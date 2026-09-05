import ProjectSession from '../../../src/components/collaboration-modal/project-session.jsx';
import api from '../../../src/community/api.js';
import {getRememberedPlatformProjectState} from '../../../src/lib/community/publish.js';
import {getCurrentProjectBranch} from '../../../src/lib/git/browser-git.js';
import {isProjectHistoryHydrated} from '../../../src/lib/git/project-history.js';

jest.mock('../../../src/community/api.js', () => ({
    request: jest.fn(), getProject: jest.fn(), updateProject: jest.fn()
}));
jest.mock('../../../src/lib/community/publish.js', () => ({
    getRememberedPlatformProjectState: jest.fn(), rememberPlatformProject: jest.fn()
}));
jest.mock('../../../src/lib/git/browser-git.js', () => ({getCurrentProjectBranch: jest.fn()}));
jest.mock('../../../src/lib/git/project-history.js', () => ({isProjectHistoryHydrated: jest.fn()}));

const makeCoordinator = (role = 'owner') => {
    const service = {
        isConnected: false, scope: null, on: jest.fn(), off: jest.fn(),
        getPendingJoinRequests: jest.fn(() => []), approveJoinRequest: jest.fn(() => true),
        kickUser: jest.fn()
    };
    const props = {
        service, vm: {on: jest.fn(), off: jest.fn()}, username: 'mist', isReady: true,
        onOpen: jest.fn(), onLeaveRoom: jest.fn(() => { service.isConnected = false; }),
        onCreateRoom: jest.fn(), onJoinRoom: jest.fn(), children: jest.fn()
    };
    const instance = new ProjectSession(props);
    instance.setState = patch => { instance.state = {...instance.state, ...patch}; };
    instance.state.project = {id: 'p1', myRole: role, collaborators: [{username: 'friend', role: 'editor'}]};
    instance.contextKey = 'p1:main:mist';
    instance.host = jest.fn().mockResolvedValue();
    instance.join = jest.fn().mockResolvedValue();
    return instance;
};

describe('opt-in project collaboration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getRememberedPlatformProjectState.mockReturnValue({id: 'p1', gitBranch: 'main', isOwner: true});
        isProjectHistoryHydrated.mockReturnValue(false);
        api.request.mockResolvedValue({session: {}, hasTeam: true});
        api.getProject.mockResolvedValue({project: {id: 'p1', myRole: 'owner', collaborators: []}});
    });

    test('only announces presence when a shared project is loaded', async () => {
        const instance = makeCoordinator();
        await instance.tick();
        expect(instance.host).not.toHaveBeenCalled();
        expect(instance.props.onOpen).not.toHaveBeenCalled();
        expect(api.request).toHaveBeenCalledWith('/projects/p1/live', expect.objectContaining({
            body: {action: 'presence', branch: 'main'}, timeoutMs: 15000
        }));
    });

    test('does not join an existing public session automatically', async () => {
        const instance = makeCoordinator('editor');
        api.request.mockResolvedValue({session: {id: 'live', roomId: 'room', branch: 'main', public: true}, hasTeam: true});
        await instance.tick();
        expect(instance.join).not.toHaveBeenCalled();
        expect(instance.host).not.toHaveBeenCalled();
    });

    test('does not share the VM while the project is still loading', async () => {
        const instance = makeCoordinator();
        instance.props.isReady = false;
        await instance.tick();
        expect(api.request).not.toHaveBeenCalled();
        expect(instance.host).not.toHaveBeenCalled();
    });

    test('sharing a project does not open a live session', async () => {
        const instance = makeCoordinator();
        instance.state.project.collaborators = [];
        await instance.tick();
        expect(instance.host).not.toHaveBeenCalled();
    });

    test('never takes over a manual room', async () => {
        const instance = makeCoordinator();
        instance.props.service.isConnected = true;
        await instance.tick();
        expect(instance.host).not.toHaveBeenCalled();
        expect(instance.join).not.toHaveBeenCalled();
    });

    test('disconnects before branch switching and releases the original branch lease', () => {
        const instance = makeCoordinator();
        instance.lease = {id: 'live', projectId: 'p1', branch: 'main', host: true};
        instance.branchChanging();
        expect(instance.props.onLeaveRoom).toHaveBeenCalledTimes(1);
        expect(instance.lease).toBeNull();
        expect(instance.paused).toBe(true);
        expect(api.request.mock.calls[0][1].body).toEqual({action: 'end', sessionId: 'live', branch: 'main'});
    });

    test('does not join a branch when viewing a detached commit', async () => {
        const instance = makeCoordinator();
        isProjectHistoryHydrated.mockReturnValue(true);
        getCurrentProjectBranch.mockResolvedValue(null);
        await instance.tick();
        expect(instance.host).not.toHaveBeenCalled();
        expect(instance.join).not.toHaveBeenCalled();
    });

    test('automatically admits only peers verified by the API', async () => {
        const instance = makeCoordinator();
        instance.lease = {id: 'live', projectId: 'p1', branch: 'main', roomId: 'room', host: true};
        instance.props.service.isConnected = true;
        instance.props.service.getPendingJoinRequests.mockReturnValue([{id: 'verified'}, {id: 'unverified'}]);
        api.request.mockResolvedValue({session: {id: 'live', members: [
            {username: 'friend', peerId: 'verified', approved: true}
        ]}});
        await instance.tick();
        expect(instance.props.service.approveJoinRequest.mock.calls).toEqual([['verified']]);
    });

    test('provides explicit project controls in the room window', () => {
        const instance = makeCoordinator();
        instance.props.service.scope = {projectId: 'p1', branch: 'main'};
        instance.render();
        expect(instance.props.children).toHaveBeenCalledWith(true, expect.objectContaining({
            onHost: expect.any(Function), onJoin: expect.any(Function), onLeave: expect.any(Function)
        }));
    });
    test('private sessions cannot be joined, even by an editor', async () => {
        const instance = makeCoordinator('editor');
        instance.state.session = {id: 'live', roomId: 'room', public: false};
        await expect(ProjectSession.prototype.join.call(instance)).rejects.toThrow('not available');
        expect(instance.props.onJoinRoom).not.toHaveBeenCalled();
        expect(api.request).not.toHaveBeenCalled();
    });

    test('opening a session explicitly advertises it as public to the team', async () => {
        const instance = makeCoordinator();
        instance.props.onCreateRoom.mockImplementation(async () => { instance.props.service.isConnected = true; });
        api.request.mockResolvedValue({session: {id: 'live', branch: 'main', public: true}});
        await ProjectSession.prototype.host.call(instance);
        expect(instance.props.onCreateRoom).toHaveBeenCalledWith(
            expect.any(String), 'mist', 'private', {projectId: 'p1', branch: 'main'}
        );
        expect(api.request).toHaveBeenCalledWith('/projects/p1/live', expect.objectContaining({
            body: expect.objectContaining({action: 'host', public: true})
        }));
        expect(instance.state.phase).toBe('live');
    });

    test('a join request does not claim the project has finished syncing', async () => {
        const instance = makeCoordinator('editor');
        instance.props.service.getCurrentUserId = () => 'peer';
        instance.state.session = {id: 'live', roomId: 'room', public: true};
        instance.props.onJoinRoom.mockImplementation(async () => { instance.props.service.isConnected = true; });
        api.request.mockResolvedValue({session: instance.state.session});
        await instance.run(() => ProjectSession.prototype.join.call(instance), 'joining');
        expect(instance.lease.host).toBe(false);
        expect(instance.state.phase).toBe('joining');
        instance.sessionReady();
        expect(instance.state.phase).toBe('live');
    });

    test('directory failures keep discovery uncertain and do not clear action errors', async () => {
        const instance = makeCoordinator();
        instance.state.error = 'The room was full.';
        api.request.mockRejectedValue(new Error('offline'));
        await instance.tick();
        expect(instance.state.discoveryError).toContain('Could not check');
        api.request.mockResolvedValue({session: {}});
        await instance.tick();
        expect(instance.state.discoveryError).toBe('');
        expect(instance.state.error).toBe('The room was full.');
    });

    test('ending a session disconnects locally even when directory cleanup fails', async () => {
        const instance = makeCoordinator();
        instance.lease = {id: 'live', projectId: 'p1', branch: 'main', host: true};
        instance.render();
        api.request.mockRejectedValue(new Error('offline'));
        await instance.props.children.mock.calls[0][1].onLeave();
        expect(instance.props.onLeaveRoom).toHaveBeenCalledTimes(1);
        expect(instance.lease).toBeNull();
        expect(instance.state.error).toContain('Disconnected.');
        expect(instance.state.error).toContain('90 seconds');
    });

    test('leaving or changing branches never opts into another session', async () => {
        const instance = makeCoordinator();
        instance.branchChanging();
        instance.branchChanged();
        await Promise.resolve();
        expect(instance.host).not.toHaveBeenCalled();
        expect(instance.join).not.toHaveBeenCalled();
    });

});
