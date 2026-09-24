import {recordDeletion} from '../lib/undo-history';

const RESTORE_UPDATE = 'scratch-gui/restore-deletion/RESTORE_UPDATE';
const RESTORE_PUSH = 'scratch-gui/restore-deletion/RESTORE_PUSH';
const RESTORE_REMOVE = 'scratch-gui/restore-deletion/RESTORE_REMOVE';

// Each entry holds a deleted sprite, costume or sound in memory.
const MAX_ENTRIES = 32;

// restoreFun, deletedItem and sequence always describe the newest entry, so
// "Restore" in the Edit menu and older addons see the same shape as before.
const withEntries = entries => {
    const top = entries[entries.length - 1];
    return {
        entries,
        restoreFun: top ? top.restoreFun : null,
        deletedItem: top ? top.deletedItem : '',
        sequence: top ? top.sequence : 0
    };
};

const initialState = withEntries([]);

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
    const entries = state.entries || [];

    switch (action.type) {
    case RESTORE_UPDATE:
        // Raw state replacement, kept for addons that save and put back the
        // whole restore state.
        return Object.assign({}, state, action.state);
    case RESTORE_PUSH:
        return withEntries(entries.concat(action.entry).slice(-MAX_ENTRIES));
    case RESTORE_REMOVE: {
        const index = typeof action.restoreFun === 'function' ?
            entries.findIndex(entry => entry.restoreFun === action.restoreFun) :
            entries.length - 1;
        if (index === -1) return state;
        return withEntries(entries.filter((_, i) => i !== index));
    }
    default:
        return state;
    }
};

/**
 * Remove a deletion from the history, usually because it was restored.
 * @param {function} [restoreFun] the entry to remove; the newest one if omitted
 * @returns {object} action
 */
const removeRestore = restoreFun => ({
    type: RESTORE_REMOVE,
    restoreFun
});

/**
 * Add a deletion to the undo history. Passing no restoreFun removes the
 * newest deletion instead.
 * @param {object} state
 * @param {?function} state.restoreFun puts the deleted item back
 * @param {string} state.deletedItem 'Sprite', 'Costume' or 'Sound'
 * @returns {object} action
 */
const setRestore = function (state) {
    if (typeof state.restoreFun !== 'function') return removeRestore();
    return {
        type: RESTORE_PUSH,
        entry: {
            restoreFun: singleFlightRestore(state.restoreFun),
            deletedItem: state.deletedItem,
            sequence: recordDeletion()
        }
    };
};

export {
    reducer as default,
    initialState as restoreDeletionInitialState,
    removeRestore,
    singleFlightRestore,
    setRestore
};
