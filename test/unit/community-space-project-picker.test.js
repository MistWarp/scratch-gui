import {projectIdsForSpace} from '../../src/community/components/SpaceProjectPicker.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('SpaceProjectPicker', () => {
    test('detects existing projects from both IDs and loaded project data', () => {
        const ids = projectIdsForSpace({
            projectIds: [],
            projects: [{id: 'loaded-project'}]
        });

        expect(ids.has('loaded-project')).toBe(true);
    });
});
