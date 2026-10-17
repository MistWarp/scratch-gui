import VM from 'scratch-vm';
import {
    applyExtensionSource,
    extensionImpact,
    redoExtensionApply,
    undoExtensionApply
} from '../../../src/lib/code-mode/extension-apply.js';
import {clearCodeHistory, latestRedo, latestUndo} from '../../../src/lib/code-mode/code-history.js';
import {runUnsandboxed} from '../../../src/lib/extension-dev/actions.js';

const makeTarget = (name, blocks) => ({
    isOriginal: true,
    isStage: false,
    getName: () => name,
    blocks: {_blocks: blocks}
});

const fakeVm = ({mode = 'iframe', source = 'v1', diff = null} = {}) => {
    const state = {source, mode};
    const manager = {
        getExtensionSource: jest.fn(() => Promise.resolve(state.source)),
        getExtensionMode: jest.fn(() => state.mode),
        reloadExtension: jest.fn(async (id, next, options) => {
            if (options && options.confirm && diff) {
                const ok = await options.confirm(diff);
                if (ok !== true) throw new Error('The reload was cancelled.');
            }
            if (options && options.mode) state.mode = options.mode;
            state.source = next;
            return {ids: [id], removed: [], added: [], changed: []};
        }),
        requestUnsandboxedAllowance: jest.fn(() => Promise.resolve(true))
    };
    const vm = {
        extensionManager: manager,
        runtime: {
            targets: [
                makeTarget('Sprite1', {a: {opcode: 'myext_double'}, b: {opcode: 'myext_double'}}),
                makeTarget('Sprite2', {c: {opcode: 'myext_double'}, d: {opcode: 'motion_movesteps'}})
            ],
            emitProjectChanged: () => {}
        }
    };
    return {vm, state, manager};
};

const removedDiff = {ids: ['myext'], removed: ['myext_double'], added: [], changed: [], details: {}};

beforeEach(() => clearCodeHistory());

describe('extension apply gates', () => {
    test('a removed opcode the project uses is counted by blocks and sprites', () => {
        const {vm} = fakeVm();
        expect(extensionImpact(vm, removedDiff)).toEqual([{
            opcode: 'myext_double',
            label: 'myext.double',
            kind: 'removed',
            blocks: 3,
            targets: ['Sprite1', 'Sprite2']
        }]);
    });

    test('a changed opcode only counts when its argument names or order change', () => {
        const {vm} = fakeVm();
        const diff = (before, after) => ({removed: [],
            changed: ['myext_double'],
            details: {myext_double: {before, after}}});
        const one = {text: 'double [N]', arguments: {N: {}}};
        expect(extensionImpact(vm, diff(one, {...one, blockType: 'reporter'}))).toEqual([]);
        expect(extensionImpact(vm, diff(one, {text: 'double [X]', arguments: {X: {}}}))[0].kind).toBe('changed');
        expect(extensionImpact(vm, diff({text: '[A] [B]', arguments: {A: {}, B: {}}},
            {text: '[B] [A]', arguments: {A: {}, B: {}}}))).toHaveLength(1);
    });

    test('the impact modal decides whether the reload commits', async () => {
        const {vm, state} = fakeVm({diff: removedDiff});
        const confirm = jest.fn(() => Promise.resolve(false));
        await expect(applyExtensionSource({vm, id: 'myext', source: 'v2', confirm})).rejects.toThrow(/cancelled/);
        expect(confirm).toHaveBeenCalledWith([expect.objectContaining({label: 'myext.double', blocks: 3})]);
        expect(state.source).toBe('v1');
        expect(latestUndo(null)).toBeNull();
        confirm.mockImplementation(() => Promise.resolve(true));
        await applyExtensionSource({vm, id: 'myext', source: 'v2', confirm});
        expect(state.source).toBe('v2');
    });

    test('collaboration refuses an extension apply', async () => {
        const {vm} = fakeVm();
        vm.editingCommands = {handler: () => {}};
        await expect(applyExtensionSource({vm, id: 'myext', source: 'v2'})).rejects.toThrow(/collaboration/);
    });
});

describe('extension history', () => {
    test('undo and redo restore the source through reloadExtension', async () => {
        const {vm, state} = fakeVm();
        await applyExtensionSource({vm, id: 'myext', source: 'v2'});
        const entry = latestUndo(null);
        expect(entry).toMatchObject({kind: 'extension', extensionId: 'myext', mode: 'iframe', targetId: null});
        expect(latestUndo('sprite-target')).toBeNull();
        expect((await undoExtensionApply({vm, entry})).status).toBe('committed');
        expect(state.source).toBe('v1');
        expect((await redoExtensionApply({vm, entry: latestRedo(null)})).status).toBe('committed');
        expect(state.source).toBe('v2');
    });

    test('undo is refused when the loaded source changed since the apply', async () => {
        const {vm, state} = fakeVm();
        await applyExtensionSource({vm, id: 'myext', source: 'v2'});
        state.source = 'edited elsewhere';
        const result = await undoExtensionApply({vm, entry: latestUndo(null)});
        expect(result).toMatchObject({status: 'refused', reason: 'extensionChanged'});
        expect(state.source).toBe('edited elsewhere');
    });

    test('undo is refused when the worker mode changed since the apply', async () => {
        const {vm, state} = fakeVm();
        await applyExtensionSource({vm, id: 'myext', source: 'v2'});
        const entry = latestUndo(null);
        state.mode = 'unsandboxed';
        expect(await undoExtensionApply({vm, entry})).toMatchObject({status: 'refused'});
        expect(state.source).toBe('v2');
    });

    test('drop, edit, go unsandboxed, undo: the old source never runs unsandboxed', async () => {
        const {vm, state, manager} = fakeVm();
        await applyExtensionSource({vm, id: 'myext', source: 'v2'});
        const editEntry = latestUndo(null);
        const ok = await runUnsandboxed({
            vm,
            dispatch: () => {},
            intl: {formatMessage: message => message.defaultMessage},
            messages: require('../../../src/components/extension-dev/messages.js').default,
            entry: {id: 'myext', name: 'My Ext', kind: 'embedded', mode: 'iframe'},
            fileName: 'myext.js'
        });
        expect(ok).toBe(true);
        expect(manager.requestUnsandboxedAllowance).toHaveBeenCalledWith('myext', 'v2', 'myext.js');
        expect(state.mode).toBe('unsandboxed');
        expect(latestUndo(null)).toBeNull();
        expect(await undoExtensionApply({vm, entry: editEntry})).toMatchObject({status: 'refused'});
        expect(state.source).toBe('v2');
    });
});

describe('unsandboxed from file', () => {
    test('a mode change without the prompt allowance is refused by the VM', async () => {
        const vm = new VM();
        const manager = vm.extensionManager;
        manager._loadedExtensions.set('myext', 'extension.0.myext');
        manager.workerURLs[0] = 'data:application/javascript,1';
        manager._workerModes[0] = 'iframe';
        await expect(manager.reloadExtension('myext', '1', {mode: 'unsandboxed'})).rejects.toThrow(/not allowed/);
        expect(await manager.requestUnsandboxedAllowance('myext', '1', 'myext.js')).toBe(false);
        await expect(manager.reloadExtension('myext', '1', {mode: 'unsandboxed'})).rejects.toThrow(/not allowed/);
        manager.securityManager.canRunUnsandboxedFromFile = () => Promise.resolve(true);
        expect(await manager.requestUnsandboxedAllowance('myext', '1', 'myext.js')).toBe(true);
        await expect(manager.reloadExtension('myext', 'other source', {mode: 'unsandboxed'}))
            .rejects.toThrow(/not allowed/);
        vm.quit();
    });
});
