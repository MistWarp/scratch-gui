import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import Markdown, {markdownBlocks} from '../../src/community/components/Markdown.jsx';

const render = source => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <Markdown headingOffset={1}>{source}</Markdown>
    </MemoryRouter>
);

describe('community Markdown', () => {
    test('parses blog structure without accepting raw HTML', () => {
        expect(markdownBlocks('# Heading\n\n- one\n- two\n\n```js\nalert(1)\n```')).toEqual([
            {type: 'heading', level: 1, text: 'Heading'},
            {type: 'list', ordered: false, items: ['one', 'two']},
            {type: 'code', language: 'js', text: 'alert(1)'}
        ]);

        const wrapper = render('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>');
        expect(wrapper.find('script')).toHaveLength(0);
        expect(wrapper.find('img')).toHaveLength(0);
        expect(wrapper.text()).toContain('<script>alert(1)</script>');
        wrapper.unmount();
    });

    test('only makes safe links clickable, and sends outside links away safely', () => {
        const wrapper = render('[safe](/news/post) [out](https://example.com/a) [unsafe](javascript:alert(1)) ' +
            '[data](data:text/html,x) http://plain.test');
        const links = wrapper.find('a');

        expect(links.map(link => link.prop('href'))).toEqual(['/news/post', 'https://example.com/a']);
        expect(links.at(0).prop('target')).toBeUndefined();
        expect(links.at(1).prop('target')).toBe('_blank');
        expect(links.at(1).prop('rel')).toBe('noopener noreferrer');
        expect(wrapper.text()).toContain('[unsafe](javascript:alert(1))');
        expect(wrapper.text()).toContain('[data](data:text/html,x)');
        wrapper.unmount();
    });

    test('renders rich posts: headings under the page title, images, quotes and code', () => {
        const wrapper = render([
            '# Release 2', 'Some **bold** and _soft_ text with `code`.', '',
            '![The new editor](https://img.test/editor.png)', '',
            '> Quoted', '', '1. first', '2. second', '', '```', 'let x = 1;', '```',
            '', '![tracker](javascript:alert(1))'
        ].join('\n'));

        expect(wrapper.find('h2').text()).toBe('Release 2');
        expect(wrapper.find('h1')).toHaveLength(0);
        expect(wrapper.find('strong').text()).toBe('bold');
        expect(wrapper.find('em').text()).toBe('soft');
        expect(wrapper.find('figure img').props()).toMatchObject({src: 'https://img.test/editor.png', alt: 'The new editor'});
        expect(wrapper.find('img')).toHaveLength(1);
        expect(wrapper.find('blockquote').text()).toBe('Quoted');
        expect(wrapper.find('ol li').map(item => item.text())).toEqual(['first', 'second']);
        expect(wrapper.find('pre code').text()).toBe('let x = 1;');
        wrapper.unmount();
    });

    test('keeps plain text posts as paragraphs and line breaks', () => {
        const wrapper = render('Comment editing\nis here.\n\nhave fun :3');
        expect(wrapper.find('p')).toHaveLength(2);
        expect(wrapper.find('br')).toHaveLength(1);
        wrapper.unmount();
    });
});
