import {combineReducers, createStore} from 'redux';
import VM from 'scratch-vm';
import projectTitleReducer, {
    isDefaultProjectTitle,
    projectNameForTitle,
    setProjectTitle,
    syncProjectNameToVm
} from '../../../src/reducers/project-title';
import {blockProjectPrompts, clearBlockedProjectPrompts, isProjectPromptBlocked} from '../../../src/lib/project-prompt-blocking';

const makeStore = (vm, localeMessages = {}) => createStore(combineReducers({
    locales: (state = {messages: localeMessages}, action) =>
        (action.type === 'SET_MESSAGES' ? {messages: action.messages} : state),
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

    test('names a replacement VM and skips actions that leave the name alone', () => {
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

    test('the default title, in English or the current language, leaves the project unnamed', () => {
        const vm = {setProjectName: jest.fn()};
        const store = makeStore(vm, {'tw.gui.defaultProjectTitle': 'Projekt'});
        syncProjectNameToVm(store);
        store.dispatch(setProjectTitle('Projekt'));
        store.dispatch(setProjectTitle('Project'));
        store.dispatch(setProjectTitle('Projekt 2'));
        store.dispatch({type: 'SET_MESSAGES', messages: {'tw.gui.defaultProjectTitle': 'Projet'}});
        store.dispatch(setProjectTitle('Projekt'));
        expect(vm.setProjectName.mock.calls).toEqual([[''], ['Projekt 2'], ['Projekt']]);

        expect(isDefaultProjectTitle('Project')).toBe(true);
        expect(isDefaultProjectTitle('Projet', {'tw.gui.defaultProjectTitle': 'Projet'})).toBe(true);
        expect(projectNameForTitle('My game')).toBe('My game');
        expect(projectNameForTitle(null)).toBe('');
    });

    test('blocking prompts in an untitled project does not block them in the next untitled one', () => {
        clearBlockedProjectPrompts();
        const vm = new VM();
        const store = makeStore(vm);
        syncProjectNameToVm(store);
        store.dispatch(setProjectTitle('Project'));
        expect(blockProjectPrompts({name: vm.runtime.projectName})).toBe('');
        expect(isProjectPromptBlocked({name: vm.runtime.projectName})).toBe(false);

        store.dispatch(setProjectTitle('Named game'));
        expect(blockProjectPrompts({name: vm.runtime.projectName})).toBe('name:Named game');
        store.dispatch(setProjectTitle('Project'));
        expect(isProjectPromptBlocked({name: vm.runtime.projectName})).toBe(false);
        clearBlockedProjectPrompts();
        vm.quit();
    });
});
