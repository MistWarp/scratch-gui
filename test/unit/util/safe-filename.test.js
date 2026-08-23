import {projectFilename, safeFilenameBase} from '../../../src/lib/utils/safe-filename.js';

describe('safe filenames', () => {
    test('replaces characters that make saves fail on common desktop platforms', () => {
        expect(projectFilename('Level 1: forest/river?', 'project', 'mwp'))
            .toBe('Level 1_ forest_river_.mwp');
    });

    test('removes trailing periods and spaces', () => {
        expect(projectFilename('My project... ', 'project', 'sb3')).toBe('My project.sb3');
    });

    test('avoids reserved Windows filenames', () => {
        expect(projectFilename('CON', 'project', 'sb3')).toBe('_CON.sb3');
        expect(projectFilename('CON.backup', 'project', 'sb3')).toBe('_CON.backup.sb3');
    });

    test('uses a fallback for an empty or unusable title', () => {
        expect(projectFilename('   ...', 'MistWarp Project', 'mwp')).toBe('MistWarp Project.mwp');
    });

    test('limits the filename base without cutting off the extension', () => {
        expect(safeFilenameBase('x'.repeat(120))).toHaveLength(100);
        expect(projectFilename('x'.repeat(120), 'project', 'sb3')).toHaveLength(104);
    });
});
