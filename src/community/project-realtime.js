import {loadSession} from '../lib/community/api.js';

const SOCKET_URL = 'wss://mwapi.mistium.com/v1/ws';
const MAX_PENDING_DIAGNOSTICS = 100;

class ProjectRealtime {
    constructor () {
        this.socket = null;
        this.projects = new Map();
        this.pendingDiagnostics = [];
        this.reconnectTimer = null;
        this.reconnectDelay = 1000;
        this.keepalive = null;
        this.closing = false;
    }

    isOpen () {
        return Boolean(this.socket && this.socket.readyState === WebSocket.OPEN);
    }

    send (message) {
        if (!this.isOpen()) return false;
        this.socket.send(JSON.stringify(message));
        return true;
    }

    connect () {
        if (typeof WebSocket === 'undefined' || this.socket || !this.projects.size) return;
        this.closing = false;
        const socket = new WebSocket(SOCKET_URL);
        this.socket = socket;
        socket.addEventListener('open', () => this.onOpen(socket));
        socket.addEventListener('message', event => this.onMessage(socket, event.data));
        socket.addEventListener('close', () => this.onClose(socket));
        socket.addEventListener('error', () => {
            if (this.socket === socket) socket.close();
        });
    }

    onOpen (socket) {
        if (this.socket !== socket) return;
        this.reconnectDelay = 1000;
        const token = loadSession();
        if (token) this.send({type: 'authenticate', token});
        for (const [projectId, subscription] of this.projects) {
            this.send({type: 'project_subscribe', projectId, accessKey: subscription.accessKey});
        }
        for (const entry of this.pendingDiagnostics.splice(0)) {
            if (this.projects.has(entry.projectId)) this.send(entry);
        }
        clearInterval(this.keepalive);
        this.keepalive = setInterval(() => this.send({type: 'ping'}), 30000);
    }

    onMessage (socket, raw) {
        if (this.socket !== socket) return;
        let event;
        try {
            event = JSON.parse(raw);
        } catch (e) {
            return;
        }
        if (event && event.type === 'ping') {
            this.send({type: 'pong'});
            return;
        }
        if (!event || typeof event !== 'object' || !event.projectId) return;
        const subscription = this.projects.get(String(event.projectId));
        if (!subscription) return;
        for (const listener of subscription.listeners) listener(event);
    }

    onClose (socket) {
        if (this.socket !== socket) return;
        this.socket = null;
        clearInterval(this.keepalive);
        this.keepalive = null;
        if (this.closing || !this.projects.size) return;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }

    subscribe (projectId, listener, accessKey = '') {
        const id = String(projectId);
        let subscription = this.projects.get(id);
        if (!subscription) {
            subscription = {listeners: new Set(), accessKey: String(accessKey || '')};
            this.projects.set(id, subscription);
            if (this.isOpen()) {
                this.send({type: 'project_subscribe', projectId: id, accessKey: subscription.accessKey});
            }
        }
        subscription.listeners.add(listener);
        this.connect();
        return () => {
            const current = this.projects.get(id);
            if (!current) return;
            current.listeners.delete(listener);
            if (current.listeners.size) return;
            this.projects.delete(id);
            this.pendingDiagnostics = this.pendingDiagnostics.filter(entry => entry.projectId !== id);
            this.send({type: 'project_unsubscribe', projectId: id});
        };
    }

    refreshAuth () {
        if (!this.isOpen()) return;
        this.send({type: 'authenticate', token: loadSession() || ''});
    }

    diagnostic (projectId, diagnostic) {
        const id = String(projectId);
        if (!this.projects.has(id) || !diagnostic || typeof diagnostic !== 'object') return;
        const message = {type: 'diagnostic', projectId: id, diagnostic};
        if (this.send(message)) return;
        this.pendingDiagnostics.push(message);
        if (this.pendingDiagnostics.length > MAX_PENDING_DIAGNOSTICS) this.pendingDiagnostics.shift();
        this.connect();
    }

    disconnect () {
        this.closing = true;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
        clearInterval(this.keepalive);
        this.keepalive = null;
        const socket = this.socket;
        this.socket = null;
        if (socket && socket.readyState !== WebSocket.CLOSED) socket.close();
    }
}

const projectRealtime = new ProjectRealtime();

export {ProjectRealtime, SOCKET_URL};
export default projectRealtime;
