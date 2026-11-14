import React from 'react';
import configureStore from 'redux-mock-store';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

import SpriteSelector from '../../../src/components/sprite-selector/sprite-selector.jsx';
import {STAGE_DISPLAY_SIZES} from '../../../src/lib/constants/layout-constants.js';
import {Theme} from '../../../src/lib/themes';

describe('SpriteSelector', () => {
    const store = configureStore()({
        locales: {isRtl: false, locale: 'en', messages: {}},
        scratchGui: {
            assetDrag: {dragging: false, currentOffset: null, dragType: null, index: null},
            collaboration: {spriteEditors: {}},
            hoveredTarget: {receivedBlocks: false, sprite: null},
            theme: {theme: new Theme()}
        }
    });
    const mount = overrides => {
        const props = {
            hoveredTarget: {hoveredSprite: null, receivedBlocks: false, sprite: null},
            sprites: {},
            stageSize: STAGE_DISPLAY_SIZES.large,
            onChangeSpriteDirection: jest.fn(),
            onChangeSpriteName: jest.fn(),
            onChangeSpriteRotationStyle: jest.fn(),
            onChangeSpriteSize: jest.fn(),
            onChangeSpriteVisibility: jest.fn(),
            onChangeSpriteX: jest.fn(),
            onChangeSpriteY: jest.fn(),
            onDeleteSprite: jest.fn(),
            onDrop: jest.fn(),
            onDuplicateSprite: jest.fn(),
            onExportSprite: jest.fn(),
            onFileUploadClick: jest.fn(),
            onNewSpriteClick: jest.fn(),
            onPaintSpriteClick: jest.fn(),
            onSelectSprite: jest.fn(),
            onSpriteUpload: jest.fn(),
            onSurpriseSpriteClick: jest.fn(),
            spriteFileInput: jest.fn(),
            ...overrides
        };
        return {props, wrapper: mountWithIntl(<SpriteSelector {...props} />, {context: {store}})};
    };

    test('a project with no sprites says so and offers the sprite library', () => {
        const {props, wrapper} = mount();
        expect(wrapper.text()).toContain('This project has no sprites yet.');
        const button = wrapper.find('button').filterWhere(node => node.text() === 'Choose a Sprite');
        expect(button.length).toBe(1);
        button.simulate('click');
        expect(props.onNewSpriteClick).toHaveBeenCalledTimes(1);
    });

    test('a project with sprites lists them instead', () => {
        const {wrapper} = mount({
            selectedId: 'a',
            sprites: {a: {id: 'a', name: 'Cat', order: 0, x: 1, y: 2, size: 100, direction: 90, visible: true}}
        });
        expect(wrapper.text()).not.toContain('This project has no sprites yet.');
        expect(wrapper.text()).toContain('Cat');
    });
});
