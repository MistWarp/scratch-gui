import {request} from '../community/api.js';

const PING_INTERVAL = 15000;
const HEARTBEAT_TIMEOUT = 10000;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 10000;

const startKeepaliveTimer = (callback, intervalMs) => {
    if (typeof window !== 'undefined' && typeof Blob !== 'undefined' && typeof Worker !== 'undefined') {
        try {
            const blob = new Blob([
                `let timer = null;
                self.onmessage = function(e) {
                    if (e.data === 'start') {
                        if (timer) clearInterval(timer);
                        timer = setInterval(function() { postMessage('tick'); }, ${intervalMs});
                    } else if (e.data === 'stop') {
                        if (timer) clearInterval(timer);
                        timer = null;
                    }
                };`
            ], {type: 'application/javascript'});
            const url = URL.createObjectURL(blob);
            const worker = new Worker(url);
            worker.onmessage = () => callback();
            worker.postMessage('start');
            return () => {
                try {
                    worker.postMessage('stop');
                    worker.terminate();
                } catch (e) {
                    // ignore
                }
                URL.revokeObjectURL(url);
            };
        } catch (e) {
            // fallback if worker creation is disallowed by environment
        }
    }
    const timer = setInterval(callback, intervalMs);
    return () => clearInterval(timer);
};

class RealtimeClient {
    constructor () {
        this.socket = null;
        this.players = new Map();
        this.listeners = new Set();
        this.self = '';
        this.connectionPromise = null;
        this.connectionKey = '';
        this.connectionGeneration = 0;
        this.targetConnection = null;
        this.isExplicitDisconnect = false;
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.stopKeepalive = null;
        this.heartbeatTimeout = null;
        this.lastState = null;

        this.handleWake = this.handleWake.bind(this);
        if (typeof window !== 'undefined') {
            window.addEventListener('focus', this.handleWake);
            window.addEventListener('online', this.handleWake);
            window.addEventListener('pageshow', this.handleWake);
        }
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.handleWake);
        }
    }

    handleWake () {
        if (this.isExplicitDisconnect || !this.targetConnection) return;
        if (this.isConnected()) {
            this.ping();
        } else if (!this.connectionPromise) {
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            this.performReconnect();
        }
    }

    startHeartbeat () {
        this.stopHeartbeat();
        this.stopKeepalive = startKeepaliveTimer(() => this.ping(), PING_INTERVAL);
    }

    stopHeartbeat () {
        if (this.stopKeepalive) {
            this.stopKeepalive();
            this.stopKeepalive = null;
        }
        this.clearHeartbeatTimeout();
    }

    ping () {
        if (!this.isConnected()) return;
        try {
            this.socket.send(JSON.stringify({type: 'ping'}));
            this.armHeartbeatTimeout();
        } catch (e) {
            // If sending fails, socket is likely closed or broken
            if (this.socket) {
                try {
                    this.socket.close();
                } catch (closeErr) {
                    // ignore
                }
            }
        }
    }

    clearHeartbeatTimeout () {
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
    }

    armHeartbeatTimeout () {
        this.clearHeartbeatTimeout();
        this.heartbeatTimeout = setTimeout(() => {
            this.heartbeatTimeout = null;
            if (this.socket) {
                try {
                    this.socket.close();
                } catch (e) {
                    // ignore
                }
            }
        }, HEARTBEAT_TIMEOUT);
    }

    subscribe (listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    emit (event) {
        for (const listener of this.listeners) listener(event);
    }

    isConnected () {
        return Boolean(this.socket && this.socket.readyState === WebSocket.OPEN);
    }

    ensureConnected (projectId, context = 'play', room = 'main') {
        if (this.isConnected()) {
            return Promise.resolve({connected: true, self: this.self, players: this.listPlayers()});
        }
        if (this.connectionPromise) return this.connectionPromise;
        return this.connect(projectId, context, room);
    }

    connect (projectId, context = 'play', room = 'main') {
        const connectionKey = `${projectId}:${context}:${room}`;
        if (this.isConnected() && this.connectionKey === connectionKey) {
            return Promise.resolve({connected: true, self: this.self, players: this.listPlayers()});
        }
        if (this.connectionPromise && this.connectionKey === connectionKey) return this.connectionPromise;

        this.isExplicitDisconnect = false;
        this.targetConnection = {projectId, context, room};
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.connectionGeneration += 1;
        if (this.socket) {
            this.stopHeartbeat();
            this.socket.close(1000, 'Replaced');
            this.socket = null;
        }
        this.connectionKey = connectionKey;
        const generation = this.connectionGeneration;
        const attempt = this.openConnection(projectId, context, room, generation);
        const trackedAttempt = attempt.finally(() => {
            if (this.connectionPromise === trackedAttempt) this.connectionPromise = null;
        });
        this.connectionPromise = trackedAttempt;
        return trackedAttempt;
    }

    scheduleReconnect () {
        if (this.isExplicitDisconnect || !this.targetConnection || this.reconnectTimer || this.connectionPromise) {
            return;
        }
        const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts), MAX_RECONNECT_DELAY) +
            (Math.random() * 500);
        this.reconnectAttempts += 1;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.performReconnect();
        }, delay);
    }

    performReconnect () {
        if (this.isExplicitDisconnect || !this.targetConnection || this.isConnected() || this.connectionPromise) {
            return;
        }
        const {projectId, context, room} = this.targetConnection;
        const generation = this.connectionGeneration;
        const attempt = this.openConnection(projectId, context, room, generation);
        const trackedAttempt = attempt.finally(() => {
            if (this.connectionPromise === trackedAttempt) this.connectionPromise = null;
        });
        this.connectionPromise = trackedAttempt;
        attempt.catch(() => {
            if (!this.isExplicitDisconnect && this.targetConnection) {
                this.scheduleReconnect();
            }
        });
    }

    async openConnection (projectId, context, room, generation) {
        const result = await request(`/projects/${encodeURIComponent(projectId)}/multiplayer-ticket`, {
            method: 'POST', body: {context, room}
        });
        if (generation !== this.connectionGeneration) throw new Error('Multiplayer connection was replaced');
        const socket = new WebSocket(result.connectUrl);
        this.socket = socket;
        return new Promise((resolve, reject) => {
            let settled = false;
            const timeout = setTimeout(() => {
                if (settled) return;
                settled = true;
                socket.close();
                reject(new Error('Multiplayer connection timed out'));
            }, 10000);

            socket.addEventListener('open', () => {
                socket.send(JSON.stringify({type: 'authenticate', ticket: result.ticket}));
            });

            socket.addEventListener('message', event => {
                this.clearHeartbeatTimeout();
                let message;
                try {
                    message = JSON.parse(event.data);
                } catch (e) {
                    return;
                }
                if (message.type === 'welcome') {
                    settled = true;
                    clearTimeout(timeout);
                    this.self = message.self;
                    this.players = new Map((message.players || []).map(player => [player.id, player]));
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    if (this.lastState) {
                        try {
                            this.send({type: 'state', value: this.lastState});
                        } catch (e) {
                            // ignore state restore failure
                        }
                    }
                    resolve({connected: true, self: this.self, players: this.listPlayers()});
                } else if (message.type === 'pong') {
                    this.clearHeartbeatTimeout();
                } else if (message.type === 'player_joined' || message.type === 'player_state') {
                    this.players.set(message.player.id, message.player);
                } else if (message.type === 'player_left') {
                    this.players.delete(message.player.id);
                }
                this.emit(message);
            });

            socket.addEventListener('close', () => {
                clearTimeout(timeout);
                this.stopHeartbeat();
                if (!settled) {
                    settled = true;
                    reject(new Error('Multiplayer connection closed before it was ready'));
                }
                if (this.socket === socket) {
                    this.socket = null;
                    this.players.clear();
                    this.emit({type: 'disconnected'});
                    if (!this.isExplicitDisconnect && this.targetConnection) {
                        this.scheduleReconnect();
                    }
                }
            });

            socket.addEventListener('error', () => {
                clearTimeout(timeout);
                if (socket.readyState !== WebSocket.OPEN && !settled) {
                    settled = true;
                    reject(new Error('Could not connect to multiplayer'));
                }
            });
        });
    }

    disconnect () {
        this.isExplicitDisconnect = true;
        this.targetConnection = null;
        this.lastState = null;
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.stopHeartbeat();
        this.connectionGeneration += 1;
        if (this.socket) {
            try {
                this.socket.close(1000, 'Disconnected');
            } catch (e) {
                // ignore
            }
        }
        this.socket = null;
        this.connectionPromise = null;
        this.connectionKey = '';
        this.players.clear();
    }

    destroy () {
        this.disconnect();
        if (typeof window !== 'undefined') {
            window.removeEventListener('focus', this.handleWake);
            window.removeEventListener('online', this.handleWake);
            window.removeEventListener('pageshow', this.handleWake);
        }
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleWake);
        }
        this.listeners.clear();
    }

    send (message) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) throw new Error('Connect to multiplayer first');
        this.socket.send(JSON.stringify(message));
    }

    setState (value) {
        this.lastState = value;
        this.send({type: 'state', value});
    }

    sendGameEvent (event) {
        this.send({
            type: 'game_event',
            name: event.name,
            value: event.value,
            ...(event.to ? {to: event.to} : {})
        });
    }

    listPlayers () {
        return [...this.players.values()];
    }
}

export default RealtimeClient;
