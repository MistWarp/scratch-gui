import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import GitGraph from '../../src/community/components/GitGraph.jsx';
import {
    chunk,
    commitHeadline,
    commitSummarySentence,
    isDefaultCommitMessage,
    pendingSummaryShas,
    summaryPlace
} from '../../src/community/commit-summary.js';

const text = (template, values = {}) => template.replace(/\{(\w+)\}/g, (match, name) => String(values[name]));

const sha = letter => letter.repeat(40);

const summary = (extra = {}) => ({
    ok: true,
    legacy: false,
    initial: false,
    sprites: ['Cat'],
    spriteCount: 1,
    authoredFiles: 0,
    tooLarge: false,
    ...extra,
    totals: {
        scripts: {added: 0, removed: 0, changed: 0, moved: 0},
        items: 0,
        state: 0,
        assets: {added: 0, removed: 0, modified: 0},
        files: 0,
        stateOnly: false,
        ...(extra.totals || {})
    }
});

describe('commit list summaries', () => {
    test('treats generated save messages as defaults', () => {
        expect(isDefaultCommitMessage('Updated project')).toBe(true);
        expect(isDefaultCommitMessage('initial version\n\nmore')).toBe(true);
        expect(isDefaultCommitMessage('')).toBe(true);
        expect(isDefaultCommitMessage(null)).toBe(true);
        expect(isDefaultCommitMessage('Add jumping')).toBe(false);
        expect(isDefaultCommitMessage('Restored version abc1234')).toBe(false);
    });

    test('names up to three sprites and counts the rest', () => {
        expect(summaryPlace(summary(), text, 'en')).toBe('Cat');
        expect(summaryPlace(summary({sprites: ['Cat', 'Stage'], spriteCount: 2}), text, 'en')).toBe('Cat and Stage');
        expect(summaryPlace(summary({sprites: ['A', 'B', 'C'], spriteCount: 3}), text, 'en')).toBe('A, B, and C');
        expect(summaryPlace(summary({sprites: ['A', 'B', 'C', 'D', 'E'], spriteCount: 9}), text, 'en')).toBe('9 sprites');
        expect(summaryPlace(summary({sprites: [], spriteCount: 0}), text, 'en')).toBe('');
    });

    test('describes the main kind of change', () => {
        const scripts = counts => summary({totals: {scripts: {added: 0, removed: 0, changed: 0, moved: 0, ...counts}}});
        expect(commitSummarySentence(scripts({changed: 1}), text, 'en')).toBe('Changed 1 script in Cat');
        expect(commitSummarySentence(scripts({changed: 2, added: 1}), text, 'en')).toBe('Changed 3 scripts in Cat');
        expect(commitSummarySentence(scripts({added: 4}), text, 'en')).toBe('Added 4 scripts in Cat');
        expect(commitSummarySentence(scripts({removed: 1}), text, 'en')).toBe('Removed 1 script in Cat');
        expect(commitSummarySentence(summary({totals: {assets: {added: 1, removed: 0, modified: 1}}}), text, 'en'))
            .toBe('Changed 2 costumes and sounds in Cat');
        expect(commitSummarySentence(summary({totals: {items: 2}}), text, 'en'))
            .toBe('Changed variables, lists or settings in Cat');
        expect(commitSummarySentence(summary({tooLarge: true}), text, 'en')).toBe('Changed Cat, too large to summarize');
        expect(commitSummarySentence(summary({sprites: [], spriteCount: 0, authoredFiles: 2}), text, 'en'))
            .toBe('Changed 2 project files');
        expect(commitSummarySentence(summary({sprites: [], spriteCount: 0, totals: {state: 3, stateOnly: true}}), text, 'en'))
            .toBe('Only saved state changed');
        expect(commitSummarySentence(summary({sprites: [], spriteCount: 0}), text, 'en'))
            .toBe('No changes to how the project runs');
    });

    test('says nothing for legacy or failed summaries', () => {
        expect(commitSummarySentence(summary({legacy: true}), text, 'en')).toBe('');
        expect(commitSummarySentence({ok: false}, text, 'en')).toBe('');
        expect(commitSummarySentence(null, text, 'en')).toBe('');
    });

    test('replaces default messages and keeps written ones', () => {
        const changed = summary({totals: {scripts: {added: 0, removed: 0, changed: 2, moved: 0}}});
        expect(commitHeadline('Updated project', changed, text, 'en'))
            .toEqual({title: 'Changed 2 scripts in Cat', detail: ''});
        expect(commitHeadline('Add jumping\n\nbody', changed, text, 'en'))
            .toEqual({title: 'Add jumping', detail: 'Changed 2 scripts in Cat'});
        expect(commitHeadline('Updated project', null, text, 'en'))
            .toEqual({title: 'Updated project', detail: ''});
        expect(commitHeadline('', null, text, 'en')).toEqual({title: 'Untitled commit', detail: ''});
    });

    test('requests each new commit once and caps the list', () => {
        const known = new Set([sha('a')]);
        expect(pendingSummaryShas([sha('a'), sha('b'), sha('b'), 'nope', sha('c')], known)).toEqual([sha('b'), sha('c')]);
        expect(pendingSummaryShas([sha('b'), sha('c'), sha('d')], new Set(), 2)).toEqual([sha('b'), sha('c')]);
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    test('shows summaries in the commit graph', () => {
        const graph = {
            branches: ['main'],
            branchLogs: [{branch: 'main', oids: [sha('b'), sha('a')]}],
            nodes: [
                {sha: sha('b'), parents: [sha('a')], branches: ['main'], message: 'Updated project'},
                {sha: sha('a'), parents: [], branches: ['main'], message: 'Start the game'}
            ]
        };
        const summaries = {
            [sha('b')]: summary({totals: {scripts: {added: 0, removed: 0, changed: 1, moved: 0}}}),
            [sha('a')]: summary({initial: true, totals: {scripts: {added: 3, removed: 0, changed: 0, moved: 0}}})
        };
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <GitGraph
                    projectId="p1"
                    graph={graph}
                    summaries={summaries}
                />
            </MemoryRouter>
        );
        const rows = wrapper.find('li');
        expect(rows.at(0).text()).toContain('Changed 1 script in Cat');
        expect(rows.at(0).text()).not.toContain('Updated project');
        expect(rows.at(1).text()).toContain('Start the game');
        expect(rows.at(1).text()).toContain('Added 3 scripts in Cat');
        expect(rows.at(0).find('a')
            .first()
            .prop('aria-label')).toBe('View commit Changed 1 script in Cat');
        wrapper.unmount();
    });
});
