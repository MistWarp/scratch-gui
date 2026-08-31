import React from 'react';
import {shallow} from 'enzyme';

import ShareWindow from '../../../src/components/mw-share-modal/share-window.jsx';
import {publishToMistWarp} from '../../../src/lib/community/publish.js';
import {request} from '../../../src/lib/community/api.js';
import {getRepoChanges} from '../../../src/lib/git/browser-git.js';
import {getFractchGitDiff} from '../../../src/lib/git/fractch-diff.js';
import {generateCommitName} from '../../../src/lib/sable/smart-features.js';

jest.mock('../../../src/lib/community/publish.js', () => ({
    captureThumbnailDataUri: jest.fn(() => Promise.resolve(null)),
    prepareThumbnailBlob: jest.fn(() => Promise.resolve(null)),
    publishToMistWarp: jest.fn()
}));
jest.mock('../../../src/lib/community/api.js', () => ({
    request: jest.fn()
}));
jest.mock('../../../src/lib/git/browser-git.js', () => ({
    getRepoChanges: jest.fn()
}));
jest.mock('../../../src/lib/git/project-history.js', () => ({
    ensureProjectHistoryHydrated: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../src/lib/git/fractch-diff.js', () => ({
    getFractchGitDiff: jest.fn()
}));
jest.mock('../../../src/lib/sable/smart-features.js', () => ({
    generateCommitName: jest.fn()
}));

const makeWindow = (action = 'update') => shallow(
    <ShareWindow
        action={action}
        initialTitle="Project"
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
        getRepoChanges.mockResolvedValue([{filepath: 'Stage.fractch', description: 'modified'}]);
        getFractchGitDiff.mockResolvedValue('diff --git a/Stage.fractch b/Stage.fractch');
        generateCommitName.mockResolvedValue({name: 'Fix stage movement', balance: 9.98});
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

    test('asks Sable for a name only after Generate name is clicked', async () => {
        const wrapper = makeWindow();
        const publish = jest.spyOn(wrapper.instance(), 'handlePublish').mockImplementation(() => {});

        expect(generateCommitName).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('Generating a name may use some of your Sable Credit (SC).');
        const generateButton = wrapper.find('button').filterWhere(button => button.text() === 'Generate name');
        await generateButton.props().onClick();

        expect(getRepoChanges).toHaveBeenCalledWith(wrapper.instance().props.vm);
        expect(generateCommitName).toHaveBeenCalledWith('diff --git a/Stage.fractch b/Stage.fractch');
        expect(wrapper.state('changeMessage')).toBe('Fix stage movement');
        expect(publish).not.toHaveBeenCalled();
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
});
