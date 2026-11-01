import {getRememberedPlatformProjectState} from '../community/publish.js';

const projectChangeStates = new WeakMap();

const getProjectChangeState = vm => {
    if (!vm || (typeof vm !== 'object' && typeof vm !== 'function')) return null;
    let state = projectChangeStates.get(vm);
    if (!state) {
        state = {sequence: 0};
        projectChangeStates.set(vm, state);
        const changed = () => {
            state.sequence++;
        };
        if (typeof vm.on === 'function') vm.on('PROJECT_CHANGED', changed);
        if (vm.runtime && typeof vm.runtime.on === 'function') vm.runtime.on('PROJECT_LOADED', changed);
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
