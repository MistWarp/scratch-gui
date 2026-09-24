const emptyState = {};
const PAINT_LOADED = 'scratch-gui/paint/LOADED';

let realReducer = null;
const loadedCallbacks = [];

const setScratchPaintReducer = reducer => {
    if (realReducer) return;
    realReducer = reducer;
    for (const callback of loadedCallbacks.splice(0)) callback();
};

const onScratchPaintLoaded = callback => {
    if (realReducer) return;
    loadedCallbacks.push(callback);
};

const ScratchPaintReducer = (state = emptyState, action) => {
    if (!realReducer) return state;
    return realReducer(state === emptyState ? void 0 : state, action);
};

export {
    PAINT_LOADED,
    ScratchPaintReducer,
    onScratchPaintLoaded,
    setScratchPaintReducer
};
