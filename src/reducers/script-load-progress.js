const SET = 'scratch-gui/script-load-progress/SET';

const initialState = null;

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET:
        return action.progress;
    default:
        return state;
    }
};

const setScriptLoadProgress = function (progress) {
    return {
        type: SET,
        progress: progress || null
    };
};

export {
    reducer as default,
    initialState as scriptLoadProgressInitialState,
    setScriptLoadProgress
};
