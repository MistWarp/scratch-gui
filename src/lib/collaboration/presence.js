import Emitter from './emitter.js';
import {PRESENCE, makePresence} from './protocol.js';

const CURSOR_MIN_INTERVAL_MS = 50; // 20Hz

/**
 * The unsequenced presence channel: live cursors, cursor chat, and
 * which-sprite-is-being-edited badges. Latest state wins per peer; no
 * ordering, no persistence. The host relays presence and stamps the
 * originating userId (see host-session).
 *
 * Events (all about REMOTE peers; userId first):
 *  - 'cursor-move' (userId, {x, y, targetId, isStage})
 *  - 'cursor-leave' (userId)
 *  - 'cursor-chat' (userId, text|null)
 *  - 'editing-changed' (userId, targetId|null, previousTargetId|null)
 *  - 'user-gone' (userId) — peer left; drop all their presence state
 */
class PresenceChannel extends Emitter {
    /**
     * @param {object} options Options.
     * @param {HostSession|ClientSession} options.session The session.
     */
    constructor ({session}) {
        super();
        this.session = session;
        this.editingTargets = new Map(); // userId -> targetId

        this._lastCursorSentAt = 0;
        this._pendingCursor = null;
        this._cursorTimer = null;

        this._onPresence = (userId, envelope) => {
            if (!userId || userId === this.session.id) return;
            const payload = envelope.payload;
            switch (envelope.type) {
            case PRESENCE.CURSOR:
                this.emit('cursor-move', userId, payload);
                break;
            case PRESENCE.CURSOR_LEAVE:
                this.emit('cursor-leave', userId);
                break;
            case PRESENCE.CURSOR_CHAT:
                this.emit('cursor-chat', userId, payload.text || null);
                break;
            case PRESENCE.EDITING_TARGET: {
                const previous = this.editingTargets.get(userId) || null;
                const next = payload.targetId || null;
                if (previous === next) break;
                if (next === null) {
                    this.editingTargets.delete(userId);
                } else {
                    this.editingTargets.set(userId, next);
                }
                this.emit('editing-changed', userId, next, previous);
                break;
            }
            default:
                break;
            }
        };
        this._onUserLeft = user => {
            const previous = this.editingTargets.get(user.id) || null;
            this.editingTargets.delete(user.id);
            if (previous) this.emit('editing-changed', user.id, null, previous);
            this.emit('user-gone', user.id);
        };
        session.on('presence', this._onPresence);
        session.on('user-left', this._onUserLeft);
    }

    destroy () {
        this.session.off('presence', this._onPresence);
        this.session.off('user-left', this._onUserLeft);
        if (this._cursorTimer) {
            clearTimeout(this._cursorTimer);
            this._cursorTimer = null;
        }
        this.editingTargets.clear();
        this.removeAllListeners();
    }

    getEditingTargets () {
        return new Map(this.editingTargets);
    }

    _send (type, payload) {
        this.session.submitLocalPresence(makePresence(type, payload));
    }

    /**
     * Send our cursor position, rate limited to 20Hz with a trailing
     * update so the final position always lands.
     * @param {object} payload {x, y, targetId, isStage}.
     */
    sendCursor (payload) {
        const now = Date.now();
        const elapsed = now - this._lastCursorSentAt;
        if (elapsed >= CURSOR_MIN_INTERVAL_MS) {
            this._lastCursorSentAt = now;
            this._send(PRESENCE.CURSOR, payload);
            return;
        }
        this._pendingCursor = payload;
        if (this._cursorTimer) return;
        this._cursorTimer = setTimeout(() => {
            this._cursorTimer = null;
            if (!this._pendingCursor) return;
            this._lastCursorSentAt = Date.now();
            this._send(PRESENCE.CURSOR, this._pendingCursor);
            this._pendingCursor = null;
        }, CURSOR_MIN_INTERVAL_MS - elapsed);
    }

    sendCursorLeave () {
        this._pendingCursor = null;
        this._send(PRESENCE.CURSOR_LEAVE, {});
    }

    /**
     * Share (or clear, with null/empty) our cursor chat bubble.
     * @param {string|null} text Chat text.
     */
    sendCursorChat (text) {
        this._send(PRESENCE.CURSOR_CHAT, text ? {text: text.slice(0, 500)} : {});
    }

    /**
     * Announce which sprite we are editing (null to clear).
     * @param {string|null} targetId The sprite id.
     */
    sendEditingTarget (targetId) {
        this._send(PRESENCE.EDITING_TARGET, targetId ? {targetId} : {});
    }
}

export default PresenceChannel;
