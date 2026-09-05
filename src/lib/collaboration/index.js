import {withProjectReplacement} from '../project-replacement.js';
import {detachWorkspace} from '../workspace-state.js';
import Emitter from './emitter.js';
import {Transport} from './transport.js';
import HostSession from './host-session.js';
import ClientSession from './client-session.js';
import VMApplier, {remapTargetIds} from './vm-applier.js';
import VMAdapter from './vm-adapter.js';
import {HostSnapshotService, ClientSnapshotService} from './snapshot.js';
import AssetChannel from './assets.js';
import PresenceChannel from './presence.js';
import CursorOverlay from './cursor-overlay.js';
import {getAssetData, storeAssetData, hasAssetData, clearAssetCache} from './vm-assets.js';
import {avatarForCollabUser} from './avatar.js';

/**
 * The collaboration engine facade — the only module the React layer talks
 * to. Wires transport + session + snapshot + assets + VM adapter/applier
 * together and translates engine events into the event vocabulary the
 * containers already use.
 */
class CollabService extends Emitter {
    constructor () {
        super();
        this.vm = null;
        this.isConnected = false;
        this.isHost = false;
        this.roomId = null;
        this.username = null;
        this.handle = null;

        this._transport = null;
        this._session = null;
        this._applier = null;
        this._adapter = null;
        this._snapshot = null;
        this._assets = null;
        this._presence = null;
        this._cursorOverlay = null;
        this._workspace = null;
        this._approved = false;
        this._sendChain = Promise.resolve();
        this._activity = {targetId: null, tab: 0, assetIndex: 0};
    }

    init (vm) {
        if (this.vm && this._onEditError) this.vm.removeListener('EDIT_COMMAND_ERROR', this._onEditError);
        this.vm = vm;
        this._onEditError = error => this.emit('edit-error', {error: error.message || String(error)});
        vm.on('EDIT_COMMAND_ERROR', this._onEditError);
    }

    /**
     * Create or join a room.
     * @param {string} roomId Room code.
     * @param {string} username Display name.
     * @param {boolean} isHost Create (true) or join (false).
     * @param {string} [privacy] 'public' | 'private' (host only).
     * @param {string} [handle] Rotur handle, for avatars.
     * @param {number} [maxUsers] Maximum number of people in a hosted room.
     * @param {object|null} [scope] Project ID and branch required by this room.
     * @returns {Promise<string>} Our peer id.
     */
    async connectToRoom (
        roomId, username, isHost = false, privacy = 'public', handle = null, maxUsers = 3, scope = null
    ) {
        if (!roomId) throw new Error('roomId is required to connect to a room');
        if (!this.vm) throw new Error('CollabService.init(vm) must be called first');
        if (this._transport) this.disconnect();

        this.roomId = roomId;
        this.username = handle || username || `User${Math.floor(Math.random() * 1000)}`;
        this.handle = handle || null;
        this.scope = scope;
        this.isHost = isHost;

        const transport = new Transport();
        this._transport = transport;
        this._applier = new VMApplier({
            vm: this.vm,
            getWorkspace: () => this._workspace
        });
        this._adapter = new VMAdapter({
            vm: this.vm,
            applier: this._applier,
            onLocalOp: (type, payload) => this._submitLocalOp(type, payload)
        });

        try {
            const id = isHost ?
                await this._connectAsHost(roomId, privacy, maxUsers) :
                await this._connectAsClient(roomId);
            if (this._transport !== transport) throw new Error('Collaboration connection cancelled');
            this.isConnected = true;
            this.onEditingTargetChange();
            if (this._workspace) this._adapter.attach(this._workspace);
            return id;
        } catch (error) {
            if (this._transport === transport) this._teardown();
            throw error;
        }
    }

    async _connectAsHost (roomId, privacy, maxUsers) {
        const session = new HostSession({
            transport: this._transport,
            applier: this._applier,
            roomId,
            username: this.username,
            handle: this.handle,
            privacy,
            maxUsers,
            scope: this.scope
        });
        this._session = session;

        this._snapshot = new HostSnapshotService({
            session,
            transport: this._transport,
            getProjectData: () => this.vm.saveProjectSb3('arraybuffer', {allowOptimization: false}),
            getTargetIds: () => this.vm.editingCommands.snapshot(),
            getExtensions: () => this._getLoadedExtensions()
        });
        this._assets = new AssetChannel({
            isHost: true,
            session,
            transport: this._transport,
            getAsset: md5ext => getAssetData(this.vm, md5ext),
            storeAsset: (md5ext, data) => storeAssetData(this.vm, md5ext, data)
        });

        this._relay(session, {
            'user-joined': 'user-joined',
            'user-left': 'user-left',
            'users-updated': 'users-updated',
            'join-request-received': 'join-request-received',
            'join-request-cancelled': 'join-request-cancelled',
            'room-privacy-changed': 'room-privacy-changed',
            'session-ready': 'session-ready'
        });
        session.on('op-applied', () => this._projectChanged());

        this._transport.on('fatal', ({error}) => {
            this.emit('connection-failed', {
                error: error && error.message ? error.message : String(error)
            });
            this.disconnect();
        });

        this._setupPresence(session);

        const id = await session.start();
        this.emit('room-created', {roomId, hostId: id});
        this.emit('connected-to-host');
        return id;
    }

    _connectAsClient (roomId) {
        const session = new ClientSession({
            transport: this._transport,
            applier: this._applier,
            roomId,
            username: this.username,
            handle: this.handle,
            hasAsset: md5ext => hasAssetData(this.vm, md5ext),
            scope: this.scope
        });
        this._session = session;

        this._snapshot = new ClientSnapshotService({
            session,
            transport: this._transport,
            applyProjectData: (buffer, active) => this._loadProjectSuppressed(buffer, active),
            remapTargetIds: (targetIds, active) => remapTargetIds(this.vm, targetIds, active),
            loadExtensions: extensions => this._loadMissingExtensions(extensions)
        });
        this._assets = new AssetChannel({
            isHost: false,
            session,
            transport: this._transport,
            getAsset: md5ext => getAssetData(this.vm, md5ext),
            storeAsset: (md5ext, data) => storeAssetData(this.vm, md5ext, data)
        });

        this._relay(session, {
            'awaiting-approval': 'awaiting-approval',
            'user-joined': 'user-joined',
            'user-left': 'user-left',
            'users-updated': 'users-updated',
            'room-privacy-changed': 'room-privacy-changed',
            'session-ready': 'session-ready',
            'host-loading-start': 'host-loading-start',
            'host-loading-progress': 'host-loading-progress',
            'host-loading-complete': 'host-loading-complete',
            'reconnecting': 'reconnecting',
            'reconnected': 'reconnected'
        });

        session.on('join-approved', () => {
            this._approved = true;
            this.emit('approval-resolved');
            this.emit('join-approved');
            this.emit('connected-to-host');
            this.onEditingTargetChange();
        });
        session.on('host-connection-lost', () => {
            this._approved = false;
        });
        session.on('join-denied', reason => {
            this.emit('approval-resolved');
            this.disconnect();
            this.emit('join-denied', reason);
        });
        session.on('kicked', () => {
            this.emit('kicked-from-room', {});
            this.disconnect();
        });
        session.on('host-left', () => {
            this.emit('host-left');
            this.disconnect();
        });
        session.on('op-applied', () => this._projectChanged());
        session.on('op-rejected', ({reason}) => this.vm.emit('EDIT_COMMAND_ERROR', new Error(reason)));
        session.on('assets-needed', md5exts => this._assets.requestFromHost(md5exts));
        this._assets.on('asset-received', () => session.resumeApply());
        session.on('connection-failed', payload => {
            this.emit('connection-failed', payload);
            this.disconnect();
        });

        this._snapshot.on('download-start', ({totalBytes}) => {
            this.emit('project-sync-download-start', {totalBytes});
        });
        this._snapshot.on('download-progress', ({loaded, total}) => {
            this.emit('project-sync-download-progress', {
                loaded,
                total,
                progress: total > 0 ? Math.round((loaded / total) * 100) : 0
            });
        });
        this._snapshot.on('download-complete', () => {
            this.emit('project-sync-download-complete');
        });
        this._snapshot.on('download-error', ({error}) => {
            this.emit('project-sync-download-error', {error});
        });

        this._setupPresence(session);

        return session.connect();
    }

    _relay (source, eventMap) {
        Object.keys(eventMap).forEach(from => {
            source.on(from, (...args) => this.emit(eventMap[from], ...args));
        });
    }

    _setupPresence (session) {
        this._presence = new PresenceChannel({session});
        // Refresh after onboarding and target-id remapping, even if the user
        // never switches sprites. New peers also need existing users' activity.
        this._activityTimer = setInterval(() => this.setActivity(), 5000);
        session.on('user-joined', () => this.setActivity());
        this._cursorOverlay = new CursorOverlay({
            vm: this.vm,
            presence: this._presence,
            getUsername: userId => {
                const user = session.users.get(userId);
                return user ? user.username : '';
            },
            getAvatarUrl: userId => avatarForCollabUser(session.users.get(userId))
        });
        // The container turns these into Redux updates — the engine itself
        // never touches the store.
        this._presence.on('editing-changed', (userId, activity) => {
            const user = session.users.get(userId);
            this.emit('presence-editing-changed', {
                userId,
                username: user ? user.username : '',
                handle: user ? user.handle || null : null,
                activity
            });
        });
        if (this._workspace) this._cursorOverlay.attach(this._workspace);
    }

    _submitLocalOp (type, payload) {
        const session = this._session;
        const assets = this._assets;
        const isHost = this.isHost;
        if (!session || !this.isConnected || (!isHost && (!this._approved || session.lastAppliedSeq === null))) {
            return Promise.reject(new Error('Wait for the collaboration project to finish loading.'));
        }
        const send = this._sendChain.then(async () => {
            if (this._session !== session) throw new Error('Collaboration session ended');
            if (!isHost && payload.assetRefs) await assets.sendAssets('host', payload.assetRefs);
            if (this._session !== session) throw new Error('Collaboration session ended');
            return isHost ? {completion: session.submitLocal(type, payload).then(op => op && op.payload)} :
                {completion: session.submitCommand(type, payload)};
        });
        this._sendChain = send.then(() => {}, () => {});
        return send.then(({completion}) => completion);
    }

    /**
     * Every loaded extension as {id, url?}. Builtins travel by id; custom
     * extensions carry the URL they were loaded from.
     * @returns {Array.<object>} Loaded extensions.
     */
    _getLoadedExtensions () {
        const manager = this.vm.extensionManager;
        if (!manager || !manager._loadedExtensions) return [];
        const urls = typeof manager.getExtensionURLs === 'function' ? manager.getExtensionURLs() : {};
        return Array.from(manager._loadedExtensions.keys()).map(id => {
            const entry = {id};
            if (urls[id]) entry.url = urls[id];
            return entry;
        });
    }

    /**
     * Load whatever the host has that we don't. Capture is naturally
     * suppressed: clients cannot propose until onboarding completes.
     * @param {Array.<object>} extensions Host's [{id, url?}].
     * @returns {Promise} Resolves when all loads settled.
     */
    async _loadMissingExtensions (extensions) {
        const manager = this.vm.extensionManager;
        if (!manager) return;
        for (const {id, url} of extensions) {
            if (manager.isExtensionLoaded(id)) continue;
            const load = this.vm.editingCommands.extensions.loadExtensionURL;
            await load(url || id);
        }
    }

    async _loadProjectSuppressed (buffer, active = () => true) {
        const adapter = this._adapter;
        const scope = this.scope;
        if (!active()) return;
        if (!active()) return;
        this.emit('project-sync-apply-start');
        adapter.setSuppressed(true);
        try {
            await withProjectReplacement(this.vm, 'Before live synchronization', async () => {
                await this.vm.loadProject(buffer, {
                    mwPreserveProjectSource: true, skipGitImport: true, editSessionActive: active
                });
            });
            if (!scope && active()) detachWorkspace(this.vm);
        } finally {
            if (adapter === this._adapter) adapter.setSuppressed(false);
            if (active()) this.emit('project-sync-apply-complete');
        }
        // Loading rebuilt the workspace contents; re-hook capture.
        if (active()) this.emit('request-workspace-reattach');
    }

    _projectChanged () {
        if (this.vm && this.vm.runtime) {
            this.vm.runtime.emitProjectChanged();
        }
    }

    disconnect () {
        const wasConnected = this.isConnected;
        this._teardown();
        if (wasConnected) this.emit('disconnected');
    }

    _teardown () {
        this.isConnected = false;
        this.scope = null;
        this._sendChain = Promise.resolve();
        this._approved = false;
        this._backedUpBeforeSync = false;
        if (this._adapter) {
            this._adapter.destroy();
            this._adapter = null;
        }
        if (this._cursorOverlay) {
            this._cursorOverlay.destroy();
            this._cursorOverlay = null;
        }
        if (this._presence) {
            clearInterval(this._activityTimer);
            this._presence.destroy();
            this._presence = null;
        }
        if (this._assets) {
            this._assets.destroy();
            this._assets = null;
        }
        if (this._snapshot) {
            this._snapshot.destroy();
            this._snapshot = null;
        }
        if (this._session) {
            this._session.destroy();
            this._session = null;
        }
        if (this._transport) {
            this._transport.destroy();
            this._transport = null;
        }
        if (this._applier) {
            this._applier.destroy();
            this._applier = null;
        }
        if (this.vm) clearAssetCache(this.vm);
        this.roomId = null;
        this.isHost = false;
    }

    // ----- Workspace hooks (containers/blocks.jsx) -----

    attachToWorkspace (workspace) {
        this._workspace = workspace;
        if (this._adapter && this.isConnected) {
            this._adapter.attach(workspace);
        }
        if (this._cursorOverlay && this.isConnected) {
            this._cursorOverlay.attach(workspace);
        }
    }

    detachFromWorkspace () {
        if (this._adapter) this._adapter.detach();
        if (this._cursorOverlay) this._cursorOverlay.detach();
        this._workspace = null;
    }

    /**
     * Called when the custom procedure modal closes; captures procedure
     * blocks that Blockly created with events disabled.
     */
    flushProcedureBlocks () {
        if (this._adapter && this.isConnected) {
            this._adapter.syncProcedureBlocks();
            this._adapter.flush();
        }
    }

    /**
     * Presence hook: announce where we are working. Callers report only the
     * part they own (the target pane the sprite, the tabs the tab, the
     * costume/sound lists the index) and the rest is carried over.
     * @param {object} [partial] Any of {targetId, tab, assetIndex}.
     */
    setActivity (partial) {
        const target = this.vm && this.vm.editingTarget;
        const next = Object.assign({}, this._activity, {
            targetId: target ? target.id : null
        }, partial);
        // Switching sprite or tab lands you on that view's first item.
        if (partial && (typeof partial.tab === 'number') && partial.tab !== this._activity.tab) {
            next.assetIndex = typeof partial.assetIndex === 'number' ? partial.assetIndex : 0;
        }
        this._activity = next;
        if (!this._presence || !this.isConnected) return;
        this._presence.sendActivity(next);
    }

    /** Presence hook (target-pane): the edited sprite changed. */
    onEditingTargetChange () {
        this.setActivity({assetIndex: 0});
    }

    // ----- Room state accessors -----

    getCurrentUserId () {
        return this._transport ? this._transport.id : null;
    }

    isConnectedToHostPeer () {
        return this.isConnected && (this.isHost || this._approved);
    }

    getConnectedUsers () {
        return this._session ? this._session.getUsers() : [];
    }

    getRoomPrivacy () {
        if (this._session) return this._session.privacy || 'public';
        return 'public';
    }

    getPendingJoinRequests () {
        if (this._session && this.isHost) {
            return this._session.getPendingJoinRequests();
        }
        return [];
    }

    // ----- Host controls -----

    kickUser (userId) {
        if (this._session && this.isHost) this._session.kickUser(userId);
    }

    approveJoinRequest (requesterId) {
        return Boolean(this._session && this.isHost && this._session.approveJoinRequest(requesterId));
    }

    denyJoinRequest (requesterId, reason) {
        if (this._session && this.isHost) this._session.denyJoinRequest(requesterId, reason);
    }

    changeRoomPrivacy (privacy) {
        if (!this.isHost) throw new Error('Only the host can change room privacy');
        this._session.changeRoomPrivacy(privacy);
    }

    // ----- Client controls -----

    cancelJoinRequest () {
        if (this._session && !this.isHost) {
            this._session.cancelJoinRequest();
        }
        this.disconnect();
    }

    changeUsername (username) {
        this.username = username;
        if (!this._session) return;
        this._session.changeUsername(username);
        if (this.isHost) return;
        this.emit('username-changed', {id: this.getCurrentUserId(), username});
    }
}

let instance = null;

const CollabServiceModule = {
    getInstance () {
        if (!instance) instance = new CollabService();
        return instance;
    }
};

// Debug handle for development only; production builds get no global.
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    window.CollaborationService = CollabServiceModule;
}

export {CollabService};
export default CollabServiceModule;
