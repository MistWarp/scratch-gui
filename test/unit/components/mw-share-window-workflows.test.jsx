import React from 'react';
import {shallow} from 'enzyme';

import {
    ShareWindow,
    ShareWindowSignIn,
    remixTitle
} from '../../../src/components/mw-share-modal/share-window.jsx';
import {
    getRememberedPlatformProjectState,
    getScratchOrigin,
    publishToMistWarp,
    rememberPlatformProject
} from '../../../src/lib/community/publish.js';
import {getProject, request} from '../../../src/lib/community/api.js';
import {getState as getIdentityState, login, subscribe} from '../../../src/lib/rotur/identity.js';
import {getRepoChanges} from '../../../src/lib/git/browser-git.js';

jest.mock('../../../src/lib/community/publish.js', () => ({
    getRememberedPlatformProjectState: jest.fn(() => null),
    getScratchOrigin: jest.fn(() => null),
    rememberPlatformProject: jest.fn(),
    captureThumbnailDataUri: jest.fn(() => Promise.resolve(null)),
    prepareThumbnailBlob: jest.fn(() => Promise.resolve(null)),
    publishToMistWarp: jest.fn()
}));
jest.mock('../../../src/lib/community/api.js', () => ({
    getProject: jest.fn(),
    request: jest.fn()
}));
jest.mock('../../../src/lib/rotur/identity.js', () => ({
    getState: jest.fn(() => ({status: 'ready', user: {username: 'me'}})),
    login: jest.fn(),
    subscribe: jest.fn(() => () => {})
}));
jest.mock('../../../src/community/analytics.js', () => ({track: jest.fn()}));
jest.mock('../../../src/lib/git/browser-git.js', () => ({
    getRepoChanges: jest.fn()
}));
jest.mock('../../../src/lib/git/project-history.js', () => ({
    ensureProjectHistoryHydrated: jest.fn(() => Promise.resolve())
}));

const makeWindow = (action = 'update', props = {}) => shallow(
    <ShareWindow
        {...props}
        action={action}
        initialTitle="Project"
        intl={{formatMessage: message => message.defaultMessage}}
        vm={{}}
        onClose={jest.fn()}
        onPublished={jest.fn()}
        onReviewStorage={jest.fn()}
    />
);

describe('MistWarp share window workflows', () => {
    beforeEach(() => {
        request.mockReset();
        publishToMistWarp.mockReset();
        request.mockResolvedValue({agreement: {accepted: true, version: 1}});
        getRememberedPlatformProjectState.mockReturnValue(null);
        getScratchOrigin.mockReturnValue(null);
        getIdentityState.mockReturnValue({status: 'ready', user: {username: 'me'}});
        getRepoChanges.mockResolvedValue([{filepath: 'Stage.fractch', description: 'modified'}]);
    });

    test('an immediate second publish click cannot start another upload', async () => {
        let finishPublish;
        publishToMistWarp.mockReturnValue(new Promise(resolve => {
            finishPublish = resolve;
        }));
        const wrapper = makeWindow();
        wrapper.setState({changeMessage: 'Fixed controls'});

        const first = wrapper.instance().handlePublish();
        const second = wrapper.instance().handlePublish();
        await Promise.resolve();
        await Promise.resolve();

        expect(publishToMistWarp).toHaveBeenCalledTimes(1);
        finishPublish({remoteWarnings: [], shared: true, url: '/project/1'});
        await first;
        await second;
        wrapper.unmount();
    });

    test('a full Rotur storage says where to get more', () => {
        const wrapper = makeWindow('save');
        wrapper.setState({
            error: 'Your Rotur storage is full. Delete projects or backpack items you no longer need and empty the trash, or get more storage with a Rotur membership at rotur.dev/membership.',
            errorCode: 'storage_full'
        });

        const link = wrapper.find('a[href="https://rotur.dev/membership"]');
        expect(link).toHaveLength(1);
        expect(link.text()).toBe('Get more storage with a Rotur membership');
        expect(wrapper.text()).toContain('Your Rotur storage is full.');
        wrapper.setState({errorCode: 'save_failed'});
        expect(wrapper.find('a[href="https://rotur.dev/membership"]')).toHaveLength(0);
        wrapper.unmount();
    });

    test('payload fields lock while a publish is running', () => {
        const wrapper = makeWindow('save');
        wrapper.setState({status: 'Preparing your project'});

        expect(wrapper.find('#mw-share-title').prop('disabled')).toBe(true);
        expect(wrapper.find('input[type="file"]').prop('disabled')).toBe(true);
        wrapper.unmount();
    });

    test('agreement acceptance has an immediate duplicate-action lock', async () => {
        let finishAgreement;
        const wrapper = makeWindow();
        request.mockClear();
        request.mockReturnValue(new Promise(resolve => {
            finishAgreement = resolve;
        }));
        publishToMistWarp.mockResolvedValue({remoteWarnings: [], shared: true, url: '/project/1'});

        const first = wrapper.instance().handleAcceptAgreement();
        const second = wrapper.instance().handleAcceptAgreement();
        expect(request).toHaveBeenCalledTimes(1);

        finishAgreement({});
        await first;
        await second;
        wrapper.unmount();
    });

    test('does not publish when the guidelines cannot be loaded', async () => {
        request.mockRejectedValueOnce(new Error('offline'));
        const wrapper = makeWindow();
        wrapper.setState({changeMessage: 'Fixed controls'});

        await wrapper.instance().handlePublish();

        expect(publishToMistWarp).not.toHaveBeenCalled();
        expect(wrapper.state('error')).toMatch(/Could not load the community guidelines/);
        wrapper.unmount();
    });

    test('asks for a written version name without offering Sable generation', () => {
        const wrapper = makeWindow();

        expect(wrapper.text()).toContain('Write the name yourself.');
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Generate name')).toHaveLength(0);
        wrapper.unmount();
    });

    test('shows new guidelines when the server rejects an upload', async () => {
        const agreement = {version: 2, accepted: false, text: '# Updated rules'};
        const error = Object.assign(new Error('Accept the guidelines'), {
            code: 'agreement_required',
            data: {agreement}
        });
        publishToMistWarp.mockRejectedValue(error);
        const wrapper = makeWindow();
        wrapper.setState({changeMessage: 'Fixed controls'});

        await wrapper.instance().handlePublish();

        expect(wrapper.state('agreement')).toEqual(agreement);
        expect(wrapper.state('error')).toBeNull();
        wrapper.unmount();
    });

    test('offers to post a shared project to claw', () => {
        const postButton = wrapper => wrapper.findWhere(node => (
            node.prop('onClick') === wrapper.instance().handlePostToClaw
        ));
        const wrapper = makeWindow('save');
        wrapper.setState({done: {id: 'p1', url: '/project/p1', shared: true}});
        expect(postButton(wrapper)).toHaveLength(1);

        wrapper.setState({done: {id: 'p1', url: '/project/p1', shared: false}});
        expect(postButton(wrapper)).toHaveLength(0);
        wrapper.unmount();
    });

    test('a remix is named after the original and shared by default with credit', async () => {
        getRememberedPlatformProjectState.mockReturnValue({id: 'p9', title: 'Racer', owner: 'ana', isOwner: false});
        publishToMistWarp.mockResolvedValue({id: 'p10', remoteWarnings: [], shared: true, url: '/project/p10'});
        const wrapper = makeWindow('remix');

        expect(wrapper.state('title')).toBe('Project remix');
        expect(wrapper.state('share')).toBe(true);
        expect(wrapper.text()).toContain('Remix of {title} by {owner}.');

        await wrapper.instance().handlePublish();

        expect(publishToMistWarp).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Project remix',
            share: true,
            titleForNewOnly: true
        }));
        expect(wrapper.instance().doneMessage()).toBe('Your remix is shared. {owner} gets credit as the original creator.');
        wrapper.unmount();
    });

    test('a new project stays private unless the share box is ticked', async () => {
        publishToMistWarp.mockResolvedValue({id: 'p1', remoteWarnings: [], shared: false, url: '/project/p1'});
        const wrapper = makeWindow('save');
        expect(wrapper.state('share')).toBe(false);

        await wrapper.instance().handlePublish();
        expect(publishToMistWarp).toHaveBeenLastCalledWith(expect.objectContaining({share: false}));

        wrapper.setState({done: null});
        wrapper.instance().handleShareChange({target: {checked: true}});
        await wrapper.instance().handlePublish();
        expect(publishToMistWarp).toHaveBeenLastCalledWith(expect.objectContaining({share: true}));
        wrapper.unmount();
    });

    test('a project opened from Scratch is shared by default and names its source', () => {
        getScratchOrigin.mockReturnValue('123456');
        const wrapper = makeWindow('save');

        expect(wrapper.state('share')).toBe(true);
        expect(wrapper.text()).toContain('Imported from Scratch project {id}.');
        wrapper.unmount();
    });

    test('class accounts never get the share box', () => {
        const wrapper = makeWindow('remix', {student: true});

        expect(wrapper.state('share')).toBe(false);
        expect(wrapper.find('input[type="checkbox"]')).toHaveLength(0);
        wrapper.unmount();
    });

    test('remix titles keep within the title limit and are not doubled', () => {
        expect(remixTitle('Racer remix')).toBe('Racer remix');
        expect(remixTitle('')).toBe('Untitled remix');
        expect(remixTitle('x'.repeat(100))).toHaveLength(100);
    });
});

describe('MistWarp save window sign-in', () => {
    const intl = {formatMessage: message => message.defaultMessage};
    const makeSignIn = (action = 'remix') => shallow(
        <ShareWindowSignIn
            action={action}
            intl={intl}
            vm={{}}
            onClose={jest.fn()}
            onPublished={jest.fn()}
            onReviewStorage={jest.fn()}
        />
    );

    beforeEach(() => {
        login.mockReset();
        getProject.mockReset();
        rememberPlatformProject.mockReset();
        subscribe.mockReset();
        subscribe.mockReturnValue(() => {});
        getRememberedPlatformProjectState.mockReturnValue({id: 'p9', title: 'Racer', owner: 'ana', isOwner: false});
    });

    test('signed-in people go straight to the save form', () => {
        getIdentityState.mockReturnValue({status: 'ready', user: {username: 'me'}});
        const wrapper = makeSignIn();

        expect(wrapper.find(ShareWindow)).toHaveLength(1);
        expect(wrapper.find(ShareWindow).prop('action')).toBe('remix');
        wrapper.unmount();
    });

    test('signed-out people sign in first, then save with the action for their account', async () => {
        getIdentityState.mockReturnValue({status: 'idle', user: null});
        getProject.mockResolvedValue({project: {id: 'p9', title: 'Racer', owner: 'me', isOwner: true}});
        const wrapper = makeSignIn();

        expect(wrapper.find(ShareWindow)).toHaveLength(0);
        expect(wrapper.text()).toContain('Sign in to save your remix.');

        const onIdentity = subscribe.mock.calls[0][0];
        onIdentity({status: 'ready', user: {username: 'me'}});
        await new Promise(resolve => setTimeout(resolve, 0));
        wrapper.update();

        expect(rememberPlatformProject).toHaveBeenCalledWith(expect.objectContaining({isOwner: true}));
        expect(wrapper.find(ShareWindow).prop('action')).toBe('update');
        wrapper.unmount();
    });

    test('a lost project means the window saves a new project after sign-in', async () => {
        getIdentityState.mockReturnValue({status: 'idle', user: null});
        getRememberedPlatformProjectState.mockReturnValue(null);
        const wrapper = makeSignIn('remix');

        subscribe.mock.calls[0][0]({status: 'ready', user: {username: 'me'}});
        await new Promise(resolve => setTimeout(resolve, 0));
        wrapper.update();

        expect(getProject).not.toHaveBeenCalled();
        expect(wrapper.find(ShareWindow).prop('action')).toBe('save');
        wrapper.unmount();
    });

    test('a closed sign-in window shows an error and keeps the prompt', async () => {
        getIdentityState.mockReturnValue({status: 'idle', user: null});
        login.mockRejectedValue(new Error(''));
        const wrapper = makeSignIn('save');

        await wrapper.instance().handleSignIn();

        expect(wrapper.state('error')).toBe('Sign-in did not finish. Try again.');
        expect(wrapper.find(ShareWindow)).toHaveLength(0);
        wrapper.unmount();
    });
});
