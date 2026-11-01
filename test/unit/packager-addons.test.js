import VM from 'scratch-vm';
import pause from '../../src/packager/addons/pause.js';
import pointerlock from '../../src/packager/addons/pointerlock.js';

const makeScaffolding = () => {
    const vm = new VM();
    vm.runtime.audioEngine = {
        paused: false,
        audioContext: {suspend: jest.fn(() => Promise.resolve()), resume: jest.fn(() => Promise.resolve())}
    };
    return {
        vm,
        _canvas: document.createElement('canvas'),
        layersRect: {width: 480, height: 360},
        addEventListener: jest.fn()
    };
};

describe('packager addons', () => {
    let scaffolding;

    beforeEach(() => {
        scaffolding = makeScaffolding();
    });

    afterEach(() => scaffolding.vm.quit());

    test('the pause button uses the runtime pause and reports it', () => {
        const {vm} = scaffolding;
        pause({scaffolding});
        expect(Object.prototype.hasOwnProperty.call(vm, 'setPaused')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(vm.runtime, 'startHats')).toBe(false);
        const reports = [];
        const stops = jest.fn();
        vm.on('P4_PAUSE', paused => reports.push(paused));
        vm.runtime.on('PROJECT_RUN_STOP', stops);

        vm.setPaused(true);
        expect(vm.isPaused()).toBe(true);
        expect(vm.runtime.ioDevices.clock._paused).toBe(true);
        expect(vm.runtime.audioEngine.paused).toBe(true);
        expect(stops).toHaveBeenCalledTimes(1);

        vm.setPaused(false);
        vm.setPaused(true);
        vm.stopAll();
        expect(vm.isPaused()).toBe(false);
        expect(reports).toEqual([true, false, true, false]);
    });

    test('pointer lock recentres the mouse after every step without replacing the step', () => {
        const {vm} = scaffolding;
        pointerlock({scaffolding});
        expect(Object.prototype.hasOwnProperty.call(vm.runtime, '_step')).toBe(false);
        const mouse = vm.runtime.ioDevices.mouse;
        vm.pointerLockMove(30, 10);
        expect(mouse._clientX).toBe(30);
        vm.runtime._step();
        expect(mouse._clientX).toBe(240);
        expect(mouse._clientY).toBe(180);
        expect(mouse._scratchX).toBe(0);
    });
});
