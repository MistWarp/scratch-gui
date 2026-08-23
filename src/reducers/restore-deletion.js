const RESTORE_UPDATE = 'scratch-gui/restore-deletion/RESTORE_UPDATE';

const initialState = {
    restoreFun: null,
    deletedItem: ''
};

const singleFlightRestore = restoreFun => {
    if (typeof restoreFun !== 'function') return restoreFun;
    let restorePromise = null;
    let restored = false;
    return () => {
        if (restored) return Promise.resolve(false);
        if (restorePromise) return restorePromise;
        restorePromise = Promise.resolve()
            .then(() => restoreFun())
            .then(result => {
                restored = true;
                return result;
            })
            .catch(error => {
                restorePromise = null;
                throw error;
            });
        return restorePromise;
    };
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;

    switch (action.type) {
    case RESTORE_UPDATE:
        return Object.assign({}, state, action.state);
    default:
        return state;
    }
};

const setRestore = function (state) {
    return {
        type: RESTORE_UPDATE,
        state: {
            restoreFun: singleFlightRestore(state.restoreFun),
            deletedItem: state.deletedItem
        }
    };
};

export {
    reducer as default,
    initialState as restoreDeletionInitialState,
    singleFlightRestore,
    setRestore
};
