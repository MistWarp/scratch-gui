/* eslint-disable react/jsx-no-bind, react/prop-types */
import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import api from '../../src/community/api';
import useCommitSummaries from '../../src/community/pages/project/use-commit-summaries.js';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {commitSummaries: jest.fn()}
}));

const sha = index => index.toString(16).padStart(40, '0');

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return {promise, resolve, reject};
};

const Probe = ({projectId, shas, onRender}) => {
    onRender(useCommitSummaries(projectId, shas));
    return null;
};

const flush = () => act(async () => {
    await Promise.resolve();
    await Promise.resolve();
});

describe('useCommitSummaries', () => {
    beforeEach(() => {
        api.commitSummaries.mockReset();
    });

    test('loads summaries in batches of fifty and stops at one hundred commits', async () => {
        api.commitSummaries.mockImplementation((id, batch) => Promise.resolve({
            ok: true,
            summaries: Object.fromEntries(batch.map(entry => [entry, {ok: true, sha: entry}]))
        }));
        const shas = Array.from({length: 130}, (value, index) => sha(index + 1));
        let latest = {};
        const wrapper = mount(<Probe
            projectId="p1"
            shas={shas}
            onRender={value => {
                latest = value;
            }}
        />);
        await flush();
        await flush();
        expect(api.commitSummaries).toHaveBeenCalledTimes(2);
        expect(api.commitSummaries.mock.calls[0][1]).toHaveLength(50);
        expect(api.commitSummaries.mock.calls[1][1]).toHaveLength(50);
        expect(Object.keys(latest)).toHaveLength(100);
        wrapper.setProps({shas: [...shas]});
        await flush();
        expect(api.commitSummaries).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });

    test('drops a slow answer for the previous project', async () => {
        const slow = deferred();
        api.commitSummaries.mockImplementation(id => (id === 'p1' ?
            slow.promise :
            Promise.resolve({ok: true, summaries: {[sha(2)]: {ok: true, sha: sha(2)}}})));
        let latest = {};
        const wrapper = mount(<Probe
            projectId="p1"
            shas={[sha(1)]}
            onRender={value => {
                latest = value;
            }}
        />);
        wrapper.setProps({projectId: 'p2', shas: [sha(2)]});
        await flush();
        await act(async () => {
            slow.resolve({ok: true, summaries: {[sha(1)]: {ok: true, sha: sha(1)}}});
            await slow.promise;
        });
        await flush();
        expect(Object.keys(latest)).toEqual([sha(2)]);
        wrapper.unmount();
    });

    test('asks again after a failed request', async () => {
        api.commitSummaries.mockRejectedValueOnce(new Error('Not found'));
        api.commitSummaries.mockResolvedValue({ok: true, summaries: {[sha(1)]: {ok: true, sha: sha(1)}}});
        let latest = {};
        const wrapper = mount(<Probe
            projectId="p1"
            shas={[sha(1)]}
            onRender={value => {
                latest = value;
            }}
        />);
        await flush();
        expect(latest).toEqual({});
        wrapper.setProps({shas: [sha(1), sha(3)]});
        await flush();
        expect(api.commitSummaries).toHaveBeenCalledTimes(2);
        expect(api.commitSummaries.mock.calls[1][1]).toEqual([sha(1), sha(3)]);
        expect(Object.keys(latest)).toEqual([sha(1)]);
        wrapper.unmount();
    });

    test('loads again when the list mounts a second time', async () => {
        api.commitSummaries.mockResolvedValue({ok: true, summaries: {[sha(1)]: {ok: true, sha: sha(1)}}});
        let latest = {};
        const first = mount(<Probe
            projectId="p1"
            shas={[sha(1)]}
            onRender={value => {
                latest = value;
            }}
        />);
        first.unmount();
        const second = mount(<Probe
            projectId="p1"
            shas={[sha(1)]}
            onRender={value => {
                latest = value;
            }}
        />);
        await flush();
        expect(Object.keys(latest)).toEqual([sha(1)]);
        second.unmount();
    });
});
