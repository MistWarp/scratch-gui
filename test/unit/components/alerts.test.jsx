import React from 'react';
import {shallow} from 'enzyme';
import AlertsComponent from '../../../src/components/alerts/alerts.jsx';
import InlineMessageComponent from '../../../src/components/alerts/inline-message.jsx';

describe('AlertsComponent', () => {
    test('alerts are keyed by id and sit in a polite live region', () => {
        const wrapper = shallow(
            <AlertsComponent
                alertsList={[
                    {alertId: 'saving', level: 'info'},
                    {extensionId: 'microbit', level: 'warn'},
                    {alertId: 'saving', level: 'info'}
                ]}
                onCloseAlert={jest.fn()}
            />
        );
        expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true);
        expect(wrapper.find('Connect(Alert)').map(alert => alert.key()))
            .toEqual(['saving', 'extension-microbit', 'saving-2']);
    });
});

describe('InlineMessageComponent', () => {
    test('is announced, and a warning interrupts', () => {
        expect(shallow(<InlineMessageComponent level="info" />).prop('role')).toBe('status');
        expect(shallow(<InlineMessageComponent level="warn" />).prop('role')).toBe('alert');
    });
});
