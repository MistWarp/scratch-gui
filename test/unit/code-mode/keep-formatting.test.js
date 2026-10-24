import {fillBlocks, keepFormatting, remapLocked} from '../../../src/lib/code-mode/keep-formatting.js';

const UNIT_FIELDS = {script: 'scripts', decl: 'declarations', comment: 'comments'};

const compose = parts => {
    let text = '';
    const sourceMap = {version: 1, scripts: {}, blocks: {}, comments: {}, declarations: {}, regions: {}};
    const open = {};
    for (const part of parts) {
        if (typeof part === 'string') {
            text += part;
        } else if (part.region) {
            if (part.end) sourceMap.regions[part.region] = {from: open[part.region], to: text.length};
            else open[part.region] = text.length;
        } else {
            const from = text.length;
            text += part.text;
            sourceMap[UNIT_FIELDS[part.kind]][part.id] = {from, to: text.length};
            for (const [blockId, piece] of Object.entries(part.blocks || {})) {
                const at = part.text.indexOf(piece);
                sourceMap.blocks[blockId] = {from: from + at, to: from + at + piece.length};
            }
        }
    }
    return {text, sourceMap};
};

const script = (id, text, blocks) => ({kind: 'script', id, text, blocks});
const decl = (id, text) => ({kind: 'decl', id, text});
const comment = (id, text) => ({kind: 'comment', id, text});

const slice = (result, field, id) => {
    const range = result.sourceMap[field][id];
    return result.text.slice(range.from, range.to);
};

const lineOf = (text, pos) => text.slice(0, pos).split('\n').length;

const expectLines = result => {
    for (const field of ['scripts', 'blocks', 'comments', 'declarations', 'regions']) {
        for (const range of Object.values(result.sourceMap[field])) {
            expect(range.line).toBe(lineOf(result.text, range.from));
            expect(range.endLine).toBe(lineOf(result.text, range.to));
        }
    }
};

const canonicalA = 'when flag at 0,0 {\n  say "hi";\n}';
const canonicalB = 'when key space at 0,200 {\n  move 10;\n}';
const canonicalC = 'when clicked at 0,400 {\n  turn 15;\n}';
const mineA = 'when   flag at 0,0 {\n\n      say  "hi" ;\n}';
const mineB = '// walk\nwhen key space at 0,200 {\n    move 10;\n}';
const mineC = 'when clicked at 0,400 {\n turn 15;\n\n}';
const NOTE = 'comment "my game" size 200x200;';

const canonical = units => compose(units.flatMap((unit, index) => (index ? ['\n\n', unit] : [unit])).concat('\n'));

const A = script('a', canonicalA, {a: canonicalA, say: 'say "hi";'});
const B = script('b', canonicalB, {b: canonicalB, move: 'move 10;'});
const C = script('c', canonicalC, {c: canonicalC, turn: 'turn 15;'});
const SCORE = decl('var:score', 'var score = 0;');

const previous = canonical([SCORE, comment('note', NOTE), A, B, C]);

const formatted = compose([
    comment('note', '// my game'), '\n',
    decl('var:score', 'var score   = 0 ;'), '\n\n\n',
    script('a', mineA, {a: mineA, say: 'say  "hi" ;'}), '\n\n',
    script('b', mineB, {b: mineB, move: 'move 10;'}), '\n\n\n\n',
    script('c', mineC, {c: mineC, turn: 'turn 15;'}), '\n\n'
]);

const HEAD = '// my game\nvar score   = 0 ;\n\n\n';

describe('keep formatting', () => {
    test('nothing changed keeps the formatted text and source map', () => {
        const next = canonical([SCORE, comment('note', NOTE), A, B, C]);
        const result = keepFormatting({previous, formatted, next});
        expect(result.text).toBe(formatted.text);
        expect(result.sourceMap).toBe(formatted.sourceMap);
    });

    test('without a formatted baseline the canonical text is used', () => {
        expect(keepFormatting({previous: null, formatted: null, next: previous}).text).toBe(previous.text);
    });

    test('a changed script takes the canonical text in place and everything else keeps its formatting', () => {
        const changedB = 'when key a at 0,200 {\n  move 10;\n}';
        const next = canonical([SCORE, comment('note', NOTE), A, script('b', changedB, {b: changedB, move: 'move 10;'}), C]);
        const result = keepFormatting({previous, formatted, next});
        expect(result.text).toBe(`${HEAD}${mineA}\n\n${changedB}\n\n\n\n${mineC}\n\n`);
        expect(slice(result, 'scripts', 'a')).toBe(mineA);
        expect(slice(result, 'scripts', 'b')).toBe(changedB);
        expect(slice(result, 'scripts', 'c')).toBe(mineC);
        expect(slice(result, 'comments', 'note')).toBe('// my game');
        expect(slice(result, 'declarations', 'var:score')).toBe('var score   = 0 ;');
        expect(slice(result, 'blocks', 'say')).toBe('say  "hi" ;');
        expect(slice(result, 'blocks', 'move')).toBe('move 10;');
        expect(slice(result, 'blocks', 'turn')).toBe('turn 15;');
        expect(slice(result, 'blocks', 'b')).toBe(changedB);
        expectLines(result);
    });

    test('the user order is kept when the canonical order moves a rebuilt script to the end', () => {
        const changedA = 'when flag at 0,0 {\n  say "hello";\n}';
        const next = canonical([SCORE, comment('note', NOTE), B, C, script('a', changedA, {a: changedA, say: 'say "hello";'})]);
        const result = keepFormatting({previous, formatted, next});
        expect(result.text).toBe(`${HEAD}${changedA}\n\n${mineB}\n\n\n\n${mineC}\n\n`);
        expect(slice(result, 'blocks', 'say')).toBe('say "hello";');
        expectLines(result);
    });

    test('an added script goes after its canonical neighbour', () => {
        const added = 'when I receive "go" at 0,600 {\n  hide;\n}';
        const next = canonical([SCORE, comment('note', NOTE), A, script('d', added, {d: added, hide: 'hide;'}), B, C]);
        const result = keepFormatting({previous, formatted, next});
        expect(result.text).toBe(`${HEAD}${mineA}\n\n${added}\n\n${mineB}\n\n\n\n${mineC}\n\n`);
        expect(slice(result, 'scripts', 'd')).toBe(added);
        expect(slice(result, 'blocks', 'hide')).toBe('hide;');
        expect(slice(result, 'blocks', 'move')).toBe('move 10;');
        expectLines(result);
    });

    test('a new declaration goes next to the other declarations', () => {
        const next = compose([
            SCORE, '\n', decl('var:lives', 'var lives = 3;'), '\n\n', comment('note', NOTE), '\n\n',
            A, '\n\n', B, '\n\n', C, '\n'
        ]);
        const result = keepFormatting({previous, formatted, next});
        expect(result.text).toBe(`// my game\nvar score   = 0 ;\nvar lives = 3;\n\n\n${mineA}\n\n${mineB}\n\n\n\n${mineC}\n\n`);
        expect(slice(result, 'declarations', 'var:lives')).toBe('var lives = 3;');
    });

    test('a removed script takes one of its gaps with it', () => {
        const next = canonical([SCORE, comment('note', NOTE), A, C]);
        const result = keepFormatting({previous, formatted, next});
        expect(result.text).toBe(`${HEAD}${mineA}\n\n\n\n${mineC}\n\n`);
        expect(result.sourceMap.scripts.b).toBeUndefined();
        expect(result.sourceMap.blocks.move).toBeUndefined();
        expect(slice(result, 'scripts', 'c')).toBe(mineC);
        expectLines(result);
    });

    test('removing the first unit does not leave blank lines at the top', () => {
        const next = canonical([SCORE, A, B, C]);
        const result = keepFormatting({previous, formatted, next});
        expect(result.text).toBe(`var score   = 0 ;\n\n\n${mineA}\n\n${mineB}\n\n\n\n${mineC}\n\n`);
    });

    test('a changed declaration takes the canonical text and keeps the other declarations', () => {
        const previousDecls = compose([
            decl('var:score', 'var score = 0;'), '\n',
            decl('var:lives', 'var lives = 3;'), '\n\n',
            script('a', canonicalA), '\n'
        ]);
        const formattedDecls = compose([
            decl('var:lives', 'var lives=3;'), '\n',
            decl('var:score', 'var   score = 0;'), '\n\n\n',
            script('a', mineA), '\n'
        ]);
        const next = compose([
            decl('var:score', 'var score = 0;'), '\n',
            decl('var:lives', 'var lives = 9;'), '\n\n',
            script('a', canonicalA), '\n'
        ]);
        const result = keepFormatting({previous: previousDecls, formatted: formattedDecls, next});
        expect(result.text).toBe(`var lives = 9;\nvar   score = 0;\n\n\n${mineA}\n`);
        expect(slice(result, 'declarations', 'var:lives')).toBe('var lives = 9;');
        expect(slice(result, 'declarations', 'var:score')).toBe('var   score = 0;');
    });

    test('workspace comments keep their formatting when unchanged and follow the canonical text when edited', () => {
        const previousComments = compose([
            comment('n1', 'comment "first" at 0,0;'), '\n',
            comment('n2', 'comment "second" at 0,50;'), '\n\n',
            script('a', canonicalA), '\n'
        ]);
        const formattedComments = compose([
            comment('n1', '//   first'), '\n',
            comment('n2', 'comment  "second" at 0,50;'), '\n\n',
            script('a', mineA), '\n'
        ]);
        const next = compose([
            comment('n1', 'comment "first" at 0,0;'), '\n',
            comment('n2', 'comment "changed" at 0,50;'), '\n\n',
            script('a', canonicalA), '\n'
        ]);
        const result = keepFormatting({previous: previousComments, formatted: formattedComments, next});
        expect(result.text).toBe(`//   first\ncomment "changed" at 0,50;\n\n${mineA}\n`);
        expect(slice(result, 'comments', 'n2')).toBe('comment "changed" at 0,50;');
    });

    describe('regions', () => {
        const regionA = 'when flag at 0,0 {\n    say "hi";\n  }';
        const regionB = 'when key space at 0,200 {\n    move 10;\n  }';
        const mineRegionA = 'when flag at 0,0   {\n        say "hi";\n    }';
        const mineRegionB = 'when key space at 0,200 {\n        move 10;\n    }';
        const regionPrevious = compose([
            {region: 'game'}, 'region "game" {\n  ',
            script('a', regionA), '\n\n  ',
            script('b', regionB), '\n}', {region: 'game', end: true}, '\n\n',
            script('c', canonicalC), '\n'
        ]);
        const regionFormatted = compose([
            {region: 'game'}, 'region  "game"  {\n    ',
            script('a', mineRegionA), '\n\n    ',
            script('b', mineRegionB), '\n}', {region: 'game', end: true}, '\n\n',
            script('c', mineC), '\n'
        ]);

        test('a changed script in a region keeps the formatted header and the other scripts', () => {
            const changedB = 'when key b at 0,200 {\n    move 10;\n  }';
            const next = compose([
                {region: 'game'}, 'region "game" {\n  ',
                script('a', regionA), '\n\n  ',
                script('b', changedB), '\n}', {region: 'game', end: true}, '\n\n',
                script('c', canonicalC), '\n'
            ]);
            const result = keepFormatting({previous: regionPrevious, formatted: regionFormatted, next});
            expect(result.text).toBe(`region  "game"  {\n    ${mineRegionA}\n\n    ${changedB}\n}\n\n${mineC}\n`);
            expect(slice(result, 'regions', 'game')).toBe(`region  "game"  {\n    ${mineRegionA}\n\n    ${changedB}\n}`);
            expectLines(result);
        });

        test('an added script in a region lands inside the region with the user indentation', () => {
            const added = 'when I receive "go" at 0,600 {\n    hide;\n  }';
            const next = compose([
                {region: 'game'}, 'region "game" {\n  ',
                script('a', regionA), '\n\n  ',
                script('b', regionB), '\n\n  ',
                script('d', added), '\n}', {region: 'game', end: true}, '\n\n',
                script('c', canonicalC), '\n'
            ]);
            const result = keepFormatting({previous: regionPrevious, formatted: regionFormatted, next});
            expect(result.text).toBe(
                `region  "game"  {\n    ${mineRegionA}\n\n    ${mineRegionB}\n\n    ${added}\n}\n\n${mineC}\n`);
            expect(slice(result, 'regions', 'game')).toContain(added);
        });

        test('removing the first script of a region keeps the region header', () => {
            const next = compose([
                {region: 'game'}, 'region "game" {\n  ',
                script('b', regionB), '\n}', {region: 'game', end: true}, '\n\n',
                script('c', canonicalC), '\n'
            ]);
            const result = keepFormatting({previous: regionPrevious, formatted: regionFormatted, next});
            expect(result.text).toBe(`region  "game"  {\n    ${mineRegionB}\n}\n\n${mineC}\n`);
        });

        test('a script moving into a region falls back to the canonical order', () => {
            const movedC = 'when clicked at 0,400 {\n    turn 15;\n  }';
            const next = compose([
                {region: 'game'}, 'region "game" {\n  ',
                script('a', regionA), '\n\n  ',
                script('b', regionB), '\n\n  ',
                script('c', movedC), '\n}', {region: 'game', end: true}, '\n'
            ]);
            const result = keepFormatting({previous: regionPrevious, formatted: regionFormatted, next});
            expect(result.text).toBe(`region  "game"  {\n    ${mineRegionA}\n\n    ${mineRegionB}\n\n  ${movedC}\n}\n`);
            expect(slice(result, 'regions', 'game')).toBe(result.text.slice(0, -1));
            expect(slice(result, 'scripts', 'c')).toBe(movedC);
        });
    });

    test('a block missing from the formatted source map falls back to its enclosing block', () => {
        const next = canonical([decl('var:score', 'var score = 1;'), comment('note', NOTE),
            script('a', canonicalA, {a: canonicalA, say: 'say "hi";', text: '"hi"'}), B, C]);
        const result = keepFormatting({previous, formatted, next});
        expect(slice(result, 'blocks', 'text')).toBe('say  "hi" ;');
        expect(slice(result, 'declarations', 'var:score')).toBe('var score = 1;');
    });

    test('overlapping units fall back to the canonical text', () => {
        const scripts = {...formatted.sourceMap.scripts, a: {from: 0, to: formatted.text.length}};
        const broken = {text: formatted.text, sourceMap: {...formatted.sourceMap, scripts}};
        const next = canonical([decl('var:score', 'var score = 1;')]);
        expect(keepFormatting({previous, formatted: broken, next}).text).toBe(next.text);
    });
});

describe('formatted source maps', () => {
    test('fillBlocks gives blocks the build did not map the range of their parent', () => {
        const emitted = compose([script('a', canonicalA, {a: canonicalA, say: 'say "hi";', text: '"hi"'})]);
        const built = compose([script('a', mineA, {a: mineA, say: 'say  "hi" ;'})]);
        const filled = fillBlocks(built.sourceMap, emitted.sourceMap);
        expect(mineA.slice(filled.blocks.text.from, filled.blocks.text.to)).toBe('say  "hi" ;');
        expect(fillBlocks(filled, emitted.sourceMap)).toBe(filled);
    });

    test('remapLocked moves locked scripts to their ranges in the formatted text and drops unknown ones', () => {
        const locked = remapLocked([
            {topId: 'b', reason: 'shared', from: 1, to: 2},
            {topId: 'gone', reason: 'shared', from: 3, to: 4}
        ], formatted.sourceMap);
        expect(locked).toHaveLength(1);
        expect(formatted.text.slice(locked[0].from, locked[0].to)).toBe(mineB);
        expect(locked[0].reason).toBe('shared');
    });
});
