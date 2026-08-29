import React from 'react';
import {shallow} from 'enzyme';

jest.mock('editor-msgs', () => ({'es-419': {}}));

import {BooleanSetting, UnwrappedSetting} from '../../../src/components/tw-settings-modal/setting';
import {CustomFPS} from '../../../src/components/tw-settings-modal/settings-modal.jsx';
import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';

describe('settings controls', () => {
    test('help control does not submit an enclosing form', () => {
        const setting = shallowWithIntl(
            <UnwrappedSetting
                help="More detail"
                primary="Setting"
            />
        );

        expect(setting.find('button').prop('type')).toBe('button');
    });

    test('help control expands and collapses the detail', () => {
        const setting = shallowWithIntl(
            <UnwrappedSetting
                help="More detail"
                primary="Setting"
            />
        );

        expect(setting.text()).not.toContain('More detail');
        setting.find('button').simulate('click');
        expect(setting.text()).toContain('More detail');
        expect(setting.find('button').prop('aria-expanded')).toBe(true);
        setting.find('button').simulate('click');
        expect(setting.text()).not.toContain('More detail');
    });

    test('boolean setting keeps the label and checkbox in one click target', () => {
        const setting = shallow(
            <BooleanSetting
                label="Show title"
                value
                onChange={() => {}}
            />
        );
        const label = setting.prop('primary');

        expect(label.type).toBe('label');
        expect(label.props.children[0].props.checked).toBe(true);
        expect(label.props.children[1]).toBe('Show title');
    });

    test('custom framerate input exposes its purpose and numeric type', () => {
        const setting = shallow(
            <CustomFPS
                framerate={30}
                onChange={jest.fn()}
                onCustomizeFramerate={jest.fn()}
            />
        );
        const primary = shallow(setting.prop('primary'));
        const customInput = primary.find('[aria-label="Custom framerate"]');

        expect(customInput).toHaveLength(1);
        expect(customInput.prop('type')).toBe('number');
    });
});
