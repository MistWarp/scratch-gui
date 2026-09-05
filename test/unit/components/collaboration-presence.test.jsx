import React from 'react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {mount, shallow} from 'enzyme';
import CollabPresence from '../../../src/components/menu-bar/mw-collab-presence.jsx';
import CollaborationSpriteIndicator from '../../../src/components/collaboration-sprite-indicator.jsx';
import reducer from '../../../src/reducers/collaboration.js';

jest.mock('../../../src/lib/collaboration/index.js', () => ({
    getInstance: () => ({getCurrentUserId: () => 'me'})
}));
jest.mock('../../../src/lib/collaboration/avatar.js', () => ({
    avatarForCollabUser: user => user.handle ? `/avatars/${user.handle}` : null
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
    const wrapper = mount(<Provider store={store}><CollabPresence /></Provider>);
    wrapper.find('button[aria-label="Show current collaborators"]').simulate('click');
    expect(store.getState().scratchGui.collaboration.modalVisible).toBe(true);
    wrapper.unmount();
});

test('sprite presence uses the collaborator avatar with a named tooltip', () => {
    const wrapper = shallow(<CollaborationSpriteIndicator users={[
        {userId: 'peer', username: 'Alex', handle: 'Alex'}
    ]} />);
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
    const wrapper = mount(<Provider store={store}><CollabPresence /></Provider>);
    expect(wrapper.find('button').text()).toBe(label);
    wrapper.unmount();
});
