import {mergeNotifications} from '../../src/community/pages/Notifications.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('notification list merging', () => {
    test('keeps a realtime push while merging the initial fetch', () => {
        const pushed = {id: 'new', type: 'follow'};
        const fetched = [{id: 'old', type: 'comment'}, {id: 'new', type: 'follow'}];

        expect(mergeNotifications([pushed], fetched)).toEqual([
            pushed,
            {id: 'old', type: 'comment'}
        ]);
    });
});
