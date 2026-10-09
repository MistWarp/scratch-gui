import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import configureStore from 'redux-mock-store';
import SortableHOC from '../../../src/lib/components/sortable-hoc.jsx';

const List = ({containerRef}) => <div ref={containerRef} />;

const storeWithDrag = assetDrag => configureStore()({
    scratchGui: {assetDrag},
    locales: {isRtl: false}
});

describe('SortableHOC', () => {
    test('renders when it mounts in the middle of a drag', () => {
        const Sortable = SortableHOC(List);
        const store = storeWithDrag({dragging: true, currentOffset: {x: 10, y: 10}, index: 0});
        const wrapper = mount(
            <Provider store={store}>
                <Sortable items={[{name: 'Sprite1'}]} />
            </Provider>
        );
        expect(wrapper.find(List).prop('mouseOverIndex')).toBeNull();
    });
});
