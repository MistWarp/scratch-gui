import React from 'react';
import {shallow} from 'enzyme';

import {LibraryComponent} from '../../../src/components/library/library.jsx';

const intl = {
    formatDate: jest.fn(),
    formatHTMLMessage: jest.fn(),
    formatMessage: message => message.defaultMessage,
    formatNumber: jest.fn(),
    formatPlural: jest.fn(),
    formatRelative: jest.fn(),
    formatTime: jest.fn(),
    now: jest.fn()
};

describe('library search workflow', () => {
    test('shows an explicit empty state for a search with no matches', () => {
        const wrapper = shallow(
            <LibraryComponent
                data={[{name: 'Cat', tags: ['animals']}]}
                id="spriteLibrary"
                intl={intl}
                title="Choose a Sprite"
                onItemSelected={jest.fn()}
            />
        );
        wrapper.setState({
            canDisplay: true,
            filterQuery: 'spaceship',
            selectedTag: 'all'
        });

        expect(wrapper.contains('No matches found.')).toBe(true);
    });

    test('does not show removed-trademark content while searching', () => {
        const wrapper = shallow(
            <LibraryComponent
                removedTrademarks
                data={[{name: 'Cat', tags: ['animals']}]}
                id="spriteLibrary"
                intl={intl}
                title="Choose a Sprite"
                onItemSelected={jest.fn()}
            />
        );
        wrapper.setState({
            canDisplay: true,
            filterQuery: 'cat',
            selectedTag: 'all'
        });

        expect(wrapper.find('RemovedTrademarks')).toHaveLength(0);
    });
});
