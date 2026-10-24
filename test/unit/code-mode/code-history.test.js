import {
    BUDGET,
    MAX_ENTRIES,
    canRedoExactly,
    canUndoExactly,
    clearCodeHistory,
    codeHistoryEntries,
    codeHistoryUnits,
    latestRedo,
    latestUndo,
    markUndone,
    pushCodeApply,
    pushCodeGroup
} from '../../../src/lib/code-mode/code-history.js';
import {nextUndoSource, recordDeletion} from '../../../src/lib/undo-history.js';

const scriptStep = blocks => {
    const script = {};
    for (let i = 0; i < blocks; i++) script[`b${i}`] = {opcode: 'motion_movesteps'};
    return {scripts: {top: script}, values: {}, declarations: [], comments: {}};
};

describe('code apply history', () => {
    beforeEach(() => clearCodeHistory());

    test('undo needs the after-hash and redo needs the hash taken at undo', () => {
        const entry = pushCodeApply({targetId: 't', previous: scriptStep(1), afterHash: 'after'});
        expect(canUndoExactly(entry, 'other')).toBe(false);
        expect(canUndoExactly(entry, 'after')).toBe(true);
        markUndone(entry, [scriptStep(1)], 'undone');
        expect(latestUndo('t')).toBeNull();
        expect(latestRedo('t')).toBe(entry);
        expect(canRedoExactly(entry, 'after')).toBe(false);
        expect(canRedoExactly(entry, 'undone')).toBe(true);
    });

    test('a new apply on a target clears that target redo entries only', () => {
        const a = pushCodeApply({targetId: 'a', previous: scriptStep(1), afterHash: 'a1'});
        const b = pushCodeApply({targetId: 'b', previous: scriptStep(1), afterHash: 'b1'});
        markUndone(a, [scriptStep(1)], 'a0');
        markUndone(b, [scriptStep(1)], 'b0');
        pushCodeApply({targetId: 'a', previous: scriptStep(1), afterHash: 'a2'});
        expect(latestRedo('a')).toBeNull();
        expect(latestRedo('b')).toBe(b);
    });

    test('a group entry belongs to every target it changed and compares every hash', () => {
        const group = pushCodeGroup({
            targetIds: ['a', 'b'],
            steps: [scriptStep(1), scriptStep(2)],
            afterHash: {a: 'a1', b: 'b1'}
        });
        expect(latestUndo('a')).toBe(group);
        expect(latestUndo('b')).toBe(group);
        expect(latestUndo('c')).toBeNull();
        expect(canUndoExactly(group, {a: 'a1', b: 'b1'})).toBe(true);
        expect(canUndoExactly(group, {a: 'a1', b: 'changed'})).toBe(false);
        markUndone(group, [scriptStep(1)], {a: 'a0', b: 'b0'});
        expect(latestRedo('b')).toBe(group);
        expect(canRedoExactly(group, {a: 'a0', b: 'b0'})).toBe(true);
        pushCodeApply({targetId: 'b', previous: scriptStep(1), afterHash: 'b2'});
        expect(latestRedo('a')).toBeNull();
    });

    test('a group apply clears redo for each target it touches', () => {
        const a = pushCodeApply({targetId: 'a', previous: scriptStep(1), afterHash: 'a1'});
        const c = pushCodeApply({targetId: 'c', previous: scriptStep(1), afterHash: 'c1'});
        markUndone(a, [scriptStep(1)], 'a0');
        markUndone(c, [scriptStep(1)], 'c0');
        pushCodeGroup({targetIds: ['a', 'b'], steps: [scriptStep(1)], afterHash: {a: 'a2', b: 'b2'}});
        expect(latestRedo('a')).toBeNull();
        expect(latestRedo('c')).toBe(c);
    });

    test('a deletion clears code redo', () => {
        const a = pushCodeApply({targetId: 'a', previous: scriptStep(1), afterHash: 'a1'});
        markUndone(a, [scriptStep(1)], 'a0');
        recordDeletion();
        expect(latestRedo()).toBeNull();
    });

    test('auto applies within two seconds of each other become one entry', () => {
        pushCodeApply({targetId: 't', previous: scriptStep(1), afterHash: 'h1', auto: true, now: 1000});
        pushCodeApply({targetId: 't', previous: scriptStep(1), afterHash: 'h2', auto: true, now: 2500});
        pushCodeApply({targetId: 't', previous: scriptStep(1), afterHash: 'h3', auto: true, now: 6000});
        const entries = codeHistoryEntries();
        expect(entries.length).toBe(2);
        expect(entries[0].steps.length).toBe(2);
        expect(entries[0].afterHash).toBe('h2');
    });

    test('code entries take part in the shared undo order', () => {
        const workspace = {undoStack_: [{_mwUndoSequence: 1}]};
        const entry = pushCodeApply({targetId: 't', previous: scriptStep(1), afterHash: 'h'});
        expect(nextUndoSource(workspace, null, entry)).toBe('code');
        workspace.undoStack_.push({_mwUndoSequence: entry.sequence + 1});
        expect(nextUndoSource(workspace, null, entry)).toBe('blocks');
    });

    test('100 one-line applies to a 20,000-block sprite stay within the budget', () => {
        for (let i = 0; i < 100; i++) {
            pushCodeApply({targetId: 't', previous: scriptStep(20), afterHash: `h${i}`});
        }
        expect(codeHistoryEntries().length).toBe(MAX_ENTRIES);
        expect(codeHistoryUnits()).toBeLessThanOrEqual(BUDGET);
    });

    test('100 re-applies of a 5,000-block script stay within the budget', () => {
        for (let i = 0; i < 100; i++) {
            pushCodeApply({targetId: 't', previous: scriptStep(5000), afterHash: `h${i}`});
        }
        expect(codeHistoryUnits()).toBeLessThanOrEqual(BUDGET);
        expect(codeHistoryEntries().length).toBe(BUDGET / 5000);
    });

    test('a 1,000,000-item list value is kept only until the next entry arrives', () => {
        const huge = new Array(1000000).fill('x');
        for (let i = 0; i < 100; i++) {
            pushCodeApply({targetId: 't',
                previous: {scripts: {}, values: {list: huge}, declarations: [], comments: {}},
                afterHash: `h${i}`});
            expect(codeHistoryEntries().length).toBe(1);
        }
    });

    test('a list only referenced by the history counts as one unit', () => {
        const variable = {value: new Array(1000000).fill('x')};
        pushCodeApply({targetId: 't',
            previous: {scripts: {}, values: {}, declarations: [{id: 'l', variable, deleted: false}], comments: {}},
            afterHash: 'h'});
        expect(codeHistoryUnits()).toBe(1);
    });
});
