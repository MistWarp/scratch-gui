import {roadmapPayload} from '../../src/community/pages/Roadmap.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('Roadmap composer', () => {
    test('trims bug report text before submission', () => {
        expect(roadmapPayload({kind: 'bug', title: '  Crash  ', description: '  Steps  ', category: 'Editor'})).toEqual({
            kind: 'bug',
            title: 'Crash',
            description: 'Steps',
            category: 'Editor'
        });
    });
});
