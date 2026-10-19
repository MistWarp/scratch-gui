import * as pauseModule from './pause.js';

const createEngine = vm => {
    pauseModule.setup(vm);
    return {
        isPaused: pauseModule.isPaused,
        setPaused: pauseModule.setPaused,
        onPauseChanged: pauseModule.onPauseChanged,
        onSingleStep: pauseModule.onSingleStep,
        getRunningThread: pauseModule.getRunningThread,
        singleStep: pauseModule.singleStep
    };
};

export default createEngine;
