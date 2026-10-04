import React from 'react';
import {mount} from 'enzyme';

import SectionTabs, {tabPanelProps} from '../../src/community/components/SectionTabs.jsx';

const items = [{key: 'new', label: 'Newest'}, {key: 'top', label: 'Top'}];

describe('SectionTabs', () => {
    test('links the active tab to its panel when given an id prefix', () => {
        const wrapper = mount(
            <SectionTabs items={items} value="top" onChange={() => {}} ariaLabel="Sections" idPrefix="feed" />
        );
        const tabs = wrapper.find('button[role="tab"]');
        expect(tabs.at(0).prop('id')).toBe('feed-tab-new');
        expect(tabs.at(0).prop('aria-controls')).toBeNull();
        expect(tabs.at(1).prop('aria-controls')).toBe('feed-panel-top');
        expect(tabPanelProps('feed', 'top')).toEqual({
            'role': 'tabpanel',
            'id': 'feed-panel-top',
            'aria-labelledby': 'feed-tab-top',
            'tabIndex': 0
        });
        wrapper.unmount();
    });

    test('renders filter controls as a group of pressed buttons', () => {
        const onChange = jest.fn();
        const wrapper = mount(
            <SectionTabs items={items} value="new" onChange={onChange} ariaLabel="Sort" variant="buttons" />
        );
        expect(wrapper.find('[role="tablist"]')).toHaveLength(0);
        expect(wrapper.find('[role="group"]').prop('aria-label')).toBe('Sort');
        const buttons = wrapper.find('button');
        expect(buttons.at(0).prop('aria-pressed')).toBe(true);
        expect(buttons.at(1).prop('aria-pressed')).toBe(false);
        expect(buttons.at(1).prop('role')).toBeUndefined();
        buttons.at(1).simulate('click');
        expect(onChange).toHaveBeenCalledWith('top');
        wrapper.unmount();
    });
});
