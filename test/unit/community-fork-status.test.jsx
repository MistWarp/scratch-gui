import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {
        syncRemix: jest.fn(),
        uploadRemixSync: jest.fn(),
        commitTree: jest.fn(),
        commitFile: jest.fn()
    }
}));
jest.mock('../../src/lib/git/mwp.js', () => ({
    buildProjectArtifactsFromFileEntries: jest.fn(entries => Promise.resolve({sb3: 'sb3', tree: 'tree', entries}))
}));

import api from '../../src/community/api';
import {buildProjectArtifactsFromFileEntries} from '../../src/lib/git/mwp.js';
import ForkStatus from '../../src/community/components/ForkStatus.jsx';

const encode = value => Buffer.from(value).toString('base64');
const remixFrom = (extra = {}) => ({id: 'parent', owner: 'flufi', title: 'Meowing Simulator', ahead: 1, behind: 1, ...extra});
const syncResponse = changes => ({
    ok: true,
    merge: {ok: true, changes},
    targetProjectId: 'remix',
    sourceProjectId: 'parent',
    sourceHead: 'b'.repeat(40),
    targetHead: 'a'.repeat(40),
    expectedHead: 'a'.repeat(40)
});

const mountStatus = props => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <ForkStatus
            projectId="remix"
            remixFrom={remixFrom()}
            canSync
            contributeHref="/p/meow#contribute"
            {...props}
        />
    </MemoryRouter>
);

const settle = async wrapper => {
    for (let index = 0; index < 6; index++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const syncButton = wrapper => wrapper.find('button').filterWhere(button => button.text().includes('Sync with original'));

describe('remix fork status', () => {
    beforeEach(() => {
        api.syncRemix.mockReset();
        api.uploadRemixSync.mockReset().mockResolvedValue({ok: true});
        api.commitTree.mockReset().mockResolvedValue({files: [{path: 'Cat/main.fractch'}]});
        api.commitFile.mockReset().mockResolvedValue({content: encode('cat code')});
        buildProjectArtifactsFromFileEntries.mockClear();
    });

    test('offers a sync only to maintainers of a remix that is behind', () => {
        const behind = mountStatus({canContribute: true});
        expect(behind.text()).toContain('This project is 1 commit ahead and 1 commit behind flufi / Meowing Simulator.');
        expect(behind.find('a').filterWhere(link => link.text() === 'Contribute')
            .prop('href')).toBe('/p/meow#contribute');
        expect(syncButton(behind)).toHaveLength(1);

        expect(syncButton(mountStatus({remixFrom: remixFrom({behind: 0})}))).toHaveLength(0);
        expect(syncButton(mountStatus({canSync: false}))).toHaveLength(0);
    });

    test('asks for a commit first when the remix has uncommitted changes', () => {
        const wrapper = mountStatus({hasUncommitted: true});
        expect(syncButton(wrapper).prop('disabled')).toBe(true);
        expect(wrapper.text()).toContain('Commit your saved changes in the editor before syncing');
    });

    test('a clean sync uploads the merged tree with both heads and refreshes the project', async () => {
        api.syncRemix.mockResolvedValue(syncResponse([{path: 'Stage/main.fractch', content: encode('stage code')}]));
        const onSynced = jest.fn().mockResolvedValue();
        const wrapper = mountStatus({onSynced});
        await act(async () => {
            syncButton(wrapper).simulate('click');
        });
        await settle(wrapper);

        expect(api.syncRemix).toHaveBeenCalledWith('remix');
        const entries = buildProjectArtifactsFromFileEntries.mock.calls[0][0];
        expect(entries.map(entry => entry.path).sort()).toEqual(['Cat/main.fractch', 'Stage/main.fractch']);
        expect(api.uploadRemixSync).toHaveBeenCalledWith('remix', {
            sb3: 'sb3', mergeTree: 'tree', expectedHead: 'a'.repeat(40), syncHead: 'b'.repeat(40)
        });
        expect(onSynced).toHaveBeenCalled();
        expect(wrapper.text()).toContain('Brought in the latest changes from flufi / Meowing Simulator.');
    });

    test('reports when the remix already has every change', async () => {
        api.syncRemix.mockResolvedValue({...syncResponse([]), merge: {ok: true, alreadyMerged: true}});
        const wrapper = mountStatus();
        await act(async () => {
            syncButton(wrapper).simulate('click');
        });
        await settle(wrapper);

        expect(api.uploadRemixSync).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('This remix already has every change from flufi / Meowing Simulator.');
    });

    test('conflicts wait for a resolution before syncing', async () => {
        api.syncRemix.mockResolvedValue(syncResponse([
            {path: 'Cat/main.fractch', conflict: true, content: encode('<<<<<<< target')},
            {path: 'Cat/a.svg', conflict: true, binary: true, ours: encode('ours'), theirs: encode('theirs')}
        ]));
        const wrapper = mountStatus();
        await act(async () => {
            syncButton(wrapper).simulate('click');
        });
        await settle(wrapper);

        expect(api.uploadRemixSync).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('Resolve sync conflicts');
        expect(syncButton(wrapper)).toHaveLength(0);
        const submit = () => wrapper.find('button').filterWhere(button => button.text().includes('Save resolutions and sync'));

        await act(async () => {
            submit().simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('Choose a version for Cat/a.svg.');
        expect(api.uploadRemixSync).not.toHaveBeenCalled();

        act(() => {
            wrapper.find('textarea').props()
                .onChange({target: {value: 'resolved'}});
        });
        wrapper.update();
        act(() => {
            wrapper.find('button').filterWhere(button => button.text() === 'Use the original')
                .simulate('click');
        });
        wrapper.update();
        await act(async () => {
            submit().simulate('click');
        });
        await settle(wrapper);

        const uploaded = buildProjectArtifactsFromFileEntries.mock.calls[0][0];
        const entries = new Map(uploaded.map(entry => [entry.path, entry.data]));
        expect(new TextDecoder().decode(entries.get('Cat/main.fractch'))).toBe('resolved');
        expect(new TextDecoder().decode(entries.get('Cat/a.svg'))).toBe('theirs');
        expect(api.uploadRemixSync).toHaveBeenCalled();
        expect(wrapper.text()).not.toContain('Resolve sync conflicts');
    });

    test('shows the server refusal when the sync cannot start', async () => {
        api.syncRemix.mockRejectedValue(new Error('commit the changes saved in this remix before syncing it with the original'));
        const wrapper = mountStatus();
        await act(async () => {
            syncButton(wrapper).simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('commit the changes saved in this remix before syncing it with the original');
    });
});
