import React from 'react';
import {shallow} from 'enzyme';
import {
    DonateModal,
    mergeProjects,
    parseDonationAmount,
    profileLoadMessage,
    scrollToCommentAnchor
} from '../../src/community/pages/Profile.jsx';
import Modal from '../../src/community/components/ui/Modal.jsx';
import {payUser} from '../../src/lib/rotur/client.js';
import {badgePercent, badgeTooltipPosition} from '../../src/community/components/ProfileBadges.jsx';
import {
    postMetricCount,
    postTimestamp,
    pouncePostUrl,
    sortProfilePosts
} from '../../src/community/components/ProfilePosts.jsx';

jest.mock('../../src/lib/rotur/client.js', () => ({
    payUser: jest.fn(() => Promise.resolve())
}));

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('Profile loading', () => {
    test('merges later project pages without duplicating a featured project', () => {
        expect(mergeProjects(
            [{id: 'featured', title: 'Old'}, {id: 'one'}],
            [{id: 'featured', title: 'Updated'}, {id: 'two'}]
        )).toEqual([
            {id: 'featured', title: 'Updated'},
            {id: 'one'},
            {id: 'two'}
        ]);
    });

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

describe('Profile badges and posts', () => {
    test('clamps evolving badge progress', () => {
        expect(badgePercent({evolving: true, progress: 25, next_threshold: 100})).toBe(25);
        expect(badgePercent({evolving: true, progress: 120, next_threshold: 100})).toBe(100);
        expect(badgePercent({evolving: false, progress: 25, next_threshold: 100})).toBe(0);
    });

    test('centers badge tooltips and keeps them inside the viewport', () => {
        expect(badgeTooltipPosition({left: 146, top: 200, width: 28}, 320)).toMatchObject({
            left: 160,
            arrowOffset: 0
        });
        expect(badgeTooltipPosition({left: 10, top: 200, width: 28}, 320)).toMatchObject({
            left: 137,
            arrowOffset: -113
        });
        expect(badgeTooltipPosition({left: 286, top: 200, width: 28}, 320)).toMatchObject({
            left: 183,
            arrowOffset: 117
        });
    });

    test('sorts pinned posts first and each group newest first', () => {
        const posts = [
            {id: 'old', timestamp: 100},
            {id: 'pin', timestamp: 200, pinned: true},
            {id: 'new', timestamp: 300}
        ];
        expect(sortProfilePosts(posts).map(post => post.id)).toEqual(['pin', 'new', 'old']);
    });

    test('normalizes post metadata and links', () => {
        expect(postMetricCount(['a', 'b'])).toBe(2);
        expect(postMetricCount(4)).toBe(4);
        expect(postTimestamp(1724000000)).toBe(1724000000000);
        expect(postTimestamp(1724000000000)).toBe(1724000000000);
        expect(postTimestamp('not-a-date')).toBeNull();
        expect(postTimestamp()).toBeNull();
        expect(pouncePostUrl('post/id with spaces')).toBe(
            'https://pounce.rotur.dev/#/p/post%2Fid%20with%20spaces'
        );
    });
});
