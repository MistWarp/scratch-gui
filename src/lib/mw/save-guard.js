import {getRememberedPlatformProjectState} from '../community/publish.js';

const projectChangeStates = new WeakMap();

const getProjectChangeState = vm => {
    if (!vm || (typeof vm !== 'object' && typeof vm !== 'function')) return null;
    let state = projectChangeStates.get(vm);
    if (!state) {
        state = {sequence: 0};
        projectChangeStates.set(vm, state);
        if (typeof vm.on === 'function') {
            const changed = () => {
                state.sequence++;
            };
            vm.on('PROJECT_CHANGED', changed);
            vm.on('PROJECT_LOADED', changed);
        }
    }
    return state;
};

const guardSavedCallback = (vm, onSaved) => {
    const state = getProjectChangeState(vm);
    const sequence = state && state.sequence;
    const destination = getRememberedPlatformProjectState()?.id;
    return result => {
        if ((!state || state.sequence === sequence) &&
            (!destination || destination === getRememberedPlatformProjectState()?.id)) onSaved(result);
    };
};

export {guardSavedCallback};
