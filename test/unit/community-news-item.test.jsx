import React from 'react';
import {shallow} from 'enzyme';
import {Link} from 'react-router-dom';

import NewsItem, {safeNewsLink} from '../../src/community/components/NewsItem.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('NewsItem links', () => {
    const item = {id: 'news-1', title: 'Update', body: 'Details', created: Date.now()};

    test('uses client navigation for internal links', () => {
        const wrapper = shallow(
            <NewsItem item={{...item, link: {url: '/roadmap', label: 'Roadmap'}}} onChanged={jest.fn()} />
        );

        expect(wrapper.find(Link).prop('to')).toBe('/roadmap');
    });

    test('does not crash when optional link data has no URL', () => {
        expect(() => shallow(
            <NewsItem item={{...item, link: {label: 'Missing URL'}}} onChanged={jest.fn()} />
        )).not.toThrow();
    });

    test('drops unsafe or protocol-relative links', () => {
        expect(safeNewsLink({url: 'javascript:alert(1)'})).toBeNull();
        expect(safeNewsLink({url: '//example.com'})).toBeNull();
    });
});
