import {loadVm} from '../../helpers/code-mode-fixture.js';
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
    test('green flag logging follows PROJECT_START instead of replacing greenFlag', async () => {
        const settings = jest.requireActual('../../../src/lib/debugger/settings.js');
        jest.spyOn(settings, 'getSetting').mockImplementation(name =>
            name === 'log_clear_greenflag' || name === 'log_greenflag');
        const registerDebuggerBlocks = jest.requireActual('../../../src/lib/debugger/blocks.js').default;
        window.__mwDebuggerBlocklyPatched = true;
        const {vm} = await loadVm();
        const handlers = {onLog: jest.fn(), onBreakpoint: jest.fn(), onClearLogs: jest.fn()};
        registerDebuggerBlocks(vm, handlers);
        expect(Object.prototype.hasOwnProperty.call(vm.runtime, 'greenFlag')).toBe(false);

        vm.greenFlag();

        expect(handlers.onClearLogs).toHaveBeenCalledTimes(1);
        expect(handlers.onLog).toHaveBeenCalledWith('Green flag clicked', null, 'internal');
        vm.quit();
        delete window.__mwDebuggerBlocklyPatched;
    });
});
