import Emitter from './emitter.js';
import {
    PROTOCOL_VERSION,
    KIND,
    CTRL,
    makePropose,
    makeCtrl
} from './protocol.js';
import {entityKeysForOp} from './op-applier.js';

const GAP_REQUEST_DELAY_MS = 3000;
const GAP_RESYNC_DELAY_MS = 10000;
const PENDING_OP_TIMEOUT_MS = 30000;
const PENDING_PRUNE_INTERVAL_MS = 10000;
const MAX_BUFFERED_OPS = 5000;

/**
 * A client's view of the room. Sends local edits to the host as proposals
 * and applies the host's sequenced op stream in strict order.
 *
 * Optimistic concurrency: a local edit has already mutated the local
 * document when it is submitted (capture is post-hoc), so it is queued as
 * a pending op. When its host echo arrives it is confirmed and skipped.
 * When a conflicting remote op arrives first, the remote op is applied and
 * the pending local op re-asserted, which matches eventual host order.
 *
 * Events:
 *  - 'awaiting-approval' () — hello sent, waiting on the host
 *  - 'join-approved' ({hostUsername}) / 'join-denied' (reason)
 *  - 'users-updated' ({users}) / 'user-joined' (user) / 'user-left' (user)
 *  - 'op-applied' (envelope) — a remote op mutated the local doc
 *  - 'op-rejected' ({clientOpId, reason})
 *  - 'kicked' (reason) / 'host-left' () / 'session-ready' ()
 *  - 'room-privacy-changed' (privacy)
 *  - 'host-loading-start/progress/complete'
 *  - 'snapshot-message' (envelope) / 'asset-message' (envelope)
 *  - 'presence' (userId, envelope)
 *  - 'resync-needed' (reason) — ordered apply is broken; re-onboard
 *  - 'reconnecting' ({attempt, delayMs}) / 'reconnected' ()
 *  - 'connection-failed' ({error})
 */
class ClientSession extends Emitter {
    /**
     * @param {object} options Options.
     * @param {Transport} options.transport Transport (not yet started).
     * @param {OpApplier} options.applier Applies sequenced ops locally.
     * @param {string} options.roomId Room id.
     * @param {string} options.username Display name.
     */
    constructor ({transport, applier, roomId, username, hasAsset}) {
        super();
        this.transport = transport;
        this.applier = applier;
        this.roomId = roomId;
        this.username = username;
        // Optional md5ext => boolean; when provided, ops carrying assetRefs
        // block the apply queue until their assets are locally present.
        this._hasAsset = hasAsset || null;
        this._blockedOp = null;

        // null until the snapshot establishes a base sequence number.
        this.lastAppliedSeq = null;
        this.users = new Map();
        this.pendingOps = [];
        this.isApproved = false;

        this._opBuffer = new Map();
        this._clientOpCounter = 0;
        this._gapRequestTimer = null;
        this._gapResyncTimer = null;
        this._pruneTimer = null;

        this._onMessage = this._onMessage.bind(this);
        this._onPeerDisconnected = this._onPeerDisconnected.bind(this);
        this._onReconnecting = this._onReconnecting.bind(this);
        this._onReconnected = this._onReconnected.bind(this);
        this._onFatal = this._onFatal.bind(this);
    }

    /**
     * Dial the host and request to join.
     * @returns {Promise<string>} Our peer id. Approval arrives later as a
     * 'join-approved' or 'join-denied' event.
     */
    async connect () {
        const id = await this.transport.join(this.roomId, {username: this.username});
        this.transport.on('message', this._onMessage);
        this.transport.on('peer-disconnected', this._onPeerDisconnected);
        this.transport.on('reconnecting', this._onReconnecting);
        this.transport.on('reconnected', this._onReconnected);
        this.transport.on('fatal', this._onFatal);

        this._pruneTimer = setInterval(() => this._prunePendingOps(), PENDING_PRUNE_INTERVAL_MS);

        this._sendHello();
        return id;
    }

    destroy () {
        this.transport.off('message', this._onMessage);
        this.transport.off('peer-disconnected', this._onPeerDisconnected);
        this.transport.off('reconnecting', this._onReconnecting);
        this.transport.off('reconnected', this._onReconnected);
        this.transport.off('fatal', this._onFatal);
        this._clearGapTimers();
        if (this._pruneTimer) {
            clearInterval(this._pruneTimer);
            this._pruneTimer = null;
        }
        this.users.clear();
        this.pendingOps = [];
        this._blockedOp = null;
        this._opBuffer.clear();
        this.removeAllListeners();
    }

    get id () {
        return this.transport.id;
    }

    getUsers () {
        return Array.from(this.users.values());
    }

    /**
     * Submit a local edit that has already been applied to the local
     * document. It becomes a pending op until the host echoes it back.
     * @param {string} type Op type.
     * @param {object} payload Op payload.
     * @returns {number} The clientOpId assigned to the proposal.
     */
    submitLocal (type, payload) {
        this._clientOpCounter++;
        const clientOpId = this._clientOpCounter;
        this.pendingOps.push({
            clientOpId,
            type,
            payload,
            keys: entityKeysForOp(type, payload),
            submittedAt: Date.now()
        });
        this.transport.sendToHost(makePropose(type, payload, clientOpId));
        return clientOpId;
    }

    /**
     * Send a presence envelope to the host for relaying.
     * @param {object} envelope Presence envelope.
     */
    submitLocalPresence (envelope) {
        this.transport.sendToHost(envelope);
    }

    changeUsername (username) {
        this.username = username;
        this.transport.sendToHost(makeCtrl(CTRL.USERNAME_CHANGE, {username}));
    }

    cancelJoinRequest () {
        this.transport.sendToHost(makeCtrl(CTRL.JOIN_CANCELLED, {}));
    }

    /**
     * Set the base sequence number after applying a snapshot, then drain
     * any ops that were buffered while the snapshot streamed in.
     * @param {number} atSeq The host seq the snapshot was taken at.
     */
    setBaseSeq (atSeq) {
        this.lastAppliedSeq = atSeq;
        this._drainBuffer();
    }

    /**
     * Retry the op that blocked on missing assets. Called by the asset
     * channel once the requested assets are stored locally.
     */
    resumeApply () {
        if (!this._blockedOp) return;
        const envelope = this._blockedOp;
        this._blockedOp = null;
        this._applyOp(envelope);
        this._drainBuffer();
    }

    /**
     * Drop all local ordering state ahead of a full re-onboard (snapshot
     * re-download). Incoming ops buffer until setBaseSeq is called again.
     */
    beginResync () {
        this.lastAppliedSeq = null;
        this.pendingOps = [];
        this._blockedOp = null;
        this._opBuffer.clear();
        this._clearGapTimers();
    }

    _sendHello () {
        const payload = {
            protocolVersion: PROTOCOL_VERSION,
            username: this.username,
            roomId: this.roomId
        };
        if (this.lastAppliedSeq !== null) {
            payload.lastAppliedSeq = this.lastAppliedSeq;
        }
        this.transport.sendToHost(makeCtrl(CTRL.HELLO, payload));
        this.emit('awaiting-approval');
    }

    _onMessage (peerId, envelope) {
        // Everything a client receives comes from the host.
        switch (envelope.kind) {
        case KIND.OP:
            this._onOp(envelope);
            break;
        case KIND.REJECT:
            this._onReject(envelope);
            break;
        case KIND.CTRL:
            this._onCtrl(envelope);
            break;
        case KIND.SNAPSHOT:
            this.emit('snapshot-message', envelope);
            break;
        case KIND.ASSET:
            this.emit('asset-message', envelope);
            break;
        case KIND.PRESENCE:
            this.emit('presence', envelope.payload.userId, envelope);
            break;
        default:
            break;
        }
    }

    _onOp (envelope) {
        if (this.lastAppliedSeq === null || this._blockedOp) {
            // Snapshot not applied yet, or the queue is blocked on assets;
            // hold on to everything.
            this._bufferOp(envelope);
            return;
        }
        if (envelope.seq <= this.lastAppliedSeq) return; // duplicate/replay
        if (envelope.seq === this.lastAppliedSeq + 1) {
            this._applyOp(envelope);
            this._drainBuffer();
            return;
        }
        this._bufferOp(envelope);
        this._scheduleGapRecovery();
    }

    _bufferOp (envelope) {
        if (this._opBuffer.size >= MAX_BUFFERED_OPS) {
            this._opBuffer.clear();
            this.emit('resync-needed', 'op buffer overflow');
            return;
        }
        this._opBuffer.set(envelope.seq, envelope);
    }

    _drainBuffer () {
        while (!this._blockedOp && this._opBuffer.has(this.lastAppliedSeq + 1)) {
            const next = this._opBuffer.get(this.lastAppliedSeq + 1);
            this._opBuffer.delete(next.seq);
            this._applyOp(next);
        }
        // Drop anything the snapshot already covered.
        this._opBuffer.forEach((op, seq) => {
            if (seq <= this.lastAppliedSeq) this._opBuffer.delete(seq);
        });
        if (this._opBuffer.size === 0) {
            this._clearGapTimers();
        } else {
            this._scheduleGapRecovery();
        }
    }

    _applyOp (envelope) {
        // Our own echo: the edit is already in the local doc. Confirm and skip.
        if (envelope.clientId === this.id) {
            const index = this.pendingOps.findIndex(p => p.clientOpId === envelope.clientOpId);
            if (index !== -1) {
                this.lastAppliedSeq = envelope.seq;
                this.pendingOps.splice(index, 1);
                return;
            }
        }

        // Strict ordering requires the op's assets before it can apply;
        // block the queue until the asset channel delivers them.
        if (this._hasAsset && Array.isArray(envelope.payload.assetRefs)) {
            const missing = envelope.payload.assetRefs.filter(md5ext => !this._hasAsset(md5ext));
            if (missing.length > 0) {
                this._blockedOp = envelope;
                this.emit('assets-needed', missing);
                return;
            }
        }

        this.lastAppliedSeq = envelope.seq;

        try {
            this.applier.apply(envelope.type, envelope.payload, {
                clientId: envelope.clientId,
                seq: envelope.seq
            });
        } catch (error) {
            this.emit('resync-needed', `failed to apply op ${envelope.seq}: ${error.message}`);
            return;
        }
        this.emit('op-applied', envelope);

        // Re-assert unconfirmed local ops the remote op just overwrote, so
        // our doc matches eventual host order (the host will sequence our
        // proposal after this op).
        const keys = entityKeysForOp(envelope.type, envelope.payload);
        if (keys.length === 0) return;
        this.pendingOps.forEach(pending => {
            if (!pending.keys.some(key => keys.indexOf(key) !== -1)) return;
            try {
                this.applier.apply(pending.type, pending.payload, {clientId: this.id});
            } catch (error) {
                // The re-assert no longer applies (e.g. entity deleted).
                // The host will reject or no-op it identically.
            }
        });
    }

    _onReject (envelope) {
        const {clientOpId, reason} = envelope.payload;
        const index = this.pendingOps.findIndex(p => p.clientOpId === clientOpId);
        if (index !== -1) {
            this.pendingOps.splice(index, 1);
        }
        this.emit('op-rejected', {clientOpId, reason});
    }

    _onCtrl (envelope) {
        const payload = envelope.payload;
        switch (envelope.type) {
        case CTRL.JOIN_APPROVED:
            this.isApproved = true;
            this.emit('join-approved', {hostUsername: payload.hostUsername});
            break;
        case CTRL.JOIN_DENIED:
            this.emit('join-denied', payload.reason || 'Join request was denied');
            break;
        case CTRL.USERS_LIST:
            this.users.clear();
            payload.users.forEach(user => this.users.set(user.id, user));
            this.emit('users-updated', {users: this.getUsers()});
            break;
        case CTRL.USER_JOINED:
            this.users.set(payload.user.id, payload.user);
            this.emit('user-joined', payload.user);
            this.emit('users-updated', {users: this.getUsers()});
            break;
        case CTRL.USER_LEFT: {
            if (payload.id === this.transport.hostPeerId) {
                this.emit('host-left');
                break;
            }
            const user = this.users.get(payload.id);
            if (user) {
                this.users.delete(payload.id);
                this.emit('user-left', user);
                this.emit('users-updated', {users: this.getUsers()});
            }
            break;
        }
        case CTRL.KICK:
            this.emit('kicked', payload.reason || 'You were removed from the room');
            break;
        case CTRL.PRIVACY_CHANGED:
            this.emit('room-privacy-changed', payload.privacy);
            break;
        case CTRL.RESYNC_REQUIRED:
            this.emit('resync-needed', 'host op log no longer covers our position');
            break;
        case CTRL.SESSION_READY:
            this.emit('session-ready');
            break;
        case CTRL.HOST_LOADING_START:
            this.emit('host-loading-start');
            break;
        case CTRL.HOST_LOADING_PROGRESS:
            this.emit('host-loading-progress', {progress: payload.progress});
            break;
        case CTRL.HOST_LOADING_COMPLETE:
            this.emit('host-loading-complete');
            break;
        default:
            break;
        }
    }

    _scheduleGapRecovery () {
        if (this._gapRequestTimer || this._gapResyncTimer) return;
        this._gapRequestTimer = setTimeout(() => {
            this._gapRequestTimer = null;
            if (this._opBuffer.size === 0 || this.lastAppliedSeq === null) return;
            this.transport.sendToHost(makeCtrl(CTRL.OPS_REQUEST, {
                fromSeq: this.lastAppliedSeq + 1
            }));
            this._gapResyncTimer = setTimeout(() => {
                this._gapResyncTimer = null;
                if (this._opBuffer.size > 0) {
                    this.emit('resync-needed', 'gap replay did not arrive');
                }
            }, GAP_RESYNC_DELAY_MS);
        }, GAP_REQUEST_DELAY_MS);
    }

    _clearGapTimers () {
        if (this._gapRequestTimer) {
            clearTimeout(this._gapRequestTimer);
            this._gapRequestTimer = null;
        }
        if (this._gapResyncTimer) {
            clearTimeout(this._gapResyncTimer);
            this._gapResyncTimer = null;
        }
    }

    _prunePendingOps () {
        const now = Date.now();
        const before = this.pendingOps.length;
        this.pendingOps = this.pendingOps.filter(
            pending => now - pending.submittedAt < PENDING_OP_TIMEOUT_MS
        );
        if (this.pendingOps.length < before) {
            this.emit('resync-needed', 'local ops were never acknowledged by the host');
        }
    }

    _onPeerDisconnected (peerId) {
        if (peerId !== this.transport.hostPeerId) return;
        // The transport handles redialing; surface state for the UI.
        this.isApproved = false;
        this.emit('host-connection-lost');
    }

    _onReconnecting (info) {
        this.emit('reconnecting', info);
    }

    _onReconnected () {
        // Re-join. With lastAppliedSeq in the hello the host can replay
        // the missed window from its log instead of re-streaming the
        // whole project.
        this._sendHello();
        this.emit('reconnected');
    }

    _onFatal ({error}) {
        this.emit('connection-failed', {
            error: error && error.message ? error.message : String(error)
        });
    }
}

export default ClientSession;
