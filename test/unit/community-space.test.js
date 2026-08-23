import {normalizeSpace, spaceLoadMessage} from '../../src/community/pages/Space.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('Space loading feedback', () => {
    test('only calls a confirmed 404 not found', () => {
        expect(spaceLoadMessage({status: 404})).toBe('Space not found.');
        expect(spaceLoadMessage({status: 503})).toBe('Could not load this space.');
        expect(spaceLoadMessage(new Error('offline'))).toBe('Could not load this space.');
    });

    test('normalizes optional API lists before rendering a space', () => {
        expect(normalizeSpace({_id: 'space'})).toMatchObject({
            projects: [],
            projectIds: [],
            followers: [],
            managers: [],
            judges: []
        });
    });
});
