import {normalizeProjectTitle} from '../../../src/components/menu-bar/project-title-input.jsx';

describe('project title input', () => {
    test('removes accidental leading and trailing whitespace', () => {
        expect(normalizeProjectTitle('  My project  ')).toBe('My project');
    });

    test('turns a whitespace-only title into the normal empty-title state', () => {
        expect(normalizeProjectTitle('   ')).toBe('');
    });
});
