import React from 'react';
import {shallow} from 'enzyme';

import ListMonitor from '../../../src/components/monitor/list-monitor.jsx';
import ListMonitorScroller from '../../../src/components/monitor/list-monitor-scroller.jsx';

const color = {background: '#fff', text: '#000'};

describe('list monitor controls', () => {
    test('uses a native add button and disables it in read-only monitors', () => {
        const wrapper = shallow(
            <ListMonitor
                categoryColor={color}
                draggable
                label="Items"
                value={[]}
                onAdd={() => {}}
            />
        );

        expect(wrapper.find('button[aria-label="Add list item"]').prop('disabled')).toBe(false);
        wrapper.setProps({draggable: false});
        expect(wrapper.find('button[aria-label="Add list item"]').prop('disabled')).toBe(true);
    });

    test('uses a native delete button while editing an item', () => {
        const scroller = new ListMonitorScroller({
            activeIndex: 0,
            activeValue: 'item',
            categoryColor: color,
            draggable: true,
            values: ['item'],
            onRemove: () => {}
        });
        const row = shallow(scroller.rowRenderer({index: 0, key: '0', style: {}}));

        expect(row.find('button[aria-label="Delete list item"]').prop('type')).toBe('button');
    });

    test('uses a native button to start editing an item', () => {
        const onActivate = jest.fn();
        const scroller = new ListMonitorScroller({
            activeIndex: null,
            activeValue: '',
            categoryColor: color,
            draggable: true,
            values: ['item'],
            onActivate
        });
        const row = shallow(scroller.rowRenderer({index: 0, key: '0', style: {}}));
        const edit = row.find('button[aria-label="Edit list item 1"]');

        expect(edit.prop('type')).toBe('button');
        edit.simulate('click');
        expect(onActivate).toHaveBeenCalledWith(0);
    });
});
