import 'web-audio-test-api';

import React from 'react';
import configureStore from 'redux-mock-store';
import VM from 'scratch-vm';
import {mountWithIntl} from '../helpers/intl-helpers.jsx';
import {LoadingState} from '../../src/reducers/project-state';
import cloudManagerHOC from '../../src/lib/components/cloud-manager-hoc.jsx';

jest.mock('../../src/lib/api/cloud-provider', () => {
    const Actual = jest.requireActual('../../src/lib/api/cloud-provider').default;
    return {
        __esModule: true,
        default: jest.fn().mockImplementation((...args) => new Actual(...args))
    };
});

jest.mock('../../src/containers/gui.jsx', () => () => null);

const CloudProvider = require('../../src/lib/api/cloud-provider').default;
const ActualCloudProvider = jest.requireActual('../../src/lib/api/cloud-provider').default;
const RenderGUI = require('../../src/playground/render-gui.jsx').default;

const STUDENT_KEY = 'mw:classroom-student';

const makeStore = () => configureStore()({
    scratchGui: {
        projectState: {projectId: '1234', loadingState: LoadingState.SHOWING_WITH_ID},
        mode: {hasEverEnteredEditor: false},
        tw: {cloud: true, cloudHost: 'wss://clouddata.turbowarp.org'}
    }
});

const makeVm = () => {
    const vm = new VM();
    vm.setCloudProvider = jest.fn();
    vm.runtime = {hasCloudData: jest.fn(() => true)};
    vm.extensionManager = {isExtensionLoaded: jest.fn(() => false)};
    return vm;
};

describe('cloud variables for class accounts', () => {
    let sockets;

    beforeEach(() => {
        localStorage.clear();
        CloudProvider.mockClear();
        sockets = [];
        global.WebSocket = function (url) {
            this.url = url;
            this.send = jest.fn();
            this.close = jest.fn();
            sockets.push(this);
        };
        global.WebSocket.OPEN = 1;
    });

    afterEach(() => {
        localStorage.clear();
        delete global.WebSocket;
    });

    test('a student never gets a cloud provider, so cloud variables stay local', () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const vm = makeVm();
        const Wrapped = cloudManagerHOC(() => <div />);
        const wrapper = mountWithIntl(
            <Wrapped
                hasCloudPermission
                cloudHost="wss://clouddata.turbowarp.org"
                store={makeStore()}
                username="ada~k7p2q"
                vm={vm}
            />
        );
        expect(CloudProvider).not.toHaveBeenCalled();
        expect(vm.setCloudProvider).not.toHaveBeenCalled();
        expect(sockets).toHaveLength(0);
        wrapper.unmount();
    });

    test('everyone else still connects to the cloud server', () => {
        const vm = makeVm();
        const Wrapped = cloudManagerHOC(() => <div />);
        const wrapper = mountWithIntl(
            <Wrapped
                hasCloudPermission
                cloudHost="wss://clouddata.turbowarp.org"
                store={makeStore()}
                username="Mist"
                vm={vm}
            />
        );
        expect(CloudProvider).toHaveBeenCalledTimes(1);
        expect(sockets.map(socket => socket.url)).toEqual(['wss://clouddata.turbowarp.org']);
        wrapper.unmount();
    });

    test('the cloud provider itself refuses to open a socket in a student session', () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const provider = new ActualCloudProvider('wss://clouddata.turbowarp.org', {}, 'ada~k7p2q', '1');
        expect(provider.connection).toBeNull();
        provider.updateVariable('score', 1);
        provider.createVariable('lives', 3);
        expect(sockets).toHaveLength(0);
    });

    test('an embed told that its viewer is a class account turns cloud variables off', () => {
        jest.isolateModules(() => {
            // eslint-disable-next-line global-require
            const TWStateManager = require('../../src/lib/components/tw-state-manager-hoc.jsx').default;
            // eslint-disable-next-line global-require
            const flag = require('../../src/lib/rotur/student-flag.js');
            const StateManager = TWStateManager(() => null).WrappedComponent;
            const onSetCloud = jest.fn();
            const onSetUsername = jest.fn();
            const instance = new StateManager({username: 'player123', onSetCloud, onSetUsername});
            expect(flag.isStudentSession()).toBe(false);
            instance.handleParentIdentity({
                source: window.parent,
                data: {type: 'mw:rotur-user', user: {loggedIn: true, username: 'ada~k7p2q'}, displayName: '@ada~k7p2q'}
            });
            expect(onSetCloud).toHaveBeenCalledWith(false);
            expect(onSetUsername).not.toHaveBeenCalled();
            expect(flag.isStudentSession()).toBe(true);
        });
    });

    test('an embed keeps the parent name for everyone else', () => {
        jest.isolateModules(() => {
            // eslint-disable-next-line global-require
            const TWStateManager = require('../../src/lib/components/tw-state-manager-hoc.jsx').default;
            const StateManager = TWStateManager(() => null).WrappedComponent;
            const onSetCloud = jest.fn();
            const onSetUsername = jest.fn();
            const instance = new StateManager({username: 'player123', onSetCloud, onSetUsername});
            instance.handleParentIdentity({
                source: window.parent,
                data: {type: 'mw:rotur-user', user: {loggedIn: true, username: 'mist'}, displayName: '@mist'}
            });
            expect(onSetUsername).toHaveBeenCalledWith('@mist');
            expect(onSetCloud).not.toHaveBeenCalled();
        });
    });

    test('the editor entry passes no cloud host to a student session', () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const student = RenderGUI({});
        expect(student.props.cloudHost).toBeNull();
        expect(student.props.canUseCloud).toBe(false);
        expect(student.props.hasCloudPermission).toBe(false);
        localStorage.clear();
        const other = RenderGUI({});
        expect(other.props.cloudHost).toBe('wss://clouddata.turbowarp.org');
        expect(other.props.canUseCloud).toBe(true);
    });
});
