import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

import LoadedExtensionsList from '../../../src/components/loaded-extensions-list/loaded-extensions-list.jsx';

const extension = {
    id: 'pen',
    name: 'Pen',
    blockCount: 4
};

describe('loaded extension controls', () => {
    test('renders selectable extensions as buttons', () => {
        const onExtensionClick = jest.fn();
        const wrapper = mountWithIntl(
            <LoadedExtensionsList
                extensions={[extension]}
                onExtensionClick={onExtensionClick}
            />
        );
        const item = wrapper.find('button[data-extension-id="pen"]');

        expect(item.prop('type')).toBe('button');
        item.simulate('click');
        expect(onExtensionClick).toHaveBeenCalledWith('pen');
    });

    test('does not render a fake control without a selection action', () => {
        const wrapper = mountWithIntl(<LoadedExtensionsList extensions={[extension]} />);

        expect(wrapper.find('button[data-extension-id="pen"]')).toHaveLength(0);
        expect(wrapper.find('[data-extension-id="pen"]').hostNodes().getDOMNode().tagName).toBe('DIV');
    });
});
