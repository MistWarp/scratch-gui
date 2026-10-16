import reducer, {
    MAX_OUTPUT,
    addExtensionOutput,
    addRuntimeProblems,
    addScriptProblems,
    clearRuntimeProblems,
    clearScriptProblemsFor,
    countAllProblems,
    countProblems,
    extensionDevInitialState,
    resetExtensionDev,
    setLoadProblems,
    setStaticProblems
} from '../../../src/reducers/extension-dev.js';
import {categoryItems, extensionIdForOpcode} from '../../../src/lib/extension-dev/workspace-menus.js';

const runtimeProblem = (overrides = {}) => ({
    extensionId: 'demo',
    kind: 'block',
    opcode: 'greet',
    blockId: 'b1',
    message: 'boom',
    count: 1,
    severity: 'error',
    ...overrides
});

describe('extension dev reducer', () => {
    test('merges repeated runtime problems into one entry with a count', () => {
        let state = reducer(undefined, addRuntimeProblems([runtimeProblem()]));
        state = reducer(state, addRuntimeProblems([runtimeProblem({count: 3})]));
        expect(state.runtimeProblems.demo).toHaveLength(1);
        expect(state.runtimeProblems.demo[0].count).toBe(4);
    });

    test('keeps different blocks as separate problems', () => {
        const state = reducer(undefined, addRuntimeProblems([
            runtimeProblem(),
            runtimeProblem({blockId: 'b2'})
        ]));
        expect(state.runtimeProblems.demo).toHaveLength(2);
    });

    test('caps runtime problems per extension and counts the hidden ones', () => {
        const problems = [];
        for (let i = 0; i < 105; i++) problems.push(runtimeProblem({blockId: `b${i}`}));
        const state = reducer(undefined, addRuntimeProblems(problems));
        expect(state.runtimeProblems.demo).toHaveLength(100);
        expect(state.hiddenRuntimeProblems.demo).toBe(5);
    });

    test('a block keeps one runtime entry with the latest message', () => {
        let state = reducer(undefined, addRuntimeProblems([runtimeProblem()]));
        state = reducer(state, addRuntimeProblems([runtimeProblem({message: 'later'})]));
        expect(state.runtimeProblems.demo).toHaveLength(1);
        expect(state.runtimeProblems.demo[0].message).toBe('later');
        state = reducer(state, clearRuntimeProblems('demo'));
        expect(state.runtimeProblems.demo).toBeUndefined();
    });

    test('script runtime entries are keyed by target and top block and cleared per script or target', () => {
        let state = reducer(undefined, addScriptProblems([
            {targetId: 's', topId: 'a', message: 'x'},
            {targetId: 's', topId: 'a', message: 'y'},
            {targetId: 's', topId: 'b', message: 'z'}
        ]));
        expect(state.scriptProblems.s.map(item => [item.topId, item.count])).toEqual([['a', 2], ['b', 1]]);
        state = reducer(state, clearScriptProblemsFor('s', 'a'));
        expect(state.scriptProblems.s.map(item => item.topId)).toEqual(['b']);
        state = reducer(state, clearScriptProblemsFor('s'));
        expect(state.scriptProblems.s).toBeUndefined();
    });

    test('output is capped', () => {
        const entries = [];
        for (let i = 0; i < MAX_OUTPUT + 5; i++) entries.push({id: i, level: 'log', text: String(i)});
        const state = reducer(undefined, addExtensionOutput(entries));
        expect(MAX_OUTPUT).toBe(2000);
        expect(state.output).toHaveLength(MAX_OUTPUT);
        expect(state.output[0].id).toBe(5);
    });

    test('counts errors and warnings across lint, load and runtime problems', () => {
        let state = reducer(undefined, setStaticProblems('demo', [
            {severity: 'warning', message: 'w'},
            {severity: 'info', message: 'i'}
        ]));
        state = reducer(state, setLoadProblems('demo', [{severity: 'error', message: 'e'}]));
        state = reducer(state, addRuntimeProblems([runtimeProblem()]));
        expect(countProblems(state, 'demo')).toEqual({errors: 2, warnings: 1, total: 3});
        expect(countAllProblems(state)).toBe(2);
    });

    test('reset clears every problem and bumps the generation', () => {
        let state = reducer(undefined, addRuntimeProblems([runtimeProblem()]));
        state = reducer(state, addScriptProblems([{targetId: 's', topId: 'a', message: 'x'}]));
        state = reducer(state, resetExtensionDev());
        expect(state).toEqual({...extensionDevInitialState, generation: 1});
    });
});

const fakeVM = ({loaded = [], unloaded = [], urls = {}} = {}) => ({
    extensionManager: {
        _loadedExtensions: new Map(loaded.map(id => [id, `unsandboxed.0.${id}`])),
        isCoreExtension: id => ['motion', 'looks', 'control', 'data', 'operators'].includes(id),
        isExtensionLoaded: id => loaded.includes(id),
        isExtensionUnloaded: id => unloaded.includes(id),
        getExtensionURLs: () => urls
    },
    runtime: {_blockInfo: []}
});

describe('extension workspace menus', () => {
    test('maps opcodes to loaded or unloaded extension ids only', () => {
        const vm = fakeVM({loaded: ['demo'], unloaded: ['gone']});
        expect(extensionIdForOpcode(vm, 'demo_greet')).toBe('demo');
        expect(extensionIdForOpcode(vm, 'gone_thing')).toBe('gone');
        expect(extensionIdForOpcode(vm, 'motion_movesteps')).toBeNull();
        expect(extensionIdForOpcode(vm, 'unknown_block')).toBeNull();
        expect(extensionIdForOpcode(vm, 'noprefix')).toBeNull();
    });

    test('maps opcodes of extension ids that contain underscores', () => {
        const vm = fakeVM({loaded: ['my_ext', 'my']});
        expect(extensionIdForOpcode(vm, 'my_ext_double')).toBe('my_ext');
        expect(extensionIdForOpcode(vm, 'my_thing')).toBe('my');
    });

    test('category menu disables editing actions during collaboration', () => {
        const vm = fakeVM({loaded: ['demo'], urls: {demo: 'data:text/javascript,1'}});
        const intl = {formatMessage: message => message.defaultMessage};
        const items = categoryItems({vm, intl, dispatch: () => {}, collaborating: true}, 'demo');
        const enabled = items.filter(item => item.enabled).map(item => item.text);
        expect(enabled).toEqual(['Edit extension']);
        expect(items.map(item => item.text)).toContain('Remove from project...');
    });

    test('category menu is empty for core categories', () => {
        const vm = fakeVM({loaded: ['demo']});
        const intl = {formatMessage: message => message.defaultMessage};
        expect(categoryItems({vm, intl, dispatch: () => {}}, 'motion')).toEqual([]);
    });
});
