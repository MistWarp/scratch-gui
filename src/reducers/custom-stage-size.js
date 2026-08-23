const SET_CUSTOM_STAGE_SIZE = 'tw/custom-stage-size/SET';

const parseDimensions = value => {
    const match = value && value.match(/^(\d+)[^\d]+(\d+)$/);
    if (!match) return null;
    const [, widthText, heightText] = match;
    const width = Math.max(0, Math.min(4096, +widthText));
    const height = Math.max(0, Math.min(4096, +heightText));
    return {width, height};
};

const getDimensions = () => {
    // Running in node.js
    if (typeof URLSearchParams === 'undefined') {
        return null;
    }

    const urlParameters = new URLSearchParams(location.search);
    const dimensionsQuery = urlParameters.get('size');
    if (dimensionsQuery === null) {
        return null;
    }
    return parseDimensions(dimensionsQuery);
};

const defaultStageSize = {
    width: 480,
    height: 360
};

const initialState = getDimensions() || defaultStageSize;

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_CUSTOM_STAGE_SIZE:
        return Object.assign({}, state, {
            width: action.width,
            height: action.height
        });
    default:
        return state;
    }
};

const setCustomStageSize = function (width, height) {
    return {
        type: SET_CUSTOM_STAGE_SIZE,
        width,
        height
    };
};

export {
    reducer as default,
    initialState as customStageSizeInitialState,
    defaultStageSize,
    parseDimensions,
    setCustomStageSize
};
