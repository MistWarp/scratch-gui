import EventTarget from '../../addons/event-target.js';

const STATUS_RUNNING = 0;
const STATUS_PROMISE_WAIT = 1;
const STATUS_YIELD = 2;
const STATUS_YIELD_TICK = 3;
const STATUS_DONE = 4;

let vm;

let paused = false;
let pausedThreadState = new WeakMap();
let pauseNewThreads = false;

let steppingThread = null;

const eventTarget = new EventTarget();

let audioContextStateChange = Promise.resolve();

export const isPaused = () => paused;

const pauseThread = thread => {
    if (thread.updateMonitor || pausedThreadState.has(thread)) {
        return;
    }

    const pauseState = {
        time: vm.runtime.currentMSecs,
        status: thread.status
    };
    pausedThreadState.set(thread, pauseState);

    thread.status = STATUS_PROMISE_WAIT;
};

const ensurePausedThreadIsStillPaused = thread => {
    if (thread.status === STATUS_DONE) {
        return;
    }
    const pauseState = pausedThreadState.get(thread);
    if (pauseState) {
        if (thread.status !== STATUS_PROMISE_WAIT) {
            pauseState.status = thread.status;
            thread.status = STATUS_PROMISE_WAIT;
        }
    }
};

const setSteppingThread = thread => {
    steppingThread = thread;
};

const compensateForTimePassedWhilePaused = (thread, pauseState) => {
    if (thread.timer) {
        thread.timer.startTime += vm.runtime.currentMSecs - pauseState.time;
    }
    if (thread.compatibilityStackFrame && thread.compatibilityStackFrame.timer) {
        thread.compatibilityStackFrame.timer.startTime += vm.runtime.currentMSecs - pauseState.time;
    }
    const stackFrame = thread.peekStackFrame();
    if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
        stackFrame.executionContext.timer.startTime += vm.runtime.currentMSecs - pauseState.time;
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

export const setPaused = _paused => {
    const didChange = paused !== _paused;
    if (didChange) {
        paused = _paused;
        eventTarget.dispatchEvent(new CustomEvent('change'));

        if (paused) {
            vm.runtime.emit('RUNTIME_PAUSED');
        } else {
            vm.runtime.emit('RUNTIME_UNPAUSED');
        }
    }

    if (paused) {
        audioContextStateChange = audioContextStateChange.then(() => vm.runtime.audioEngine.audioContext.suspend());
        if (!vm.runtime.ioDevices.clock._paused) {
            vm.runtime.ioDevices.clock.pause();
        }
        vm.runtime.threads.forEach(pauseThread);

        const activeThread = vm.runtime.sequencer.activeThread;
        if (activeThread) {
            setSteppingThread(activeThread);
            eventTarget.dispatchEvent(new CustomEvent('step'));
        }
    }

    if (!paused && didChange) {
        audioContextStateChange = audioContextStateChange.then(() => vm.runtime.audioEngine.audioContext.resume());
        vm.runtime.ioDevices.clock.resume();
        for (const thread of vm.runtime.threads) {
            const pauseState = pausedThreadState.get(thread);
            if (pauseState) {
                compensateForTimePassedWhilePaused(thread, pauseState);
                thread.status = pauseState.status;
                thread.breakpointBlock = thread.isCompiled ? thread.topBlock : thread.peekStack();
            }
        }
        pausedThreadState = new WeakMap();

        const lastSteppedThread = steppingThread;
        stepUnsteppedThreads(lastSteppedThread);
        steppingThread = null;
    }
};

export const onPauseChanged = listener => {
    eventTarget.addEventListener('change', () => listener(paused));
};

export const onSingleStep = listener => {
    eventTarget.addEventListener('step', listener);
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

    pauseNewThreads = true;
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
            vm.runtime.sequencer.stepThread(thread);
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
        pauseNewThreads = false;
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
    const pauseState = pausedThreadState.get(thread);
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
            pauseThread(possibleNewThread);
            return possibleNewThread;
        }
    }
    return null;
};

export const singleStep = () => {
    if (steppingThread) {
        const pauseState = pausedThreadState.get(steppingThread);

        compensateForTimePassedWhilePaused(steppingThread, pauseState);
        pauseState.time = vm.runtime.currentMSecs;

        const continueExecuting = singleStepThread(steppingThread);

        if (!continueExecuting) {
            steppingThread = findNewSteppingThread(getThreadIndex(steppingThread) + 1);
        }
    }

    if (!steppingThread) {
        setSteppingThread(findNewSteppingThread(0));

        vm.runtime.ioDevices.clock._pausedTime += vm.runtime.currentStepTime;
        const audioContext = vm.runtime.audioEngine.audioContext;
        for (const target of vm.runtime.targets) {
            for (const soundId of Object.keys(target.sprite.soundBank.soundPlayers)) {
                const soundPlayer = target.sprite.soundBank.soundPlayers[soundId];
                if (soundPlayer.outputNode) {
                    soundPlayer.outputNode.stop(audioContext.currentTime);
                    soundPlayer._createSource();
                    soundPlayer.outputNode.start(
                        audioContext.currentTime,
                        audioContext.currentTime - soundPlayer.startingUntil + (vm.runtime.currentStepTime / 1000)
                    );
                    soundPlayer.startingUntil -= vm.runtime.currentStepTime / 1000;
                }
            }
        }
        for (const thread of vm.runtime.threads) {
            if (pausedThreadState.has(thread)) {
                pausedThreadState.get(thread).time += vm.runtime.currentStepTime;
            }
        }

        pauseNewThreads = true;

        const hats = vm.runtime._hats;
        for (const hatType in hats) {
            if (!Object.prototype.hasOwnProperty.call(hats, hatType)) continue;
            const hat = hats[hatType];
            if (hat.edgeActivated) {
                vm.runtime.startHats(hatType);
            }
        }

        pauseNewThreads = false;
    }

    eventTarget.dispatchEvent(new CustomEvent('step'));
};

export const setup = _vm => {
    if (vm) {
        return;
    }

    vm = _vm;

    const originalStepThreads = vm.runtime.sequencer.stepThreads;
    vm.runtime.sequencer.stepThreads = function () {
        if (isPaused()) {
            for (const thread of this.runtime.threads) {
                ensurePausedThreadIsStillPaused(thread);
            }
        }
        return originalStepThreads.call(this);
    };

    const originalGreenFlag = vm.runtime.greenFlag;
    vm.runtime.greenFlag = function () {
        setPaused(false);
        return originalGreenFlag.call(this);
    };

    const originalStopAll = vm.runtime.stopAll;
    vm.runtime.stopAll = function () {
        const result = originalStopAll.call(this);
        setPaused(false);
        return result;
    };

    const originalStartHats = vm.runtime.startHats;
    vm.runtime.startHats = function (...args) {
        const hat = args[0];
        const isUserInitiated = hat === 'event_whenbroadcastreceived' || hat === 'control_start_as_clone';
        if (pauseNewThreads) {
            if (!isUserInitiated && !this.getIsEdgeActivatedHat(hat)) {
                return [];
            }
            const newThreads = originalStartHats.apply(this, args);
            for (const thread of newThreads) {
                pauseThread(thread);
            }
            return newThreads;
        } else if (paused && !isUserInitiated) {
            return [];
        }
        return originalStartHats.apply(this, args);
    };

    const originalGetMonitorThreadCount = vm.runtime._getMonitorThreadCount;
    vm.runtime._getMonitorThreadCount = function (threads) {
        let count = originalGetMonitorThreadCount.call(this, threads);
        if (paused) {
            for (const thread of threads) {
                if (pausedThreadState.has(thread)) {
                    count++;
                }
            }
        }
        return count;
    };
};
