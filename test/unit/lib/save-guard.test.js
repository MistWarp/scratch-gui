import EventEmitter from 'events';
import {guardSavedCallback} from '../../../src/lib/mw/save-guard.js';

jest.mock('../../../src/lib/community/publish.js', () => ({
    getRememberedPlatformProjectState: () => null
}));

const createVm = () => {
    const vm = new EventEmitter();
    vm.runtime = new EventEmitter();
    return vm;
};

test('a save that finishes after nothing changed reports success', () => {
    const vm = createVm();
    const onSaved = jest.fn();
    guardSavedCallback(vm, onSaved)('saved');
    expect(onSaved).toHaveBeenCalledWith('saved');
});

test('a save is ignored when the project changes before it finishes', () => {
    const vm = createVm();
    const onSaved = jest.fn();
    const done = guardSavedCallback(vm, onSaved);
    vm.emit('PROJECT_CHANGED');
    done('saved');
    expect(onSaved).not.toHaveBeenCalled();
});

test('a save is ignored when another project loads before it finishes', () => {
    const vm = createVm();
    const onSaved = jest.fn();
    const done = guardSavedCallback(vm, onSaved);
    vm.runtime.emit('PROJECT_LOADED');
    done('saved');
    expect(onSaved).not.toHaveBeenCalled();
});
