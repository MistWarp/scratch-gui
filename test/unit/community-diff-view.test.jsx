import React from 'react';
import {mount, render, shallow} from 'enzyme';

import DiffView, {AssetCompare, OpenFileButton, parseDiff} from '../../src/community/components/DiffView.jsx';
import {classifyAssetFile, formatAssetSize} from '../../src/community/asset-media.js';

const SAMPLE_DIFF = [
    'diff --mwp a/Sprite/main.fractch b/Sprite/main.fractch',
    '--- a/Sprite/main.fractch',
    '+++ b/Sprite/main.fractch',
    '@@ -2,1 +2,2 @@',
    '-say "old";',
    '+say "new";',
    '+wait 1;',
    'diff --mwp a/Sprite/assets/costume.svg b/Sprite/assets/costume.svg',
    'Binary file changed'
].join('\n');

const SOUND_DIFF = [
    'diff --mwp a/Sprite/assets/pop.wav b/Sprite/assets/pop.wav',
    '--- a/Sprite/assets/pop.wav',
    '+++ b/Sprite/assets/pop.wav',
    'Binary file changed'
].join('\n');

const VAR_DIFF = [
    'diff --mwp a/Sprite/main.fractch b/Sprite/main.fractch',
    '--- a/Sprite/main.fractch',
    '+++ b/Sprite/main.fractch',
    '@@ -1,2 +1,2 @@',
    '-var score = 14 id "abc";',
    '+var score = 13 id "abc";'
].join('\n');

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('DiffView', () => {
    beforeEach(() => {
        global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
        global.URL.revokeObjectURL = jest.fn();
    });

    test('groups changes by file and counts changed lines', () => {
        expect(parseDiff(SAMPLE_DIFF)).toEqual([
            expect.objectContaining({
                path: 'Sprite/main.fractch',
                additions: 2,
                deletions: 1,
                binary: false
            }),
            expect.objectContaining({
                path: 'Sprite/assets/costume.svg',
                additions: 0,
                deletions: 0,
                binary: true
            })
        ]);
    });

    test('classifies changed files into code, costumes, and sounds', () => {
        expect(classifyAssetFile('Sprite/main.fractch')).toBe('code');
        expect(classifyAssetFile('project.sb3')).toBe('code');
        expect(classifyAssetFile('Sprite/assets/costume.svg')).toBe('costumes');
        expect(classifyAssetFile('Stage/assets/backdrop.png')).toBe('costumes');
        expect(classifyAssetFile('Sprite/assets/pop.wav')).toBe('sounds');
        expect(classifyAssetFile('Sprite/assets/theme.mp3')).toBe('sounds');
    });

    test('formats asset byte sizes', () => {
        expect(formatAssetSize(512)).toBe('512 B');
        expect(formatAssetSize(2048)).toBe('2.0 KB');
        expect(formatAssetSize(3 * 1024 * 1024)).toBe('3.0 MB');
    });

    test('shows source files on the code tab and assets as compact rows without a loader', () => {
        const wrapper = render(<DiffView diff={SAMPLE_DIFF} />);

        expect(wrapper.text()).toContain('2 files changed');
        expect(wrapper.text()).toContain('Code');
        expect(wrapper.text()).toContain('Costumes');
        expect(wrapper.text()).toContain('Sounds');
        expect(wrapper.text()).toContain('Sprite/main.fractch');
        expect(wrapper.find('details')).toHaveLength(1);
        const code = wrapper.find('code');
        expect(Array.from({length: code.length}, (_, index) => code.eq(index).text())).toEqual([
            'say "old";',
            'say "new";',
            'wait 1;'
        ]);
    });

    test('switches between code, costumes, and sounds tabs', () => {
        const wrapper = mount(<DiffView diff={`${SAMPLE_DIFF}\n${SOUND_DIFF}`} />);
        const tabs = () => wrapper.find('button[role="tab"]');

        expect(tabs()).toHaveLength(3);
        expect(tabs().map(tab => tab.text())).toEqual(['Code 1', 'Costumes 1', 'Sounds 1']);
        expect(wrapper.text()).toContain('Sprite/main.fractch');
        expect(wrapper.text()).not.toContain('costume.svg');

        tabs().at(1).simulate('click');
        wrapper.update();
        expect(wrapper.text()).toContain('costume.svg');
        expect(wrapper.text()).toContain('Asset changed');
        expect(wrapper.text()).not.toContain('Sprite/main.fractch');

        tabs().at(2).simulate('click');
        wrapper.update();
        expect(wrapper.text()).toContain('pop.wav');
        expect(wrapper.text()).not.toContain('costume.svg');
        wrapper.unmount();
    });

    test('compares asset versions side by side with before and after sizes', async () => {
        const loadAsset = jest.fn((side, path) => Promise.resolve({
            bytes: new Uint8Array(side === 'old' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6]),
            mediaType: 'image/png'
        }));
        const wrapper = mount(
            <AssetCompare file={{path: 'Sprite/assets/costume.png', status: 'Modified'}} loadAsset={loadAsset} />
        );

        expect(wrapper.text()).toContain('Before');
        expect(wrapper.text()).toContain('After');
        await flush();
        await flush();
        wrapper.update();

        expect(loadAsset).toHaveBeenCalledWith('old', 'Sprite/assets/costume.png');
        expect(loadAsset).toHaveBeenCalledWith('new', 'Sprite/assets/costume.png');
        expect(wrapper.find('img')).toHaveLength(2);
        expect(wrapper.text()).toContain('4 B');
        expect(wrapper.text()).toContain('6 B');
        wrapper.unmount();
    });

    test('marks the missing side for added and removed assets', async () => {
        const loadAsset = jest.fn(() => Promise.resolve({bytes: new Uint8Array([9, 9]), mediaType: 'audio/wav'}));
        const added = mount(
            <AssetCompare file={{path: 'Sprite/assets/pop.wav', status: 'Added'}} loadAsset={loadAsset} />
        );
        await flush();
        added.update();

        expect(loadAsset).not.toHaveBeenCalledWith('old', expect.anything());
        expect(added.text()).toContain('New in this commit.');
        expect(added.find('audio')).toHaveLength(1);
        expect(added.text()).toContain('2 B');
        added.unmount();

        const removed = mount(
            <AssetCompare file={{path: 'Sprite/assets/pop.wav', status: 'Deleted'}} loadAsset={loadAsset} />
        );
        await flush();
        removed.update();
        expect(removed.text()).toContain('Removed in this commit.');
        removed.unmount();
    });

    test('filters by sprite and drops fully covered code cards', () => {
        const before = 'sprite "Cat" at 10,20 layer 1;\nvar score = 14 id "abc";\nwhen flag {\n  score = 0;\n}\n';
        const after = 'sprite "Cat" at 10,20 layer 1;\nvar score = 13 id "abc";\nwhen flag {\n  score = 0;\n}\n';
        const texts = {'Sprite/main.fractch': {before, after}};
        const wrapper = mount(<DiffView diff={VAR_DIFF} fileTexts={texts} />);

        expect(wrapper.text()).toContain('"score" now starts at 13 instead of 14');
        expect(wrapper.find('details')).toHaveLength(0);

        wrapper.setProps({spriteFilter: 'Stage'});
        wrapper.update();
        expect(wrapper.text()).toContain('No code changes for Stage found.');
        wrapper.unmount();
    });

    test('counts summarized costumes and sounds in the tab badges', () => {
        const diff = [
            'diff --mwp a/Sprite/main.fractch b/Sprite/main.fractch',
            '--- a/Sprite/main.fractch',
            '+++ b/Sprite/main.fractch',
            '@@ -1,2 +1,2 @@',
            '-costume "a" file "assets/a.svg";',
            '-costume "b" file "assets/b.svg" current;',
            '+costume "a" file "assets/a.svg" current;',
            '+costume "b" file "assets/b.svg";'
        ].join('\n');
        const texts = {'Sprite/main.fractch': {
            before: 'sprite "Sprite" at 0,0;\ncostume "a" file "assets/a.svg";\ncostume "b" file "assets/b.svg" current;\n',
            after: 'sprite "Sprite" at 0,0;\ncostume "a" file "assets/a.svg" current;\ncostume "b" file "assets/b.svg";\n'
        }};
        const wrapper = mount(<DiffView diff={diff} fileTexts={texts} />);
        const tabs = () => wrapper.find('button[role="tab"]');

        expect(tabs().map(tab => tab.text())).toEqual(['Code 1', 'Costumes 1', 'Sounds 0']);
        tabs().at(1).simulate('click');
        wrapper.update();
        expect(wrapper.text()).toContain('Switched sprite to costume "a"');
        wrapper.unmount();
    });

    test('renders extension changes with icons from the library', () => {
        const diff = [
            'diff --mwp a/Stage/main.fractch b/Stage/main.fractch',
            '--- a/Stage/main.fractch',
            '+++ b/Stage/main.fractch',
            '@@ -1,1 +1,2 @@',
            ' stage;',
            '+use "mistwarpData";'
        ].join('\n');
        const wrapper = mount(
            <DiffView
                diff={diff}
                fileTexts={{'Stage/main.fractch': {before: 'stage;\n', after: 'stage;\nuse "mistwarpData";\n'}}}
            />
        );
        wrapper.update();

        expect(wrapper.text()).toContain('Extensions');
        expect(wrapper.text()).toContain('Extension "Game Data" added');
        expect(wrapper.find('img').length).toBeGreaterThan(0);
        expect(wrapper.text()).not.toContain('use "mistwarpData"');
        wrapper.unmount();
    });

    test('renders changed scripts as blocks', async () => {
        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
            measureText: text => ({width: String(text).length * 6})
        }));
        const diff = [
            'diff --mwp a/Sprite/main.fractch b/Sprite/main.fractch',
            '--- a/Sprite/main.fractch',
            '+++ b/Sprite/main.fractch',
            '@@ -1,3 +1,3 @@',
            ' when flag {',
            '-  move 10;',
            '+  move 20;',
            ' }'
        ].join('\n');
        const texts = {'Sprite/main.fractch': {
            before: 'when flag {\n  move 10;\n}\n',
            after: 'when flag {\n  move 20;\n}\n'
        }};
        const wrapper = mount(<DiffView diff={diff} fileTexts={texts} />);
        for (let round = 0; round < 8; round++) await new Promise(resolve => setTimeout(resolve, 0));
        wrapper.update();

        expect(wrapper.text()).toContain('when green flag clicked');
        expect(wrapper.html()).toMatch(/<svg/);
        expect(wrapper.find('details')).toHaveLength(0);
        expect(wrapper.text()).not.toContain('move 10;');
        delete HTMLCanvasElement.prototype.getContext;
        wrapper.unmount();
    });

    test('sorts summary-only sprites before sprites with code changes', () => {
        const diff = [
            'diff --mwp a/SpriteB/main.fractch b/SpriteB/main.fractch',
            '--- a/SpriteB/main.fractch',
            '+++ b/SpriteB/main.fractch',
            '@@ -1,1 +1,1 @@',
            '-say "old";',
            '+say "new";',
            'diff --mwp a/SpriteA/main.fractch b/SpriteA/main.fractch',
            '--- a/SpriteA/main.fractch',
            '+++ b/SpriteA/main.fractch',
            '@@ -1,1 +1,1 @@',
            '-var v = 1 id "a";',
            '+var v = 2 id "a";'
        ].join('\n');
        const wrapper = render(
            <DiffView
                diff={diff}
                fileTexts={{'SpriteA/main.fractch': {
                    before: 'var v = 1 id "a";\n',
                    after: 'var v = 2 id "a";\n'
                }}}
            />
        );

        expect(wrapper.find('section header strong').first().text()).toBe('SpriteA');
        expect(wrapper.find('section header strong').last().text()).toBe('SpriteB');
    });

    test('renders grouped change summaries above the code diff', () => {
        const before = 'sprite "Cat" at 10,20 layer 1;\nvar score = 14 id "abc";\nwhen flag {\n  score = 0;\n}\n';
        const after = 'sprite "Cat" at 10,20 layer 1;\nvar score = 13 id "abc";\nwhen flag {\n  score = 0;\n}\n';
        const wrapper = render(
            <DiffView diff={VAR_DIFF} fileTexts={{'Sprite/main.fractch': {before, after}}} />
        );

        expect(wrapper.text()).toContain('Variables');
        expect(wrapper.text()).toContain('"score" now starts at 13 instead of 14');
        expect(wrapper.text()).not.toContain('var score = 14');
        expect(wrapper.find('details')).toHaveLength(0);
    });

    test('offers historical file links when a file opener is provided', () => {
        const onOpenFile = jest.fn();
        const wrapper = shallow(
            <OpenFileButton file={{path: 'Sprite/main.fractch', status: 'Modified'}} onOpenFile={onOpenFile} />
        );

        expect(wrapper.text()).toBe('Open file');
        wrapper.simulate('click', {preventDefault: jest.fn(), stopPropagation: jest.fn()});
        expect(onOpenFile).toHaveBeenCalledWith('Sprite/main.fractch');
    });

    test('uses a plain status instead of a code panel for failed diffs', () => {
        const wrapper = shallow(<DiffView diff="Could not load diff." />);
        expect(wrapper.type()).toBe('p');
        expect(wrapper.text()).toBe('Could not load diff.');
    });
});
