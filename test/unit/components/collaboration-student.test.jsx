import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import CollaborationModal from '../../../src/components/collaboration-modal/collaboration-modal.jsx';
import ProjectSession from '../../../src/components/collaboration-modal/project-session.jsx';
import TWStateManager from '../../../src/lib/components/tw-state-manager-hoc.jsx';

jest.mock('../../../src/community/api.js', () => ({
    request: jest.fn(), getProject: jest.fn(), updateProject: jest.fn()
}));
jest.mock('../../../src/lib/community/publish.js', () => ({
    getRememberedPlatformProjectState: jest.fn(), rememberPlatformProject: jest.fn()
}));
jest.mock('../../../src/lib/git/browser-git.js', () => ({getCurrentProjectBranch: jest.fn()}));
jest.mock('../../../src/lib/git/project-history.js', () => ({isProjectHistoryHydrated: jest.fn()}));

const api = require('../../../src/community/api.js');

const STUDENT_KEY = 'mw:classroom-student';

const modalProps = () => ({
    visible: true,
    currentUsername: '@ada~k7p2q',
    currentUserId: 'user-1',
    isConnected: false,
    roomId: null,
    roomPrivacy: 'public',
    connectedUsers: [],
    connectionError: null,
    onRequestClose: jest.fn(),
    onJoinRoom: jest.fn(() => Promise.resolve()),
    onCreateRoom: jest.fn(() => Promise.resolve()),
    onLeaveRoom: jest.fn(),
    onKickUser: jest.fn(),
    onCancelConnection: jest.fn(),
    onShowToast: jest.fn(),
    openSimpleDialog: jest.fn()
});

const makeSession = ({username = 'teacher', project, session = null, editors = []} = {}) => {
    const service = {
        isConnected: false,
        scope: null,
        on: jest.fn(),
        off: jest.fn(),
        getCurrentUserId: jest.fn(() => 'peer-1')
    };
    const connect = () => {
        service.isConnected = true;
        return Promise.resolve();
    };
    const props = {
        service,
        vm: {on: jest.fn(), off: jest.fn()},
        username,
        isReady: true,
        onLeaveRoom: jest.fn(),
        onCreateRoom: jest.fn(connect),
        onJoinRoom: jest.fn(connect),
        children: jest.fn()
    };
    const instance = new ProjectSession(props);
    instance.setState = patch => {
        instance.state = {...instance.state, ...patch};
    };
    instance.state.project = project;
    instance.state.session = session;
    instance.state.editors = editors;
    instance.contextKey = 'p1:main:teacher';
    return instance;
};

beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    api.request.mockResolvedValue({session: {id: 'live', branch: 'main', public: true}});
});

afterEach(() => {
    localStorage.clear();
});

describe('room codes for class accounts', () => {
    test('a student sees no room code join or host controls', () => {
        const wrapper = mountWithIntl(<CollaborationModal
            {...modalProps()}
            isStudent
        />);
        const text = wrapper.text();
        expect(text).not.toContain('Join an Existing Room');
        expect(text).not.toContain('Create a New Room');
        expect(wrapper.find('input')).toHaveLength(0);
        expect(text).toContain('Project collaboration');
        wrapper.unmount();
    });

    test('a student never auto joins a room code from the store', async () => {
        const props = modalProps();
        const wrapper = mountWithIntl(<CollaborationModal
            {...props}
            isStudent
            roomId="cool-cat-123"
        />);
        await Promise.resolve();
        expect(props.onJoinRoom).not.toHaveBeenCalled();
        expect(props.onCreateRoom).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('everyone else still gets the room code controls', () => {
        const wrapper = mountWithIntl(<CollaborationModal {...modalProps()} />);
        expect(wrapper.text()).toContain('Join an Existing Room');
        expect(wrapper.text()).toContain('Create a New Room');
        wrapper.unmount();
    });
});

describe('classroom detection on the API live path', () => {
    test('hosting a student-owned project opens a classroom session', async () => {
        const instance = makeSession({project: {id: 'p1', myRole: 'maintainer', owner: 'ada~k7p2q'}});
        await ProjectSession.prototype.host.call(instance);
        expect(instance.props.onCreateRoom).toHaveBeenCalledWith(
            expect.any(String), 'teacher', 'private', {projectId: 'p1', branch: 'main'}, {classroom: true}
        );
    });

    test('joining a session hosted by a student opens a classroom session', async () => {
        const session = {id: 'live', roomId: 'room', host: 'ada~k7p2q', public: true};
        const instance = makeSession({project: {id: 'p1', myRole: 'viewer', owner: 'teacher'}, session});
        await ProjectSession.prototype.join.call(instance);
        expect(instance.props.onJoinRoom).toHaveBeenCalledWith('room', 'teacher', {projectId: 'p1', branch: 'main'},
            {viewer: true, classroom: true});
    });

    test('a class member in the presence list makes the session a classroom session', async () => {
        const instance = makeSession({
            project: {id: 'p1', myRole: 'owner', owner: 'teacher'},
            editors: [{username: 'mia~jfsnb', branch: 'main'}]
        });
        await ProjectSession.prototype.host.call(instance);
        expect(instance.props.onCreateRoom.mock.calls[0][4]).toEqual({classroom: true});
    });

    test('a student is always in a classroom session', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const instance = makeSession({username: 'ada~k7p2q', project: {id: 'p1', myRole: 'owner', owner: 'x'}});
        await ProjectSession.prototype.host.call(instance);
        expect(instance.props.onCreateRoom.mock.calls[0][4]).toEqual({classroom: true});
    });

    test('ordinary team projects are not classroom sessions', async () => {
        const instance = makeSession({project: {
            id: 'p1',
            myRole: 'owner',
            owner: 'teacher',
            collaborators: [{username: 'friend'}]
        }});
        await ProjectSession.prototype.host.call(instance);
        expect(instance.props.onCreateRoom.mock.calls[0][4]).toEqual({classroom: false});
    });
});

describe('editor URL parameters for class accounts', () => {
    const StateManager = TWStateManager(() => null).WrappedComponent;

    const mountManager = search => {
        window.history.replaceState(null, '', `/editor${search}`);
        const props = {
            routingStyle: 'none',
            isEmbedded: false,
            isPlayerOnly: false,
            username: 'ada~k7p2q',
            vm: {
                setFramerate: jest.fn(),
                setCompilerOptions: jest.fn(),
                setRuntimeOptions: jest.fn(),
                extensionManager: {loadExtensionURL: jest.fn()}
            },
            onSetUsername: jest.fn(),
            onSetCloud: jest.fn(),
            onSetCollaborationRoomId: jest.fn(),
            onOpenCollaborationModal: jest.fn(),
            openSimpleDialog: jest.fn()
        };
        const instance = new StateManager(props);
        instance.componentDidMount();
        return instance;
    };

    afterEach(() => {
        window.history.replaceState(null, '', '/');
    });

    test('a student ignores room and extension parameters', () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const instance = mountManager('?room=cool-cat-123&extension=https://example.com/tracker.js');
        expect(instance.props.vm.extensionManager.loadExtensionURL).not.toHaveBeenCalled();
        expect(instance.props.onSetCollaborationRoomId).not.toHaveBeenCalled();
        expect(instance.pendingRoomCode).toBeUndefined();
        expect(window.location.search).not.toContain('room=');
        instance.componentWillUnmount();
    });

    test('everyone else still honours them', () => {
        const instance = mountManager('?room=cool-cat-123&extension=https://example.com/tracker.js');
        expect(instance.props.vm.extensionManager.loadExtensionURL)
            .toHaveBeenCalledWith('https://example.com/tracker.js');
        expect(instance.props.onSetCollaborationRoomId).toHaveBeenCalledWith('cool-cat-123');
        instance.componentWillUnmount();
    });
});
