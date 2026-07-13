import cursorIcon from '../assets/icon--cursor.svg';

/**
 * DOM overlay showing remote cursors, name labels and chat bubbles above
 * the Blockly workspace, plus local capture: mouse movement, "/" to open
 * the cursor chat input, and viewport-change re-projection. Rendering is
 * ported from the old cursor-sync.js; state lives on this instance.
 */
class CursorOverlay {
    /**
     * @param {object} options Options.
     * @param {VirtualMachine} options.vm The VM (for the editing target).
     * @param {PresenceChannel} options.presence Presence send/receive.
     * @param {Function} options.getUsername (userId) => display name.
     * @param {Function} [options.getAvatarUrl] (userId) => avatar URL or null.
     */
    constructor ({vm, presence, getUsername, getAvatarUrl}) {
        this.vm = vm;
        this.presence = presence;
        this.getUsername = getUsername;
        this.getAvatarUrl = getAvatarUrl || (() => null);

        this.workspace = null;
        this.layer = null;
        this.chatInput = null;
        this.remoteCursors = new Map(); // userId -> {el, label, chat}
        this.remotePositions = new Map(); // userId -> {x, y, targetId}
        this.isChatting = false;
        this._lastLocalCursor = null;
        this._listeners = [];
        this._origScrollbarSet = null;
        this._origSetScale = null;

        this._onCursorMove = (userId, payload) => this._renderRemoteCursor(userId, payload);
        this._onCursorLeave = userId => this._hideRemoteCursor(userId);
        this._onCursorChat = (userId, text) => this._renderRemoteChat(userId, text);
        this._onUserGone = userId => this._removeRemoteCursor(userId);
        presence.on('cursor-move', this._onCursorMove);
        presence.on('cursor-leave', this._onCursorLeave);
        presence.on('cursor-chat', this._onCursorChat);
        presence.on('user-gone', this._onUserGone);
    }

    destroy () {
        this.detach();
        this.presence.off('cursor-move', this._onCursorMove);
        this.presence.off('cursor-leave', this._onCursorLeave);
        this.presence.off('cursor-chat', this._onCursorChat);
        this.presence.off('user-gone', this._onUserGone);
    }

    attach (workspace) {
        if (!workspace || this.workspace === workspace) return;
        this.detach();
        const svg = workspace.getParentSvg && workspace.getParentSvg();
        const container = svg && svg.parentNode;
        if (!container) return;
        this.workspace = workspace;
        this.container = container;

        const layer = document.createElement('div');
        layer.className = 'collaboration-cursor-layer';
        layer.style.position = 'absolute';
        layer.style.left = '0';
        layer.style.top = '0';
        layer.style.right = '0';
        layer.style.bottom = '0';
        layer.style.pointerEvents = 'none';
        layer.style.zIndex = '999';
        container.style.position = container.style.position || 'relative';
        container.appendChild(layer);
        this.layer = layer;

        this._buildChatInput();
        this._bindLocalEvents();
        this._bindViewportSync();
    }

    detach () {
        this._listeners.forEach(({target, event, handler, options}) => {
            target.removeEventListener(event, handler, options);
        });
        this._listeners = [];
        if (this.workspace) {
            if (this._workspaceChangeListener) {
                try {
                    this.workspace.removeChangeListener(this._workspaceChangeListener);
                } catch (e) {
                    // Workspace already disposed.
                }
                this._workspaceChangeListener = null;
            }
            if (this.workspace.scrollbar && this._origScrollbarSet) {
                this.workspace.scrollbar.set = this._origScrollbarSet;
                this._origScrollbarSet = null;
            }
            if (this._origSetScale) {
                this.workspace.setScale = this._origSetScale;
                this._origSetScale = null;
            }
        }
        if (this.layer && this.layer.parentNode) {
            this.layer.parentNode.removeChild(this.layer);
        }
        this.layer = null;
        this.chatInput = null;
        this.remoteCursors.clear();
        this.remotePositions.clear();
        this.isChatting = false;
        this.workspace = null;
        this.container = null;
    }

    _listen (target, event, handler, options) {
        target.addEventListener(event, handler, options);
        this._listeners.push({target, event, handler, options});
    }

    _buildChatInput () {
        const chatInput = document.createElement('input');
        chatInput.type = 'text';
        chatInput.className = 'collaboration-chat-input';
        chatInput.placeholder = 'Say something... (max 500 chars)';
        chatInput.maxLength = 500;
        chatInput.style.position = 'absolute';
        chatInput.style.display = 'none';
        chatInput.style.zIndex = '1000';
        chatInput.style.padding = '8px 12px';
        chatInput.style.borderRadius = '20px';
        chatInput.style.border = '1px solid var(--ui-modal-overlay)';
        chatInput.style.background = 'var(--ui-white, white)';
        chatInput.style.color = 'var(--text-primary, #575E75)';
        chatInput.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        chatInput.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
        chatInput.style.fontSize = '13px';
        chatInput.style.outline = 'none';
        chatInput.style.minWidth = '120px';
        chatInput.style.transform = 'translate(15px, -15px)';
        chatInput.style.pointerEvents = 'auto';

        this._listen(chatInput, 'mousedown', e => e.stopPropagation());
        this._listen(chatInput, 'input', e => {
            this.presence.sendCursorChat(e.target.value);
        });
        this._listen(chatInput, 'keydown', e => {
            e.stopPropagation();
            if (e.key === 'Enter' || e.key === 'Escape') {
                chatInput.blur();
            }
        });
        this._listen(chatInput, 'blur', () => {
            chatInput.style.display = 'none';
            chatInput.value = '';
            this.isChatting = false;
            this.presence.sendCursorChat(null);
        });

        this.layer.appendChild(chatInput);
        this.chatInput = chatInput;
    }

    _editingTargetInfo () {
        const target = this.vm && this.vm.editingTarget;
        return {
            targetId: target ? target.id : null,
            targetName: target ? target.getName() : null,
            isStage: target ? target.isStage : false
        };
    }

    _sendLocalCursor () {
        if (!this._lastLocalCursor || !this.workspace) return;
        const metrics = this.workspace.getMetrics && this.workspace.getMetrics();
        const scale = this.workspace.scale || 1;
        const {x, y} = this._lastLocalCursor;
        const {targetId, targetName, isStage} = this._editingTargetInfo();
        this.presence.sendCursor({
            x: metrics ? (metrics.viewLeft + x) / scale : x,
            y: metrics ? (metrics.viewTop + y) / scale : y,
            targetId,
            targetName,
            isStage
        });
    }

    _bindLocalEvents () {
        const container = this.container;
        this._listen(container, 'mousemove', e => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this._lastLocalCursor = {x, y};
            this._sendLocalCursor();
            if (this.isChatting && this.chatInput) {
                this.chatInput.style.left = `${x}px`;
                this.chatInput.style.top = `${y}px`;
            }
        });
        this._listen(container, 'mouseleave', () => {
            this.presence.sendCursorLeave();
        });
        this._listen(window, 'keydown', e => {
            if (e.key !== '/' || this.isChatting) return;
            const active = document.activeElement;
            const activeTag = active ? active.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || (active && active.isContentEditable)) {
                return;
            }
            e.preventDefault();
            this.isChatting = true;
            if (this.chatInput && this._lastLocalCursor) {
                const {x, y} = this._lastLocalCursor;
                this.chatInput.style.left = `${x}px`;
                this.chatInput.style.top = `${y}px`;
                this.chatInput.style.display = 'block';
                this.chatInput.focus();
            }
        });
    }

    _bindViewportSync () {
        const onViewportChanged = () => {
            this._repositionAll();
            this._sendLocalCursor();
        };
        this._listen(this.container, 'wheel', onViewportChanged, {passive: true});
        this._workspaceChangeListener = onViewportChanged;
        this.workspace.addChangeListener(this._workspaceChangeListener);

        if (this.workspace.scrollbar && this.workspace.scrollbar.set) {
            const scrollbar = this.workspace.scrollbar;
            this._origScrollbarSet = scrollbar.set.bind(scrollbar);
            scrollbar.set = (x, y) => {
                this._origScrollbarSet(x, y);
                this._repositionAll();
            };
        }
        if (this.workspace.setScale) {
            this._origSetScale = this.workspace.setScale.bind(this.workspace);
            this.workspace.setScale = scale => {
                this._origSetScale(scale);
                this._repositionAll();
            };
        }
    }

    _ensureRemoteCursor (userId) {
        let cursor = this.remoteCursors.get(userId);
        if (cursor) return cursor;

        const el = document.createElement('div');
        el.className = 'collaboration-remote-cursor';
        el.style.position = 'absolute';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.pointerEvents = 'none';

        const cursorImg = document.createElement('img');
        cursorImg.src = cursorIcon;
        cursorImg.className = 'collaboration-cursor-icon';
        cursorImg.style.width = '24px';
        cursorImg.style.height = '24px';
        cursorImg.style.filter = 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.4))';
        cursorImg.draggable = false;
        el.appendChild(cursorImg);

        const label = document.createElement('div');
        label.className = 'collaboration-cursor-label';
        label.style.position = 'absolute';
        label.style.top = '26px';
        label.style.left = '0';
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '4px';
        label.style.padding = '3px 7px';
        label.style.background = 'var(--looks-secondary)';
        label.style.color = 'var(--accent-foreground, white)';
        label.style.fontSize = '11px';
        label.style.fontWeight = '600';
        label.style.borderRadius = '4px';
        label.style.whiteSpace = 'nowrap';
        label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        const labelAvatar = document.createElement('img');
        labelAvatar.className = 'collaboration-cursor-avatar';
        labelAvatar.style.width = '14px';
        labelAvatar.style.height = '14px';
        labelAvatar.style.borderRadius = '50%';
        labelAvatar.style.objectFit = 'cover';
        labelAvatar.style.display = 'none';
        labelAvatar.draggable = false;
        label.appendChild(labelAvatar);

        const labelName = document.createElement('span');
        label.appendChild(labelName);
        el.appendChild(label);

        const chat = document.createElement('div');
        chat.className = 'collaboration-cursor-chat';
        chat.style.position = 'absolute';
        chat.style.bottom = '100%';
        chat.style.left = '10px';
        chat.style.marginBottom = '8px';
        chat.style.padding = '8px 12px';
        chat.style.borderRadius = '16px';
        chat.style.borderBottomLeftRadius = '4px';
        chat.style.background = 'var(--ui-white, white)';
        chat.style.color = 'var(--text-primary, #575E75)';
        chat.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        chat.style.fontSize = '13px';
        chat.style.whiteSpace = 'normal';
        chat.style.wordWrap = 'break-word';
        chat.style.wordBreak = 'break-word';
        chat.style.display = 'none';
        chat.style.maxWidth = '400px';
        chat.style.minWidth = '200px';
        chat.style.overflow = 'hidden';
        el.appendChild(chat);

        this.layer.appendChild(el);
        cursor = {el, label, labelAvatar, labelName, chat};
        this.remoteCursors.set(userId, cursor);
        return cursor;
    }

    _project (cursor, position) {
        // Hide cursors of peers editing a different sprite. Ids are the
        // primary key; fall back to name matching so cursors survive any
        // id divergence (e.g. a peer onboarded before ids were remapped).
        const {targetId, targetName} = this._editingTargetInfo();
        const idMismatch = position.targetId && targetId && position.targetId !== targetId;
        const nameMatches = position.targetName && targetName && position.targetName === targetName;
        if (idMismatch && !nameMatches) {
            cursor.el.style.display = 'none';
            return;
        }
        const metrics = this.workspace.getMetrics && this.workspace.getMetrics();
        const scale = this.workspace.scale || 1;
        const x = (position.x * scale) - (metrics ? metrics.viewLeft : 0);
        const y = (position.y * scale) - (metrics ? metrics.viewTop : 0);
        cursor.el.style.left = `${x}px`;
        cursor.el.style.top = `${y}px`;
        cursor.el.style.display = 'block';
    }

    _renderRemoteCursor (userId, payload) {
        if (!this.layer || !this.workspace) return;
        const cursor = this._ensureRemoteCursor(userId);
        const position = {
            x: payload.x,
            y: payload.y,
            targetId: payload.targetId || null,
            targetName: payload.targetName || null
        };
        this.remotePositions.set(userId, position);
        cursor.labelName.textContent = this.getUsername(userId) || '';
        const avatarUrl = this.getAvatarUrl(userId);
        if (avatarUrl) {
            if (cursor.labelAvatar.getAttribute('src') !== avatarUrl) {
                cursor.labelAvatar.src = avatarUrl;
            }
            cursor.labelAvatar.style.display = 'block';
        } else {
            cursor.labelAvatar.style.display = 'none';
        }
        this._project(cursor, position);
    }

    _renderRemoteChat (userId, text) {
        if (!this.layer) return;
        const cursor = this._ensureRemoteCursor(userId);
        if (text) {
            cursor.chat.textContent = text;
            cursor.chat.style.display = 'block';
        } else {
            cursor.chat.style.display = 'none';
        }
    }

    _hideRemoteCursor (userId) {
        const cursor = this.remoteCursors.get(userId);
        if (cursor) cursor.el.style.display = 'none';
        this.remotePositions.delete(userId);
    }

    _removeRemoteCursor (userId) {
        const cursor = this.remoteCursors.get(userId);
        if (cursor && cursor.el.parentNode) {
            cursor.el.parentNode.removeChild(cursor.el);
        }
        this.remoteCursors.delete(userId);
        this.remotePositions.delete(userId);
    }

    _repositionAll () {
        if (!this.workspace || !this.layer) return;
        this.remoteCursors.forEach((cursor, userId) => {
            const position = this.remotePositions.get(userId);
            if (position) this._project(cursor, position);
        });
    }
}

export default CursorOverlay;
