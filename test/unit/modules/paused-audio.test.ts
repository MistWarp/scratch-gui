import {describe, expect, jest, test} from '@jest/globals';
import {EventEmitter} from 'events';
import {
    RUNTIME_PAUSED,
    RUNTIME_UNPAUSED,
    silenceAudioWhilePaused,
    type PausableAudioEngine
} from '../../../src/modules/paused-audio';

const flush = () => new Promise(resolve => {
    setTimeout(resolve, 0);
});

const makeRuntime = (paused = false, audioEngine: PausableAudioEngine | null = null) => {
    const runtime = Object.assign(new EventEmitter(), {
        isPaused: () => paused,
        audioEngine
    });
    return runtime;
};

const makeEngine = (suspend = jest.fn(() => Promise.resolve())) => ({
    paused: false,
    audioContext: {suspend, resume: jest.fn(() => Promise.resolve())}
});

describe('silenceAudioWhilePaused', () => {
    test('suspends audio when the runtime pauses and resumes it when it unpauses', async () => {
        const engine = makeEngine();
        const runtime = makeRuntime(false, engine);
        silenceAudioWhilePaused(runtime);
        expect(engine.audioContext.suspend).not.toHaveBeenCalled();

        runtime.emit(RUNTIME_PAUSED);
        expect(engine.paused).toBe(true);
        runtime.emit(RUNTIME_UNPAUSED);
        expect(engine.paused).toBe(false);
        await flush();
        expect(engine.audioContext.suspend).toHaveBeenCalledTimes(1);
        expect(engine.audioContext.resume).toHaveBeenCalledTimes(1);
    });

    test('silences a runtime that is already paused, and keeps going after a failed suspend', async () => {
        const engine = makeEngine(jest.fn(() => Promise.reject(new Error('busy'))));
        const runtime = makeRuntime(true, engine);
        silenceAudioWhilePaused(runtime);
        expect(engine.paused).toBe(true);
        runtime.emit(RUNTIME_UNPAUSED);
        await flush();
        expect(engine.audioContext.resume).toHaveBeenCalledTimes(1);
    });

    test('stops following the runtime once removed, and tolerates a runtime without audio', () => {
        const engine = makeEngine();
        const runtime = makeRuntime(false, engine);
        const stop = silenceAudioWhilePaused(runtime);
        stop();
        runtime.emit(RUNTIME_PAUSED);
        expect(engine.paused).toBe(false);
        expect(runtime.listenerCount(RUNTIME_PAUSED)).toBe(0);
        expect(runtime.listenerCount(RUNTIME_UNPAUSED)).toBe(0);

        const silent = makeRuntime();
        silenceAudioWhilePaused(silent);
        expect(() => silent.emit(RUNTIME_PAUSED)).not.toThrow();
    });
});
