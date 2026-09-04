import React from 'react';
import {mount} from 'enzyme';

import BlocksCompare, {BLOCKS_PREVIEW_SCALE} from '../../src/community/components/BlocksCompare.jsx';

const mockCanvas = () => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
        measureText: text => ({width: String(text).length * 6})
    }));
};

const flush = async (rounds = 8) => {
    for (let round = 0; round < rounds; round++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    await new Promise(resolve => setTimeout(resolve, 20));
};

describe('BlocksCompare', () => {
    let getBoundingClientRect;

    beforeEach(() => {
        mockCanvas();
        getBoundingClientRect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = jest.fn(() => ({
            top: 10,
            left: 0,
            right: 400,
            bottom: 42,
            width: 400,
            height: 32
        }));
    });

    afterEach(() => {
        Element.prototype.getBoundingClientRect = getBoundingClientRect;
    });

    test('renders one script with red and green change rows', async () => {
        expect(BLOCKS_PREVIEW_SCALE).toBe(0.65);
        const wrapper = mount(
            <BlocksCompare source={'when green flag clicked\n- move (10) steps\n+ move (20) steps'} />
        );
        await flush();
        wrapper.update();

        expect((wrapper.html().match(/<svg/g) || [])).toHaveLength(1);
        expect(wrapper.html()).toMatch(/sb3?-diff-del/);
        expect(wrapper.html()).toMatch(/sb3?-diff-ins/);
        wrapper.unmount();
    });

    test('renders nested changed blocks in the same script', async () => {
        const wrapper = mount(
            <BlocksCompare
                source={[
                    'when [timer v] > (-1)',
                    'forever',
                    '-   wait until <not <>>',
                    '+   wait until <(answer) = [ready]>',
                    'end'
                ].join('\n')}
            />
        );
        await flush();
        wrapper.update();

        expect((wrapper.html().match(/<svg/g) || [])).toHaveLength(1);
        expect(wrapper.html()).toMatch(/sb3?-diff-del/);
        expect(wrapper.html()).toMatch(/sb3?-diff-ins/);
        wrapper.unmount();
    });

    test('keeps dropdown arrows in changed blocks', async () => {
        const wrapper = mount(
            <BlocksCompare source={'when green flag clicked\n+ switch costume to [boykisser v]'} />
        );
        await flush();
        wrapper.update();

        expect(wrapper.html()).toMatch(/sb3?-input-dropdown/);
        wrapper.unmount();
    });
});
