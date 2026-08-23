import {leaderboardBoard} from '../../src/community/pages/Leaderboard.jsx';
import {statusDate} from '../../src/community/pages/Status.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('community status and leaderboard helpers', () => {
    test('normalizes leaderboard tabs from the URL', () => {
        expect(leaderboardBoard('views')).toBe('views');
        expect(leaderboardBoard('unknown')).toBe('followers');
    });

    test('ignores invalid server timestamps', () => {
        expect(statusDate('not a date')).toBeNull();
        expect(statusDate('2026-08-23T12:00:00Z')).toBeInstanceOf(Date);
    });
});
