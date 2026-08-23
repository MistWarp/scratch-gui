import React from 'react';
import {shallow} from 'enzyme';
import {AssetFile} from '../../../src/components/mw-assets-modal/asset-file';
import {AssetFolder} from '../../../src/components/mw-assets-modal/asset-tree';

const makeAssetFile = overrides => {
    const file = new AssetFile({
        dataFormat: 'png',
        fileName: 'cat.png',
        folder: 'sprites',
        index: 2,
        name: 'sprites/cat.png',
        onRename: jest.fn(),
        onSelectFile: jest.fn(),
        selected: false,
        size: 1,
        ...overrides
    });
    file.setState = (update, callback) => {
        file.state = {...file.state, ...update};
        if (callback) callback();
    };
    return file;
};

describe('custom asset filename editing', () => {
    test('buffers typing and renames once on blur', () => {
        const file = makeAssetFile();
        file.handleNameFocus();

        file.handleNameChange({target: {value: 'new'}});
        file.handleNameChange({target: {value: 'new-cat.png'}});

        expect(file.props.onRename).not.toHaveBeenCalled();
        file.handleNameBlur();
        expect(file.props.onRename).toHaveBeenCalledWith(2, 'sprites/new-cat.png');
    });

    test('selects the asset when its filename receives focus', () => {
        const onSelectFile = jest.fn();
        const file = makeAssetFile({onSelectFile});

        file.handleNameFocus();

        expect(onSelectFile).toHaveBeenCalledWith(2);
    });

    test('does not submit an empty filename', () => {
        const file = makeAssetFile();
        file.handleNameFocus();
        file.handleNameChange({target: {value: '   '}});

        file.handleNameBlur();

        expect(file.props.onRename).not.toHaveBeenCalled();
        expect(file.state.fileName).toBe('cat.png');
    });

    test('Escape restores the current filename before blurring', () => {
        const file = makeAssetFile();
        const target = {blur: jest.fn()};
        file.handleNameFocus();
        file.handleNameChange({target: {value: 'mistake.png'}});

        file.handleNameKeyDown({key: 'Escape', target});

        expect(file.state.fileName).toBe('cat.png');
        expect(target.blur).toHaveBeenCalledTimes(1);
    });
});

describe('custom asset folder controls', () => {
    test('separates folder selection from expanding and collapsing', () => {
        const onSelect = jest.fn();
        const wrapper = shallow(
            <AssetFolder
                node={{name: 'Sprites', path: 'Sprites', folders: new Map(), files: []}}
                isRoot={false}
                selected=""
                onSelect={onSelect}
                onSelectFile={() => {}}
                onMove={() => {}}
                onDropFiles={() => {}}
                onRename={() => {}}
            />
        );
        const buttons = wrapper.find('button');

        expect(buttons.at(0).prop('aria-expanded')).toBe(true);
        expect(buttons.at(0).prop('aria-label')).toBe('Collapse Sprites');
        buttons.at(1).simulate('click', {stopPropagation: jest.fn()});
        expect(onSelect).toHaveBeenCalledWith('Sprites');

        buttons.at(0).simulate('click', {stopPropagation: jest.fn()});
        wrapper.update();
        expect(wrapper.find('button').at(0).prop('aria-expanded')).toBe(false);
        expect(wrapper.find('button').at(0).prop('aria-label')).toBe('Expand Sprites');
    });
});
