import React from 'react';
import configureStore from 'redux-mock-store';
import {shallow} from 'enzyme';

import SB3PostMessageHOC from '../../../src/lib/components/sb3-postmessage-hoc.jsx';
import RestorePointAPI from '../../../src/lib/api/restore-points';

jest.mock('../../../src/lib/api/restore-points', () => ({
    createSafetyRestorePoint: jest.fn(() => Promise.resolve())
}));

jest.mock('../../../src/lib/git/browser-git.js', () => ({
    createRepoBackup: jest.fn(async () => jest.fn()), importRepoFromSb3: jest.fn()
}));

describe('SB3PostMessageHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;

    const createInstance = () => {
        const Component = () => <div />;
        const ConnectedComponent = SB3PostMessageHOC(Component);
        const wrapper = shallow(<ConnectedComponent
            store={store}
            openSimpleDialog={config => config.onOk()}
        />);
        const instance = wrapper.dive().instance();
        instance.props = {...instance.props, openSimpleDialog: config => config.onOk()};
        return instance;
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

    test('a request canceled during backup cannot replace the project', async () => {
        let finishBackup;
        RestorePointAPI.createSafetyRestorePoint.mockImplementation(() => new Promise(resolve => {
            finishBackup = resolve;
        }));
        const instance = createInstance();
        const load = instance.handleMessage(createEvent(new Uint8Array([1])));
        for (let i = 0; i < 10; i++) await Promise.resolve();
        instance.componentWillUnmount();
        finishBackup(42);
        await load;
        expect(vm.loadProject).not.toHaveBeenCalled();
    });

    test('restore point storage failure prevents an external page replacing code', async () => {
        RestorePointAPI.createSafetyRestorePoint.mockRejectedValue(new Error('storage unavailable'));
        const source = {postMessage: jest.fn()};
        const instance = createInstance();

        await instance.handleMessage(createEvent(new Uint8Array([3]), source));

        expect(vm.quit).not.toHaveBeenCalled();
        expect(vm.loadProject).not.toHaveBeenCalled();
        expect(source.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({status: 'error'}),
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
