import React from 'react';
import {Provider} from 'react-redux';
const {mountWithIntl} = require('../../helpers/intl-helpers.jsx');

import configureStore from 'redux-mock-store';

import CrashMessageComponent from '../../../src/components/crash-message/crash-message.jsx';
import ErrorBoundary from '../../../src/containers/error-boundary.jsx';

const ChildComponent = () => <div>hello</div>;

describe('ErrorBoundary', () => {
    const mockStore = configureStore();
    let store;

    beforeEach(() => {
        store = mockStore({
            locales: {
                isRtl: false,
                locale: 'en-US'
            }
        });
    });

    test('ErrorBoundary shows children before error and CrashMessageComponent after', () => {
        const child = <ChildComponent />;
        const wrapper = mountWithIntl(
            <Provider store={store}><ErrorBoundary action="test">{child}</ErrorBoundary></Provider>
        );
        const errorSite = wrapper.childAt(0).childAt(0);

        // @ts-ignore: 'onReload' prop is absent because this component will only be used for pattern matching
        const crashMessagePattern = <CrashMessageComponent />;

        expect(wrapper.containsMatchingElement(child)).toBeTruthy();
        expect(wrapper.containsMatchingElement(crashMessagePattern)).toBeFalsy();

        errorSite.simulateError(new Error('fake error for testing purposes'));

        expect(wrapper.containsMatchingElement(child)).toBeFalsy();
        expect(wrapper.containsMatchingElement(crashMessagePattern)).toBeTruthy();
    });

    test('reload preserves the requested project URL', () => {
        const originalLocation = window.location;
        const reload = jest.fn();
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {reload}
        });
        try {
            new ErrorBoundary({action: 'test'}).handleReload();
            expect(reload).toHaveBeenCalledTimes(1);
        } finally {
            Object.defineProperty(window, 'location', {configurable: true, value: originalLocation});
        }
    });

    test('the crash screen can download the project while the VM is still alive', async () => {
        const blob = new Blob(['sb3']);
        window.vm = {
            runtime: {targets: [{}]},
            saveProjectSb3: jest.fn(() => Promise.resolve(blob))
        };
        const createObjectURL = window.URL.createObjectURL;
        const revokeObjectURL = window.URL.revokeObjectURL;
        window.URL.createObjectURL = jest.fn(() => 'blob:project');
        window.URL.revokeObjectURL = jest.fn();
        try {
            const wrapper = mountWithIntl(
                <Provider store={store}><ErrorBoundary action="test"><ChildComponent /></ErrorBoundary></Provider>
            );
            wrapper.childAt(0).childAt(0).simulateError(new Error('render failed'));
            wrapper.update();
            const button = wrapper.find('button').filterWhere(node => /Download project/.test(node.text()));
            expect(button).toHaveLength(1);
            button.simulate('click');
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(window.vm.saveProjectSb3).toHaveBeenCalledTimes(1);
            expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
        } finally {
            delete window.vm;
            window.URL.createObjectURL = createObjectURL;
            window.URL.revokeObjectURL = revokeObjectURL;
        }
    });

    test('the download action is hidden when no project is loaded', () => {
        delete window.vm;
        const wrapper = mountWithIntl(
            <Provider store={store}><ErrorBoundary action="test"><ChildComponent /></ErrorBoundary></Provider>
        );
        wrapper.childAt(0).childAt(0).simulateError(new Error('render failed'));
        wrapper.update();
        expect(wrapper.find('button').filterWhere(node => /Download project/.test(node.text()))).toHaveLength(0);
    });

    test('changing the reset key clears the crash and renders the children again', () => {
        const wrapper = mountWithIntl(
            <Provider store={store}>
                <ErrorBoundary
                    action="test"
                    resetKey="/one"
                ><ChildComponent /></ErrorBoundary>
            </Provider>
        );
        wrapper.childAt(0).childAt(0).simulateError(new Error('render failed'));
        wrapper.update();
        expect(wrapper.containsMatchingElement(<CrashMessageComponent />)).toBeTruthy();

        wrapper.setProps({
            children: (
                <ErrorBoundary
                    action="test"
                    resetKey="/two"
                ><ChildComponent /></ErrorBoundary>
            )
        });
        wrapper.update();
        expect(wrapper.containsMatchingElement(<CrashMessageComponent />)).toBeFalsy();
        expect(wrapper.text()).toContain('hello');
    });
});
