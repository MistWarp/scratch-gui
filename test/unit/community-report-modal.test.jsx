import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import api from '../../src/community/api.js';
import ReportModal from '../../src/community/components/ReportModal.jsx';

const submit = async wrapper => {
    await act(async () => {
        wrapper.find('button').filterWhere(button => button.text() === 'Send report')
            .simulate('click');
        await Promise.resolve();
    });
    wrapper.update();
};

describe('community report dialog', () => {
    afterEach(() => jest.restoreAllMocks());

    test('sends one of Rotur\'s categories with the report', async () => {
        const report = jest.spyOn(api, 'report').mockResolvedValue({ok: true});
        const wrapper = mount(<ReportModal
            type="comment"
            target="c1"
            context="text"
            targetUser="bob"
            onClose={() => {}}
        />);
        wrapper.find('select').simulate('change', {target: {value: 'harassment'}});
        wrapper.find('textarea').simulate('change', {target: {value: 'keeps insulting me'}});
        await submit(wrapper);
        expect(report).toHaveBeenCalledWith('comment', 'c1', 'Harassment or bullying: keeps insulting me', 'text',
            'bob', 'harassment');
        wrapper.unmount();
    });

    test('offers the urgent categories, and says Rotur sees them straight away', async () => {
        const report = jest.spyOn(api, 'report').mockResolvedValue({ok: true});
        const wrapper = mount(<ReportModal
            type="user"
            target="bob"
            onClose={() => {}}
        />);
        const urgent = wrapper.find('optgroup').find('option')
            .map(option => option.prop('value'));
        expect(urgent).toEqual(['csea', 'threat_to_life', 'self_harm', 'terrorism']);
        expect(wrapper.text()).not.toContain('safety team');
        wrapper.find('select').simulate('change', {target: {value: 'threat_to_life'}});
        expect(wrapper.text()).toContain("Rotur's safety team sees this report straight away");
        await submit(wrapper);
        expect(report).toHaveBeenCalledWith('user', 'bob', "A threat to someone's life", undefined, undefined,
            'threat_to_life');
        wrapper.unmount();
    });

    test('labels the reason and details fields', () => {
        const wrapper = mount(<ReportModal
            type="comment"
            target="c1"
            onClose={() => {}}
        />);
        const labels = wrapper.find('label');
        expect(labels.at(0).prop('htmlFor')).toBe(wrapper.find('select').prop('id'));
        expect(labels.at(1).prop('htmlFor')).toBe(wrapper.find('textarea').prop('id'));
        expect(wrapper.find('select').prop('id')).toBeTruthy();
        wrapper.unmount();
    });
});
