import React from 'react';
import {shallow} from 'enzyme';
import {FolderOpen} from 'lucide-react';

import {NavItem} from '../../../src/components/menu-bar/mw-editor-nav.jsx';

describe('editor navigation controls', () => {
    test('uses a native button without a manual keyboard handler', () => {
        const onClick = jest.fn();
        const wrapper = shallow(
            <NavItem
                icon={FolderOpen}
                title="My Stuff"
                onClick={onClick}
            />
        );

        expect(wrapper.type()).toBe('button');
        expect(wrapper.prop('type')).toBe('button');
        expect(wrapper.prop('onKeyDown')).toBeUndefined();
        wrapper.simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
