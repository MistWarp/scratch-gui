import VM from 'scratch-vm';
import {block, projectJson} from '../helpers/code-mode-fixture.js';
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

    test('a broadcast received while paused waits for the project to resume', async () => {
        const {vm} = scaffolding;
        pause({scaffolding});
        const project = projectJson({spriteBlocks: {
            hat: block('event_whenbroadcastreceived', {
                next: 'loop', topLevel: true, x: 0, y: 0, fields: {BROADCAST_OPTION: ['go', 'go-id']}
            }),
            loop: block('control_forever', {parent: 'hat', inputs: {SUBSTACK: [2, 'inc']}}),
            inc: block('data_changevariableby', {
                parent: 'loop', inputs: {VALUE: [1, [4, '1']]}, fields: {VARIABLE: ['score', 'v1']}
            })
        }});
        project.targets[0].broadcasts = {'go-id': 'go'};
        const audioEngine = vm.runtime.audioEngine;
        vm.runtime.audioEngine = null;
        vm.runtime.storage = null;
        await vm.loadProject(project);
        vm.runtime.audioEngine = audioEngine;
        const score = () => Number(vm.runtime.getTargetForStage().variables.v1.value);
        const broadcast = () => vm.runtime.startHats('event_whenbroadcastreceived', {BROADCAST_OPTION: 'go'});

        vm.setPaused(true);
        broadcast();
        for (let i = 0; i < 3; i++) vm.runtime._step();
        expect(score()).toBe(3);

        vm.setPaused(false);
        vm.runtime._step();
        const running = score();
        expect(running).toBeGreaterThan(3);

        vm.setPaused(true);
        broadcast();
        for (let i = 0; i < 3; i++) vm.runtime._step();
        expect(score()).toBe(running);
        expect(vm.isPaused()).toBe(true);
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
