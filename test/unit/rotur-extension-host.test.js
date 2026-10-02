jest.mock('../../src/lib/rotur/extension-bridge.js', () => ({
    hasFullGrant: jest.fn(() => false),
    commitGrant: jest.fn(() => Promise.resolve()),
    grantedScopesFor: jest.fn(() => []),
    callRotur: jest.fn(),
    activityAllowed: jest.fn(() => null),
    rememberActivityDecision: jest.fn(),
    isActivityMethod: jest.fn(() => false)
}));

jest.mock('../../src/lib/rotur/client.js', () => ({
    isLoggedIn: jest.fn(() => true)
}));

jest.mock('../../src/lib/rotur/identity.js', () => ({
    getState: jest.fn(() => ({user: {username: 'user'}}))
}));

import {callRotur, commitGrant} from '../../src/lib/rotur/extension-bridge.js';
import {
    BLOCKED_PROJECT_PROMPTS_KEY,
    isProjectPromptBlocked
} from '../../src/lib/project-prompt-blocking.js';
import {RoturExtensionHost} from '../../src/containers/rotur-extension-host.jsx';

beforeEach(() => {
    localStorage.removeItem(BLOCKED_PROJECT_PROMPTS_KEY);
    sessionStorage.removeItem('mw:mistwarp-current-project');
});

test('trusted projects skip Rotur permission prompts', async () => {
    const host = new RoturExtensionHost({
        vm: {runtime: {_mwProjectTrusted: true}},
        projectTitle: 'Project'
    });
    host.acquireModalLock = jest.fn();

    await expect(host.ensureConsent(['posts:create'], {name: 'Project'})).resolves.toBe(true);
    await expect(host.ensureActivitySharing()).resolves.toBe(true);

    expect(commitGrant).toHaveBeenCalledWith({name: ''}, ['posts:create']);
    expect(host.acquireModalLock).not.toHaveBeenCalled();
});

test('trusted projects still confirm sensitive Rotur actions', async () => {
    const host = new RoturExtensionHost({
        vm: {runtime: {_mwProjectTrusted: true}}
    });
    const showModal = jest.fn(() => Promise.resolve(true));
    host.acquireModalLock = jest.fn(() => Promise.resolve({showModal}));

    await host.call('gifts.claim', ['CODE'], {
        sensitive: false,
        label: 'claim a free hat'
    });

    expect(showModal).toHaveBeenCalledWith('confirm', {
        label: 'claim gift code CODE',
        confirmation: null,
        username: 'user'
    });
    expect(callRotur).toHaveBeenCalledWith('gifts.claim', ['CODE']);
});

test('authenticated reads expand scopes without prompting', async () => {
    const host = new RoturExtensionHost({
        vm: {runtime: {}}
    });
    host.acquireModalLock = jest.fn();

    await expect(host.ensureConsent(['account:view'], {
        name: 'Project',
        authenticatedOnly: true
    })).resolves.toBe(true);

    expect(commitGrant).toHaveBeenCalledWith({name: ''}, ['account:view']);
    expect(host.acquireModalLock).not.toHaveBeenCalled();
});

test('the project cannot skip consent by calling itself authenticated-only', async () => {
    const host = new RoturExtensionHost({
        vm: {runtime: {projectName: 'Project'}}
    });
    const showModal = jest.fn(() => Promise.resolve(false));
    host.acquireModalLock = jest.fn(() => Promise.resolve({showModal}));
    commitGrant.mockClear();

    await expect(host.ensureConsent(['posts:create'], {name: 'Other', authenticatedOnly: true}))
        .resolves.toBe(false);

    expect(showModal).toHaveBeenCalledWith('consent', expect.objectContaining({scopes: ['posts:create']}));
    expect(commitGrant).not.toHaveBeenCalled();
    await expect(host.ensureConsent(['tokens:manage'])).rejects.toThrow('cannot ask');
});

test('rejects methods outside the allowlist and ungranted scopes', async () => {
    const host = new RoturExtensionHost({
        vm: {runtime: {}}
    });
    callRotur.mockClear();

    await expect(host.call('_http.getToken', [])).rejects.toThrow('Projects cannot call');
    await expect(host.call('posts.create', ['spam'])).rejects.toThrow('not granted');
    expect(callRotur).not.toHaveBeenCalled();
});

test('blocked projects cannot reopen Rotur prompts', async () => {
    sessionStorage.setItem('mw:mistwarp-current-project', JSON.stringify({id: 'blocked-project'}));
    const host = new RoturExtensionHost({
        vm: {runtime: {}},
        projectTitle: 'Blocked project'
    });
    const callback = jest.fn();
    host.state.callback = callback;
    host.handleBlocked();

    expect(callback).toHaveBeenCalledWith(false);
    expect(isProjectPromptBlocked({id: 'blocked-project'})).toBe(true);

    await expect(host.ensureConsent(['posts:create'], {name: 'Blocked project'})).resolves.toBe(false);
    await expect(host.ensureActivitySharing()).resolves.toBe(false);
    await expect(host.call('gifts.claim', ['CODE'], {
        sensitive: true,
        label: 'gifts.claim'
    })).rejects.toThrow('cancelled');

    expect(host.state.type).toBe(null);
});

test('clears project activities when the editor host unmounts', async () => {
    const host = new RoturExtensionHost({
        vm: {runtime: {}},
        projectTitle: 'Project'
    });

    await host.activityScope.call('socket.addActivity', [{id: 'project-123'}]);
    host.componentWillUnmount();

    expect(callRotur).toHaveBeenLastCalledWith('socket.removeActivity', ['project-123']);
});

test('clears project activities when the editor loads another project', async () => {
    sessionStorage.removeItem('mw:mistwarp-current-project');
    const host = new RoturExtensionHost({
        vm: {runtime: {}},
        projectTitle: 'First project'
    });
    host.componentDidMount();
    await host.activityScope.call('socket.addActivity', [{id: 'first-project'}]);

    host.props = {...host.props, projectTitle: 'Second project'};
    host.componentDidUpdate();

    expect(callRotur).toHaveBeenLastCalledWith('socket.removeActivity', ['first-project']);
});
