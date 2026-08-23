const initialState = {
    visible: false,
    message: null,
    type: 'info',
    sequence: 0
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case 'scratch-gui/SHOW_TOAST':
        return Object.assign({}, state, {
            visible: true,
            message: action.message,
            type: action.toastType || 'info',
            sequence: (state.sequence || 0) + 1
        });
    case 'scratch-gui/HIDE_TOAST':
        return Object.assign({}, state, {
            visible: false
        });
    default:
        return state;
    }
};

export {
    reducer as default,
    initialState as toastInitialState
};
