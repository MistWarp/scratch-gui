import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';

import SpriteSelectorItem from '../../../src/containers/sprite-selector-item';
import {SpriteSelectorItem as RawSpriteSelectorItem} from '../../../src/containers/sprite-selector-item.jsx';
import DeleteButton from '../../../src/components/delete-button/delete-button';
import DragConstants from '../../../src/lib/constants/drag-constants';
import {registerBackpackSaver} from '../../../src/lib/backpack/save-to-backpack';

describe('SpriteSelectorItem Container', () => {
    const mockStore = configureStore();
    let className;
    let costumeURL;
    let name;
    let onClick;
    let dispatchSetHoveredSprite;
    let onDeleteButtonClick;
    let selected;
    let id;
    let store;
    // Wrap this in a function so it gets test specific states and can be reused.
    const getContainer = function () {
        return (
            <Provider store={store}>
                <SpriteSelectorItem
                    className={className}
                    costumeURL={costumeURL}
                    dispatchSetHoveredSprite={dispatchSetHoveredSprite}
                    id={id}
                    name={name}
                    selected={selected}
                    onClick={onClick}
                    onDeleteButtonClick={onDeleteButtonClick}
                />
            </Provider>
        );
    };

    beforeEach(() => {
        store = mockStore({scratchGui: {
            hoveredTarget: {receivedBlocks: false, sprite: null},
            assetDrag: {dragging: false},
            collaboration: {spriteEditors: {}}
        }});
        className = 'ponies';
        costumeURL = 'https://scratch.mit.edu/foo/bar/pony';
        id = 1337;
        name = 'Pony sprite';
        onClick = jest.fn();
        onDeleteButtonClick = jest.fn();
        dispatchSetHoveredSprite = jest.fn();
        selected = true;
    });

    test('should delete the sprite', () => {
        const wrapper = mountWithIntl(getContainer());
        wrapper.find(DeleteButton).simulate('click');
        expect(onDeleteButtonClick).toHaveBeenCalledWith(1337);
    });

    test('ignores touch events before its tile ref is ready', () => {
        const item = Object.create(RawSpriteSelectorItem.prototype);
        item.ref = null;

        expect(() => item.handleTouchEnd({changedTouches: []})).not.toThrow();
    });
});

describe('SpriteSelectorItem add to backpack', () => {
    const makeItem = props => new RawSpriteSelectorItem({
        dispatchSetHoveredSprite: jest.fn(),
        onDrag: jest.fn(),
        receivedBlocks: false,
        ...props
    });

    test('offers add to backpack for costumes, sounds and sprites when a backpack is open', () => {
        const saver = jest.fn(() => Promise.resolve(true));
        const unregister = registerBackpackSaver(saver);
        const costume = {name: 'costume1', asset: {}};
        const item = makeItem({dragType: DragConstants.COSTUME, dragPayload: costume});
        const handler = item.render().props.onAddToBackpackButtonClick;
        expect(typeof handler).toBe('function');
        const event = {stopPropagation: jest.fn()};
        handler(event);
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(saver).toHaveBeenCalledWith({dragType: DragConstants.COSTUME, payload: costume});
        unregister();
    });

    test('does not offer it without a backpack or for other items', () => {
        expect(makeItem({dragType: DragConstants.SOUND, dragPayload: {}}).render().props
            .onAddToBackpackButtonClick).toBe(null);
        const unregister = registerBackpackSaver(jest.fn());
        expect(makeItem({dragType: DragConstants.BACKPACK_COSTUME, dragPayload: {}}).render().props
            .onAddToBackpackButtonClick).toBe(null);
        expect(makeItem({dragType: DragConstants.SPRITE}).render().props
            .onAddToBackpackButtonClick).toBe(null);
        unregister();
    });
});
