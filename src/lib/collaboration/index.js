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
import {getAssetData, storeAssetData, releaseAssetData, hasAssetData, clearAssetCache} from './vm-assets.js';
import {avatarForCollabUser} from './avatar.js';
import log from '../utils/log.js';

/**
 * The collaboration engine facade — the only module the React layer talks
 * to. Wires transport + session + snapshot + assets + VM adapter/applier
 * together and translates engine events into the event vocabulary the
 * containers already use.
 */
const EDIT_ERROR_REPEAT_MS = 4000;
const HOST_WAIT_MS = 60 * 1000;

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
        this._admissions = 0;
        this._sendChain = Promise.resolve();
        this._activity = {targetId: null, tab: 0, assetIndex: 0};
        this._ownLoads = 0;
        this._backedUp = false;
        this._originalLoadProject = null;
        this._onPageHide = () => {
            if (this.isHost && this._session) this._session.announceClose();
        };
    }

    init (vm) {
        if (this.vm && this._onEditError) this.vm.removeListener('EDIT_COMMAND_ERROR', this._onEditError);
        this.vm = vm;
        this._onEditError = error => {
            const message = error.message || String(error);
            const now = Date.now();
            if (message === this._lastEditError && now - this._lastEditErrorAt < EDIT_ERROR_REPEAT_MS) return;
            this._lastEditError = message;
            this._lastEditErrorAt = now;
            this.emit('edit-error', {error: message});
        };
        vm.on('EDIT_COMMAND_ERROR', this._onEditError);
        if (vm.editingCommands && vm.securityManager) {
            vm.editingCommands.canLoadExtension = url => {
                if (this._applier && this._applier.applyingLocal) return Promise.resolve(true);
                return vm.securityManager.canLoadExtensionFromProject(url);
            };
        }
    }

    /**
     * Create or join a room.
     * @param {string} roomId Room code.
     * @param {string} username Display name.
     * @param {boolean} isHost Create (true) or join (false).
     * @param {string} [privacy] 'public' | 'private' (host only).
     * @param {string} [handle] Rotur handle, for avatars.
     * @param {object|null} [scope] Project ID and branch required by this room.
     * @param {object} [options] Options.
     * @param {string} [options.invite] Invite key from a link (guests).
     * @param {string} [options.inviteRole] What the invite link allows (host).
     * @returns {Promise<string>} Our peer id.
     */
    async connectToRoom (
        roomId, username, isHost = false, privacy = 'public', handle = null, scope = null, options = {}
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
            isLocalClient: clientId => Boolean(clientId) && clientId === this.getCurrentUserId()
        });
        this._adapter = new VMAdapter({
            vm: this.vm,
            applier: this._applier,
            onLocalOp: (type, payload) => this._submitLocalOp(type, payload)
        });

        try {
            const id = isHost ?
                await this._connectAsHost(roomId, privacy, options.inviteRole) :
                await this._connectAsClient(roomId, options.invite);
            if (this._transport !== transport) {
                throw Object.assign(new Error('Collaboration connection cancelled'), {cancelled: true});
            }
            this.isConnected = true;
            this._watchProjectLoads();
            if (typeof window !== 'undefined') window.addEventListener('pagehide', this._onPageHide);
            this.onEditingTargetChange();
            if (this._workspace) this._adapter.attach(this._workspace);
            return id;
        } catch (error) {
            if (this._transport === transport) this._teardown();
            // Superseded by another connect, or disconnected meanwhile.
            else if (error && typeof error === 'object') error.cancelled = true;
            throw error;
        }
    }

    async _connectAsHost (roomId, privacy, inviteRole) {
        const session = new HostSession({
            inviteRole,
            transport: this._transport,
            applier: this._applier,
            roomId,
            username: this.username,
            handle: this.handle,
            privacy,
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
            'session-ready': 'session-ready',
            'invite-changed': 'invite-changed'
        });
        session.on('op-applied', op => {
            this._releaseCommandAssets(op);
            this._projectChanged();
        });
        this._snapshot.on('upload-error', ({peerId, error}) => {
            const user = session.users.get(peerId);
            this.emit('snapshot-upload-failed', {
                username: user ? user.username : '',
                error: error && error.message ? error.message : String(error)
            });
        });
        this._watchTransport(this._transport);

        this._transport.on('fatal', ({error}) => {
            this.emit('connection-failed', {
                error: error && error.message ? error.message : String(error),
                code: (error && error.collabCode) || null
            });
            this.disconnect();
        });

        this._setupPresence(session);

        const id = await session.start();
        this.emit('room-created', {roomId, hostId: id});
        this.emit('connected-to-host');
        return id;
    }

    _connectAsClient (roomId, invite) {
        const session = new ClientSession({
            invite,
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
            remapTargetIds: (targetIds, active) =>
                remapTargetIds(this.vm, targetIds, active, this._editingBeforeLoad),
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
            'reconnecting': 'reconnecting',
            'reconnected': 'reconnected',
            'join-pending': 'join-pending',
            'host-restarted': 'host-restarted',
            'role-changed': 'role-changed'
        });
        this._watchTransport(this._transport);

        session.on('join-approved', () => {
            this._approved = true;
            this._admissions++;
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
            this.emit('join-denied', reason);
            this.disconnect();
        });
        session.on('kicked', () => {
            this.emit('kicked-from-room', {});
            this.disconnect();
        });
        session.on('host-left', () => {
            this.emit('host-left');
            this.disconnect();
        });
        session.on('op-applied', op => {
            this._releaseCommandAssets(op);
            this._projectChanged();
        });
        session.on('assets-needed', md5exts => this._assets.requestFromHost(md5exts));
        this._assets.on('asset-received', () => session.resumeApply());
        session.on('connection-failed', payload => {
            this.emit('connection-failed', Object.assign({code: null}, payload));
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
        this._snapshot.on('download-error', ({error, attempt, willRetry}) => {
            this.emit('project-sync-download-error', {error, attempt, willRetry});
        });

        this._setupPresence(session);

        return session.connect();
    }

    _watchTransport (transport) {
        transport.on('broker-offline', () => this.emit('broker-status', {online: false}));
        transport.on('broker-online', () => this.emit('broker-status', {online: true}));
        // {attempt, delayMs}: the broker still holds our room id after a reload.
        transport.on('host-id-taken', info => this.emit('host-id-taken', info));
        transport.on('invalid-message', ({peerId, error}) => {
            log.warn(`Dropped a collaboration message from ${peerId}: ${error}`);
        });
    }

    _releaseCommandAssets (op) {
        if (!this.vm) return;
        const refs = op && op.payload && Array.isArray(op.payload.assetRefs) ? op.payload.assetRefs : [];
        releaseAssetData(this.vm, refs.filter(ref => ref.endsWith('.bin')));
        releaseAssetData(this.vm);
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
        // While a client reconnects, edits wait in the session and go out
        // once the host lets it back in.
        if (!session || !this.isConnected || (!isHost && session.lastAppliedSeq === null)) {
            return Promise.reject(new Error('Wait for the collaboration project to finish loading.'));
        }
        if (!isHost && session.role !== 'edit') {
            return Promise.reject(new Error('You are watching this session, so your changes were not kept. ' +
                'Ask the host to let you edit.'));
        }
        const send = this._sendChain.then(async () => {
            if (this._session !== session) throw new Error('Collaboration session ended');
            if (!isHost && payload.assetRefs) {
                await this._waitForHost(session);
                if (this._session !== session) throw new Error('Collaboration session ended');
                const admissions = this._admissions;
                try {
                    await assets.sendAssets('host', payload.assetRefs);
                } catch (error) {
                    // The link dropped mid-transfer. The host discards partial
                    // assets, so send them again once it lets us back in.
                    if (!/Asset connection/.test(error.message) || this._session !== session) throw error;
                    if (this._admissions === admissions) this._approved = false;
                    await this._waitForHost(session);
                    if (this._session !== session) throw new Error('Collaboration session ended');
                    await assets.sendAssets('host', payload.assetRefs);
                }
            }
            if (this._session !== session) throw new Error('Collaboration session ended');
            return isHost ? {completion: session.submitLocal(type, payload).then(op => op && op.payload)} :
                {completion: session.submitCommand(type, payload)};
        });
        this._sendChain = send.then(() => {}, () => {});
        const binaryRefs = (payload.assetRefs || []).filter(ref => ref.endsWith('.bin'));
        return send.then(({completion}) => completion).finally(() => {
            if (this.vm && binaryRefs.length) releaseAssetData(this.vm, binaryRefs);
        });
    }

    /**
     * Resolve once the host has (re)admitted us, so asset bytes are not
     * sent into a link that is down.
     * @param {ClientSession} session The session the edit belongs to.
     * @returns {Promise} Resolves when admitted, or after a minute.
     */
    _waitForHost (session) {
        if (this._approved || this._session !== session) return Promise.resolve();
        return new Promise(resolve => {
            let timer = null;
            const done = () => {
                clearTimeout(timer);
                session.off('join-approved', done);
                resolve();
            };
            timer = setTimeout(done, HOST_WAIT_MS);
            session.on('join-approved', done);
        });
    }

    /**
     * How we reach the host, for diagnostics.
     * @returns {string|null} 'direct', 'relay', or null.
     */
    getConnectionPath () {
        if (!this._transport || this.isHost) return null;
        return this._transport.connectionPath('host');
    }

    /**
     * Whether anyone reaches this host through the broker relay, and so
     * drops out while the broker is unreachable.
     * @returns {boolean} True when at least one guest is relayed.
     */
    hasRelayedGuests () {
        if (!this._transport || !this.isHost) return false;
        return this._transport.peers().some(peerId => this._transport.connectionPath(peerId) === 'relay');
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
        const skipped = [];
        for (const {id, url} of extensions) {
            if (manager.isExtensionLoaded(id)) continue;
            const builtin = typeof manager.isBuiltinExtension === 'function' && manager.isBuiltinExtension(id);
            if (!builtin && !url) {
                skipped.push(id);
                continue;
            }
            try {
                if (!builtin && this.vm.securityManager &&
                    !(await this.vm.securityManager.canLoadExtensionFromProject(url))) {
                    skipped.push(id);
                    continue;
                }
                await this.vm.editingCommands.extensions.loadExtensionURL(builtin ? id : url);
            } catch (error) {
                log.warn(`Could not load extension ${id} for collaboration`, error);
                skipped.push(id);
            }
        }
        if (skipped.length) this.emit('extensions-skipped', {ids: skipped});
    }

    async _loadProjectSuppressed (buffer, active = () => true) {
        const adapter = this._adapter;
        const scope = this.scope;
        if (!active()) return;
        this.emit('project-sync-apply-start');
        this._editingBeforeLoad = this.vm.editingTarget ? this.vm.editingTarget.id : null;
        adapter.setSuppressed(true);
        this._ownLoads++;
        try {
            const load = () => this.vm.loadProject(buffer, {
                mwPreserveProjectSource: true, skipGitImport: true, editSessionActive: active
            });
            if (this._backedUp) {
                await load();
            } else {
                await withProjectReplacement(this.vm, 'Before live synchronization', load);
                this._backedUp = true;
            }
            if (!scope && active()) detachWorkspace(this.vm);
        } finally {
            this._ownLoads--;
            if (adapter === this._adapter) adapter.setSuppressed(false);
            this.emit('project-sync-apply-complete');
        }
        // Loading rebuilt the workspace contents; re-hook capture.
        if (active()) this.emit('request-workspace-reattach');
    }

    _watchProjectLoads () {
        const vm = this.vm;
        if (this._originalLoadProject) return;
        const original = vm.loadProject;
        this._originalLoadProject = original;
        this._ownedLoadProject = Object.prototype.hasOwnProperty.call(vm, 'loadProject');
        this._loadProjectWrapper = (...args) => {
            if (this._ownLoads > 0 || !this.isConnected) return original.apply(vm, args);
            return this._onOtherProjectLoad(original, args);
        };
        vm.loadProject = this._loadProjectWrapper;
    }

    _unwatchProjectLoads () {
        if (!this._originalLoadProject) return;
        if (this.vm.loadProject === this._loadProjectWrapper) {
            if (this._ownedLoadProject) this.vm.loadProject = this._originalLoadProject;
            else delete this.vm.loadProject;
        }
        this._originalLoadProject = null;
        this._loadProjectWrapper = null;
    }

    async _onOtherProjectLoad (original, args) {
        const vm = this.vm;
        if (!this.isHost) {
            this.disconnect();
            this.emit('left-for-other-project');
            return original.apply(vm, args);
        }
        const session = this._session;
        const adapter = this._adapter;
        adapter.setSuppressed(true);
        try {
            const result = await session.queue.run(() => original.apply(vm, args));
            if (this._session === session) session.restartHistory();
            return result;
        } finally {
            if (adapter === this._adapter) adapter.setSuppressed(false);
        }
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
        this._backedUp = false;
        if (typeof window !== 'undefined') window.removeEventListener('pagehide', this._onPageHide);
        if (this.vm) this._unwatchProjectLoads();
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
            if (this.isHost) {
                this._transport.destroyGracefully().catch(() => {});
            } else {
                this._transport.destroy();
            }
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
        if (this._adapter && this.isConnected) this._adapter.syncProcedureBlocks();
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

    /**
     * What we can do in the current session.
     * @returns {string|null} 'edit', 'watch', or null when not in a session.
     */
    getMyRole () {
        if (!this._session) return null;
        return this.isHost ? 'edit' : this._session.role;
    }

    /**
     * A link that lets someone join straight away, with the invite role.
     * @returns {string|null} The link, or null when not hosting.
     */
    getInviteLink () {
        if (!this.isHost || !this._session || typeof window === 'undefined') return null;
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        url.searchParams.set('room', this.roomId);
        url.searchParams.set('invite', this._session.inviteKey);
        return url.toString();
    }

    getInviteRole () {
        return this.isHost && this._session ? this._session.inviteRole : null;
    }

    setInviteRole (role) {
        if (!this.isHost || !this._session) throw new Error('Only the host can change the invite link');
        this._session.setInviteRole(role);
    }

    setUserRole (userId, role) {
        return Boolean(this.isHost && this._session && this._session.setUserRole(userId, role));
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

    approveJoinRequest (requesterId, role) {
        return Boolean(this._session && this.isHost && this._session.approveJoinRequest(requesterId, role));
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
