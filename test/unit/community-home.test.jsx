import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import {fetchNotifications} from '../../src/lib/rotur/client.js';
import {NotificationsSection} from '../../src/community/pages/Home.jsx';

jest.mock('../../src/lib/rotur/client.js', () => ({fetchNotifications: jest.fn()}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const Harness = ({user}) => (
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <NotificationsSection user={user} login={jest.fn()} />
    </MemoryRouter>
);

describe('home notification preview', () => {
    test('clears the previous account while the next account loads', async () => {
        fetchNotifications
            .mockResolvedValueOnce([{id: 'one', type: 'follow', actor: 'alice', created: Date.now()}])
            .mockReturnValueOnce(new Promise(() => {}));

        const wrapper = mount(<Harness user={{username: 'first'}} />);
        await act(async () => {
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.text()).toContain('alice');

        act(() => {
            wrapper.setProps({user: {username: 'second'}});
        });
        wrapper.update();

        expect(wrapper.text()).not.toContain('alice');
    });
});
