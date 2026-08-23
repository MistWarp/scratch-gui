import React from 'react';
import configureStore from 'redux-mock-store';
import {shallow} from 'enzyme';

import SB3PostMessageHOC from '../../../src/lib/components/sb3-postmessage-hoc.jsx';
import RestorePointAPI from '../../../src/lib/api/restore-points';

jest.mock('../../../src/lib/api/restore-points', () => ({
    createSafetyRestorePoint: jest.fn(() => Promise.resolve())
}));

describe('SB3PostMessageHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;

    const createInstance = () => {
        const Component = () => <div />;
        const ConnectedComponent = SB3PostMessageHOC(Component);
        const wrapper = shallow(<ConnectedComponent store={store} />);
        return wrapper.dive().instance();
    };

    const createEvent = (data, source = {postMessage: jest.fn()}) => ({
        data: {
            type: 'LOAD_SB3',
            data
        },
        origin: window.location.origin,
        source
    });

    beforeEach(() => {
        vm = {
            loadProject: jest.fn(() => Promise.resolve()),
            quit: jest.fn(),
            renderer: {
                draw: jest.fn()
            }
        };
        store = mockStore({
            scratchGui: {
                projectState: {},
                vm
            }
        });
        RestorePointAPI.createSafetyRestorePoint.mockReset();
        RestorePointAPI.createSafetyRestorePoint.mockResolvedValue();
    });

    test('an older request cannot load or reply after a newer request arrives', async () => {
        const restoreResolvers = [];
        RestorePointAPI.createSafetyRestorePoint.mockImplementation(() => (
            new Promise(resolve => restoreResolvers.push(resolve))
        ));
        const oldSource = {postMessage: jest.fn()};
        const newSource = {postMessage: jest.fn()};
        const instance = createInstance();

        const oldLoad = instance.handleMessage(createEvent(new Uint8Array([1]), oldSource));
        const newLoad = instance.handleMessage(createEvent(new Uint8Array([2]), newSource));
        restoreResolvers[0]();
        restoreResolvers[1]();
        await Promise.all([oldLoad, newLoad]);

        expect(vm.loadProject).toHaveBeenCalledTimes(1);
        expect(new Uint8Array(vm.loadProject.mock.calls[0][0])).toEqual(new Uint8Array([2]));
        expect(oldSource.postMessage).not.toHaveBeenCalled();
        expect(newSource.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({status: 'success'}),
            window.location.origin
        );
    });

    test('restore point storage failure does not block an external project', async () => {
        RestorePointAPI.createSafetyRestorePoint.mockRejectedValue(new Error('storage unavailable'));
        const source = {postMessage: jest.fn()};
        const instance = createInstance();

        await instance.handleMessage(createEvent(new Uint8Array([3]), source));

        expect(vm.quit).toHaveBeenCalledTimes(1);
        expect(vm.loadProject).toHaveBeenCalledTimes(1);
        expect(source.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({status: 'success'}),
            window.location.origin
        );
    });

    test('invalid project data replies to the caller with an error', () => {
        const source = {postMessage: jest.fn()};
        const instance = createInstance();

        instance.handleMessage(createEvent({not: 'project data'}, source));

        expect(source.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({status: 'error'}),
            window.location.origin
        );
        expect(vm.loadProject).not.toHaveBeenCalled();
    });
});
