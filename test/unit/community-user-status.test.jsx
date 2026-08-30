import React from 'react';
import {shallow} from 'enzyme';
import UserStatus, {userPresence} from '../../src/community/components/UserStatus.jsx';

describe('community user status', () => {
    test('shows a presence indicator beside a custom status', () => {
        const wrapper = shallow(<UserStatus status={{presence: 'online', status: 'warping'}} />);

        expect(wrapper.find('[role="img"]').prop('aria-label')).toBe('Online');
        expect(wrapper.find('RichText').prop('text')).toBe('warping');
    });

    test('uses the presence label when the custom status is visually blank', () => {
        expect(userPresence({presence: 'idle', status: '\u2800'})).toEqual({
            presence: 'idle',
            presenceLabel: 'Idle',
            text: 'Idle'
        });
    });

    test('treats unknown presence values as offline', () => {
        expect(userPresence({presence: 'invisible'})).toEqual({
            presence: 'offline',
            presenceLabel: 'Offline',
            text: 'Offline'
        });
    });
});
