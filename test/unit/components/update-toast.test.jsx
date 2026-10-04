import React from 'react';
import configureStore from 'redux-mock-store';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {finishUpdate, UpdateToast} from '../../../src/components/update-toast/update-toast.jsx';

const mountToast = projectChanged => {
    const store = configureStore()({
        locales: {isRtl: false, locale: 'en', messages: {}},
        scratchGui: {projectChanged}
    });
    const wrapper = mountWithIntl(<UpdateToast />, {context: {store}});
    wrapper.setState({deployedId: 'abcdef0123456'});
    return wrapper;
};

describe('update toast', () => {
    test('hides build ids in a tooltip and can be dismissed', () => {
        const wrapper = mountToast(false);
        expect(wrapper.text()).toContain('A new version of MistWarp is available. Reload to update.');
        expect(wrapper.text()).not.toContain('abcdef0');
        expect(wrapper.find('[title]').first()
            .prop('title')).toContain('abcdef0');

        wrapper.find('button').filterWhere(node => node.text() === 'Later')
            .simulate('click');
        expect(wrapper.html()).toBeNull();
    });

    test('suggests saving first when the project has unsaved changes', () => {
        const wrapper = mountToast(true);
        expect(wrapper.text()).toContain('You have unsaved changes, so save your project before reloading.');
    });

    test('reloading leaves caches alone until the new page has loaded', () => {
        const originalLocation = window.location;
        const replace = jest.fn();
        const keys = jest.fn(() => Promise.resolve([]));
        window.caches = {keys, delete: jest.fn()};
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {href: 'https://example.com/editor#1', replace}
        });
        try {
            const wrapper = mountToast(true);
            wrapper.find('button').filterWhere(node => node.text() === 'Reload')
                .simulate('click');
            expect(replace).toHaveBeenCalledWith('https://example.com/editor?mw-update=abcdef0123456#1');
            expect(keys).not.toHaveBeenCalled();
        } finally {
            Object.defineProperty(window, 'location', {configurable: true, value: originalLocation});
            delete window.caches;
        }
    });

    test('the next page load clears old caches and tidies the URL', async () => {
        window.history.replaceState(null, '', '/editor?mw-update=abc&x=1#5');
        const deleted = [];
        window.caches = {
            keys: () => Promise.resolve(['mistwarp-cache-v2', 'other', 'mistwarp-runtime-v2']),
            delete: name => {
                deleted.push(name);
                return Promise.resolve(true);
            }
        };
        try {
            await finishUpdate();
            expect(deleted).toEqual(['mistwarp-cache-v2', 'mistwarp-runtime-v2']);
            expect(window.location.search).toBe('?x=1');
            expect(window.location.hash).toBe('#5');

            deleted.length = 0;
            await finishUpdate();
            expect(deleted).toEqual([]);
        } finally {
            delete window.caches;
            window.history.replaceState(null, '', '/');
        }
    });
});
