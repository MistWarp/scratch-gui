import React from 'react';
import {FormattedMessage, IntlProvider} from 'react-intl';
import {shallow} from 'enzyme';
import extensions from '../../../src/lib/libraries/extensions/index.jsx';
import extensionTags from '../../../src/lib/libraries/tw-extension-tags.js';
import {matchesExtensionQuery, messageText} from '../../../src/lib/libraries/extension-search.js';
import ExtensionLibrary from '../../../src/components/tw-extension-library/extension-library.jsx';

const {intl} = new IntlProvider({locale: 'en', messages: {}}, {}).getChildContext();
const byId = id => extensions.find(item => item.extensionId === id);
const search = query => extensions
    .filter(item => matchesExtensionQuery(item, query, intl))
    .map(item => item.extensionId);

describe('extension library search', () => {
    test('reads built-in names written as FormattedMessage elements', () => {
        expect(messageText(byId('pen').name, intl)).toBe('Pen');
        expect(messageText(<FormattedMessage
            defaultMessage="{name} Blocks"
            id="test.blocks"
            values={{name: 'MistWarp'}}
        />, intl)).toBe('MistWarp Blocks');
    });

    test('finds built-in extensions by name, description, tag, and id', () => {
        expect(search('pen')).toContain('pen');
        expect(search('draw with')).toContain('pen');
        expect(search('videosensing')).toContain('videoSensing');
        expect(search('rotur')).toContain('roturEconomy');
        expect(search('custom extension')).toContain('custom_extension');
    });

    test('matches every word of the query at the start of a word', () => {
        expect(search('pen music')).toEqual([]);
        expect(search('pen')).not.toContain('mistwarpMarketplace');
        expect(search('micro:bit')).toContain('microbit');
    });

    test('shows an empty state with a way to load a custom extension', () => {
        const onItemSelected = jest.fn();
        const Library = ExtensionLibrary.WrappedComponent;
        const wrapper = shallow(
            <Library
                data={extensions}
                intl={intl}
                tags={extensionTags}
                title="Choose an Extension"
                onItemSelected={onItemSelected}
            />
        );
        wrapper.setState({query: 'pen'});
        expect(wrapper.find('ExtensionCard').map(card => card.prop('item').extensionId)).toContain('pen');

        wrapper.setState({query: 'no extension has this name'});
        expect(wrapper.find('ExtensionCard').exists()).toBe(false);
        expect(wrapper.find('p').text()).toBe('No extensions match your search.');
        const button = wrapper.find('CustomExtensionButton');
        expect(button.prop('item').extensionId).toBe('custom_extension');
    });
});
