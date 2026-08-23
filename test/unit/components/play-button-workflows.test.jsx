import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

import PlayButton from '../../../src/components/play-button/play-button.jsx';

describe('sound preview play button', () => {
    test('uses a native button with the current action as its label', () => {
        const wrapper = mountWithIntl(
            <PlayButton
                isPlaying={false}
                onClick={() => {}}
                onMouseDown={() => {}}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                setButtonRef={() => {}}
            />
        );
        const button = wrapper.find('button');

        expect(button.prop('type')).toBe('button');
        expect(button.prop('aria-label')).toBe('Play');
        wrapper.setProps({isPlaying: true});
        expect(wrapper.find('button').prop('aria-label')).toBe('Stop');
    });
});
