import React from 'react';
import {shallow} from 'enzyme';
import PlaytimeLibrary from '../../src/community/components/PlaytimeLibrary.jsx';

describe('Playtime library', () => {
    test('shows games in ranked order with their playtime', () => {
        const wrapper = shallow(<PlaytimeLibrary
            projects={[
                {id: 'one', title: 'Long game', owner: 'Alex', duration: 7200000, lastPlayed: Date.now()},
                {id: 'two', title: 'Short game', owner: 'Sam', duration: 1800000, lastPlayed: Date.now()}
            ]}
            total={2}
        />);

        const text = wrapper.text();
        expect(text.indexOf('Long game')).toBeLessThan(text.indexOf('Short game'));
        expect(text).toContain('by Alex 2h');
        expect(text).toContain('by Sam 30m');
    });

    test('does not expose projects when a library is private', () => {
        const wrapper = shallow(<PlaytimeLibrary visible={false} />);

        expect(wrapper.text()).toContain('This game library is private.');
        expect(wrapper.text()).toContain('chosen not to share what they play');
    });

    test('marks a private library as visible to its owner', () => {
        const wrapper = shallow(<PlaytimeLibrary
            projects={[{id: 'one', title: 'Game', owner: 'Alex', duration: 60000, lastPlayed: Date.now()}]}
            total={1}
            visible={false}
            self
        />);

        expect(wrapper.text()).toContain('Only visible to you');
        expect(wrapper.text()).toContain('1m');
    });
});
