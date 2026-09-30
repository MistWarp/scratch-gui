import {shallow} from 'enzyme';
import http from 'isomorphic-git/http/web';
import {addRemote, cloneRepo, pull, push} from '../../src/lib/git/browser-git.js';
import {syncConfiguredRemotes} from '../../src/lib/git/sync-remotes.js';
import {GitModalComponent} from '../../src/components/mw-git-modal/git-modal.jsx';
import {setGitModalInitialView} from '../../src/lib/git/modal-view.js';

jest.mock('isomorphic-git/http/web', () => ({request: jest.fn()}));

const STUDENT_KEY = 'mw:classroom-student';

const collectElements = (node, found = []) => {
    if (Array.isArray(node)) {
        node.forEach(child => collectElements(child, found));
    } else if (node && typeof node === 'object' && node.props) {
        found.push(node);
        collectElements(node.props.children, found);
        if (node.props.footer) collectElements(node.props.footer, found);
    }
    return found;
};

const sidebarViews = modal => collectElements(modal.render())
    .filter(element => element.props && element.props.label && typeof element.props.value === 'string')
    .map(element => element.props.value);

const modalProps = extra => Object.assign({
    intl: {formatMessage: message => message.defaultMessage},
    initialized: true,
    remotes: [],
    commits: [],
    graphNodes: [],
    branchColors: {},
    onClearDiff: jest.fn()
}, extra);

beforeEach(() => {
    localStorage.clear();
    http.request.mockClear();
});

afterEach(() => {
    localStorage.clear();
});

describe('git remotes for class accounts', () => {
    test('clone, pull, push and adding a remote are refused before any request', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const vm = {};
        await expect(cloneRepo({url: 'https://github.com/user/repo.git'})).rejects.toThrow('class accounts');
        await expect(push({vm, remote: 'origin', ref: 'main'})).rejects.toThrow('class accounts');
        await expect(pull({vm, remote: 'origin', ref: 'main'})).rejects.toThrow('class accounts');
        await expect(addRemote({vm, name: 'origin', url: 'https://github.com/user/repo.git'}))
            .rejects.toThrow('class accounts');
        expect(http.request).not.toHaveBeenCalled();
    });

    test('saving never syncs connected remotes for a student', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        await expect(syncConfiguredRemotes({vm: {}})).resolves.toEqual([]);
        expect(http.request).not.toHaveBeenCalled();
    });

    test('the project history window hides remote connections from a student', () => {
        setGitModalInitialView('remote');
        const modal = new GitModalComponent(modalProps({remotesDisabled: true, onAddRemote: jest.fn()}));
        expect(modal.state.currentView).toBe('history');
        expect(sidebarViews(modal)).toEqual(['history', 'branches']);
        modal.state.currentView = 'remote';
        expect(collectElements(modal.renderContent()).some(element =>
            element.props && element.props.onClick === modal.props.onAddRemote)).toBe(false);
    });

    test('a student can start local history but cannot clone', () => {
        const modal = new GitModalComponent(modalProps({initialized: false, remotesDisabled: true, onInit: jest.fn()}));
        const empty = shallow(modal.renderNotInitialized());
        expect(empty.find('input')).toHaveLength(0);
        expect(empty.text()).not.toContain('clone');
        expect(empty.find('button')).toHaveLength(1);
    });

    test('everyone else keeps remotes and cloning', () => {
        setGitModalInitialView('remote');
        const modal = new GitModalComponent(modalProps());
        expect(modal.state.currentView).toBe('remote');
        expect(sidebarViews(modal)).toEqual(['history', 'branches', 'remote']);
        const empty = shallow(new GitModalComponent(modalProps({initialized: false})).renderNotInitialized());
        expect(empty.find('input')).toHaveLength(1);
    });
});
