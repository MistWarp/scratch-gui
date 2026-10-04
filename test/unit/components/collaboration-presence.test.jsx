import React from 'react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {shallow} from 'enzyme';
import {act} from 'react-dom/test-utils';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import CollabPresence from '../../../src/components/menu-bar/mw-collab-presence.jsx';
import CollaborationSpriteIndicator from '../../../src/components/collaboration-sprite-indicator.jsx';
import reducer from '../../../src/reducers/collaboration.js';

const mockService = {
    pending: [],
    handlers: {},
    getCurrentUserId: () => 'me',
    getPendingJoinRequests: () => mockService.pending,
    on: (event, handler) => {
        mockService.handlers[event] = handler;
    },
    off: (event, handler) => {
        if (mockService.handlers[event] === handler) delete mockService.handlers[event];
    }
};
jest.mock('../../../src/lib/collaboration/index.js', () => ({
    getInstance: () => mockService
}));
jest.mock('../../../src/lib/collaboration/avatar.js', () => ({
    avatarForCollabUser: user => (user.handle ? `/avatars/${user.handle}` : null),
    colorForCollabUser: () => 'hsl(0, 70%, 45%)'
}));

test('menu avatars open the collaboration window', () => {
    const state = {
        ...reducer(undefined, {}),
        isConnected: true,
        connectedUsers: [{id: 'me', username: 'Mist'}, {id: 'peer', username: 'Alex', handle: 'Alex'}]
    };
    const store = createStore((current = {scratchGui: {collaboration: state}}, action) => ({
        scratchGui: {collaboration: reducer(current.scratchGui.collaboration, action)}
    }));
    const wrapper = mountWithIntl(<Provider store={store}><CollabPresence /></Provider>);
    wrapper.find('button[aria-label="Show current collaborators"]').simulate('click');
    expect(store.getState().scratchGui.collaboration.modalVisible).toBe(true);
    wrapper.unmount();
});

test('sprite presence uses the collaborator avatar with a named tooltip', () => {
    const wrapper = shallow(<CollaborationSpriteIndicator
        users={[
            {userId: 'peer', username: 'Alex', handle: 'Alex'}
        ]}
    />);
    expect(wrapper.find('img').prop('src')).toBe('/avatars/Alex');
    expect(wrapper.find('[title="Alex is editing this"]').exists()).toBe(true);
});

test.each([
    [{editors: [{username: 'Alex'}]}, '1 on this branch'],
    [{isPublic: true}, 'Live session available'],
    [{isPublic: true, hosting: true}, 'Session open'],
    [{phase: 'joining'}, 'Joining session…'],
    [{unavailable: true}, 'Online status unavailable']
])('presence shows discovery and connection progress accurately: %s', (projectPresence, label) => {
    const state = {...reducer(undefined, {}), projectPresence};
    const store = createStore(() => ({scratchGui: {collaboration: state}}));
    const wrapper = mountWithIntl(<Provider store={store}><CollabPresence /></Provider>);
    expect(wrapper.find('button').text()).toBe(label);
    wrapper.unmount();
});

test.each([
    [{isConnected: true, isReconnecting: true}, 'Reconnecting…'],
    [{isConnected: true, isReconnecting: true, reconnectReason: 'ROOM_NOT_FOUND'}, 'Waiting for host…'],
    [{reconnectReason: 'ROOM_NOT_FOUND', projectPresence: {phase: 'reconnecting'}}, 'Waiting for host…'],
    [{isConnected: true, connectedUsers: [{id: 'me', username: 'Mist'}]}, 'Session open']
])('a room session shows its own state in the menu bar: %j', (collab, label) => {
    const state = {...reducer(undefined, {}), ...collab};
    const store = createStore(() => ({scratchGui: {collaboration: state}}));
    const wrapper = mountWithIntl(<Provider store={store}><CollabPresence /></Provider>);
    expect(wrapper.find('button').text()).toBe(label);
    wrapper.unmount();
});

test('reconnecting replaces the avatars until the connection is back', () => {
    const state = {
        ...reducer(undefined, {}),
        isConnected: true,
        isReconnecting: true,
        connectedUsers: [{id: 'me', username: 'Mist'}, {id: 'peer', username: 'Alex'}]
    };
    const store = createStore(() => ({scratchGui: {collaboration: state}}));
    const wrapper = mountWithIntl(<Provider store={store}><CollabPresence /></Provider>);
    expect(wrapper.find('button').text()).toBe('Reconnecting…');
    wrapper.unmount();
});

test('sprite presence overflow names the people it hides', () => {
    const wrapper = shallow(<CollaborationSpriteIndicator
        users={[
            {userId: 'a', username: 'A'}, {userId: 'b', username: 'B'},
            {userId: 'c', username: 'C'}, {userId: 'd', username: 'D'}
        ]}
    />);
    expect(wrapper.find('[title="C, D"]').text()).toBe('+2');
});

test('the host sees how many people are waiting to join, also as an accessible label', () => {
    mockService.pending = [];
    const state = {...reducer(undefined, {}), isConnected: true, connectedUsers: [{id: 'me', username: 'Mist'}]};
    const store = createStore(() => ({scratchGui: {collaboration: state}}));
    const wrapper = mountWithIntl(<Provider store={store}><CollabPresence /></Provider>);
    expect(wrapper.find('button').prop('aria-label')).toBe(null);

    mockService.pending = [{id: 'a', username: 'Ann'}, {id: 'b', username: 'Ben'}];
    act(() => mockService.handlers['join-request-received']({requesterId: 'b'}));
    wrapper.update();
    expect(wrapper.find('button').prop('aria-label')).toBe('Session open, 2 people waiting to join');
    expect(wrapper.find('button [aria-hidden="true"]').text()).toBe('2');

    mockService.pending = [];
    act(() => mockService.handlers['join-request-cancelled']({requesterId: 'a'}));
    wrapper.update();
    expect(wrapper.find('button [aria-hidden="true"]').exists()).toBe(false);
    wrapper.unmount();
    expect(mockService.handlers).toEqual({});
});
