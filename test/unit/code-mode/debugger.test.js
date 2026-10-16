import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {block, loadVm} from '../../helpers/code-mode-fixture.js';
import {emitTarget, opcodeTable} from '../../../src/lib/code-mode/fractch-adapter.js';
import {blockIdAtLine} from '../../../src/lib/code-mode/debug-bridge.js';
import {
    codeDebugExtension,
    formatValue,
    resolveVariables,
    setBreakpointLines,
    setPausedLine,
    variableNameAt
} from '../../../src/lib/code-mode/debug-extension.js';
import {
    installBreakpoints,
    isPaused,
    listBreakpoints,
    pausedLocals,
    pausedLocation,
    setPaused,
    singleStep,
    toggleBreakpoint
} from '../../../src/lib/debugger/breakpoints.js';

const setVar = (id, next, parent, variable, value) => block('data_setvariableto', {
    next,
    parent,
    inputs: {VALUE: [1, [10, value]]},
    fields: {VARIABLE: variable}
});

const debugBlocks = () => ({
    hat: block('event_whenflagclicked', {next: 'set', topLevel: true, x: 0, y: 0}),
    set: setVar('set', 'temp', 'hat', ['lives', 'v2'], '1'),
    temp: setVar('temp', 'change', 'set', ['!local_ab_temp', 'loc'], 'x'),
    change: block('data_changevariableby', {
        next: 'say',
        parent: 'temp',
        inputs: {VALUE: [1, [4, '1']]},
        fields: {VARIABLE: ['lives', 'v2']}
    }),
    say: block('looks_say', {parent: 'change', inputs: {MESSAGE: [1, [10, 'hi']]}})
});

const quietAudio = vm => {
    const audioContext = {suspend: () => Promise.resolve(), resume: () => Promise.resolve(), currentTime: 0};
    vm.runtime.audioEngine = {audioContext};
    for (const target of vm.runtime.targets) {
        if (!target.sprite.soundBank) {
            target.sprite.soundBank = {
                soundPlayers: {},
                setEffects: () => {},
                stopAllSounds: () => {}
            };
        }
    }
};

describe('core breakpoints', () => {
    let vm;
    let sprite;
    let text;
    let sourceMap;

    beforeAll(async () => {
        ({vm, sprite} = await loadVm({spriteBlocks: debugBlocks()}));
        sprite.createVariable('loc', '!local_ab_temp', '');
        quietAudio(vm);
        vm.runtime.currentStepTime = 1000 / 30;
        installBreakpoints(vm);
        ({text, sourceMap} = emitTarget(vm.getFractchContext(), sprite.id, {opcodes: opcodeTable}));
    });

    afterAll(() => vm.quit());

    const lives = () => Number(sprite.lookupVariableById('v2').value);

    test('a gutter line maps to the block that starts on it', () => {
        const doc = EditorState.create({doc: text}).doc;
        const line = doc.line(text.slice(0, text.indexOf('lives += 1')).split('\n').length);
        expect(blockIdAtLine(sourceMap, doc, line.from)).toBe('change');
        const closing = doc.line(doc.lines - 1);
        expect(closing.text.trim()).toBe('}');
        expect(blockIdAtLine(sourceMap, doc, closing.from)).toBe(null);
    });

    test('the interpreted thread stops before the breakpointed block, steps, and resumes', () => {
        expect(toggleBreakpoint('change')).toBe(true);
        expect(listBreakpoints()).toEqual(['change']);
        vm.greenFlag();
        expect(vm.runtime.threads[0].isCompiled).toBe(false);
        vm.runtime._step();
        expect(isPaused()).toBe(true);
        expect(pausedLocation()).toMatchObject({
            targetId: sprite.id,
            blockId: 'change',
            topId: 'hat',
            compiled: false,
            compilerOnly: false
        });
        expect(lives()).toBe(1);
        expect(pausedLocals().map(item => [item.name, item.variable.value])).toEqual([['temp', 'x']]);
        vm.runtime._step();
        expect(lives()).toBe(1);
        singleStep();
        expect(lives()).toBe(2);
        expect(pausedLocation().blockId).toBe('say');
        setPaused(false);
        expect(isPaused()).toBe(false);
        expect(toggleBreakpoint('change')).toBe(false);
        expect(vm.runtime.breakpoints).toBe(null);
    });
});

describe('variable values in text', () => {
    test('finds identifiers and vars["..."] but not calls, members or strings', () => {
        const doc = 'say score;\nvars["Fancy Name"] = 1;\nfoo(1);\nsay "score";\npen.clear();';
        expect(variableNameAt(doc, doc.indexOf('score') + 2)).toMatchObject({name: 'score', global: false});
        expect(variableNameAt(doc, doc.indexOf('Fancy'))).toMatchObject({name: 'Fancy Name', global: true});
        expect(variableNameAt(doc, doc.indexOf('foo'))).toBe(null);
        expect(variableNameAt(doc, doc.indexOf('"score"') + 2)).toBe(null);
        expect(variableNameAt(doc, doc.indexOf('clear'))).toBe(null);
    });

    test('formats values and lists', () => {
        expect(formatValue('hi', '')).toBe('"hi"');
        expect(formatValue(3, '')).toBe('3');
        expect(formatValue(['a', 2], 'list')).toBe('(2) ["a", "2"]');
    });

    test('script locals shadow globals unless vars["..."] is used', async () => {
        const {vm, sprite} = await loadVm();
        const local = {id: 'l', name: '!local_ab_score', type: '', value: 9};
        const symbol = {name: 'score', global: false};
        expect(resolveVariables(sprite, symbol, [{name: 'score', variable: local}])).toEqual([local]);
        expect(resolveVariables(sprite, {...symbol, global: true}, [{name: 'score', variable: local}])
            .map(variable => variable.value)).toEqual([3]);
        expect(resolveVariables(sprite, {name: 'lives', global: false}, []).map(variable => variable.value))
            .toEqual([5]);
        vm.quit();
    });
});

describe('breakpoint gutter', () => {
    const TEXT = 'when flag {\n  say "a";\n  move 10;\n}\n';
    const makeView = onToggleBreakpoint => {
        const parent = document.createElement('div');
        document.body.appendChild(parent);
        return new EditorView({
            parent,
            state: EditorState.create({
                doc: TEXT,
                extensions: codeDebugExtension({
                    callbacks: {current: {onToggleBreakpoint, watchItemsAt: () => null}},
                    classes: {breakpoint: 'bp', breakpointGutter: 'bp-gutter', pausedLine: 'paused'},
                    labels: {list: 'list', pin: 'Pin'}
                })
            })
        });
    };

    const markers = view => Array.from(view.dom.querySelectorAll('.bp-gutter .bp'))
        .filter(node => node.parentNode.style.visibility !== 'hidden');

    test('markers and the paused line follow the positions they are given', () => {
        const view = makeView(() => {});
        setBreakpointLines(view, [TEXT.indexOf('say'), TEXT.indexOf('move')]);
        expect(markers(view)).toHaveLength(2);
        setPausedLine(view, TEXT.indexOf('move'));
        expect(view.dom.querySelector('.paused').textContent).toBe('  move 10;');
        view.dispatch({changes: {from: 0, insert: '\n'}});
        expect(view.dom.querySelector('.paused').textContent).toBe('  move 10;');
        setPausedLine(view, null);
        expect(view.dom.querySelector('.paused')).toBe(null);
        view.destroy();
    });

    test('clicking the gutter reports the line', () => {
        const calls = [];
        const view = makeView((_view, from) => calls.push(from));
        setBreakpointLines(view, [TEXT.indexOf('move')]);
        markers(view)[0].parentNode.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
        expect(calls).toHaveLength(1);
        view.destroy();
    });
});
