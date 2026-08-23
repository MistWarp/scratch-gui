import React from 'react';
import {shallow} from 'enzyme';

import ShareWindow from '../../../src/components/mw-share-modal/share-window.jsx';
import {publishToMistWarp} from '../../../src/lib/community/publish.js';
import {request} from '../../../src/lib/community/api.js';

jest.mock('../../../src/lib/community/publish.js', () => ({
    captureThumbnailDataUri: jest.fn(() => Promise.resolve(null)),
    prepareThumbnailBlob: jest.fn(() => Promise.resolve(null)),
    publishToMistWarp: jest.fn()
}));
jest.mock('../../../src/lib/community/api.js', () => ({
    request: jest.fn()
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
});
