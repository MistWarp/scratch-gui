import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {useParams} from 'react-router-dom';
import api from '../../src/community/api.js';
import VanityProject from '../../src/community/pages/VanityProject.jsx';

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        Navigate: ({to}) => <span data-testid="redirect">{to}</span>,
        useParams: jest.fn()
    };
});

jest.mock('../../src/community/api.js', () => ({
    resolveVanity: jest.fn()
}));

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return {promise, reject, resolve};
};

const flush = async wrapper => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
};

describe('VanityProject', () => {
    beforeEach(() => {
        api.resolveVanity.mockReset();
    });

    test('shows loading, redirects on success, and reports a current failure', async () => {
        useParams.mockReturnValue({slug: 'working'});
        api.resolveVanity.mockResolvedValueOnce({id: 'project-1'});
        const wrapper = mount(<VanityProject />);
        expect(wrapper.text()).toContain('Finding project…');
        await flush(wrapper);
        expect(wrapper.text()).toContain('/project/project-1');
        wrapper.unmount();

        useParams.mockReturnValue({slug: 'missing'});
        api.resolveVanity.mockRejectedValueOnce(new Error('not found'));
        const failedWrapper = mount(<VanityProject />);
        await flush(failedWrapper);
        expect(failedWrapper.text()).toContain('This project link does not exist.');
        failedWrapper.unmount();
    });

    test('resets an old error and ignores its stale response when the slug changes', async () => {
        const oldRequest = deferred();
        const newRequest = deferred();
        useParams.mockReturnValue({slug: 'old'});
        api.resolveVanity
            .mockReturnValueOnce(oldRequest.promise)
            .mockReturnValueOnce(newRequest.promise);
        const wrapper = mount(<VanityProject />);

        useParams.mockReturnValue({slug: 'new'});
        wrapper.setProps({revision: 1});
        expect(wrapper.text()).toContain('Finding project…');

        await act(async () => oldRequest.reject(new Error('old failure')));
        wrapper.update();
        expect(wrapper.text()).toContain('Finding project…');

        await act(async () => newRequest.resolve({id: 'new-project'}));
        wrapper.update();
        expect(wrapper.text()).toContain('/project/new-project');
        wrapper.unmount();
    });

    test('does not let an older success replace the current route result', async () => {
        const oldRequest = deferred();
        const newRequest = deferred();
        useParams.mockReturnValue({slug: 'old'});
        api.resolveVanity
            .mockReturnValueOnce(oldRequest.promise)
            .mockReturnValueOnce(newRequest.promise);
        const wrapper = mount(<VanityProject />);

        useParams.mockReturnValue({slug: 'new'});
        wrapper.setProps({revision: 1});
        await act(async () => newRequest.resolve({id: 'new-project'}));
        wrapper.update();
        await act(async () => oldRequest.resolve({id: 'old-project'}));
        wrapper.update();

        expect(wrapper.text()).toContain('/project/new-project');
        expect(wrapper.text()).not.toContain('/project/old-project');
        wrapper.unmount();
    });
});
