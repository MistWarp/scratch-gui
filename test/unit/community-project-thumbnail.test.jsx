import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import ProjectThumbnail, {fallbackTitle} from '../../src/community/components/ProjectThumbnail.jsx';

describe('ProjectThumbnail', () => {
    test('only adds an ellipsis when the fallback title is truncated', () => {
        expect(fallbackTitle('Cat')).toBe('Cat');
        expect(fallbackTitle('Platformer')).toBe('Platf…');
    });

    test('retries after the thumbnail URL changes', () => {
        const wrapper = mount(<ProjectThumbnail project={{title: 'Game', thumbUrl: '/old.png'}} />);
        act(() => wrapper.find('img').prop('onError')({}));
        wrapper.update();
        expect(wrapper.find('img')).toHaveLength(0);

        act(() => {
            wrapper.setProps({project: {title: 'Game', thumbUrl: '/new.png'}});
        });
        wrapper.update();

        expect(wrapper.find('img').prop('src')).toBe('/new.png');
    });
});
