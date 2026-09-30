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

    expect(commitGrant).toHaveBeenCalledWith({name: 'Project'}, ['posts:create']);
    expect(host.acquireModalLock).not.toHaveBeenCalled();
});

test('trusted projects still confirm sensitive Rotur actions', async () => {
    const host = new RoturExtensionHost({
        vm: {runtime: {_mwProjectTrusted: true}}
    });
    const showModal = jest.fn(() => Promise.resolve(true));
    host.acquireModalLock = jest.fn(() => Promise.resolve({showModal}));

    await host.call('me.transfer', ['other-user', 10, ''], {
        sensitive: true,
        label: 'me.transfer',
        confirmation: {type: 'payment', amount: 10, recipient: 'other-user'}
    });

    expect(showModal).toHaveBeenCalledWith('confirm', {
        label: 'me.transfer',
        confirmation: {type: 'payment', amount: 10, recipient: 'other-user'},
        username: 'user'
    });
    expect(callRotur).toHaveBeenCalledWith('me.transfer', ['other-user', 10, '']);
});

test('authenticated reads expand scopes without prompting', async () => {
    const host = new RoturExtensionHost({
        vm: {runtime: {}}
    });
    host.acquireModalLock = jest.fn();

    await expect(host.ensureConsent(['credits:view'], {
        name: 'Project',
        authenticatedOnly: true
    })).resolves.toBe(true);

    expect(commitGrant).toHaveBeenCalledWith({
        name: 'Project',
        authenticatedOnly: true
    }, ['credits:view']);
    expect(host.acquireModalLock).not.toHaveBeenCalled();
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
    await expect(host.call('me.transfer', ['other-user', 10], {
        sensitive: true,
        label: 'me.transfer'
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
