import Emitter from './emitter.js';
import {PRESENCE, makePresence} from './protocol.js';

const CURSOR_MIN_INTERVAL_MS = 50; // 20Hz

const sameActivity = (a, b) => (
    a === b ||
    Boolean(a && b && a.targetId === b.targetId && a.tab === b.tab && a.assetIndex === b.assetIndex)
);

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
 *  - 'editing-changed' (userId, activity|null, previousActivity|null) where
 *    an activity is {targetId, tab, assetIndex}
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
        this.activities = new Map(); // userId -> {targetId, tab, assetIndex}

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
                const previous = this.activities.get(userId) || null;
                const next = payload.targetId ? {
                    targetId: payload.targetId,
                    tab: payload.tab || 0,
                    assetIndex: payload.assetIndex || 0
                } : null;
                if (sameActivity(previous, next)) break;
                if (next === null) {
                    this.activities.delete(userId);
                } else {
                    this.activities.set(userId, next);
                }
                this.emit('editing-changed', userId, next, previous);
                break;
            }
            default:
                break;
            }
        };
        this._onUserLeft = user => {
            const previous = this.activities.get(user.id) || null;
            this.activities.delete(user.id);
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
        this.activities.clear();
        this.removeAllListeners();
    }

    getActivities () {
        return new Map(this.activities);
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
     * Announce where we are working (null targetId to clear).
     * @param {object} activity {targetId, tab, assetIndex}.
     */
    sendActivity (activity) {
        this._send(PRESENCE.EDITING_TARGET, activity && activity.targetId ? {
            targetId: activity.targetId,
            tab: activity.tab || 0,
            assetIndex: activity.assetIndex || 0
        } : {});
    }
}

export default PresenceChannel;
