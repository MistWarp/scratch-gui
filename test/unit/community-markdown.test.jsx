import React from 'react';
import {shallow} from 'enzyme';

import Markdown, {markdownBlocks} from '../../src/community/components/Markdown.jsx';

describe('community Markdown', () => {
    test('parses blog structure without accepting raw HTML', () => {
        expect(markdownBlocks('# Heading\n\n- one\n- two\n\n```js\nalert(1)\n```')).toEqual([
            {type: 'heading', level: 1, text: 'Heading'},
            {type: 'list', ordered: false, items: ['one', 'two']},
            {type: 'code', language: 'js', text: 'alert(1)'}
        ]);

        const wrapper = shallow(<Markdown>{'<script>alert(1)</script>'}</Markdown>);
        expect(wrapper.find('script')).toHaveLength(0);
        expect(wrapper.text()).toContain('<script>alert(1)</script>');
    });

    test('only makes safe links clickable', () => {
        const wrapper = shallow(
            <Markdown>{'[safe](/news/post) [unsafe](javascript:alert(1))'}</Markdown>
        );

        expect(wrapper.find('a')).toHaveLength(1);
        expect(wrapper.find('a').prop('href')).toBe('/news/post');
        expect(wrapper.text()).toContain('[unsafe](javascript:alert(1))');
    });
});
