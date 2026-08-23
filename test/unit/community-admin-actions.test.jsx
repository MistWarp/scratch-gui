import React from 'react';
import {shallow} from 'enzyme';
import Modal from '../../src/community/components/ui/Modal.jsx';
import {AdminActionDialog} from '../../src/community/pages/Admin.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('admin action dialog', () => {
    test('keeps moderation input and confirmation inside the app', () => {
        const onChange = jest.fn();
        const onConfirm = jest.fn();
        const wrapper = shallow(
            <AdminActionDialog
                dialog={{
                    title: 'Warn user?',
                    action: 'Send warning',
                    fields: [{key: 'reason', label: 'Reason', value: '', multiline: true}]
                }}
                busy={false}
                error=""
                onChange={onChange}
                onCancel={jest.fn()}
                onConfirm={onConfirm}
            />
        );

        expect(wrapper.find(Modal).prop('title')).toBe('Warn user?');
        wrapper.find('textarea').simulate('change', {target: {value: 'Clear reason'}});
        expect(onChange).toHaveBeenCalledWith('reason', 'Clear reason');

        const actions = shallow(<div>{wrapper.find(Modal).prop('actions')}</div>);
        actions.find('button').at(1).simulate('click');
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test('disables dismissal and actions while the request is running', () => {
        const wrapper = shallow(
            <AdminActionDialog
                dialog={{title: 'Delete project?', action: 'Delete project', danger: true}}
                busy
                error="storage unavailable"
                onChange={jest.fn()}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        expect(wrapper.find(Modal).prop('dismissDisabled')).toBe(true);
        const content = shallow(<div>{wrapper.find(Modal).prop('children')}</div>);
        expect(content.text()).toContain('storage unavailable');
    });
});
