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
import {RoturExtensionHost} from '../../src/containers/rotur-extension-host.jsx';

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
        label: 'send credits'
    });

    expect(showModal).toHaveBeenCalledWith('confirm', {
        label: 'send credits',
        username: 'user'
    });
    expect(callRotur).toHaveBeenCalledWith('me.transfer', ['other-user', 10, '']);
});
