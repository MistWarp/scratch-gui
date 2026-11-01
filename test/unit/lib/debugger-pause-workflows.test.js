import {block, loadVm} from '../../helpers/code-mode-fixture.js';

const own = (object, name) => Object.prototype.hasOwnProperty.call(object, name);

const loadPauseModule = () => {
    let pause;
    jest.isolateModules(() => {
        pause = require('../../../src/addons/addons/debugger/module');
    });
    return pause;
};

const quietAudio = vm => {
    const audioContext = {
        suspend: jest.fn(() => Promise.resolve()),
        resume: jest.fn(() => Promise.resolve()),
        currentTime: 0
    };
    vm.runtime.audioEngine = {audioContext, paused: false};
    for (const target of vm.runtime.targets) {
        target.sprite.soundBank = {soundPlayers: {}, setEffects: () => {}, stopAllSounds: () => {}};
    }
    return audioContext;
};

const broadcastBlocks = () => ({
    flag: block('event_whenflagclicked', {next: 'send', topLevel: true, x: 0, y: 0}),
    send: block('event_broadcast', {parent: 'flag', next: 'after', inputs: {BROADCAST_INPUT: [1, [11, 'go', 'go-id']]}}),
    after: block('looks_say', {parent: 'send', inputs: {MESSAGE: [1, [10, 'sent']]}}),
    receive: block('event_whenbroadcastreceived', {
        next: 'heard',
        topLevel: true,
        x: 0,
        y: 200,
        fields: {BROADCAST_OPTION: ['go', 'go-id']}
    }),
    heard: block('looks_say', {parent: 'receive', inputs: {MESSAGE: [1, [10, 'heard']]}})
});

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('debugger pause', () => {
    let vm;
    let pause;
    let audioContext;

    beforeEach(async () => {
        let stage;
        ({vm, stage} = await loadVm({spriteBlocks: broadcastBlocks()}));
        stage.createVariable('go-id', 'go', 'broadcast_msg');
        vm.setCompilerOptions({enabled: false});
        audioContext = quietAudio(vm);
        pause = loadPauseModule();
        pause.setup({tab: {traps: {vm}}});
    });

    afterEach(() => vm.quit());

    test('pauses through the runtime without replacing runtime methods', () => {
        for (const name of ['_step', 'greenFlag', 'stopAll', 'startHats', '_getMonitorThreadCount']) {
            expect(own(vm.runtime, name)).toBe(false);
        }
        expect(own(vm.runtime.sequencer, 'stepThreads')).toBe(false);

        pause.setPaused(true);
        expect(vm.runtime.isPaused()).toBe(true);
        expect(pause.isPaused()).toBe(true);

        vm.setPaused(false);
        expect(pause.isPaused()).toBe(false);
    });

    test('stopping the project also clears debugger pause', () => {
        const changes = [];
        pause.onPauseChanged(paused => changes.push(paused));
        pause.setPaused(true);

        vm.runtime.stopAll();

        expect(pause.isPaused()).toBe(false);
        expect(vm.runtime.ioDevices.clock._paused).toBe(false);
        expect(changes).toEqual([true, false]);
    });

    test('pausing freezes the timer and silences audio until resumed', async () => {
        pause.setPaused(true);
        await flushPromises();
        expect(vm.runtime.ioDevices.clock._paused).toBe(true);
        expect(vm.runtime.audioEngine.paused).toBe(true);
        expect(audioContext.suspend).toHaveBeenCalledTimes(1);

        pause.setPaused(false);
        await flushPromises();
        expect(vm.runtime.ioDevices.clock._paused).toBe(false);
        expect(vm.runtime.audioEngine.paused).toBe(false);
        expect(audioContext.resume).toHaveBeenCalledTimes(1);
    });

    test('pause and step listeners can be removed', () => {
        const changed = jest.fn();
        const stepped = jest.fn();
        const removeChanged = pause.onPauseChanged(changed);
        const removeStepped = pause.onSingleStep(stepped);
        pause.setPaused(true);
        pause.singleStep();
        expect(changed).toHaveBeenCalledTimes(1);
        expect(stepped).toHaveBeenCalledTimes(1);

        removeChanged();
        removeStepped();
        pause.singleStep();
        pause.setPaused(false);
        expect(changed).toHaveBeenCalledTimes(1);
        expect(stepped).toHaveBeenCalledTimes(1);
    });

    test('single stepping holds the threads a stepped block starts, and resuming runs them', () => {
        vm.greenFlag();
        pause.setPaused(true);
        const flagThread = vm.runtime.threads.find(thread => thread.topBlock === 'flag');
        expect(vm.runtime.getPausedThreadState(flagThread)).not.toBeNull();

        pause.singleStep();
        expect(pause.getRunningThread()).toBe(flagThread);
        for (let steps = 0; steps < 5 && flagThread.peekStack() !== 'after'; steps++) {
            expect(vm.runtime.threads.some(thread => thread.topBlock === 'receive')).toBe(false);
            pause.singleStep();
        }
        expect(flagThread.peekStack()).toBe('after');

        const receiver = vm.runtime.threads.find(thread => thread.topBlock === 'receive');
        expect(receiver).toBeDefined();
        expect(vm.runtime.getPausedThreadState(receiver)).not.toBeNull();
        expect(receiver.status).toBe(1);

        const heldAt = receiver.peekStack();
        vm.runtime._step();
        expect(receiver.peekStack()).toBe(heldAt);
        expect(vm.runtime.threads).toContain(receiver);

        pause.setPaused(false);
        vm.runtime._step();
        expect(vm.runtime.threads.some(thread => thread.topBlock === 'receive')).toBe(false);
    });

    test('while paused the green flag still unpauses and starts the project', () => {
        pause.setPaused(true);
        vm.greenFlag();
        expect(pause.isPaused()).toBe(false);
        expect(vm.runtime.threads.some(thread => thread.topBlock === 'flag')).toBe(true);
    });
});
