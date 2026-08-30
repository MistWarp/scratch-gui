import React from 'react';
import {render, shallow} from 'enzyme';

import DiffView, {OpenFileButton, parseDiff} from '../../src/community/components/DiffView.jsx';

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

describe('DiffView', () => {
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

    test('shows assets as compact rows and source files as collapsible sections', () => {
        const wrapper = render(<DiffView diff={SAMPLE_DIFF} />);

        expect(wrapper.text()).toContain('2 files changed');
        expect(wrapper.text()).toContain('Sprite/main.fractch');
        expect(wrapper.text()).toContain('Sprite/assets/costume.svg');
        expect(wrapper.text()).toContain('Asset changed');
        expect(wrapper.find('details')).toHaveLength(1);
        const code = wrapper.find('code');
        expect(Array.from({length: code.length}, (_, index) => code.eq(index).text())).toEqual([
            'say "old";',
            'say "new";',
            'wait 1;'
        ]);
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
