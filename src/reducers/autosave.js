const SET_AUTOSAVE_ENABLED = 'scratch-gui/autosave/SET_AUTOSAVE_ENABLED';
const SET_AUTOSAVE_INTERVAL = 'scratch-gui/autosave/SET_AUTOSAVE_INTERVAL';
const SET_AUTOSAVE_LAST_SAVE_TIME = 'scratch-gui/autosave/SET_AUTOSAVE_LAST_SAVE_TIME';
const SET_AUTOSAVE_NOTIFICATIONS = 'scratch-gui/autosave/SET_AUTOSAVE_NOTIFICATIONS';

const initialState = {
    enabled: false,
    interval: 5, // minutes
    lastSaveTime: 0,
    showNotifications: true
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_AUTOSAVE_ENABLED:
        return Object.assign({}, state, {
            enabled: action.enabled
        });
    case SET_AUTOSAVE_INTERVAL:
        return Object.assign({}, state, {
            interval: action.interval
        });
    case SET_AUTOSAVE_LAST_SAVE_TIME:
        return Object.assign({}, state, {
            lastSaveTime: action.timestamp
        });
    case SET_AUTOSAVE_NOTIFICATIONS:
        return Object.assign({}, state, {
            showNotifications: action.showNotifications
        });
    default:
        return state;
    }
};

const setAutosaveEnabled = enabled => ({
    type: SET_AUTOSAVE_ENABLED,
    enabled
});

const setAutosaveInterval = interval => ({
    type: SET_AUTOSAVE_INTERVAL,
    interval
});

const setAutosaveLastSaveTime = timestamp => ({
    type: SET_AUTOSAVE_LAST_SAVE_TIME,
    timestamp
});

const setAutosaveNotifications = showNotifications => ({
    type: SET_AUTOSAVE_NOTIFICATIONS,
    showNotifications
});

export {
    reducer as default,
    initialState as autosaveInitialState,
    setAutosaveEnabled,
    setAutosaveInterval,
    setAutosaveLastSaveTime,
    setAutosaveNotifications
};
