/* eslint-disable react/jsx-no-bind */
import React from 'react';
import PropTypes from 'prop-types';
import api from '../../community/api.js';
import {getCurrentProjectBranch} from '../../lib/git/browser-git.js';
import {isProjectHistoryHydrated} from '../../lib/git/project-history.js';
import {
    getRememberedPlatformProjectState, rememberPlatformProject
} from '../../lib/community/publish.js';

// The API authenticates requests. Peer display names never confer save access.
class ProjectSession extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            project: null,
            session: null,
            editors: [],
            error: '',
            discoveryError: '',
            checked: false,
            busy: false,
            phase: ''
        };
        this.branch = 'main';
        this.paused = false;
        this.lastVerifiedAt = Date.now();
        this.contextKey = '';
        this.lease = null;
        this.presence = null;
        this.polling = false;
        this.disposed = false;
        this.sessionReady = () => {
            if (!this.disposed) this.setState({phase: 'live'});
        };
        this.reconnecting = () => {
            if (!this.disposed) this.setState({phase: 'reconnecting'});
        };
        this.connectionFailed = data => {
            if (!this.props.service.scope && !this.lease) return;
            this.release();
            this.props.onLeaveRoom();
            if (!this.disposed) {
                this.setState({
                    error: typeof data === 'string' ? data : data?.error || 'The live connection ended.', phase: ''
                });
            }
        };
        this.tick = this.tick.bind(this);
        this.release = this.release.bind(this);
        this.memberLeft = this.memberLeft.bind(this);
        this.branchChanging = this.branchChanging.bind(this);
        this.branchChanged = this.branchChanged.bind(this);
        this.platformChanged = this.platformChanged.bind(this);
    }

    componentDidMount () {
        this.props.service.on('disconnected', this.release);
        this.props.service.on('user-left', this.memberLeft);
        this.props.service.on('session-ready', this.sessionReady);
        this.props.service.on('reconnecting', this.reconnecting);
        this.props.service.on('reconnected', this.sessionReady);
        this.props.service.on('connection-failed', this.connectionFailed);
        this.props.service.on('join-denied', this.connectionFailed);
        this.props.vm.on('PROJECT_LOADED', this.tick);
        window.addEventListener('mw:branch-changing', this.branchChanging);
        window.addEventListener('mw:branch-changed', this.branchChanged);
        window.addEventListener('mw:platform-project-changed', this.platformChanged);
        this.timer = setInterval(this.tick, 5000);
        this.tick();
    }

    componentDidUpdate (previous, previousState) {
        if (this.props.onPresence && previousState && ['phase', 'editors', 'session', 'discoveryError'].some(
            key => previousState[key] !== this.state[key])) {
            this.props.onPresence({
                editors: this.state.editors.filter(editor => editor.username !== this.props.username?.toLowerCase()),
                isPublic: Boolean(this.state.session?.public),
                hosting: Boolean(this.lease?.host),
                phase: this.state.phase,
                unavailable: Boolean(this.state.discoveryError)
            });
        }
        if (previous.username !== this.props.username || (previous.isReady && !this.props.isReady)) {
            this.clearPresence();
            this.contextKey = '';
            if (this.lease) {
                this.release();
                this.props.onLeaveRoom();
            }
        }
        if ((!previous.isReady && this.props.isReady) || previous.username !== this.props.username) this.tick();
    }

    componentWillUnmount () {
        this.disposed = true;
        clearInterval(this.timer);
        this.props.service.off('disconnected', this.release);
        this.props.service.off('user-left', this.memberLeft);
        this.props.service.off('session-ready', this.sessionReady);
        this.props.service.off('reconnecting', this.reconnecting);
        this.props.service.off('reconnected', this.sessionReady);
        this.props.service.off('connection-failed', this.connectionFailed);
        this.props.service.off('join-denied', this.connectionFailed);
        if (this.props.vm.off) this.props.vm.off('PROJECT_LOADED', this.tick);
        window.removeEventListener('mw:branch-changing', this.branchChanging);
        window.removeEventListener('mw:branch-changed', this.branchChanged);
        window.removeEventListener('mw:platform-project-changed', this.platformChanged);
        const connected = Boolean(this.lease);
        this.release();
        if (connected) this.props.onLeaveRoom();
        this.clearPresence();
    }

    clearPresence () {
        if (this.props.onPresence) this.props.onPresence(null);
        const presence = this.presence;
        this.presence = null;
        if (presence) this.call(presence.projectId, {action: 'away', branch: presence.branch}).catch(() => {});
    }

    branchChanging () {
        this.clearPresence();
        this.paused = true;
        this.contextKey = '';
        if (this.lease) {
            this.release();
            this.props.onLeaveRoom();
        }
    }

    branchChanged () {
        this.paused = false;
        this.tick();
    }

    platformChanged () {
        const project = getRememberedPlatformProjectState();
        if (!project || (this.contextKey && !this.contextKey.startsWith(`${project.id}:`))) {
            this.contextKey = '';
            this.clearPresence();
            if (this.lease) {
                this.release();
                this.props.onLeaveRoom();
            }
            this.setState({project: null, session: null, editors: [], checked: false, phase: ''});
        }
        this.tick();
    }

    call (projectId, body) {
        return api.request(`/projects/${encodeURIComponent(projectId)}/live`, {
            method: 'POST', body: {branch: this.branch, ...body}, cache: false, timeoutMs: 15000
        });
    }

    memberLeft (user) {
        const lease = this.lease;
        if (!lease || !lease.host) return;
        const member = (this.state.session?.members || []).find(item => item.peerId === user.id);
        if (member) {
            this.call(lease.projectId, {
                action: 'deny', sessionId: lease.id, branch: lease.branch, username: member.username
            }).catch(() => {});
        }
    }

    release () {
        const lease = this.lease;
        this.lease = null;
        if (!this.disposed && lease) this.setState({phase: '', session: null});
        const current = getRememberedPlatformProjectState();
        if (lease && current && current.id === lease.projectId && !current.isOwner) {
            const permanentEditor = ['owner', 'maintainer', 'editor'].includes(this.state.project?.myRole);
            rememberPlatformProject({...current, canSaveDirectly: permanentEditor});
        }
        if (lease) {
            this.call(lease.projectId, {
                action: lease.host ? 'end' : 'leave', sessionId: lease.id, branch: lease.branch
            }).catch(() => {});
        }
    }

    async tick () {
        if (this.operating || this.polling || this.disposed || this.paused || !this.props.isReady) return;
        this.polling = true;
        const platform = getRememberedPlatformProjectState();
        let context;
        try {
            const branch = platform && isProjectHistoryHydrated(this.props.vm) ?
                await getCurrentProjectBranch(platform.gitBranch) : platform?.gitBranch || 'main';
            if (this.paused || this.disposed) return;
            context = platform && this.props.username && branch ?
                `${platform.id}:${branch}:${this.props.username}` : '';
            if (context !== this.contextKey || this.branch !== branch) {
                const wasInSession = Boolean(this.lease);
                this.clearPresence();
                this.release();
                if (wasInSession) this.props.onLeaveRoom();
                this.branch = branch;
                this.contextKey = context;
                this.setState({project: null,
                    session: null,
                    editors: [],
                    error: '',
                    discoveryError: '',
                    checked: false,
                    phase: ''});
                if (!context) return;
                const {project} = await api.getProject(platform.id);
                if (this.disposed || this.contextKey !== context) return;
                this.setState({project});
            }
            if (!context || !this.state.project || !this.state.project.myRole) return;
            const lease = this.lease;
            const body = lease ? {
                action: lease.host ? 'host' : 'heartbeat',
                sessionId: lease.id,
                roomId: lease.roomId
            } : {action: 'presence'};
            this.presence = {projectId: platform.id, branch};
            const {session, myRole, editors = []} = await this.call(platform.id, body);
            if (this.disposed || this.contextKey !== context || lease !== this.lease || this.operating) return;
            this.lastVerifiedAt = Date.now();
            if (myRole && myRole !== this.state.project.myRole) {
                this.setState({project: {...this.state.project, myRole}});
            }
            if (lease && lease.host) {
                for (const previous of this.state.session?.members || []) {
                    if (!(session.members || []).some(member => member.peerId === previous.peerId)) {
                        this.props.service.kickUser(previous.peerId);
                    }
                }
            }
            this.setState({session: session.id ? session : null, editors, discoveryError: '', checked: true});
            if (lease && lease.host) {
                const pending = this.props.service.getPendingJoinRequests();
                for (const member of session.members || []) {
                    if (member.approved && pending.some(item => item.id === member.peerId)) {
                        this.props.service.approveJoinRequest(member.peerId);
                    }
                }
            }
            if (lease && !lease.host) {
                const member = (session.members || []).find(item =>
                    item.username === this.props.username.toLowerCase());
                const current = getRememberedPlatformProjectState();
                if (current && current.id === platform.id) {
                    rememberPlatformProject({...current,
                        canSaveDirectly:
                        ['owner', 'maintainer', 'editor'].includes(this.state.project.myRole) || Boolean(
                            member && member.approved && this.props.service.isConnected &&
                            this.props.service.roomId === lease.roomId)});
                }
                if (!member || !session.id) {
                    this.release();
                    this.props.onLeaveRoom();
                    this.setState({error: 'Your session access ended. Your local work is still here.'});
                }
            }

        } catch (error) {
            if (!this.disposed) {
                if (!this.state.project) this.contextKey = '';
                if (this.lease && ([403, 404, 409].includes(error.status) ||
                    Date.now() - this.lastVerifiedAt >= 90000)) {
                    this.release();
                    this.props.onLeaveRoom();
                }
                this.setState({discoveryError: 'Could not check who is online. Retrying…'});
            }
        } finally {
            this.polling = false;
        }
    }

    async run (action, phase) {
        if (this.operating) return;
        this.operating = true;
        this.setState({busy: true, phase, error: ''});
        try {
            await action();
        } catch (error) {
            if (!this.disposed) this.setState({error: error.message || 'Could not update the session.', phase: ''});
        } finally {
            this.operating = false;
            if (!this.disposed) this.setState({busy: false});
        }
    }

    async host () {
        const project = this.state.project;
        if (!this.props.isReady || this.paused || this.props.service.isConnected || this.state.session ||
            !['owner', 'maintainer', 'editor'].includes(project?.myRole)) {
            throw new Error('This project or session changed. Check the current status and try again.');
        }
        const context = this.contextKey;
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        const roomId = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        const scope = {projectId: String(project.id), branch: this.branch};
        await this.props.onCreateRoom(roomId, this.props.username, 'private', scope);
        try {
            const {session} = await this.call(project.id, {action: 'host', roomId, branch: scope.branch, public: true});
            if (this.disposed || context !== this.contextKey || !this.props.service.isConnected) {
                await this.call(project.id, {action: 'end', sessionId: session.id, branch: scope.branch});
                this.props.onLeaveRoom();
                return;
            }
            this.lastVerifiedAt = Date.now();
            this.lease = {...session, projectId: String(project.id), host: true};
            this.setState({session, phase: 'live'});
        } catch (error) {
            this.props.onLeaveRoom();
            throw error;
        }
    }

    async join () {
        const {project, session} = this.state;
        if (!this.props.isReady || this.paused || this.props.service.isConnected || !session?.public ||
            project.myRole === 'tester') {
            throw new Error('This session is not available to join.');
        }
        const context = this.contextKey;
        const scope = {projectId: String(project.id), branch: this.branch};
        await this.props.onJoinRoom(session.roomId, this.props.username, scope);
        try {
            const {session: next} = await this.call(project.id, {
                action: 'request',
                sessionId: session.id,
                peerId: this.props.service.getCurrentUserId(),
                branch: scope.branch
            });
            if (this.disposed || context !== this.contextKey || !this.props.service.isConnected) {
                await this.call(project.id, {action: 'leave', sessionId: session.id, branch: scope.branch});
                this.props.onLeaveRoom();
                return;
            }
            this.lastVerifiedAt = Date.now();
            this.lease = {...session, projectId: String(project.id), host: false};
            this.setState({session: next});
        } catch (error) {
            this.props.onLeaveRoom();
            throw error;
        }
    }


    render () {
        const {project, session, editors, busy, error, phase, checked, discoveryError} = this.state;
        const platform = getRememberedPlatformProjectState();
        const available = Boolean(this.props.username && platform && (!project || project.myRole) &&
            (!this.props.service.isConnected || this.props.service.scope));
        return this.props.children(Boolean(this.props.service.scope), available ? {
            session,
            editors,
            busy,
            error,
            phase,
            discoveryError,
            checking: this.branch !== null && (!checked || !this.props.isReady || this.paused),
            viewingCommit: this.branch === null,
            loadingProject: !this.props.isReady,
            branch: this.branch,
            active: Boolean(this.lease),
            isHost: Boolean(this.lease?.host),
            username: this.props.username,
            canHost: ['owner', 'maintainer', 'editor'].includes(project?.myRole) &&
                !this.props.service.isConnected,
            canJoin: Boolean(project?.myRole) && project.myRole !== 'tester' && !this.props.service.isConnected,
            onHost: () => this.run(() => this.host(), 'opening'),
            onJoin: () => this.run(() => this.join(), 'joining'),
            onLeave: () => this.run(async () => {
                const lease = this.lease;
                // Stop syncing immediately, even if the directory cannot be reached.
                this.lease = null;
                const current = getRememberedPlatformProjectState();
                if (lease && current && String(current.id) === lease.projectId && !current.isOwner) {
                    rememberPlatformProject({...current,
                        canSaveDirectly: ['owner', 'maintainer', 'editor'].includes(project?.myRole)});
                }
                this.props.onLeaveRoom();
                this.setState({session: null});
                try {
                    if (lease) {
                        await this.call(lease.projectId, {
                            action: lease.host ? 'end' : 'leave', sessionId: lease.id, branch: lease.branch
                        });
                    }
                    this.setState({phase: ''});
                } catch (e) {
                    throw new Error('Disconnected. The online listing could not be updated ' +
                        'and may remain for up to 90 seconds.');
                }
            }, 'leaving')
        } : null);
    }
}

ProjectSession.propTypes = {
    service: PropTypes.object.isRequired,
    vm: PropTypes.object.isRequired,
    username: PropTypes.string,
    isReady: PropTypes.bool,
    onJoinRoom: PropTypes.func.isRequired,
    onCreateRoom: PropTypes.func.isRequired,
    onLeaveRoom: PropTypes.func.isRequired,
    onPresence: PropTypes.func,
    children: PropTypes.func.isRequired
};

export default ProjectSession;
