import PeerModule from 'peerjs';
import {resolvePeerConstructor} from './peer-constructor.js';
import Emitter from './emitter.js';
import {validateEnvelope, makeCtrl, KIND, CTRL, PROTOCOL_VERSION} from './protocol.js';
import {APP_NAME} from '../constants/brand.js';

const DEFAULT_PEER_CONFIG = {
    host: 'collab_warp.mistium.com',
    port: 443,
    path: '/',
    secure: true,
    config: {
        iceServers: [
            {urls: 'stun:vpn.mikedev101.cc:5349'},
            {urls: 'turn:vpn.mikedev101.cc:5349', username: 'free', credential: 'free'},
            {urls: 'stun:stun.l.google.com:19302'},
            {urls: 'stun:freeturn.net:3478'},
            {urls: 'stun:freeturn.net:5349'},
            {urls: 'turn:freeturn.net:3478', username: 'free', credential: 'free'},
            {urls: 'turns:freeturn.net:5349', username: 'free', credential: 'free'}
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all'
    },
    debug: 1
};

const HEARTBEAT_INTERVAL_MS = 10 * 1000;
const DEAD_PEER_TIMEOUT_MS = 30 * 1000;
const DIAL_TIMEOUT_MS = 15 * 1000;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 16 * 1000;
const BROKER_RECONNECT_MAX_DELAY_MS = 30 * 1000;
const HOST_GONE_ATTEMPTS = 3;
const GRACEFUL_CLOSE_TIMEOUT_MS = 1500;
const GRACEFUL_CLOSE_POLL_MS = 50;
const FATAL_PEER_ERRORS = new Set(['browser-incompatible', 'invalid-id', 'invalid-key', 'ssl-unavailable']);

const sanitizeRoomId = roomId => String(roomId || '').replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

const collabError = (code, message) => {
    const error = new Error(message);
    error.collabCode = code;
    return error;
};

const roomIdError = roomId => (sanitizeRoomId(roomId) ?
    null :
    collabError('INVALID_ROOM', 'A room code needs at least one letter or number.'));

const generateHostPeerId = roomId => `${APP_NAME}-collab-${sanitizeRoomId(roomId)}-host`;

const generateClientPeerId = roomId => {
    const randomString = Math.random()
        .toString(36)
        .substring(2, 11);
    return `${APP_NAME}-collab-${sanitizeRoomId(roomId)}-user-${Date.now()}-${randomString}`;
};

/**
 * PeerJS wrapper for the collaboration engine. Owns connection lifecycle:
 * peer registration with the broker, dialing the host, accepting client
 * connections, heartbeat-based dead peer detection, client reconnection
 * with exponential backoff, and host broker re-registration.
 *
 * Every inbound message is validated against the protocol before being
 * surfaced. No collaboration semantics live here.
 *
 * Events:
 *  - 'connected' () — (client) data channel to the host is open
 *  - 'peer-connected' (peerId, metadata) — (host) a client channel opened
 *  - 'peer-disconnected' (peerId) — a channel closed or timed out
 *  - 'message' (peerId, envelope) — validated inbound envelope
 *  - 'reconnecting' ({attempt, delayMs}) — (client) redial scheduled
 *  - 'reconnected' () — (client) redial succeeded
 *  - 'invalid-message' ({peerId, error}) — dropped inbound message
 *  - 'version-mismatch' ({peerId, version, type}) — a hello or join denial
 *    from a different protocol version
 *  - 'broker-offline' () / 'broker-online' () — registration with the
 *    signalling server was lost or restored; open channels keep working
 *  - 'fatal' ({error}) — unrecoverable; the session should shut down
 */
class Transport extends Emitter {
    constructor (options = {}) {
        super();
        this._peerConfig = options.peerConfig || DEFAULT_PEER_CONFIG;
        this._createPeer = options.createPeer || ((id, config) => new (resolvePeerConstructor(PeerModule))(id, config));
        this._heartbeatIntervalMs = options.heartbeatIntervalMs || HEARTBEAT_INTERVAL_MS;
        this._deadPeerTimeoutMs = options.deadPeerTimeoutMs || DEAD_PEER_TIMEOUT_MS;
        this._dialTimeoutMs = options.dialTimeoutMs || DIAL_TIMEOUT_MS;

        this.peer = null;
        this.isHost = false;
        this.roomId = null;
        this.hostPeerId = null;
        this.destroyed = false;
        this.droppedMessageCount = 0;

        this._connections = new Map();
        this._pendingConnections = new Set();
        this._heartbeatTimer = null;
        this._reconnectTimer = null;
        this._reconnectAttempts = 0;
        this._hostMissingAttempts = 0;
        this._brokerTimer = null;
        this._brokerAttempts = 0;
        this._brokerOffline = false;
        this._joinMetadata = null;
        this._onPeerUnavailable = null;
    }

    _describeError (error) {
        switch (error && error.type) {
        case 'unavailable-id':
            return collabError(
                'ROOM_TAKEN',
                `Room "${this.roomId}" is already being hosted. Join it instead of creating it.`
            );
        case 'network':
        case 'server-error':
        case 'socket-error':
        case 'socket-closed':
            return collabError(
                'SERVER_UNREACHABLE',
                'Could not reach the collaboration server. Check your connection and try again.'
            );
        case 'browser-incompatible':
            return collabError(
                'BROWSER_UNSUPPORTED',
                'This browser cannot use collaboration; it does not support WebRTC data channels.'
            );
        default:
            return error instanceof Error ? error : new Error(String(error));
        }
    }

    get id () {
        return this.peer ? this.peer.id : null;
    }

    peers () {
        return Array.from(this._connections.keys());
    }

    isOpen (peerId) {
        const entry = this._connections.get(peerId);
        return Boolean(entry && entry.conn.open);
    }

    /**
     * Register with the broker as the room's host and accept connections.
     * @param {string} roomId The room to host.
     * @returns {Promise<string>} Resolves with our peer id.
     */
    host (roomId) {
        const invalid = roomIdError(roomId);
        if (invalid) return Promise.reject(invalid);
        this.isHost = true;
        this.roomId = roomId;
        return this._openPeer(generateHostPeerId(roomId)).then(id => {
            this.hostPeerId = id;
            this.peer.on('connection', conn => this._wireConnection(conn));
            this._startHeartbeat();
            return id;
        });
    }

    /**
     * Register with the broker and dial the room's host.
     * @param {string} roomId The room to join.
     * @param {object} metadata Attached to the connection (username etc).
     * @returns {Promise<string>} Resolves with our peer id once the data
     * channel to the host is open.
     */
    join (roomId, metadata) {
        const invalid = roomIdError(roomId);
        if (invalid) return Promise.reject(invalid);
        this.isHost = false;
        this.roomId = roomId;
        this.hostPeerId = generateHostPeerId(roomId);
        this._joinMetadata = metadata || {};
        return this._openPeer(generateClientPeerId(roomId))
            .then(() => this._dialHost())
            .then(() => {
                this._startHeartbeat();
                return this.peer.id;
            });
    }

    /**
     * Send an envelope to one peer.
     * @param {string} peerId Destination peer.
     * @param {object} envelope Protocol envelope.
     * @returns {boolean} Whether the message was handed to the channel.
     */
    send (peerId, envelope) {
        const entry = this._connections.get(peerId);
        if (!entry || !entry.conn.open) return false;
        try {
            entry.conn.send(envelope);
            return true;
        } catch (error) {
            return false;
        }
    }

    sendToHost (envelope) {
        if (this.isHost || !this.hostPeerId) return false;
        return this.send(this.hostPeerId, envelope);
    }

    /**
     * Bytes still queued on a peer's data channel. Bulk senders use this to
     * pace themselves, so a large transfer does not park ops and presence
     * behind megabytes of backlog on the same ordered channel.
     * @param {string} peerId Peer, or 'host' from a client.
     * @returns {number} Queued bytes (0 when the channel is unknown).
     */
    bufferedAmount (peerId) {
        const entry = this._connections.get(peerId === 'host' ? this.hostPeerId : peerId);
        return entry ? this._queuedBytes(entry.conn) : 0;
    }

    /**
     * Send an envelope to every open connection except one.
     * @param {object} envelope Protocol envelope.
     * @param {string} [exceptPeerId] Peer to skip.
     */
    broadcast (envelope, exceptPeerId) {
        this._connections.forEach((entry, peerId) => {
            if (peerId === exceptPeerId) return;
            if (!entry.conn.open) return;
            try {
                entry.conn.send(envelope);
            } catch (error) {
                // Dead channel; heartbeat or close event will reap it.
            }
        });
    }

    /**
     * Close the channel to one peer (host-side kick).
     * @param {string} peerId Peer to disconnect.
     * @param {object} [options] Options.
     * @param {boolean} [options.graceful] Let queued messages leave first.
     * @returns {Promise} Resolves once the channel is closed.
     */
    closeConnection (peerId, {graceful = false} = {}) {
        const entry = this._connections.get(peerId);
        if (!entry) return Promise.resolve();
        this._connections.delete(peerId);
        if (!graceful) {
            this._closeConn(entry.conn);
            return Promise.resolve();
        }
        return this._drain(entry.conn).then(() => this._closeConn(entry.conn));
    }

    _closeConn (conn) {
        try {
            conn.close();
        } catch (error) {
            return;
        }
    }

    _queuedBytes (conn) {
        const channel = conn.dataChannel;
        return (channel ? channel.bufferedAmount : 0) + (conn.bufferSize || 0);
    }

    _drain (conn) {
        const deadline = Date.now() + GRACEFUL_CLOSE_TIMEOUT_MS;
        return new Promise(resolve => {
            const check = () => {
                if (!conn.open || this._queuedBytes(conn) === 0 || Date.now() >= deadline) {
                    setTimeout(resolve, GRACEFUL_CLOSE_POLL_MS);
                    return;
                }
                setTimeout(check, GRACEFUL_CLOSE_POLL_MS);
            };
            check();
        });
    }

    _stopTimers () {
        this._pendingConnections.forEach(cancel => cancel());
        this._pendingConnections.clear();
        this._onPeerUnavailable = null;
        this._stopHeartbeat();
        clearTimeout(this._reconnectTimer);
        this._reconnectTimer = null;
        clearTimeout(this._brokerTimer);
        this._brokerTimer = null;
    }

    _destroyPeer (peer) {
        if (!peer) return;
        try {
            peer.destroy();
        } catch (error) {
            return;
        }
    }

    destroy () {
        this.destroyed = true;
        this._stopTimers();
        this._connections.forEach(entry => this._closeConn(entry.conn));
        this._connections.clear();
        this._destroyPeer(this.peer);
        this.peer = null;
        this.removeAllListeners();
    }

    /**
     * Stop immediately, but give messages already queued on each channel
     * (a final "room closed" notice, for example) a moment to leave before
     * the channels close.
     * @returns {Promise} Resolves once every channel and the peer are closed.
     */
    destroyGracefully () {
        this.destroyed = true;
        this._stopTimers();
        this.removeAllListeners();
        const entries = Array.from(this._connections.values());
        this._connections.clear();
        const peer = this.peer;
        this.peer = null;
        return Promise.all(entries.map(entry => this._drain(entry.conn).then(() => this._closeConn(entry.conn))))
            .then(() => this._destroyPeer(peer));
    }

    _openPeer (peerId) {
        return new Promise((resolve, reject) => {
            let settled = false;
            if (this.destroyed) {
                reject(collabError('CONNECTION_CANCELLED', 'Collaboration connection cancelled'));
                return;
            }
            const peer = this._createPeer(peerId, this._peerConfig);
            this.peer = peer;
            const disposePeer = () => {
                if (this.peer === peer) this.peer = null;
                try {
                    peer.destroy();
                } catch (error) {
                    // A failed peer may already be destroyed.
                }
            };
            const pending = {timer: null};
            const cancel = () => {
                if (settled) return;
                settled = true;
                clearTimeout(pending.timer);
                this._pendingConnections.delete(cancel);
                disposePeer();
                reject(collabError('CONNECTION_CANCELLED', 'Collaboration connection cancelled'));
            };
            pending.timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                this._pendingConnections.delete(cancel);
                disposePeer();
                reject(collabError('SERVER_UNREACHABLE', 'The collaboration server did not respond.'));
            }, this._dialTimeoutMs);
            this._pendingConnections.add(cancel);

            peer.on('open', id => {
                if (this.destroyed || this.peer !== peer) return;
                if (!settled) {
                    settled = true;
                    clearTimeout(pending.timer);
                    this._pendingConnections.delete(cancel);
                    resolve(id);
                    return;
                }
                this._brokerAttempts = 0;
                if (this._brokerOffline) {
                    this._brokerOffline = false;
                    this.emit('broker-online');
                }
            });

            peer.on('error', error => {
                if (this.destroyed || this.peer !== peer) return;
                if (!settled) {
                    settled = true;
                    clearTimeout(pending.timer);
                    this._pendingConnections.delete(cancel);
                    disposePeer();
                    reject(this._describeError(error));
                    return;
                }
                const type = error && error.type;
                if (type === 'peer-unavailable') {
                    if (this._onPeerUnavailable) this._onPeerUnavailable();
                    return;
                }
                if (FATAL_PEER_ERRORS.has(type)) this.emit('fatal', {error: this._describeError(error)});
            });

            peer.on('disconnected', () => {
                if (this.destroyed || peer.destroyed || this.peer !== peer) return;
                this._scheduleBrokerReconnect(peer);
            });
        });
    }

    _scheduleBrokerReconnect (peer) {
        if (this._brokerTimer) return;
        if (!this._brokerOffline) {
            this._brokerOffline = true;
            this.emit('broker-offline');
        }
        const attempt = this._brokerAttempts++;
        const retry = () => {
            this._brokerTimer = null;
            if (this.destroyed || peer.destroyed || this.peer !== peer) return;
            try {
                peer.reconnect();
            } catch (error) {
                this._scheduleBrokerReconnect(peer);
            }
        };
        if (attempt === 0) {
            retry();
            return;
        }
        this._brokerTimer = setTimeout(retry, Math.min(
            RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt - 1),
            BROKER_RECONNECT_MAX_DELAY_MS
        ));
    }

    _dialHost () {
        return new Promise((resolve, reject) => {
            let conn = null;
            let timeout = null;
            const pending = {cancel: null};
            const settle = (error, openConn) => {
                if (timeout === null) return;
                clearTimeout(timeout);
                timeout = null;
                this._onPeerUnavailable = null;
                this._pendingConnections.delete(pending.cancel);
                if (!error) {
                    this._registerConnection(openConn);
                    this.emit('connected');
                    resolve();
                    return;
                }
                if (conn) {
                    try {
                        conn.close();
                    } catch (closeError) {
                        // Ignore.
                    }
                }
                reject(error);
            };

            pending.cancel = () => settle(collabError('CONNECTION_CANCELLED', 'Collaboration connection cancelled'));
            this._pendingConnections.add(pending.cancel);
            timeout = setTimeout(() => settle(collabError(
                'DIAL_TIMEOUT',
                `Room "${this.roomId}" did not respond. The host may have a slow or blocked connection.`
            )), this._dialTimeoutMs);

            this._onPeerUnavailable = () => settle(collabError(
                'ROOM_NOT_FOUND',
                `Nobody is hosting room "${this.roomId}" right now.`
            ));

            try {
                conn = this.peer.connect(this.hostPeerId, {
                    label: 'collaboration',
                    metadata: this._joinMetadata,
                    reliable: true
                });
            } catch (error) {
                settle(this._describeError(error));
                return;
            }

            conn.on('open', () => settle(null, conn));
            conn.on('close', () => settle(collabError(
                'CONNECTION_CLOSED', 'The host connection closed before joining. Please try again.'
            )));
            conn.on('error', error => settle(this._describeError(
                error || new Error(`Could not connect to room "${this.roomId}".`)
            )));
        });
    }

    _wireConnection (conn) {
        if (this.destroyed) {
            conn.close();
            return;
        }
        let finished = false;
        let timer = null;
        const pending = {cancel: null};
        const cleanup = () => {
            clearTimeout(timer);
            this._pendingConnections.delete(pending.cancel);
        };
        const cancel = () => {
            if (finished) return;
            finished = true;
            cleanup();
            try {
                conn.close();
            } catch (error) {
                // The incomplete channel may already be closed.
            }
        };
        pending.cancel = cancel;
        const opened = () => {
            if (finished || this.destroyed) return;
            finished = true;
            cleanup();
            this._registerConnection(conn);
            this.emit('peer-connected', conn.peer, conn.metadata || {});
        };
        conn.on('close', cancel);
        conn.on('error', cancel);
        if (conn.open) {
            opened();
        } else {
            this._pendingConnections.add(cancel);
            timer = setTimeout(cancel, this._dialTimeoutMs);
            conn.on('open', opened);
        }
    }

    _registerConnection (conn) {
        const previous = this._connections.get(conn.peer);
        if (previous && previous.conn === conn) return;
        this._connections.set(conn.peer, {conn, lastSeen: Date.now()});
        if (previous) {
            try {
                previous.conn.close();
            } catch (error) {
                // The replacement is already registered; stale events are ignored.
            }
        }

        conn.on('data', data => {
            if (this.destroyed) return;
            const entry = this._connections.get(conn.peer);
            if (!entry || entry.conn !== conn) return;
            entry.lastSeen = Date.now();

            const error = validateEnvelope(data);
            if (error) {
                const mismatch = this._versionMismatch(data);
                if (mismatch) {
                    this.emit('version-mismatch', Object.assign({peerId: conn.peer}, mismatch));
                    return;
                }
                this.droppedMessageCount++;
                this.emit('invalid-message', {peerId: conn.peer, error});
                return;
            }
            if (data.kind === KIND.CTRL && data.type === CTRL.PING) {
                this.send(conn.peer, makeCtrl(CTRL.PONG, {}));
                return;
            }
            if (data.kind === KIND.CTRL && data.type === CTRL.PONG) {
                return;
            }
            this.emit('message', conn.peer, data);
        });

        conn.on('close', () => {
            this._handleConnectionDown(conn.peer, conn);
        });
        conn.on('error', () => {
            this._handleConnectionDown(conn.peer, conn);
        });
    }

    _versionMismatch (data) {
        if (!data || typeof data !== 'object' || data.kind !== KIND.CTRL) return null;
        if (typeof data.v !== 'number' || data.v === PROTOCOL_VERSION || !Number.isInteger(data.v)) return null;
        const expected = this.isHost ? CTRL.HELLO : CTRL.JOIN_DENIED;
        if (data.type !== expected) return null;
        return {version: data.v, type: data.type};
    }

    _handleConnectionDown (peerId, conn) {
        if (this.destroyed) return;
        const entry = this._connections.get(peerId);
        if (!entry || (conn && entry.conn !== conn)) return;
        this._connections.delete(peerId);
        try {
            entry.conn.close();
        } catch (error) {
            // Continue recovery even if the broken channel cannot close cleanly.
        }
        this.emit('peer-disconnected', peerId);

        if (!this.isHost && peerId === this.hostPeerId) {
            this._scheduleReconnect();
        }
    }

    _scheduleReconnect () {
        if (this.destroyed || this._reconnectTimer) return;
        this._reconnectAttempts++;
        if (this._reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            this.emit('fatal', {
                error: collabError(
                    'RECONNECT_FAILED',
                    'Lost the connection to the host. Check your internet connection, then join again.'
                )
            });
            return;
        }
        const delayMs = Math.min(
            RECONNECT_BASE_DELAY_MS * Math.pow(2, this._reconnectAttempts - 1),
            RECONNECT_MAX_DELAY_MS
        );
        this.emit('reconnecting', {attempt: this._reconnectAttempts, delayMs});

        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            if (this.destroyed) return;
            this._redial();
        }, delayMs);
    }

    _redial () {
        const attemptDial = () => this._dialHost().then(() => {
            this._reconnectAttempts = 0;
            this._hostMissingAttempts = 0;
            this.emit('reconnected');
        });

        let dialPromise;
        if (!this.peer || this.peer.destroyed) {
            dialPromise = this._openPeer(generateClientPeerId(this.roomId)).then(attemptDial);
        } else {
            dialPromise = attemptDial();
        }
        dialPromise.catch(error => {
            if (this.destroyed) return;
            if (error && (error.collabCode === 'ROOM_NOT_FOUND' || error.collabCode === 'DIAL_TIMEOUT')) {
                this._hostMissingAttempts++;
                if (this._hostMissingAttempts >= HOST_GONE_ATTEMPTS) {
                    this.emit('fatal', {error: collabError('HOST_GONE', 'The host closed the room.')});
                    return;
                }
            } else {
                this._hostMissingAttempts = 0;
            }
            this._scheduleReconnect();
        });
    }

    _startHeartbeat () {
        if (this._heartbeatTimer) return;
        let lastHeartbeatAt = Date.now();
        this._heartbeatTimer = setInterval(() => {
            const now = Date.now();
            const resumed = now - lastHeartbeatAt > this._deadPeerTimeoutMs;
            lastHeartbeatAt = now;
            this._connections.forEach((entry, peerId) => {
                // A suspended tab could not receive pongs. Allow a fresh ping
                // round after waking before declaring every peer disconnected.
                if (resumed) entry.lastSeen = now;
                if (now - entry.lastSeen > this._deadPeerTimeoutMs) {
                    try {
                        entry.conn.close();
                    } catch (error) {
                        // Ignore.
                    }
                    this._handleConnectionDown(peerId);
                    return;
                }
                if (entry.conn.open) {
                    try {
                        entry.conn.send(makeCtrl(CTRL.PING, {}));
                    } catch (error) {
                        // Dead channel; the timeout above will reap it.
                    }
                }
            });
        }, this._heartbeatIntervalMs);
    }

    _stopHeartbeat () {
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
    }
}

export {
    Transport,
    DEFAULT_PEER_CONFIG,
    sanitizeRoomId,
    generateHostPeerId,
    generateClientPeerId,
    HEARTBEAT_INTERVAL_MS,
    DEAD_PEER_TIMEOUT_MS,
    HOST_GONE_ATTEMPTS
};
