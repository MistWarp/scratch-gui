import React from 'react';
import {shallow} from 'enzyme';

import {GitFileRow, GitModalComponent} from '../../../src/components/mw-git-modal/git-modal.jsx';
import HistoryView from '../../../src/components/mw-git-modal/history-view.jsx';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

describe('git history controls', () => {
    const node = (oid, message, parents, timestamp) => ({
        oid,
        parents,
        branches: ['main'],
        commit: {message, author: {name: 'mist', timestamp}}
    });
    const graph = {
        branches: ['main'],
        branchLogs: [{branch: 'main', oids: ['c3', 'c2', 'c1']}],
        nodes: [node('c3', 'Third commit', ['c2'], 300), node('c2', 'Second commit', ['c1'], 200),
            node('c1', 'First commit', [], 100)]
    };
    const historyView = props => mountWithIntl(
        <HistoryView
            changeCount={0}
            currentBranch="main"
            graph={graph}
            hasMore={false}
            onChangeBase={jest.fn()}
            onDownloadCommit={jest.fn()}
            onLoadMore={jest.fn()}
            onRestoreCommit={jest.fn()}
            onSelectCommit={jest.fn()}
            onSelectWorktree={jest.fn()}
            {...props}
        />
    );

    test('lists commits as native buttons and selects them by oid', () => {
        const onSelectCommit = jest.fn();
        const view = historyView({onSelectCommit, selection: {kind: 'commit', oid: 'c2', base: null}});
        const select = view.find('button[data-oid="c2"]').first();

        expect(select.prop('type')).toBe('button');
        expect(select.prop('aria-pressed')).toBe(true);
        expect(view.find('ol button[data-oid]')).toHaveLength(3);
        select.simulate('click');
        expect(onSelectCommit).toHaveBeenCalled();
        expect(select.prop('data-oid')).toBe('c2');
    });

    test('shows uncommitted changes first when there are any', () => {
        const onSelectWorktree = jest.fn();
        const view = historyView({changeCount: 2, onSelectWorktree});
        const rows = view.find('ol button');

        expect(rows.first().text()).toContain('Uncommitted changes');
        expect(rows.first().text()).toContain('2 files changed since the last commit');
        rows.first().simulate('click');
        expect(onSelectWorktree).toHaveBeenCalled();
    });

    test('offers only older commits to compare with', () => {
        const onChangeBase = jest.fn();
        const view = historyView({
            onChangeBase,
            selection: {kind: 'commit', oid: 'c3', base: null},
            detail: {status: 'loading'}
        });
        const options = view.find('select option').map(option => option.prop('value'));

        expect(options).toEqual(['', 'c2', 'c1']);
        view.find('select').simulate('change', {target: {value: 'c1'}});
        expect(onChangeBase).toHaveBeenCalled();
    });

    test('explains that the first commit is all new and offers restore for it', () => {
        const view = historyView({
            selection: {kind: 'commit', oid: 'c1', base: null},
            detail: {status: 'ready', data: {base: '', diff: '', fileTexts: {}, assets: {}}}
        });

        expect(view.text()).toContain('This is the first commit, so everything in it is new.');
        expect(view.find('select')).toHaveLength(0);
        expect(view.find('button[data-oid="c1"]').filterWhere(button => button.text().includes('Restore')))
            .toHaveLength(1);
    });

    test('says when changes could not be loaded', () => {
        const view = historyView({
            selection: {kind: 'commit', oid: 'c2', base: null},
            detail: {status: 'error', error: 'Object not found'}
        });

        expect(view.text()).toContain('Could not load the changes for this commit.');
        expect(view.text()).toContain('Object not found');
    });

    test('only turns diffable changed files into buttons', () => {
        const onDiffChangedFile = jest.fn();
        const modal = new GitModalComponent({
            onDiffChangedFile
        });
        const diffable = shallow(
            <GitFileRow
                description="modified"
                filepath="project.fractch"
                onClick={modal.handleDiffChangedFile}
            />
        ).find('button');
        const staticRow = shallow(
            <GitFileRow
                description="modified"
                filepath="image.png"
            />
        );

        expect(diffable.prop('type')).toBe('button');
        expect(staticRow.find('button')).toHaveLength(0);
        diffable.simulate('click', {currentTarget: {dataset: {filepath: 'project.fractch'}}});
        expect(onDiffChangedFile).toHaveBeenCalledWith('project.fractch');
    });
});
