import {combineReducers, createStore} from 'redux';
import VM from 'scratch-vm';
import projectTitleReducer, {setProjectTitle, syncProjectNameToVm} from '../../../src/reducers/project-title';

const makeStore = vm => createStore(combineReducers({
    scratchGui: combineReducers({
        projectTitle: projectTitleReducer,
        vm: (state = vm, action) => (action.type === 'SET_VM' ? action.vm : state)
    })
}));

describe('project name in the VM', () => {
    test('runtime.projectName follows the project title', () => {
        const vm = new VM();
        const store = makeStore(vm);
        const stop = syncProjectNameToVm(store);
        expect(vm.runtime.projectName).toBe('');

        store.dispatch(setProjectTitle('Space Game'));
        expect(vm.runtime.projectName).toBe('Space Game');

        store.dispatch(setProjectTitle('Space Game 2'));
        expect(vm.runtime.projectName).toBe('Space Game 2');

        stop();
        store.dispatch(setProjectTitle('Ignored'));
        expect(vm.runtime.projectName).toBe('Space Game 2');
        vm.quit();
    });

    test('names a replacement VM and skips actions that leave the title alone', () => {
        const first = {setProjectName: jest.fn()};
        const second = {setProjectName: jest.fn()};
        const store = makeStore(first);
        syncProjectNameToVm(store);
        store.dispatch(setProjectTitle('Title'));
        store.dispatch({type: 'unrelated'});
        expect(first.setProjectName.mock.calls).toEqual([[''], ['Title']]);

        store.dispatch({type: 'SET_VM', vm: second});
        expect(second.setProjectName.mock.calls).toEqual([['Title']]);
    });
});
