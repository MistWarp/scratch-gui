import {formatStatusRows} from '../../../src/lib/git/status-format';

describe('browser terminal git status', () => {
    test('formats only changed files', () => {
        expect(formatStatusRows([
            ['clean.fractch', 1, 1, 1],
            ['new.fractch', 0, 2, 0],
            ['changed.fractch', 1, 2, 1],
            ['staged.fractch', 1, 2, 2],
            ['removed.fractch', 1, 0, 1]
        ])).toEqual([
            '?? new.fractch',
            ' M changed.fractch',
            'M  staged.fractch',
            ' D removed.fractch'
        ]);
    });
});
