import React from 'react';
import configureStore from 'redux-mock-store';

import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import Selector from '../../../src/components/asset-panel/selector.jsx';
import SpriteSelectorItemComponent from '../../../src/components/sprite-selector-item/sprite-selector-item.jsx';
import DeleteButton from '../../../src/components/delete-button/delete-button.jsx';
import DragConstants from '../../../src/lib/constants/drag-constants';

const makeStore = () => configureStore()({
    locales: {isRtl: false, locale: 'en', messages: {}},
    scratchGui: {
        assetDrag: {dragging: false},
        collaboration: {activity: {}},
        editorTab: {activeTabIndex: 1},
        hoveredTarget: {receivedBlocks: false, sprite: null},
        vm: {editingTarget: {id: 'sprite'}}
    }
});

const mountSelector = props => mountWithIntl(
    <Selector
        buttons={[]}
        items={[
            {name: 'first', url: 'first.svg', details: '480 x 360'},
            {name: 'second', url: 'second.svg', details: '10 x 10'}
        ]}
        selectedItemIndex={1}
        onDeleteClick={jest.fn()}
        onItemClick={jest.fn()}
        {...props}
    />,
    {context: {store: makeStore()}}
);

describe('asset selector', () => {
    test('shows costumes as cards', () => {
        const wrapper = mountSelector({dragType: DragConstants.COSTUME});
        const items = wrapper.find(SpriteSelectorItemComponent);

        expect(items).toHaveLength(2);
        items.forEach(item => expect(item.prop('layout')).toBe('card'));
    });

    test('shows sounds as rows', () => {
        const wrapper = mountSelector({dragType: DragConstants.SOUND});

        wrapper.find(SpriteSelectorItemComponent).forEach(item => expect(item.prop('layout')).toBe('row'));
    });

    test('names and numbers every item and offers delete on the selected one only', () => {
        const onDeleteClick = jest.fn();
        const wrapper = mountSelector({dragType: DragConstants.COSTUME, onDeleteClick});
        const items = wrapper.find(SpriteSelectorItemComponent);

        expect(items.at(0).prop('name')).toBe('first');
        expect(items.at(0).prop('number')).toBe(1);
        expect(items.at(1).prop('number')).toBe(2);
        expect(items.at(0).find(DeleteButton)).toHaveLength(0);
        expect(items.at(1).find(DeleteButton)).toHaveLength(1);

        items.at(1).find(DeleteButton)
            .find('button')
            .simulate('click');
        expect(onDeleteClick).toHaveBeenCalledWith(1);
    });
});
