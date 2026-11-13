import React from 'react';
import configureStore from 'redux-mock-store';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {UpdateToast} from '../../../src/components/update-toast/update-toast.jsx';
import {prepareUpdate, switchToUpdate} from '../../../src/lib/offline-worker.js';

jest.mock('../../../src/lib/offline-worker.js', () => ({
    prepareUpdate: jest.fn(),
    switchToUpdate: jest.fn()
}));

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

const mountToast = projectChanged => {
    const store = configureStore()({
        locales: {isRtl: false, locale: 'en', messages: {}},
        scratchGui: {projectChanged}
    });
    const wrapper = mountWithIntl(<UpdateToast />, {context: {store}});
    wrapper.setState({deployedId: 'abcdef0123456'});
    return wrapper;
};

describe('update toast', () => {
    test('hides build ids in a tooltip and can be dismissed', () => {
        const wrapper = mountToast(false);
        expect(wrapper.text()).toContain('A new version of MistWarp is available. Reload to update.');
        expect(wrapper.text()).not.toContain('abcdef0');
        expect(wrapper.find('[title]').first()
            .prop('title')).toContain('abcdef0');

        wrapper.find('button').filterWhere(node => node.text() === 'Later')
            .simulate('click');
        expect(wrapper.html()).toBeNull();
    });

    test('suggests saving first when the project has unsaved changes', () => {
        const wrapper = mountToast(true);
        expect(wrapper.text()).toContain('You have unsaved changes, so save your project before reloading.');
    });

    test('reloading switches to the new version before the page reloads', async () => {
        const originalLocation = window.location;
        const reload = jest.fn();
        let finishSwitch;
        switchToUpdate.mockReturnValue(new Promise(resolve => {
            finishSwitch = resolve;
        }));
        Object.defineProperty(window, 'location', {configurable: true, value: {reload}});
        try {
            const wrapper = mountToast(true);
            wrapper.find('button').filterWhere(node => node.text() === 'Reload')
                .simulate('click');
            await settle();
            expect(switchToUpdate).toHaveBeenCalled();
            expect(reload).not.toHaveBeenCalled();
            finishSwitch();
            await settle();
            expect(reload).toHaveBeenCalled();
        } finally {
            Object.defineProperty(window, 'location', {configurable: true, value: originalLocation});
        }
    });

    test('the notice appears once the new version is ready to use', async () => {
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => Promise.resolve({ok: true, json: () => Promise.resolve({id: 'abcdef0123456'})}));
        let finishPreparing;
        prepareUpdate.mockReturnValue(new Promise(resolve => {
            finishPreparing = resolve;
        }));
        try {
            const wrapper = mountToast(false);
            wrapper.setState({deployedId: null});
            const checking = wrapper.instance().checkForUpdate();
            await settle();
            expect(prepareUpdate).toHaveBeenCalled();
            expect(wrapper.state('deployedId')).toBeNull();
            finishPreparing();
            await checking;
            expect(wrapper.state('deployedId')).toBe('abcdef0123456');
        } finally {
            global.fetch = originalFetch;
        }
    });
});
