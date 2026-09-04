import React from 'react';
import {mount} from 'enzyme';

import SpriteList, {
    currentCostumeAsset,
    groupFilesBySprite,
    spriteLabel
} from '../../src/community/components/SpriteList.jsx';

const FILES = [
    {path: 'Sprite3/main.fractch'},
    {path: 'Sprite3/assets/1.svg'},
    {path: 'Stage/main.fractch'},
    {path: 'README.md'}
];

describe('SpriteList', () => {
    test('groups changed files by sprite and labels the stage as global', () => {
        expect(groupFilesBySprite(FILES).map(group => group.name)).toEqual(['Sprite3', 'Stage', '']);
        expect(spriteLabel('Sprite3')).toBe('Sprite3');
        expect(spriteLabel('Stage')).toBe('Global');
        expect(spriteLabel('')).toBe('Other files');
    });

    test('lists sprites only, never the stage', () => {
        const onSelect = jest.fn();
        const wrapper = mount(<SpriteList files={FILES} onSelect={onSelect} />);

        expect(wrapper.text()).toContain('Sprite3');
        expect(wrapper.text()).not.toContain('Global');
        expect(wrapper.text()).not.toContain('Other files');
        expect(wrapper.find('button[aria-pressed]')).toHaveLength(1);

        wrapper.find('button').simulate('click');
        expect(onSelect).toHaveBeenCalledWith('Sprite3');
        wrapper.unmount();
    });

    test('marks the active sprite', () => {
        const wrapper = mount(<SpriteList files={FILES} activeSprite="Sprite3" onSelect={() => {}} />);
        const active = wrapper.find('button').filterWhere(row => row.prop('aria-pressed') === true);

        expect(active).toHaveLength(1);
        expect(active.text()).toContain('Sprite3');
        wrapper.unmount();
    });

    test('resolves the current costume asset for thumbnails', () => {
        const fileTexts = {
            'Sprite3/main.fractch': {
                after: 'sprite "Sprite3" at 0,0 layer 1;\ncostume "a" file "assets/a.svg";\ncostume "b" file "assets/b.svg" current;\n'
            }
        };

        expect(currentCostumeAsset('Sprite3', fileTexts)).toBe('Sprite3/assets/b.svg');
        expect(currentCostumeAsset('Missing', fileTexts)).toBe('');
        expect(currentCostumeAsset('Stage', {})).toBe('');
    });
});
