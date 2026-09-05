import Emitter from './emitter.js';
import {
    PROTOCOL_VERSION,
    KIND,
    CTRL,
    makePropose,
    makeCtrl
} from './protocol.js';
import CommandQueue from './command-queue.js';

const GAP_REQUEST_DELAY_MS = 3000;
const GAP_RESYNC_DELAY_MS = 10000;
const PENDING_OP_TIMEOUT_MS = 30000;
const PENDING_PRUNE_INTERVAL_MS = 10000;
const MAX_BUFFERED_OPS = 5000;

/**
 * A client's view of the room. Sends local edits to the host as proposals
 * and applies the host's sequenced op stream in strict order.
 *
 * Local commands remain pending until the host accepts and applies them.
 * Every accepted operation applies once, including our own commands.
 * Retrying an unacknowledged command preserves its request ID.
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
    constructor ({transport, applier, roomId, username, handle, hasAsset, scope = null}) {
        super();
        this.transport = transport;
        this.applier = applier;
        this.roomId = roomId;
        this.scope = scope;
        this.username = username;
        this.handle = handle || null;
        // Optional md5ext => boolean; when provided, ops carrying assetRefs
        // block the apply queue until their assets are locally present.
        this._hasAsset = hasAsset || null;
        this._blockedOp = null;

        // null until the snapshot establishes a base sequence number.
        this.lastAppliedSeq = null;
        this.queue = new CommandQueue();
        this._applying = false;
        this._ready = false;
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
        clearTimeout(this._approvalTimer);
        this.queue.cancel();
        this._destroyed = true;
        this.pendingOps.forEach(op => op.reject(new Error('Collaboration session ended')));
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
     * Submit a local editing request. The local VM changes only after
     * the host commits it.
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
            resolve: () => {},
            reject: () => {},
            submittedAt: Date.now()
        });
        this.transport.sendToHost(makePropose(type, payload, clientOpId));
        return clientOpId;
    }

    submitCommand (type, payload) {
        const id = this.submitLocal(type, payload);
        const pending = this.pendingOps.find(op => op.clientOpId === id);
        return new Promise((resolve, reject) => Object.assign(pending, {resolve, reject}));
    }

    _retryPending () {
        if (!this.isApproved || this.lastAppliedSeq === null) return;
        this.pendingOps.forEach(op => {
            this.transport.sendToHost(makePropose(op.type, op.payload, op.clientOpId));
            op.submittedAt = Date.now();
        });
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
        this._retryPending();
        this._drainBuffer();
    }

    /**
     * Retry the op that blocked on missing assets. Called by the asset
     * channel once the requested assets are stored locally.
     */
    resumeApply () {
        this._blockedOp = null;
        this._drainBuffer();
    }

    /**
     * Drop all local ordering state ahead of a full re-onboard (snapshot
     * re-download). Incoming ops buffer until setBaseSeq is called again.
     */
    beginResync () {
        this.lastAppliedSeq = null;
        this.queue.cancel();
        if (this.applier.queue) this.applier.queue.cancel();
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
        if (this.handle) payload.handle = this.handle;
        if (this.scope) payload.scope = this.scope;
        if (this.lastAppliedSeq !== null) {
            payload.lastAppliedSeq = this.lastAppliedSeq;
        }
        clearTimeout(this._approvalTimer);
        this._approvalTimer = setTimeout(() => {
            this.emit('connection-failed', {error: 'The host did not approve the connection. ' +
                'Check that both editors are up to date and try again.'});
        }, 120000);
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
        if (this.lastAppliedSeq !== null && envelope.seq <= this.lastAppliedSeq) {
            this._confirm(envelope);
            return;
        }
        if (this._opBuffer.size >= MAX_BUFFERED_OPS) {
            this.emit('resync-needed', 'op buffer overflow');
            return;
        }
        this._opBuffer.set(envelope.seq, envelope);
        this._drainBuffer();
    }

    _confirm (envelope) {
        const index = this.pendingOps.findIndex(op => (envelope.payload.requestId ?
            op.payload.requestId === envelope.payload.requestId :
            envelope.clientId === this.id && op.clientOpId === envelope.clientOpId));
        if (index !== -1) {
            const [pending] = this.pendingOps.splice(index, 1);
            pending.resolve(envelope.payload);
        }
    }

    _drainBuffer () {
        if (this._destroyed || this._applying || this.lastAppliedSeq === null || this._blockedOp) return;
        this._opBuffer.forEach((op, seq) => {
            if (seq <= this.lastAppliedSeq) {
                this._opBuffer.delete(seq);
                this._confirm(op);
            }
        });
        const envelope = this._opBuffer.get(this.lastAppliedSeq + 1);
        if (!envelope) {
            if (this._opBuffer.size) this._scheduleGapRecovery();
            else {
                this._clearGapTimers();
                if (this._ready) {
                    this._ready = false;
                    this._retryPending();
                    this.emit('session-ready');
                    if (this._rejoining) {
                        this._rejoining = false; this.emit('reconnected');
                    }
                }
            }
            return;
        }
        if (this._hasAsset && Array.isArray(envelope.payload.assetRefs)) {
            const missing = envelope.payload.assetRefs.filter(id => !this._hasAsset(id));
            if (missing.length) {
                this._blockedOp = envelope;
                this.emit('assets-needed', missing);
                return;
            }
        }
        this._applying = true;
        this.queue.run(async active => {
            await this.applier.apply(envelope.type, envelope.payload, {clientId: envelope.clientId, seq: envelope.seq});
            if (!active()) return;
            this.lastAppliedSeq = envelope.seq;
            this._opBuffer.delete(envelope.seq);
            this._confirm(envelope);
            this.emit('op-applied', envelope);
        }).catch(error => {
            if (!this._destroyed) {
                this.beginResync();
                this.emit('resync-needed', `failed to apply op ${envelope.seq}: ${error.message}`);
            }
        })
            .finally(() => {
                this._applying = false;
                this._drainBuffer();
            });
    }

    _onReject (envelope) {
        const {clientOpId, reason} = envelope.payload;
        const index = this.pendingOps.findIndex(p => p.clientOpId === clientOpId);
        if (index !== -1) {
            const [pending] = this.pendingOps.splice(index, 1);
            pending.reject(new Error(reason));
        }
        this.emit('op-rejected', {clientOpId, reason});
    }

    _onCtrl (envelope) {
        const payload = envelope.payload;
        switch (envelope.type) {
        case CTRL.COMMAND_ACK: {
            const index = this.pendingOps.findIndex(op => (payload.requestId ?
                op.payload.requestId === payload.requestId : op.clientOpId === payload.clientOpId));
            if (index !== -1) this.pendingOps.splice(index, 1)[0].resolve({});
            break;
        }
        case CTRL.JOIN_APPROVED:
            clearTimeout(this._approvalTimer);
            this.isApproved = true;
            this.emit('join-approved', {hostUsername: payload.hostUsername});
            break;
        case CTRL.JOIN_DENIED:
            clearTimeout(this._approvalTimer);
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
            this.privacy = payload.privacy;
            this.emit('room-privacy-changed', payload.privacy);
            break;
        case CTRL.RESYNC_REQUIRED:
            this.emit('resync-needed', 'host op log no longer covers our position');
            break;
        case CTRL.SESSION_READY:
            this._ready = true;
            this._drainBuffer();
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
        if (this.pendingOps.some(op => Date.now() - op.submittedAt >= PENDING_OP_TIMEOUT_MS)) this._retryPending();
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
        this._rejoining = true;
        this._sendHello();
    }

    _onFatal ({error}) {
        this.emit('connection-failed', {
            error: error && error.message ? error.message : String(error)
        });
    }
}

export default ClientSession;
