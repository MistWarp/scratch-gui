import {loadVm} from '../../helpers/code-mode-fixture.js';
import RenderedTarget from 'scratch-vm/src/sprites/rendered-target';
import initDebugger from '../../../src/lib/debugger/controller.js';

jest.mock('../../../src/lib/debugger/blocks.js', () => jest.fn());

describe('debugger controller', () => {
    let vm;

    beforeEach(async () => {
        ({vm} = await loadVm());
    });

    afterEach(() => vm.quit());

    test('after-step callbacks are runtime step listeners that can be removed', () => {
        const controller = initDebugger(vm);
        expect(initDebugger(vm)).toBe(controller);
        expect(Object.prototype.hasOwnProperty.call(vm.runtime, '_step')).toBe(false);

        const first = jest.fn();
        const second = jest.fn();
        const removeFirst = controller.addAfterStepCallback(first);
        const removeSecond = controller.addAfterStepCallback(second);
        vm.runtime._step();
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);

        removeFirst();
        removeFirst();
        vm.runtime._step();
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(2);

        removeSecond();
        vm.runtime._step();
        expect(second).toHaveBeenCalledTimes(2);
        expect(vm.runtime._afterStepListeners).toBeNull();
    });
});

describe('debugger blocks', () => {
    let vm;
    let handlers;
    let makeClone;

    beforeEach(async () => {
        makeClone = RenderedTarget.prototype.makeClone;
        const settings = jest.requireActual('../../../src/lib/debugger/settings.js');
        jest.spyOn(settings, 'getSetting').mockReturnValue(true);
        const registerDebuggerBlocks = jest.requireActual('../../../src/lib/debugger/blocks.js').default;
        window.__mwDebuggerBlocklyPatched = true;
        ({vm} = await loadVm());
        handlers = {onLog: jest.fn(), onBreakpoint: jest.fn(), onClearLogs: jest.fn()};
        registerDebuggerBlocks(vm, handlers);
    });

    afterEach(() => {
        vm.quit();
        delete window.__mwDebuggerBlocklyPatched;
        jest.restoreAllMocks();
    });

    const logged = () => handlers.onLog.mock.calls.map(call => [call[0], call[2]]);

    test('logs through runtime events without replacing runtime or target methods', () => {
        const sprite = vm.runtime.targets.find(target => !target.isStage);
        for (const name of ['greenFlag', 'startHats']) {
            expect(Object.prototype.hasOwnProperty.call(vm.runtime, name)).toBe(false);
        }
        expect(Object.getPrototypeOf(sprite)).toBe(RenderedTarget.prototype);
        expect(RenderedTarget.prototype.makeClone).toBe(makeClone);
    });

    test('logs the green flag and clears the log first', () => {
        vm.greenFlag();
        expect(handlers.onClearLogs).toHaveBeenCalledTimes(1);
        expect(logged()).toContainEqual(['Green flag clicked', 'internal']);
    });

    test('logs broadcasts, created clones and clones refused by the limit', () => {
        vm.runtime.startHats('event_whenbroadcastreceived', {BROADCAST_OPTION: 'hello'});
        const sprite = vm.runtime.targets.find(target => !target.isStage && target.getName() === 'Sprite1');
        expect(sprite.makeClone()).not.toBeNull();
        vm.runtime.clonesAvailable = () => false;
        expect(sprite.makeClone()).toBeNull();
        expect(logged()).toEqual([
            ['Broadcasted "hello"', 'internal'],
            ['Created clone of "Sprite1"', 'internal'],
            ['Failed to create clone of "Sprite1" because there are too many clones', 'internal-warn']
        ]);
    });
});
