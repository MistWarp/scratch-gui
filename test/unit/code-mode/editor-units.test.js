import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {DRAG_TYPE, codeUnitsExtension, readUnits, setUnits} from '../../../src/lib/code-mode/editor-units.js';

const TEXT = 'var x = 1;\n\nwhen flag {\n  say "a";\n}\n\nwhen key space {\n  move 10;\n}\n';
const LOCK_FROM = TEXT.indexOf('when key');
const LOCK_TO = TEXT.lastIndexOf('}') + 1;

const makeView = callbacks => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const view = new EditorView({
        parent,
        state: EditorState.create({
            doc: TEXT,
            extensions: codeUnitsExtension({
                callbacks: {current: {onRun: () => {}, onShowBlock: () => {}, ...callbacks}},
                classes: {},
                labels: {run: 'Run', showBlock: 'Show block', lockedReason: 'Locked'}
            })
        })
    });
    setUnits(view, {
        locked: [{from: LOCK_FROM, to: LOCK_TO, topId: 'key', reason: 'Locked'}],
        runs: [{from: TEXT.indexOf('when flag'), to: TEXT.indexOf('}') + 1, topId: 'hat'}]
    });
    return view;
};

describe('locked script ranges', () => {
    test('edits inside a locked script are dropped, edits next to it are kept', () => {
        const view = makeView();
        view.dispatch({changes: {from: LOCK_FROM + 5, insert: 'X'}});
        expect(view.state.doc.toString()).toBe(TEXT);
        view.dispatch({changes: {from: LOCK_FROM, insert: '// note\n'}});
        expect(view.state.doc.toString()).toContain('// note\nwhen key');
        const locked = readUnits(view).locked[0];
        expect(view.state.sliceDoc(locked.from, locked.to)).toBe(TEXT.slice(LOCK_FROM, LOCK_TO));
        view.destroy();
    });

    test('deleting a whole locked script is allowed', () => {
        const view = makeView();
        view.dispatch({changes: {from: LOCK_FROM, to: LOCK_TO}});
        expect(view.state.doc.toString()).not.toContain('when key');
        expect(readUnits(view).locked).toEqual([]);
        view.destroy();
    });

    test('dropping a costume from the explorer inserts its name as a quoted string', () => {
        const view = makeView({resolveAssetName: item => (item.type === 'costume' ? 'cat "2"' : null)});
        const event = new Event('drop', {bubbles: true, cancelable: true});
        event.dataTransfer = {
            types: [DRAG_TYPE],
            getData: type => (type === DRAG_TYPE ? JSON.stringify({type: 'costume', targetId: 't', itemId: 'i'}) : '')
        };
        event.clientX = 0;
        event.clientY = 0;
        view.contentDOM.dispatchEvent(event);
        expect(view.state.doc.toString()).toContain('"cat \\"2\\""');
        expect(view.state.doc.length).toBe(TEXT.length + '"cat \\"2\\""'.length);
        view.destroy();
    });
});
