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
import useRemixSync from '../../src/community/use-remix-sync.js';

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

// eslint-disable-next-line react/prop-types
const Harness = ({onSynced, projectId = 'remix', remixFrom: from = remixFrom(), visible = true, ...props}) => {
    const sync = useRemixSync({projectId, remixFrom: from, onSynced});
    return visible ? (
        <ForkStatus
            projectId={projectId}
            remixFrom={from}
            canSync
            contributeHref="/p/meow#contribute"
            sync={sync}
            {...props}
        />
    ) : null;
};

const mountStatus = props => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <Harness {...props} />
    </MemoryRouter>
);

const setHarness = (wrapper, props) => {
    wrapper.setProps({children: <Harness {...props} />});
    wrapper.update();
};

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
        const unknownBehind = mountStatus({
            gitHead: 'a'.repeat(40),
            remixFrom: {id: 'parent', owner: 'flufi', title: 'Meowing Simulator', head: 'b'.repeat(40)}
        });
        expect(syncButton(unknownBehind)).toHaveLength(1);
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
        const diff3Hunk = 'one\n<<<<<<<<< this remix\nmove 5\n=========\nmove 20\n>>>>>>>>> original\nthree';
        api.syncRemix.mockResolvedValue(syncResponse([
            {path: 'Cat/main.fractch', conflict: true, content: encode(diff3Hunk)},
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
        expect(wrapper.text()).toContain('Resolve the conflict in Cat/main.fractch.');
        expect(api.uploadRemixSync).not.toHaveBeenCalled();

        act(() => {
            wrapper.find('textarea').props()
                .onChange({target: {value: 'resolved'}});
        });
        wrapper.update();
        await act(async () => {
            submit().simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('Choose a version for Cat/a.svg.');
        expect(api.uploadRemixSync).not.toHaveBeenCalled();
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

    test('explains each refusal in a sentence of its own', async () => {
        const refusals = [
            [{code: 'uncommitted_changes', status: 409}, 'Commit your saved changes in the editor before syncing, so they are not replaced.'],
            [{code: 'head_changed', status: 409}, 'This remix changed while it was syncing. Sync again to include the new changes.'],
            [{code: 'sync_unavailable', status: 409, message: 'the two projects do not share a common commit'}, 'This remix no longer shares any commits with flufi / Meowing Simulator, so it cannot be synced.'],
            [{code: 'sync_unavailable', status: 409, message: 'target workspace archive is unavailable'}, 'Could not sync this remix.'],
            [{code: 'sync_history_unavailable', status: 409}, 'Both projects need saved commits before this remix can be synced.'],
            [{status: 404}, 'The original project for this remix no longer exists, so it cannot be synced.'],
            [{status: 403}, 'Only maintainers of this remix can sync it, and only while they can see inside flufi / Meowing Simulator.']
        ];
        for (const [fields, sentence] of refusals) {
            api.syncRemix.mockRejectedValueOnce(Object.assign(new Error(fields.message || 'raw server text'), fields));
            const wrapper = mountStatus();
            await act(async () => {
                syncButton(wrapper).simulate('click');
            });
            await settle(wrapper);
            expect(wrapper.text()).toContain(sentence);
            expect(wrapper.text()).not.toContain(fields.message || 'raw server text');
            wrapper.unmount();
        }
    });

    test('a stale sync explains itself, closes the session and refreshes, while an uncommitted refusal keeps resolutions open', async () => {
        api.syncRemix.mockResolvedValue(syncResponse([
            {path: 'Cat/main.fractch', conflict: true, content: encode('<<<<<<<<< this remix\nmove 5\n=========\nmove 20\n>>>>>>>>> original')}
        ]));
        api.uploadRemixSync
            .mockRejectedValueOnce(Object.assign(new Error('dirty'), {code: 'uncommitted_changes', status: 409}))
            .mockRejectedValueOnce(Object.assign(new Error('the original changed'), {code: 'original_changed', status: 409}));
        const onSynced = jest.fn().mockResolvedValue();
        const wrapper = mountStatus({onSynced});
        await act(async () => {
            syncButton(wrapper).simulate('click');
        });
        await settle(wrapper);
        act(() => {
            wrapper.find('textarea').props()
                .onChange({target: {value: 'kept resolution'}});
        });
        wrapper.update();
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text().includes('Save resolutions and sync'))
                .simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('Commit your saved changes in the editor before syncing, so they are not replaced.');
        expect(wrapper.text()).toContain('Resolve sync conflicts');
        expect(wrapper.find('textarea').prop('value')).toBe('kept resolution');

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text().includes('Save resolutions and sync'))
                .simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('flufi / Meowing Simulator changed while this remix was syncing.');
        expect(wrapper.text()).not.toContain('Resolve sync conflicts');
        expect(onSynced).toHaveBeenCalled();
    });

    test('points the disabled sync button at the reason', () => {
        const wrapper = mountStatus({hasUncommitted: true});
        const describedBy = syncButton(wrapper).prop('aria-describedby');
        expect(describedBy).toBeTruthy();
        expect(wrapper.find(`#${describedBy}`).text()).toContain('Commit your saved changes');
    });

    test('a conflict session survives the card being hidden and resets for another project', async () => {
        api.syncRemix.mockResolvedValue(syncResponse([
            {path: 'Cat/main.fractch', conflict: true, content: encode('<<<<<<<<< this remix\nmove 5\n=========\nmove 20\n>>>>>>>>> original')}
        ]));
        const wrapper = mountStatus();
        await act(async () => {
            syncButton(wrapper).simulate('click');
        });
        await settle(wrapper);
        act(() => {
            wrapper.find('textarea').props()
                .onChange({target: {value: 'kept edit'}});
        });
        wrapper.update();

        setHarness(wrapper, {visible: false});
        expect(wrapper.text()).not.toContain('Resolve sync conflicts');
        setHarness(wrapper, {});
        expect(wrapper.find('textarea').prop('value')).toBe('kept edit');

        await act(async () => {
            setHarness(wrapper, {projectId: 'other'});
        });
        await settle(wrapper);
        expect(wrapper.text()).not.toContain('Resolve sync conflicts');
        expect(syncButton(wrapper)).toHaveLength(1);
    });

    test('a sync answer for a project the viewer has left is dropped', async () => {
        let answer;
        api.syncRemix.mockReturnValue(new Promise(resolve => {
            answer = resolve;
        }));
        const wrapper = mountStatus();
        await act(async () => {
            syncButton(wrapper).simulate('click');
        });
        await act(async () => {
            setHarness(wrapper, {projectId: 'other'});
        });
        await act(async () => {
            answer(syncResponse([{path: 'Cat/main.fractch', conflict: true, content: encode('<<<<<<<<< this remix\n=========\n>>>>>>>>> original')}]));
        });
        await settle(wrapper);
        expect(wrapper.text()).not.toContain('Resolve sync conflicts');
        expect(api.uploadRemixSync).not.toHaveBeenCalled();
    });
});
