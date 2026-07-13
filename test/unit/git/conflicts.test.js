import {parseConflicts, resolutionText} from '../../../src/lib/git/conflicts';

const CONFLICTED = [
    'sprite Cat {',
    '<<<<<<< HEAD',
    '    say "ours"',
    '=======',
    '    say "theirs"',
    '>>>>>>> feature',
    '}'
].join('\n');

describe('conflicts', () => {
    test('parses a conflict region', () => {
        const regions = parseConflicts(CONFLICTED);
        expect(regions).toHaveLength(1);
        expect(regions[0].startLine).toBe(2);
        expect(regions[0].separatorLine).toBe(4);
        expect(regions[0].endLine).toBe(6);
        expect(regions[0].ours).toEqual(['    say "ours"']);
        expect(regions[0].theirs).toEqual(['    say "theirs"']);
    });

    test('ignores text without markers', () => {
        expect(parseConflicts('sprite Cat {}')).toEqual([]);
    });

    test('parses diff3 style regions, keeping the base out of both sides', () => {
        const regions = parseConflicts([
            '<<<<<<< HEAD',
            'ours',
            '||||||| base',
            'base',
            '=======',
            'theirs',
            '>>>>>>> other'
        ].join('\n'));
        expect(regions[0].ours).toEqual(['ours']);
        expect(regions[0].base).toEqual(['base']);
        expect(regions[0].theirs).toEqual(['theirs']);
    });

    test('resolves to either side or both', () => {
        const [region] = parseConflicts(CONFLICTED);
        expect(resolutionText(region, 'ours')).toBe('    say "ours"');
        expect(resolutionText(region, 'theirs')).toBe('    say "theirs"');
        expect(resolutionText(region, 'both')).toBe('    say "ours"\n    say "theirs"');
    });
});
