import CommandQueue from './command-queue.js';
import Emitter from './emitter.js';
import {
    PROTOCOL_VERSION,
    KIND,
    CTRL,
    SNAPSHOT,
    makeOp,
    makeReject,
    makeCtrl
} from './protocol.js';

const OP_LOG_SIZE = 512;
const RECONNECT_GRACE_MS = 2 * 60 * 1000;
const KICK_BAN_MS = 10 * 60 * 1000;
const COMMAND_TIMEOUT_MS = 20 * 1000;
const OPS_REQUEST_INTERVAL_MS = 1000;
const PRESENCE_WINDOW_MS = 1000;
const PRESENCE_PER_WINDOW = 40;
const VERSION_MISMATCH_REASON = 'This room is running a different version of MistWarp. ' +
    'Reload the page on both computers, then try again.';

const randomToken = () => {
    const bytes = new Uint32Array(4);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 0x100000000);
    }
    return Array.from(bytes, n => n.toString(16).padStart(8, '0')).join('');
};

const withTimeout = (promise, ms, message) => {
    let timer = null;
    return Promise.race([
        promise,
        new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error(message)), ms);
        })
    ]).finally(() => clearTimeout(timer));
};

/**
 * The room authority. Runs on the host peer: sequences every operation,
 * relays them (and presence) to all clients, owns join/approval/kick and
 * the users list, and answers gap-replay requests from its op log.
 *
 * All host state changes flow through here exactly once — there is a
 * single relay path.
 *
 * Events:
 *  - 'user-joined' (user) / 'user-left' (user) / 'users-updated' ({users})
 *  - 'join-request-received' ({requesterId, requesterUsername})
 *  - 'join-request-cancelled' ({requesterId, requesterUsername})
 *  - 'snapshot-needed' ({peerId}) — a newly approved client needs the project
 *  - 'snapshot-skipped' ({peerId}) — reconnecting client caught up from the log
 *  - 'snapshot-message' (peerId, envelope) — snapshot channel traffic
 *  - 'asset-message' (peerId, envelope) — asset channel traffic
 *  - 'presence' (peerId, envelope) — presence traffic (also relayed)
 *  - 'op-applied' (envelope) — a client op was sequenced and applied locally
 *  - 'session-ready' () — every approved client finished onboarding
 *  - 'room-privacy-changed' (privacy)
 */
class HostSession extends Emitter {
    /**
     * @param {object} options Options.
     * @param {Transport} options.transport Transport (must not be started yet).
     * @param {VMApplier} options.applier Applies sequenced ops to the host doc.
     * @param {string} options.roomId Room id.
     * @param {string} options.username Host's display name.
     * @param {string} [options.privacy] 'public' or 'private'.
     */
    constructor ({transport, applier, roomId, username, handle, privacy, scope = null}) {
        super();
        this.transport = transport;
        this.applier = applier;
        this.roomId = roomId;
        this.scope = scope;
        this.username = username;
        this.handle = handle || null;
        this.privacy = privacy === 'private' ? 'private' : 'public';
        this.epoch = randomToken();

        this.queue = new CommandQueue();
        this._receipts = new Map();
        this.seq = 0;
        this.opLog = [];
        this.users = new Map();
        this.pendingJoinRequests = new Map();
        this.pendingSyncs = new Set();
        this._clientOpCounter = 0;
        this._started = false;
        this._tokens = new Map();
        this._bannedTokens = new Map();
        this._bannedPeers = new Map();
        this._opsRequestedAt = new Map();
        this._presenceBudget = new Map();

        this._onMessage = this._onMessage.bind(this);
        this._onPeerDisconnected = this._onPeerDisconnected.bind(this);
        this._onVersionMismatch = this._onVersionMismatch.bind(this);
    }

    /**
     * Register with the broker and start accepting clients.
     * @returns {Promise<string>} Our peer id.
     */
    async start () {
        const id = await this.transport.host(this.roomId);
        this._started = true;
        this.transport.on('message', this._onMessage);
        this.transport.on('peer-disconnected', this._onPeerDisconnected);
        this.transport.on('version-mismatch', this._onVersionMismatch);

        const hostUser = {id, username: this.username, isHost: true};
        if (this.handle) hostUser.handle = this.handle;
        this.users.set(id, hostUser);
        this.emit('user-joined', hostUser);
        this._emitUsersUpdated();
        return id;
    }

    /**
     * Tell every client the room is closing. Safe to call before destroy,
     * and again from a page unload handler.
     */
    announceClose () {
        if (!this._started) return;
        const notice = makeCtrl(CTRL.USER_LEFT, {id: this.id});
        for (const peerId of this.users.keys()) {
            if (peerId !== this.id) this.transport.send(peerId, notice);
        }
        for (const peerId of this.pendingJoinRequests.keys()) {
            this.transport.send(peerId, makeCtrl(CTRL.JOIN_DENIED, {reason: 'The host closed the room.'}));
        }
    }

    destroy () {
        try {
            this.announceClose();
        } catch (e) {
            this._started = false;
        }
        this._started = false;
        this.queue.cancel();
        this.transport.off('message', this._onMessage);
        this.transport.off('peer-disconnected', this._onPeerDisconnected);
        this.transport.off('version-mismatch', this._onVersionMismatch);
        this.users.clear();
        this.pendingJoinRequests.clear();
        this.pendingSyncs.clear();
        this._tokens.clear();
        this.removeAllListeners();
    }

    get id () {
        return this.transport.id;
    }

    getUsers () {
        return Array.from(this.users.values());
    }

    _broadcast (envelope, exceptPeerId) {
        for (const peerId of this.users.keys()) {
            if (peerId !== this.id && peerId !== exceptPeerId) this.transport.send(peerId, envelope);
        }
    }

    getPendingJoinRequests () {
        return Array.from(this.pendingJoinRequests.values())
            .map(({id, username, handle}) => ({id, username, handle}));
    }

    isClientApproved (peerId) {
        return this.users.has(peerId) && peerId !== this.id;
    }

    /**
     * Sequence and broadcast an op that originated on the host itself.
     * Host edits use the same awaited execution path as client requests.
     * @param {string} type Op type.
     * @param {object} payload Op payload.
     * @returns {object} The sequenced op envelope.
     */
    submitLocal (type, payload) {
        const clientOpId = ++this._clientOpCounter;
        return this._commit(this.id, {type, payload, clientOpId});
    }

    _commit (peerId, envelope) {
        return this.queue.run(async active => {
            if (peerId !== this.id && !this.isClientApproved(peerId)) return null;
            const key = envelope.payload.requestId || `${peerId}:${envelope.clientOpId}`;
            if (this._receipts.has(key)) {
                const receipt = this._receipts.get(key);
                if (peerId !== this.id) this.transport.send(peerId, receipt);
                return receipt;
            }
            if (peerId !== this.id && !this.isClientApproved(peerId)) return null;
            if (typeof this.applier.validate === 'function') this.applier.validate(envelope.type, envelope.payload);
            const result = await withTimeout(
                this.applier.apply(envelope.type, envelope.payload, {clientId: peerId}),
                COMMAND_TIMEOUT_MS,
                'That edit took too long to apply, so it was cancelled.'
            );
            if (!active()) return null;
            const payload = result || envelope.payload;
            if (envelope.payload.requestId) payload.requestId = envelope.payload.requestId;
            const op = makeOp(envelope.type, payload, {
                seq: ++this.seq, clientId: peerId, clientOpId: envelope.clientOpId
            });
            // Keep receipts for the session lifetime: a reconnect can retry an
            // acknowledged operation after its log entry has been pruned.
            this._receipts.set(key, op);
            this._appendToLog(op);
            this._broadcast(op);
            this.emit('op-applied', op);
            return op;
        });
    }

    /**
     * Broadcast a presence envelope from the host itself.
     * @param {object} envelope Presence envelope (payload.userId is stamped).
     */
    submitLocalPresence (envelope) {
        envelope.payload.userId = this.id;
        this._broadcast(envelope);
    }

    approveJoinRequest (requesterId) {
        const request = this.pendingJoinRequests.get(requesterId);
        if (!request) return false;
        this.pendingJoinRequests.delete(requesterId);
        this._admitClient(requesterId, request.username, request.lastAppliedSeq, request.handle);
        return true;
    }

    denyJoinRequest (requesterId, reason = 'Host denied your request') {
        const request = this.pendingJoinRequests.get(requesterId);
        if (!request) return;
        this.pendingJoinRequests.delete(requesterId);
        this._deny(requesterId, reason);
    }

    kickUser (peerId, reason = 'You were removed from the room') {
        if (!this.isClientApproved(peerId)) return;
        const now = Date.now();
        this._bannedPeers.set(peerId, now + KICK_BAN_MS);
        for (const [token, entry] of this._tokens) {
            if (entry.peerId === peerId) {
                this._tokens.delete(token);
                this._bannedTokens.set(token, now + KICK_BAN_MS);
            }
        }
        this.transport.send(peerId, makeCtrl(CTRL.KICK, {reason}));
        this.transport.closeConnection(peerId, {graceful: true});
        this._removeClient(peerId);
    }

    _deny (peerId, reason, version) {
        const denial = makeCtrl(CTRL.JOIN_DENIED, {reason});
        if (typeof version === 'number') denial.v = version;
        this.transport.send(peerId, denial);
        this.transport.closeConnection(peerId, {graceful: true});
    }

    _isBanned (peerId, token) {
        const now = Date.now();
        const expired = map => map.forEach((until, key) => {
            if (until <= now) map.delete(key);
        });
        expired(this._bannedPeers);
        expired(this._bannedTokens);
        return this._bannedPeers.has(peerId) || Boolean(token && this._bannedTokens.has(token));
    }

    changeRoomPrivacy (privacy) {
        if (privacy !== 'public' && privacy !== 'private') {
            throw new Error('Privacy must be either "public" or "private"');
        }
        this.privacy = privacy;
        this._broadcast(makeCtrl(CTRL.PRIVACY_CHANGED, {privacy}));
        this.emit('room-privacy-changed', privacy);

        // Auto-approve everyone already waiting when the room opens up.
        if (privacy === 'public') {
            Array.from(this.pendingJoinRequests.keys())
                .forEach(requesterId => this.approveJoinRequest(requesterId));
        }
    }

    changeUsername (username) {
        this.username = username;
        const user = this.users.get(this.id);
        if (user) user.username = username;
        this._broadcastUsersList();
        this._emitUsersUpdated();
    }

    /**
     * Mark a client's onboarding as finished (snapshot applied or log
     * replay complete). Fires session-ready once nobody is pending.
     * @param {string} peerId The synced client.
     */
    markClientSynced (peerId) {
        if (!this.pendingSyncs.has(peerId)) return;
        this.pendingSyncs.delete(peerId);
        if (this.users.has(peerId)) this.transport.send(peerId, makeCtrl(CTRL.SESSION_READY, {}));
        if (this.pendingSyncs.size === 0) this.emit('session-ready');
    }

    /**
     * Ops from the log starting at fromSeq, or null when the log has
     * already aged past it (the client must fully resync).
     * @param {number} fromSeq First wanted sequence number.
     * @returns {Array.<object>|null} Op envelopes, or null.
     */
    opsSince (fromSeq) {
        if (fromSeq > this.seq + 1) return null;
        if (fromSeq === this.seq + 1) return [];
        const oldest = this.opLog.length > 0 ? this.opLog[0].seq : this.seq + 1;
        if (fromSeq < oldest) return null;
        return this.opLog.filter(op => op.seq >= fromSeq);
    }

    /**
     * The host loaded a different project. Old log entries no longer apply,
     * so every client reloads the project from a fresh snapshot.
     */
    restartHistory () {
        this.opLog = [];
        this.emit('history-restarted');
        for (const peerId of this.users.keys()) {
            if (peerId === this.id) continue;
            this.pendingSyncs.add(peerId);
            this.transport.send(peerId, makeCtrl(CTRL.RESYNC_REQUIRED, {}));
        }
    }

    _appendToLog (op) {
        this.opLog.push(op);
        if (this.opLog.length > OP_LOG_SIZE) {
            const expired = this.opLog.shift();
            const key = expired.payload.requestId || `${expired.clientId}:${expired.clientOpId}`;
            const payload = {clientOpId: expired.clientOpId};
            if (expired.payload.requestId) payload.requestId = expired.payload.requestId;
            // Retain only a small receipt after the replay window expires.
            this._receipts.set(key, makeCtrl(CTRL.COMMAND_ACK, payload));
        }
    }

    _emitUsersUpdated () {
        this.emit('users-updated', {users: this.getUsers()});
    }

    _broadcastUsersList () {
        this._broadcast(makeCtrl(CTRL.USERS_LIST, {users: this.getUsers()}));
    }

    _onMessage (peerId, envelope) {
        switch (envelope.kind) {
        case KIND.CTRL:
            this._onCtrl(peerId, envelope);
            break;
        case KIND.PROPOSE:
            this._onPropose(peerId, envelope);
            break;
        case KIND.PRESENCE:
            this._onPresence(peerId, envelope);
            break;
        case KIND.SNAPSHOT:
            if (!this.isClientApproved(peerId)) return;
            if (envelope.type === SNAPSHOT.COMPLETE) {
                this.markClientSynced(peerId);
            }
            this.emit('snapshot-message', peerId, envelope);
            break;
        case KIND.ASSET:
            if (!this.isClientApproved(peerId)) return;
            this.emit('asset-message', peerId, envelope);
            break;
        default:
            // ops and rejects only ever travel host -> client
            break;
        }
    }

    _onCtrl (peerId, envelope) {
        switch (envelope.type) {
        case CTRL.HELLO:
            this._onHello(peerId, envelope.payload);
            break;
        case CTRL.JOIN_CANCELLED: {
            const request = this.pendingJoinRequests.get(peerId);
            if (request) {
                this.pendingJoinRequests.delete(peerId);
                this.emit('join-request-cancelled', {
                    requesterId: peerId,
                    requesterUsername: request.username
                });
            }
            this.transport.closeConnection(peerId);
            break;
        }
        case CTRL.USERNAME_CHANGE: {
            if (!this.isClientApproved(peerId)) return;
            const user = this.users.get(peerId);
            if (user) user.username = envelope.payload.username;
            this._broadcastUsersList();
            this._emitUsersUpdated();
            break;
        }
        case CTRL.OPS_REQUEST: {
            if (!this.isClientApproved(peerId)) return;
            const now = Date.now();
            if (now - (this._opsRequestedAt.get(peerId) || 0) < OPS_REQUEST_INTERVAL_MS) return;
            this._opsRequestedAt.set(peerId, now);
            const ops = this.opsSince(envelope.payload.fromSeq);
            if (ops === null) {
                this.transport.send(peerId, makeCtrl(CTRL.RESYNC_REQUIRED, {}));
            } else {
                ops.forEach(op => this.transport.send(peerId, op));
            }
            break;
        }
        default:
            break;
        }
    }

    _onHello (peerId, payload) {
        if (this.scope && (payload.scope?.projectId !== this.scope.projectId ||
            payload.scope?.branch !== this.scope.branch)) {
            this.transport.send(peerId, makeCtrl(CTRL.JOIN_DENIED, {
                reason: 'Open the same project and branch before joining this editing session.'
            }));
            this.transport.closeConnection(peerId);
            return;
        }
        if (payload.protocolVersion !== PROTOCOL_VERSION) {
            this._deny(peerId, VERSION_MISMATCH_REASON);
            return;
        }
        const token = payload.reconnectToken || null;
        if (this._isBanned(peerId, token)) {
            this._deny(peerId, 'The host removed you from this room.');
            return;
        }
        const sameRoom = payload.epoch === this.epoch;
        const lastAppliedSeq = sameRoom ? payload.lastAppliedSeq : null;
        const request = {
            id: peerId,
            username: payload.username,
            handle: payload.handle || null,
            lastAppliedSeq
        };
        if (this.users.has(peerId) || this.privacy === 'public' || (sameRoom && this._takeToken(token))) {
            this._admitClient(peerId, request.username, lastAppliedSeq, request.handle);
            return;
        }
        this.pendingJoinRequests.set(peerId, request);
        this.transport.send(peerId, makeCtrl(CTRL.JOIN_PENDING, {}));
        this.emit('join-request-received', {
            requesterId: peerId,
            requesterUsername: payload.username
        });
    }

    _takeToken (token) {
        if (!token) return false;
        const entry = this._tokens.get(token);
        if (!entry) return false;
        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            this._tokens.delete(token);
            return false;
        }
        this._tokens.delete(token);
        return true;
    }

    _onVersionMismatch ({peerId, version}) {
        this._deny(peerId, VERSION_MISMATCH_REASON, version);
    }

    _admitClient (peerId, username, lastAppliedSeq, handle) {
        const user = {id: peerId, username, isHost: false};
        if (handle) user.handle = handle;
        this.users.set(peerId, user);

        for (const [existing, entry] of this._tokens) {
            if (entry.peerId === peerId) this._tokens.delete(existing);
        }
        const reconnectToken = randomToken();
        this._tokens.set(reconnectToken, {peerId, expiresAt: null});

        this.transport.send(peerId, makeCtrl(CTRL.JOIN_APPROVED, {
            hostUsername: this.username,
            epoch: this.epoch,
            reconnectToken
        }));
        this.transport.send(peerId, makeCtrl(CTRL.PRIVACY_CHANGED, {privacy: this.privacy}));
        this.transport.send(peerId, makeCtrl(CTRL.USERS_LIST, {users: this.getUsers()}));
        this._broadcast(makeCtrl(CTRL.USER_JOINED, {user}), peerId);
        this.emit('user-joined', user);
        this._emitUsersUpdated();

        this.pendingSyncs.add(peerId);

        // A reconnecting client that is still within the op log can catch
        // up from a replay instead of a full snapshot.
        if (typeof lastAppliedSeq === 'number') {
            const ops = this.opsSince(lastAppliedSeq + 1);
            if (ops !== null) {
                ops.forEach(op => this.transport.send(peerId, op));
                this.markClientSynced(peerId);
                this.emit('snapshot-skipped', {peerId});
                return;
            }
        }
        this.emit('snapshot-needed', {peerId});
    }

    _onPropose (peerId, envelope) {
        if (!this.isClientApproved(peerId)) {
            this.transport.send(peerId, makeReject(envelope.clientOpId, 'You are not in the room yet.'));
            return;
        }
        if (envelope.payload.commit) {
            this.transport.send(peerId, makeReject(envelope.clientOpId, 'Clients must submit edit requests'));
            return;
        }
        this._commit(peerId, envelope).catch(error => {
            this.transport.send(peerId, makeReject(envelope.clientOpId,
                String(error.message || error).slice(0, 200)));
        });
    }

    _onPresence (peerId, envelope) {
        if (!this.isClientApproved(peerId)) return;
        const now = Date.now();
        const budget = this._presenceBudget.get(peerId);
        if (!budget || now - budget.start >= PRESENCE_WINDOW_MS) {
            this._presenceBudget.set(peerId, {start: now, count: 1});
        } else if (++budget.count > PRESENCE_PER_WINDOW) {
            return;
        }
        // Stamp the originator; never trust what the client wrote.
        envelope.payload.userId = peerId;
        this._broadcast(envelope, peerId);
        this.emit('presence', peerId, envelope);
    }

    _onPeerDisconnected (peerId) {
        const request = this.pendingJoinRequests.get(peerId);
        if (request) {
            this.pendingJoinRequests.delete(peerId);
            this.emit('join-request-cancelled', {
                requesterId: peerId,
                requesterUsername: request.username
            });
            return;
        }
        this._removeClient(peerId);
    }

    _removeClient (peerId) {
        const user = this.users.get(peerId);
        if (!user) return;
        this.users.delete(peerId);
        this._opsRequestedAt.delete(peerId);
        this._presenceBudget.delete(peerId);
        for (const entry of this._tokens.values()) {
            if (entry.peerId === peerId && entry.expiresAt === null) entry.expiresAt = Date.now() + RECONNECT_GRACE_MS;
        }
        this.markClientSynced(peerId);
        this._broadcast(makeCtrl(CTRL.USER_LEFT, {id: peerId}));
        this.emit('user-left', user);
        this._emitUsersUpdated();
    }
}

export default HostSession;
