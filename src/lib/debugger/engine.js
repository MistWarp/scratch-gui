import * as pauseModule from '../../addons/addons/debugger/module.js';

const createEngine = vm => {
    pauseModule.setup({tab: {traps: {vm}}});
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
