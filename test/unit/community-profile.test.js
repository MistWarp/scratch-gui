import React from 'react';
import {shallow} from 'enzyme';
import {
    DonateModal,
    parseDonationAmount,
    profileLoadMessage,
    scrollToCommentAnchor
} from '../../src/community/pages/Profile.jsx';
import Modal from '../../src/community/components/ui/Modal.jsx';
import {payUser} from '../../src/lib/rotur/client.js';

jest.mock('../../src/lib/rotur/client.js', () => ({
    payUser: jest.fn(() => Promise.resolve())
}));

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('Profile loading', () => {
    test('distinguishes a missing account from an outage', () => {
        expect(profileLoadMessage({status: 404})).toBe('This user does not exist on Rotur.');
        expect(profileLoadMessage({status: 503})).toBe('Could not load this profile.');
    });

    test('cancels pending comment-anchor retries when leaving the profile', () => {
        jest.useFakeTimers();
        const originalGetElementById = document.getElementById;
        document.getElementById = jest.fn(() => null);

        const cancel = scrollToCommentAnchor('comment-1');
        expect(document.getElementById).toHaveBeenCalledTimes(1);
        cancel();
        jest.advanceTimersByTime(6000);
        expect(document.getElementById).toHaveBeenCalledTimes(1);

        document.getElementById = originalGetElementById;
        jest.useRealTimers();
    });

    test('rejects non-finite donations and rounds valid credit amounts', () => {
        expect(parseDonationAmount('Infinity')).toBeNull();
        expect(parseDonationAmount('1e309')).toBeNull();
        expect(parseDonationAmount('-2')).toBeNull();
        expect(parseDonationAmount('1.239')).toBe(1.24);
    });

    test('submits fractional credit donations as a form', async () => {
        const wrapper = shallow(<DonateModal recipient="Alex" onClose={() => {}} />);
        let content = shallow(<div>{wrapper.find(Modal).prop('children')}</div>);
        const amountInput = content.find('input');

        expect(amountInput.prop('min')).toBe('0.01');
        expect(amountInput.prop('step')).toBe('0.01');
        amountInput.prop('onChange')({target: {value: '1.25'}});
        wrapper.update();
        content = shallow(<div>{wrapper.find(Modal).prop('children')}</div>);

        const preventDefault = jest.fn();
        await content.find('form').prop('onSubmit')({preventDefault});

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(payUser).toHaveBeenCalledWith('Alex', 1.25, 'MistWarp donation to Alex');
    });
});
