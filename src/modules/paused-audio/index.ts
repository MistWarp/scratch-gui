export interface PausableAudioContext {
    suspend: () => Promise<void>;
    resume: () => Promise<void>;
}

export interface PausableAudioEngine {
    paused: boolean;
    audioContext?: PausableAudioContext | null;
}

export interface PausableRuntime {
    isPaused: () => boolean;
    on: (event: string, listener: () => void) => unknown;
    removeListener: (event: string, listener: () => void) => unknown;
    audioEngine?: PausableAudioEngine | null;
}

export const RUNTIME_PAUSED = 'RUNTIME_PAUSED';
export const RUNTIME_UNPAUSED = 'RUNTIME_UNPAUSED';

export const silenceAudioWhilePaused = (runtime: PausableRuntime): (() => void) => {
    let stateChange: Promise<void> = Promise.resolve();
    const follow = (paused: boolean): void => {
        const engine = runtime.audioEngine;
        if (!engine) return;
        engine.paused = paused;
        const context = engine.audioContext;
        if (!context) return;
        stateChange = stateChange
            .then(() => (paused ? context.suspend() : context.resume()))
            .catch(() => undefined);
    };
    const handlePaused = (): void => {
        follow(true);
    };
    const handleUnpaused = (): void => {
        follow(false);
    };
    runtime.on(RUNTIME_PAUSED, handlePaused);
    runtime.on(RUNTIME_UNPAUSED, handleUnpaused);
    if (runtime.isPaused()) follow(true);
    return () => {
        runtime.removeListener(RUNTIME_PAUSED, handlePaused);
        runtime.removeListener(RUNTIME_UNPAUSED, handleUnpaused);
    };
};
