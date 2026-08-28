import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import ProfileBadges from '../../src/community/components/ProfileBadges.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/rotur.js', () => ({
    badgePreferences: jest.fn(),
    updateBadgePreferences: jest.fn()
}));

const openEditor = async () => {
    const wrapper = mount(<ProfileBadges badges={[]} editable onChange={jest.fn()} />);
    wrapper.find('button[aria-label="Edit badge order and visibility"]').simulate('click');
    await act(async () => {
        await Promise.resolve();
    });
    wrapper.update();
    return wrapper;
};

describe('profile badge editor actions', () => {
    beforeEach(() => jest.clearAllMocks());

    test('locks rapid duplicate preference writes', async () => {
        rotur.badgePreferences.mockResolvedValue({
            badges: [{id: 'builder', name: 'Builder', description: 'Build things'}],
            preferences: {hidden_badges: [], badge_order: ['builder']}
        });
        let finishSave;
        rotur.updateBadgePreferences.mockReturnValue(new Promise(resolve => {
            finishSave = resolve;
        }));
        const wrapper = await openEditor();
        const hide = wrapper.find('button[aria-label="Hide Builder"]').prop('onClick');

        act(() => {
            hide();
            hide();
        });
        expect(rotur.updateBadgePreferences).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishSave({badges: [], preferences: {hidden_badges: ['builder']}, visible_badges: []});
            await Promise.resolve();
        });
        wrapper.unmount();
    });

    test('does not update state when loading finishes after unmount', async () => {
        let finishLoad;
        rotur.badgePreferences.mockReturnValue(new Promise(resolve => {
            finishLoad = resolve;
        }));
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});
        const wrapper = mount(<ProfileBadges badges={[]} editable onChange={jest.fn()} />);
        wrapper.find('button[aria-label="Edit badge order and visibility"]').simulate('click');
        wrapper.unmount();

        await act(async () => {
            finishLoad({badges: [], preferences: {}});
            await Promise.resolve();
        });

        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
    });
});
