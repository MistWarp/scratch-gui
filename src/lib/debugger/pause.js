import EventTarget from '../../addons/event-target.js';
import {RUNTIME_PAUSED, RUNTIME_UNPAUSED, silenceAudioWhilePaused} from '../../modules/paused-audio';

const STATUS_RUNNING = 0;
const STATUS_PROMISE_WAIT = 1;
const STATUS_YIELD = 2;
const STATUS_YIELD_TICK = 3;
const STATUS_DONE = 4;

let vm = null;

let steppingThread = null;

const eventTarget = new EventTarget();

export const isPaused = () => Boolean(vm && vm.runtime.isPaused());

const pausedState = thread => vm.runtime.getPausedThreadState(thread);

const holdThreadsStartedBy = run => {
    const runtime = vm.runtime;
    const existing = new Set(runtime.threads);
    try {
        return run();
    } finally {
        for (const thread of runtime.threads) {
            if (!existing.has(thread)) runtime.pauseThread(thread);
        }
    }
};

const compensateForTimePassedWhilePaused = (thread, pauseState) => {
    const elapsed = vm.runtime.currentMSecs - pauseState.time;
    if (thread.timer) {
        thread.timer.startTime += elapsed;
    }
    if (thread.compatibilityStackFrame && thread.compatibilityStackFrame.timer) {
        thread.compatibilityStackFrame.timer.startTime += elapsed;
    }
    const stackFrame = thread.peekStackFrame();
    if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
        stackFrame.executionContext.timer.startTime += elapsed;
    }
};

const getThreadIndex = thread => {
    if (!thread) return -1;
    return vm.runtime.threads.findIndex(
        otherThread =>
            otherThread.target === thread.target &&
            otherThread.topBlock === thread.topBlock &&
            otherThread.stackClick === thread.stackClick &&
            otherThread.updateMonitor === thread.updateMonitor
    );
};

const stepUnsteppedThreads = lastSteppedThread => {
    const threads = vm.runtime.threads;
    const startingIndex = getThreadIndex(lastSteppedThread);
    if (startingIndex !== -1) {
        for (let i = startingIndex; i < threads.length; i++) {
            const thread = threads[i];
            const status = thread.status;
            if (status === STATUS_RUNNING || status === STATUS_YIELD || status === STATUS_YIELD_TICK) {
                vm.runtime.sequencer.activeThread = thread;
                vm.runtime.sequencer.stepThread(thread);
            }
        }
    }
};

const followActiveThread = () => {
    const activeThread = vm.runtime.sequencer.activeThread;
    if (activeThread) {
        steppingThread = activeThread;
        eventTarget.dispatchEvent(new CustomEvent('step'));
    }
};

const handleRuntimePaused = () => {
    eventTarget.dispatchEvent(new CustomEvent('change'));
    followActiveThread();
};

const handleRuntimeUnpaused = () => {
    steppingThread = null;
    eventTarget.dispatchEvent(new CustomEvent('change'));
};

export const setPaused = paused => {
    if (!vm) return;
    const runtime = vm.runtime;
    if (paused) {
        if (!runtime.isPaused()) {
            runtime.setPaused(true);
            return;
        }
        for (const thread of runtime.threads) runtime.pauseThread(thread);
        followActiveThread();
        return;
    }
    if (!runtime.isPaused()) return;
    for (const thread of runtime.threads) {
        if (pausedState(thread)) thread.breakpointBlock = thread.isCompiled ? thread.topBlock : thread.peekStack();
    }
    const lastSteppedThread = steppingThread;
    runtime.setPaused(false);
    stepUnsteppedThreads(lastSteppedThread);
};

export const onPauseChanged = listener => {
    const handleChange = () => listener(isPaused());
    eventTarget.addEventListener('change', handleChange);
    return () => eventTarget.removeEventListener('change', handleChange);
};

export const onSingleStep = listener => {
    eventTarget.addEventListener('step', listener);
    return () => eventTarget.removeEventListener('step', listener);
};

export const getRunningThread = () => steppingThread;

const singleStepThread = thread => {
    if (thread.status === STATUS_DONE) {
        return false;
    }
    if (thread.isCompiled) {
        return false;
    }

    const currentBlockId = thread.peekStack();
    if (!currentBlockId) {
        thread.popStack();

        if (thread.stack.length === 0) {
            thread.status = STATUS_DONE;
            return false;
        }
    }

    vm.runtime.sequencer.activeThread = thread;

    const specialError = ['special error used by Scratch Addons for implementing single-stepping'];
    Object.defineProperty(thread, 'blockGlowInFrame', {
        set () {
            throw specialError;
        }
    });

    try {
        thread.status = STATUS_RUNNING;

        if (thread.warpTimer) {
            thread.warpTimer.start();
        }

        try {
            holdThreadsStartedBy(() => vm.runtime.sequencer.stepThread(thread));
        } catch (err) {
            if (err !== specialError) throw err;
        }

        if (thread.status !== STATUS_RUNNING) {
            return false;
        }

        if (thread.peekStack() === currentBlockId) {
            thread.goToNextBlock();
        }

        while (!thread.peekStack()) {
            thread.popStack();

            if (thread.stack.length === 0) {
                thread.status = STATUS_DONE;
                return false;
            }

            const stackFrame = thread.peekStackFrame();

            if (stackFrame.isLoop) {
                if (thread.peekStackFrame().warpMode) {
                    continue;
                } else {
                    return false;
                }
            } else if (stackFrame.waitingReporter) {
                return false;
            }

            thread.goToNextBlock();
        }

        return true;
    } finally {
        vm.runtime.sequencer.activeThread = null;
        Object.defineProperty(thread, 'blockGlowInFrame', {
            value: currentBlockId,
            configurable: true,
            enumerable: true,
            writable: true
        });

        if (thread.status !== STATUS_DONE) {
            thread.status = STATUS_PROMISE_WAIT;
        }
    }
};

const getRealStatus = thread => {
    const pauseState = pausedState(thread);
    if (pauseState) {
        return pauseState.status;
    }
    return thread.status;
};

const findNewSteppingThread = startingIndex => {
    const threads = vm.runtime.threads;
    for (let i = startingIndex; i < threads.length; i++) {
        const possibleNewThread = threads[i];
        if (possibleNewThread.updateMonitor) {
            continue;
        }
        if (possibleNewThread.isCompiled) {
            continue;
        }
        const status = getRealStatus(possibleNewThread);
        if (status === STATUS_RUNNING || status === STATUS_YIELD || status === STATUS_YIELD_TICK) {
            vm.runtime.pauseThread(possibleNewThread);
            return possibleNewThread;
        }
    }
    return null;
};

const advanceOneFrame = () => {
    const runtime = vm.runtime;
    runtime.ioDevices.clock._pausedTime += runtime.currentStepTime;
    const audioContext = runtime.audioEngine && runtime.audioEngine.audioContext;
    for (const target of runtime.targets) {
        const soundBank = target.sprite.soundBank;
        if (!audioContext || !soundBank) continue;
        for (const soundId of Object.keys(soundBank.soundPlayers)) {
            const soundPlayer = soundBank.soundPlayers[soundId];
            if (soundPlayer.outputNode) {
                soundPlayer.outputNode.stop(audioContext.currentTime);
                soundPlayer._createSource();
                soundPlayer.outputNode.start(
                    audioContext.currentTime,
                    audioContext.currentTime - soundPlayer.startingUntil + (runtime.currentStepTime / 1000)
                );
                soundPlayer.startingUntil -= runtime.currentStepTime / 1000;
            }
        }
    }
    for (const thread of runtime.threads) {
        const pauseState = pausedState(thread);
        if (pauseState) pauseState.time += runtime.currentStepTime;
    }
    holdThreadsStartedBy(() => {
        const hats = runtime._hats;
        for (const hatType in hats) {
            if (!Object.prototype.hasOwnProperty.call(hats, hatType)) continue;
            if (hats[hatType].edgeActivated) runtime.startHats(hatType);
        }
    });
};

export const singleStep = () => {
    if (!isPaused()) return;
    if (steppingThread) {
        const pauseState = pausedState(steppingThread);
        if (pauseState) {
            compensateForTimePassedWhilePaused(steppingThread, pauseState);
            pauseState.time = vm.runtime.currentMSecs;
        }

        const continueExecuting = singleStepThread(steppingThread);

        if (!continueExecuting) {
            steppingThread = findNewSteppingThread(getThreadIndex(steppingThread) + 1);
        }
    }

    if (!steppingThread) {
        steppingThread = findNewSteppingThread(0);
        advanceOneFrame();
    }

    eventTarget.dispatchEvent(new CustomEvent('step'));
};

export const setup = _vm => {
    if (vm) {
        return;
    }

    vm = _vm;
    vm.runtime.on(RUNTIME_PAUSED, handleRuntimePaused);
    vm.runtime.on(RUNTIME_UNPAUSED, handleRuntimeUnpaused);
    silenceAudioWhilePaused(vm.runtime);
};
