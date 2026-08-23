import React from 'react';
import {shallow} from 'enzyme';

import {GitFileRow, GitModalComponent} from '../../../src/components/mw-git-modal/git-modal.jsx';

describe('git history controls', () => {
    test('selects commits through native buttons', () => {
        const onSelectCommit = jest.fn();
        const modal = new GitModalComponent({
            branchColors: {},
            busy: false,
            commits: [{oid: 'abcdef1234', commit: {message: 'First commit'}}],
            graphNodes: [],
            intl: {formatMessage: message => message.defaultMessage},
            onDownloadCommit: () => {},
            onRestoreCommit: () => {},
            onSelectCommit,
            selectedCommitOid: 'abcdef1234'
        });
        const history = shallow(modal.renderHistory());
        const select = history.find('button[data-oid="abcdef1234"]').first();

        expect(select.prop('type')).toBe('button');
        expect(select.prop('aria-pressed')).toBe(true);
        select.simulate('click', {currentTarget: {dataset: {oid: 'abcdef1234'}}});
        expect(onSelectCommit).toHaveBeenCalledWith('abcdef1234');
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
