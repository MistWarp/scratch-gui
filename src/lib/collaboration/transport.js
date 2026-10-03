import PeerModule from 'peerjs';
import {resolvePeerConstructor} from './peer-constructor.js';
import Emitter from './emitter.js';
import {validateEnvelope, makeCtrl, KIND, CTRL, PROTOCOL_VERSION} from './protocol.js';
import {DirectLink, RelayLink, RAW_SERIALIZATION, RELAY_MARK} from './links.js';
import {APP_NAME} from '../constants/brand.js';

const DEFAULT_PEER_CONFIG = {
    host: 'collab_warp.mistium.com',
    port: 443,
    path: '/',
    secure: true,
    config: {
        // Peers that STUN cannot connect fall back to the broker relay, so
        // only list servers that answer.
        iceServers: [
            {urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302']},
            {urls: 'stun:stun1.l.google.com:19302'}
        ]
    },
    debug: 1
};

const HEARTBEAT_INTERVAL_MS = 5 * 1000;
const DEAD_PEER_TIMEOUT_MS = 20 * 1000;
const DIAL_TIMEOUT_MS = 15 * 1000;
const RELAY_FALLBACK_MS = 3 * 1000;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 8 * 1000;
const RECONNECT_GIVE_UP_MS = 5 * 60 * 1000;
const BROKER_RECONNECT_MAX_DELAY_MS = 30 * 1000;
const HOST_GONE_ATTEMPTS = 3;
const HOST_GONE_AFTER_MS = 20 * 1000;
const BROKER_PROBE_INTERVAL_MS = 15 * 1000;
const BROKER_PROBE_RETRY_MS = 2 * 1000;
const BROKER_PROBE_TIMEOUT_MS = 10 * 1000;
const BROKER_KEEPALIVE_MS = 10 * 1000;
const MAX_RELAY_LINKS = 256;
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

const randomString = () => Math.random()
    .toString(36)
    .substring(2, 11);

const generateClientPeerId = roomId =>
    `${APP_NAME}-collab-${sanitizeRoomId(roomId)}-user-${Date.now()}-${randomString()}`;

const isPlainObject = value => typeof value === 'object' && value !== null && !Array.isArray(value);

const connectionClosedError = () => collabError(
    'CONNECTION_CLOSED', 'The host connection closed before joining. Please try again.'
);

/**
 * Connection layer for the collaboration engine. Owns peer registration
 * with the broker, dialing the host, accepting clients, heartbeat-based
 * dead peer detection, client reconnection with backoff, and broker
 * re-registration.
 *
 * Each peer is reached over one link: a direct WebRTC data channel, or,
 * when WebRTC cannot connect within a few seconds, a relay through the
 * broker's WebSocket. Both are ordered and reliable, so nothing above this
 * layer knows which one is in use.
 *
 * Every inbound message is validated against the protocol before being
 * surfaced. No collaboration semantics live here.
 *
 * Events:
 *  - 'connected' () — (client) the link to the host is open
 *  - 'peer-connected' (peerId, metadata) — (host) a client link opened
 *  - 'peer-disconnected' (peerId) — a link closed or timed out
 *  - 'message' (peerId, envelope) — validated inbound envelope
 *  - 'reconnecting' ({attempt, delayMs}) — (client) redial scheduled
 *  - 'reconnected' () — (client) redial succeeded
 *  - 'invalid-message' ({peerId, error}) — dropped inbound message
 *  - 'version-mismatch' ({peerId, version, type}) — a hello or join denial
 *    from a different protocol version
 *  - 'broker-offline' () / 'broker-online' () — registration with the
 *    signalling server was lost or restored; direct links keep working
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
        this._relayFallbackMs = options.relayFallbackMs || RELAY_FALLBACK_MS;
        this._relayEnabled = options.relay !== false;

        this.peer = null;
        this.isHost = false;
        this.roomId = null;
        this.hostPeerId = null;
        this.destroyed = false;
        this.droppedMessageCount = 0;

        this._id = null;
        this._connections = new Map();
        this._relayLinks = new Map();
        this._pendingConnections = new Set();
        this._heartbeatTimer = null;
        this._reconnectTimer = null;
        this._reconnectAttempts = 0;
        this._reconnectStartedAt = 0;
        this._redialing = false;
        this._hostMissingAttempts = 0;
        this._hostMissingSince = 0;
        this._preferRelay = false;
        this._brokerTimer = null;
        this._brokerAttempts = 0;
        this._brokerOffline = false;
        this._probeTimer = null;
        this._probeId = null;
        this._probeSentAt = 0;
        this._keepaliveAt = 0;
        this._joinMetadata = null;
        this._onPeerUnavailable = null;
        this._onOnline = () => this._handleOnline();
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

    /**
     * Our peer id. It stays the same while the broker connection drops and
     * comes back, and changes only when a client redials with a new peer.
     * @returns {string|null} The id, or null before registration.
     */
    get id () {
        return this._id;
    }

    peers () {
        return Array.from(this._connections.keys());
    }

    isOpen (peerId) {
        const entry = this._connections.get(peerId);
        return Boolean(entry && entry.link.open);
    }

    /**
     * How a peer is reached.
     * @param {string} peerId Peer, or 'host' from a client.
     * @returns {string|null} 'direct', 'relay', or null when not connected.
     */
    connectionPath (peerId) {
        const entry = this._connections.get(peerId === 'host' ? this.hostPeerId : peerId);
        return entry ? entry.link.path : null;
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
            this._startMonitoring();
            return id;
        });
    }

    /**
     * Register with the broker and dial the room's host.
     * @param {string} roomId The room to join.
     * @param {object} metadata Attached to the connection (username etc).
     * @returns {Promise<string>} Resolves with our peer id once the link to
     * the host is open.
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
                this._startMonitoring();
                return this.id;
            });
    }

    /**
     * Send an envelope to one peer.
     * @param {string} peerId Destination peer.
     * @param {object} envelope Protocol envelope.
     * @returns {boolean} Whether the message was handed to the link.
     */
    send (peerId, envelope) {
        const entry = this._connections.get(peerId);
        if (!entry || !entry.link.open) return false;
        return entry.link.send(envelope);
    }

    sendToHost (envelope) {
        if (this.isHost || !this.hostPeerId) return false;
        return this.send(this.hostPeerId, envelope);
    }

    /**
     * Bytes still queued on a peer's link. Bulk senders use this to pace
     * themselves, so a large transfer does not park ops and presence
     * behind megabytes of backlog on the same ordered link.
     * @param {string} peerId Peer, or 'host' from a client.
     * @returns {number} Queued bytes (0 when the link is unknown).
     */
    bufferedAmount (peerId) {
        const entry = this._connections.get(peerId === 'host' ? this.hostPeerId : peerId);
        return entry ? entry.link.bufferedAmount() : 0;
    }

    /**
     * Send an envelope to every open connection except one.
     * @param {object} envelope Protocol envelope.
     * @param {string} [exceptPeerId] Peer to skip.
     */
    broadcast (envelope, exceptPeerId) {
        this._connections.forEach((entry, peerId) => {
            if (peerId === exceptPeerId || !entry.link.open) return;
            entry.link.send(envelope);
        });
    }

    /**
     * Close the link to one peer (host-side kick).
     * @param {string} peerId Peer to disconnect.
     * @param {object} [options] Options.
     * @param {boolean} [options.graceful] Let queued messages leave first.
     * @returns {Promise} Resolves once the link is closed.
     */
    closeConnection (peerId, {graceful = false} = {}) {
        const entry = this._connections.get(peerId);
        if (!entry) return Promise.resolve();
        this._connections.delete(peerId);
        if (!graceful) {
            entry.link.close();
            return Promise.resolve();
        }
        return this._drain(entry.link).then(() => entry.link.close());
    }

    _drain (link) {
        const deadline = Date.now() + GRACEFUL_CLOSE_TIMEOUT_MS;
        return new Promise(resolve => {
            const check = () => {
                if (!link.open || link.bufferedAmount() === 0 || Date.now() >= deadline) {
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
        clearTimeout(this._probeTimer);
        this._probeTimer = null;
        if (typeof window !== 'undefined') window.removeEventListener('online', this._onOnline);
    }

    _destroyPeer (peer) {
        if (!peer) return;
        try {
            peer.destroy();
        } catch (error) {
            return;
        }
    }

    _closeLinks () {
        const links = new Set(Array.from(this._connections.values(), entry => entry.link));
        this._relayLinks.forEach(link => links.add(link));
        this._connections.clear();
        this._relayLinks.clear();
        return Array.from(links);
    }

    destroy () {
        this.destroyed = true;
        this._stopTimers();
        this._closeLinks().forEach(link => link.close());
        this._destroyPeer(this.peer);
        this.peer = null;
        this.removeAllListeners();
    }

    /**
     * Stop immediately, but give messages already queued on each link
     * (a final "room closed" notice, for example) a moment to leave before
     * the links close.
     * @returns {Promise} Resolves once every link and the peer are closed.
     */
    destroyGracefully () {
        this.destroyed = true;
        this._stopTimers();
        this.removeAllListeners();
        const links = this._closeLinks();
        const peer = this.peer;
        this.peer = null;
        return Promise.all(links.map(link => this._drain(link).then(() => link.close())))
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
            this._hookRelay(peer);
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
                    this._id = id;
                    resolve(id);
                    return;
                }
                this._brokerRestored();
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

    _brokerRestored () {
        this._brokerAttempts = 0;
        clearTimeout(this._brokerTimer);
        this._brokerTimer = null;
        if (this._brokerOffline) {
            this._brokerOffline = false;
            this.emit('broker-online');
        }
    }

    _scheduleBrokerReconnect (peer) {
        if (this._brokerTimer) return;
        if (!this._brokerOffline) {
            this._brokerOffline = true;
            this.emit('broker-offline');
        }
        this._probeId = null;
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

    _handleOnline () {
        if (this.destroyed) return;
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
            this._redial();
        }
        if (this._brokerTimer && this.peer) {
            clearTimeout(this._brokerTimer);
            this._brokerTimer = null;
            const peer = this.peer;
            try {
                peer.reconnect();
            } catch (error) {
                this._scheduleBrokerReconnect(peer);
            }
        }
    }

    // ----- Broker relay -----

    _canRelay (peer) {
        return Boolean(this._relayEnabled && peer && peer.socket && typeof peer.socket.send === 'function' &&
            peer._mwRelayHooked);
    }

    /**
     * Route relay messages from the broker to us before PeerJS sees them.
     * PeerJS would otherwise keep them forever as candidates for a
     * connection that never arrives.
     * @param {Peer} peer A freshly created peer.
     */
    _hookRelay (peer) {
        if (!this._relayEnabled || typeof peer._handleMessage !== 'function') return;
        const original = peer._handleMessage;
        peer._handleMessage = message => {
            const payload = message && message.payload;
            if (payload && payload.mw === RELAY_MARK) {
                if (!this.destroyed && this.peer === peer) this._onRelayMessage(peer, message.src, payload);
                return;
            }
            return original.call(peer, message);
        };
        peer._mwRelayHooked = true;
    }

    _signal (peer, dst, message) {
        if (!peer || peer.destroyed || peer.disconnected || !peer.socket) return false;
        const socket = peer.socket._socket;
        if (socket && socket.readyState !== 1) return false;
        try {
            peer.socket.send({type: 'CANDIDATE', dst, payload: Object.assign({mw: RELAY_MARK}, message)});
        } catch (error) {
            return false;
        }
        return true;
    }

    _socketBuffered (peer) {
        const socket = peer && peer.socket && peer.socket._socket;
        return socket ? socket.bufferedAmount || 0 : 0;
    }

    _createRelayLink (peer, peerId, linkId, metadata) {
        const link = new RelayLink({
            peerId,
            linkId,
            metadata,
            signal: message => this._signal(peer, peerId, message),
            bufferedAmount: () => this._socketBuffered(peer)
        });
        this._relayLinks.set(linkId, link);
        link.on('close', () => {
            if (this._relayLinks.get(linkId) === link) this._relayLinks.delete(linkId);
        });
        return link;
    }

    _onRelayMessage (peer, src, payload) {
        if (typeof src !== 'string' || !src) return;
        this._keepBrokerAlive(peer);
        const linkId = typeof payload.link === 'string' ? payload.link : '';
        const link = this._relayLinks.get(linkId);
        const ours = Boolean(link && link.peer === src);
        switch (payload.op) {
        case 'probe':
            if (src === this._id && linkId && linkId === this._probeId) {
                this._probeId = null;
                this._brokerRestored();
            }
            break;
        case 'open':
            this._acceptRelay(peer, src, linkId, payload.meta);
            break;
        case 'accept':
            if (ours) link.markOpen();
            break;
        case 'data':
            if (ours) link.receive(payload);
            // A host that restarted has never heard of this link.
            else if (linkId) this._signal(peer, src, {op: 'close', link: linkId});
            break;
        case 'close':
            if (ours) link.remoteClose();
            break;
        default:
            break;
        }
    }

    _acceptRelay (peer, src, linkId, metadata) {
        if (!this.isHost || !linkId || linkId.length > 64 || this._relayLinks.has(linkId)) return;
        if (this._relayLinks.size >= MAX_RELAY_LINKS) {
            this._signal(peer, src, {op: 'close', link: linkId});
            return;
        }
        const link = this._createRelayLink(peer, src, linkId, isPlainObject(metadata) ? metadata : {});
        link.accept();
        if (link.open) this._acceptLink(link);
    }

    /**
     * Without WebRTC traffic a background tab's timers slow to one a
     * minute, which starves PeerJS's own broker heartbeat. Relay traffic
     * arrives as events, so answer it with a heartbeat of our own.
     * @param {Peer} peer Our peer.
     */
    _keepBrokerAlive (peer) {
        const now = Date.now();
        if (now - this._keepaliveAt < BROKER_KEEPALIVE_MS) return;
        this._keepaliveAt = now;
        const socket = peer.socket && peer.socket._socket;
        if (socket && socket.readyState !== 1) return;
        try {
            peer.socket.send({type: 'HEARTBEAT'});
        } catch (error) {
            // The probe notices a dead broker socket.
        }
    }

    /**
     * A WebSocket can stay half open after a network change: sends succeed
     * and nothing arrives. The broker echoes a message addressed to
     * ourselves, so a probe that never returns means the socket is dead.
     */
    _probeBroker () {
        this._probeTimer = null;
        if (this.destroyed) return;
        const peer = this.peer;
        if (this._canRelay(peer) && !peer.disconnected && !peer.destroyed) {
            const now = Date.now();
            if (this._probeId && now - this._probeSentAt >= BROKER_PROBE_TIMEOUT_MS) {
                this._probeId = null;
                if (typeof peer.disconnect === 'function') {
                    try {
                        // Emits 'disconnected', which reconnects with the
                        // same id; the broker hands it the old registration.
                        peer.disconnect();
                    } catch (error) {
                        // The next probe tries again.
                    }
                }
            }
            if (!this._probeId && !peer.disconnected && this._id) {
                this._probeId = randomString();
                this._probeSentAt = now;
                // Not sent while the socket is still connecting; retry soon.
                if (!this._signal(peer, this._id, {op: 'probe', link: this._probeId})) this._probeId = null;
            }
        }
        this._probeTimer = setTimeout(() => this._probeBroker(),
            this._brokerOffline ? BROKER_PROBE_RETRY_MS : BROKER_PROBE_INTERVAL_MS);
    }

    _startMonitoring () {
        this._startHeartbeat();
        if (!this._probeTimer && this._canRelay(this.peer)) {
            this._probeTimer = setTimeout(() => this._probeBroker(), BROKER_PROBE_INTERVAL_MS);
        }
        if (typeof window !== 'undefined') {
            window.removeEventListener('online', this._onOnline);
            window.addEventListener('online', this._onOnline);
        }
    }

    // ----- Links -----

    _dialHost () {
        return new Promise((resolve, reject) => {
            const peer = this.peer;
            let done = false;
            let direct = null;
            let relay = null;
            let directError = null;
            let fallbackTimer = null;
            let timeout = null;
            const pending = {cancel: null};

            const cleanup = () => {
                clearTimeout(timeout);
                clearTimeout(fallbackTimer);
                if (this._onPeerUnavailable === pending.unavailable) this._onPeerUnavailable = null;
                this._pendingConnections.delete(pending.cancel);
            };
            const fail = error => {
                if (done) return;
                done = true;
                cleanup();
                if (direct) direct.close();
                if (relay) relay.close();
                reject(error);
            };
            const win = link => {
                if (done) return;
                done = true;
                cleanup();
                const loser = link === direct ? relay : direct;
                if (loser) loser.close();
                this._preferRelay = link.path === 'relay';
                this._registerConnection(link);
                this.emit('connected');
                resolve();
            };
            const startRelay = () => {
                clearTimeout(fallbackTimer);
                if (done || relay) return;
                if (!this._canRelay(peer) || this.peer !== peer) {
                    if (!direct) fail(directError || connectionClosedError());
                    return;
                }
                relay = this._createRelayLink(peer, this.hostPeerId, randomString() + randomString(),
                    this._joinMetadata);
                relay.on('open', () => win(relay));
                relay.on('close', () => fail(directError || connectionClosedError()));
                relay.request();
                // One attempt at a time, so the host never sees two links
                // from us racing to replace each other.
                if (direct) {
                    const abandoned = direct;
                    direct = null;
                    abandoned.close();
                }
            };
            const startDirect = () => {
                let conn;
                try {
                    conn = peer.connect(this.hostPeerId, {
                        label: 'collaboration',
                        metadata: this._joinMetadata,
                        reliable: true,
                        serialization: RAW_SERIALIZATION
                    });
                } catch (error) {
                    directError = this._describeError(error);
                    startRelay();
                    return;
                }
                // Before the link subscribes, so its close sees the reason.
                conn.on('error', error => {
                    if (!directError && error) directError = this._describeError(error);
                });
                const link = new DirectLink(conn);
                direct = link;
                link.on('open', () => {
                    if (direct === link) win(link);
                });
                link.on('close', () => {
                    if (done || direct !== link) return;
                    direct = null;
                    if (!directError) directError = connectionClosedError();
                    startRelay();
                });
                fallbackTimer = setTimeout(startRelay, this._relayFallbackMs);
            };

            pending.cancel = () => fail(collabError('CONNECTION_CANCELLED', 'Collaboration connection cancelled'));
            pending.unavailable = () => fail(collabError(
                'ROOM_NOT_FOUND',
                `Nobody is hosting room "${this.roomId}" right now.`
            ));
            this._pendingConnections.add(pending.cancel);
            this._onPeerUnavailable = pending.unavailable;
            timeout = setTimeout(() => fail(collabError(
                'DIAL_TIMEOUT',
                `Room "${this.roomId}" did not respond. The host may have a slow or blocked connection.`
            )), this._dialTimeoutMs);

            if (!peer) {
                fail(collabError('CONNECTION_CANCELLED', 'Collaboration connection cancelled'));
                return;
            }
            if (this._preferRelay && this._canRelay(peer)) startRelay();
            else startDirect();
        });
    }

    _wireConnection (conn) {
        if (this.destroyed) {
            conn.close();
            return;
        }
        const link = new DirectLink(conn);
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
            link.close();
        };
        pending.cancel = cancel;
        const opened = () => {
            if (finished || this.destroyed) return;
            finished = true;
            cleanup();
            this._acceptLink(link);
        };
        link.on('close', cancel);
        if (conn.open) {
            opened();
        } else {
            this._pendingConnections.add(cancel);
            timer = setTimeout(cancel, this._dialTimeoutMs);
            link.on('open', opened);
        }
    }

    _acceptLink (link) {
        this._registerConnection(link);
        this.emit('peer-connected', link.peer, link.metadata || {});
    }

    _registerConnection (link) {
        const previous = this._connections.get(link.peer);
        if (previous && previous.link === link) return;
        this._connections.set(link.peer, {link, lastSeen: Date.now()});
        if (previous) previous.link.close();

        link.on('message', data => this._onLinkMessage(link, data));
        link.on('frame-error', error => {
            if (this.destroyed || !this._isCurrent(link)) return;
            this.droppedMessageCount++;
            this.emit('invalid-message', {peerId: link.peer, error: error.message || String(error)});
        });
        link.on('close', () => this._handleConnectionDown(link.peer, link));
    }

    _isCurrent (link) {
        const entry = this._connections.get(link.peer);
        return Boolean(entry && entry.link === link);
    }

    _onLinkMessage (link, data) {
        if (this.destroyed) return;
        const entry = this._connections.get(link.peer);
        if (!entry || entry.link !== link) return;
        entry.lastSeen = Date.now();

        const error = validateEnvelope(data);
        if (error) {
            const mismatch = this._versionMismatch(data);
            if (mismatch) {
                this.emit('version-mismatch', Object.assign({peerId: link.peer}, mismatch));
                return;
            }
            this.droppedMessageCount++;
            this.emit('invalid-message', {peerId: link.peer, error});
            return;
        }
        if (data.kind === KIND.CTRL && data.type === CTRL.PING) {
            link.send(makeCtrl(CTRL.PONG, {}));
            return;
        }
        if (data.kind === KIND.CTRL && data.type === CTRL.PONG) {
            return;
        }
        this.emit('message', link.peer, data);
    }

    _versionMismatch (data) {
        if (!data || typeof data !== 'object' || data.kind !== KIND.CTRL) return null;
        if (typeof data.v !== 'number' || data.v === PROTOCOL_VERSION || !Number.isInteger(data.v)) return null;
        const expected = this.isHost ? CTRL.HELLO : CTRL.JOIN_DENIED;
        if (data.type !== expected) return null;
        return {version: data.v, type: data.type};
    }

    _handleConnectionDown (peerId, link) {
        if (this.destroyed) return;
        const entry = this._connections.get(peerId);
        if (!entry || (link && entry.link !== link)) return;
        this._connections.delete(peerId);
        entry.link.close();
        this.emit('peer-disconnected', peerId);

        if (!this.isHost && peerId === this.hostPeerId) {
            this._scheduleReconnect();
        }
    }

    _scheduleReconnect () {
        if (this.destroyed || this._reconnectTimer || this._redialing) return;
        const now = Date.now();
        if (!this._reconnectStartedAt) this._reconnectStartedAt = now;
        if (now - this._reconnectStartedAt >= RECONNECT_GIVE_UP_MS) {
            this.emit('fatal', {
                error: collabError(
                    'RECONNECT_FAILED',
                    'Lost the connection to the host. Check your internet connection, then join again.'
                )
            });
            return;
        }
        this._reconnectAttempts++;
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
        this._redialing = true;
        // A fresh peer gets a fresh broker socket, in case the old one is
        // what broke. The host recognises us by our reconnect token.
        const previous = this.peer;
        this.peer = null;
        this._probeId = null;
        this._destroyPeer(previous);
        this._openPeer(generateClientPeerId(this.roomId))
            .then(() => this._dialHost())
            .then(() => {
                this._redialing = false;
                this._reconnectAttempts = 0;
                this._reconnectStartedAt = 0;
                this._hostMissingAttempts = 0;
                this._hostMissingSince = 0;
                this._brokerRestored();
                this.emit('reconnected');
            })
            .catch(error => {
                this._redialing = false;
                if (this.destroyed) return;
                // Only the broker saying the host is not registered counts.
                // A timeout can just as well be our own network.
                if (error && error.collabCode === 'ROOM_NOT_FOUND') {
                    const now = Date.now();
                    if (!this._hostMissingSince) this._hostMissingSince = now;
                    this._hostMissingAttempts++;
                    if (this._hostMissingAttempts >= HOST_GONE_ATTEMPTS &&
                        now - this._hostMissingSince >= HOST_GONE_AFTER_MS) {
                        this.emit('fatal', {error: collabError('HOST_GONE', 'The host closed the room.')});
                        return;
                    }
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
                    this._handleConnectionDown(peerId, entry.link);
                    return;
                }
                if (entry.link.open) entry.link.send(makeCtrl(CTRL.PING, {}));
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
    HOST_GONE_ATTEMPTS,
    HOST_GONE_AFTER_MS,
    RECONNECT_GIVE_UP_MS
};
