import React from 'react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import CollabLoader from '../../../src/components/collab-loader/collab-loader.jsx';
import reducer from '../../../src/reducers/collaboration.js';

const mockDisconnect = jest.fn();
jest.mock('../../../src/lib/collaboration/index.js', () => ({
    getInstance: () => ({disconnect: mockDisconnect})
}));

const mountLoader = collab => {
    const state = {...reducer(undefined, {}), ...collab};
    const store = createStore(() => ({scratchGui: {collaboration: state}}));
    return mountWithIntl(<Provider store={store}><CollabLoader /></Provider>);
};

test('renders nothing when not loading', () => {
    const wrapper = mountLoader({isCollabLoading: false});
    expect(wrapper.html()).toBeFalsy();
    wrapper.unmount();
});

test.each([
    ['downloading', 40, "Downloading the host's project…", '40%'],
    ['loading', 0, 'Opening the project…', ''],
    ['retrying', 0, 'The download was interrupted. Trying again…', ''],
    [null, 0, 'Waiting for the host…', '']
])('describes the %s stage', (message, progress, title, percent) => {
    const wrapper = mountLoader({isCollabLoading: true, collabLoadingMessage: message, hostLoadingProgress: progress});
    expect(wrapper.text()).toContain(title);
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    if (percent) expect(wrapper.text()).toContain(percent);
    else expect(wrapper.text()).not.toMatch(/\d+%/);
    wrapper.unmount();
});

test('offers a way out of a stuck download', () => {
    const wrapper = mountLoader({isCollabLoading: true, collabLoadingMessage: 'downloading'});
    wrapper.find('button').simulate('click');
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    wrapper.unmount();
});
