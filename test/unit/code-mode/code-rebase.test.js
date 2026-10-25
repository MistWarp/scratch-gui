import {ChangeSet} from '@codemirror/state';
import {editedUnits, mapUnits, rebase, resolveConflict} from '../../../src/lib/code-mode/code-rebase.js';

const unitsFor = (text, pieces) => {
    const units = {};
    let cursor = 0;
    for (const [key, piece] of pieces) {
        const from = text.indexOf(piece, cursor);
        units[key] = {from, to: from + piece.length};
        cursor = from + piece.length;
    }
    return units;
};

const doc = (decls, scripts) => `${decls.join('\n')}\n\n${scripts.join('\n\n')}\n`;

const A = 'when flag at 0,0 {\n  say "a";\n}';
const B = 'when key space at 0,200 {\n  move 10;\n}';
const DECL = 'var lives = 3;';

const side = (decls, scripts, keys) => {
    const text = doc(decls, scripts);
    const pieces = [];
    decls.forEach((piece, i) => pieces.push([keys.decls[i], piece]));
    scripts.forEach((piece, i) => pieces.push([keys.scripts[i], piece]));
    return {text, units: unitsFor(text, pieces)};
};

const keys = {decls: ['decl:var:lives'], scripts: ['script:a', 'script:b']};

describe('per-unit three-way rebase', () => {
    test('a text edit in one script and a blocks edit in another merge without conflict', () => {
        const base = side([DECL], [A, B], keys);
        const mineA = A.replace('"a"', '"mine"');
        const mine = side([DECL], [mineA, B], keys);
        const theirsB = B.replace('10', '20');
        const theirs = side([DECL], [A, theirsB], keys);
        const merged = rebase({base, theirs, mine});
        expect(merged.conflicts).toEqual([]);
        expect(merged.text).toContain(mineA);
        expect(merged.text).toContain(theirsB);
        expect(editedUnits({text: theirs.text, units: theirs.units}, merged.text, merged.units))
            .toEqual(['script:a']);
    });

    test('a script edited on both sides conflicts and resolves either way', () => {
        const base = side([DECL], [A, B], keys);
        const mine = side([DECL], [A.replace('"a"', '"mine"'), B], keys);
        const theirs = side([DECL], [A.replace('"a"', '"blocks"'), B], keys);
        const merged = rebase({base, theirs, mine});
        expect(merged.conflicts.map(item => [item.key, item.kind])).toEqual([['script:a', 'both']]);
        expect(merged.text).toContain('"mine"');
        const blocks = resolveConflict(merged, 'script:a', 'theirs');
        expect(blocks.text).toContain('"blocks"');
        expect(blocks.text).not.toContain('"mine"');
        expect(blocks.conflicts).toEqual([]);
        expect(blocks.text.slice(blocks.units['script:b'].from, blocks.units['script:b'].to)).toBe(B);
        const kept = resolveConflict(merged, 'script:a', 'mine');
        expect(kept.text).toBe(merged.text);
    });

    test('a script edited in text and deleted in blocks is a deleted conflict', () => {
        const base = side([DECL], [A, B], keys);
        const mine = side([DECL], [A.replace('"a"', '"mine"'), B], keys);
        const theirs = side([DECL], [B], {decls: keys.decls, scripts: ['script:b']});
        const merged = rebase({base, theirs, mine});
        expect(merged.conflicts.map(item => item.kind)).toEqual(['deleted']);
        const deleted = resolveConflict(merged, 'script:a', 'theirs');
        expect(deleted.text).not.toContain('when flag');
        expect(deleted.text).toContain(B);
    });

    test('untouched units take the new text and blocks-side deletions remove them', () => {
        const base = side([DECL], [A, B], keys);
        const theirs = side([DECL], [B], {decls: keys.decls, scripts: ['script:b']});
        const merged = rebase({base, theirs, mine: base});
        expect(merged.conflicts).toEqual([]);
        expect(merged.text).not.toContain('when flag');
    });

    test('a value-only blocks change to a declaration the user edited is not a conflict', () => {
        const base = side([DECL], [A, B], keys);
        const mine = side(['var lives = 9;'], [A, B], keys);
        const theirs = side(['var lives = 4;'], [A, B], keys);
        const merged = rebase({base, theirs, mine});
        expect(merged.conflicts).toEqual([]);
        expect(merged.text).toContain('var lives = 9;');
    });

    test('declarations added on the blocks side are merged in and new user text never conflicts', () => {
        const base = side([DECL], [A, B], keys);
        const typed = 'when flag {\n  say "new";\n}';
        const mineText = `${base.text}\n${typed}\n`;
        const mine = {text: mineText, units: base.units};
        const theirs = side([DECL, 'var speed = 2;'], [A, B],
            {decls: ['decl:var:lives', 'decl:var:speed'], scripts: keys.scripts});
        const merged = rebase({base, theirs, mine});
        expect(merged.conflicts).toEqual([]);
        expect(merged.text).toContain('var speed = 2;');
        expect(merged.text).toContain(typed);
        expect(merged.text.indexOf('var speed')).toBeLessThan(merged.text.indexOf('when flag at'));
    });

    test('unit ranges follow CodeMirror changes and exclude text typed at their edges', () => {
        const base = side([DECL], [A, B], keys);
        const at = base.units['script:b'].from;
        const changes = ChangeSet.of([{from: at, insert: 'X'}], base.text.length);
        const mapped = mapUnits(base.units, changes);
        expect(mapped['script:b'].from).toBe(at + 1);
        expect(mapped['script:a']).toEqual(base.units['script:a']);
        const whole = ChangeSet.of([{from: base.units['script:a'].from, to: base.units['script:a'].to}],
            base.text.length);
        const removed = mapUnits(base.units, whole);
        expect(removed['script:a'].to).toBe(removed['script:a'].from);
    });

    describe('scripts in files', () => {
        const REGION_A = 'when flag at 0,0 {\n    say "a";\n  }';
        const NEW = 'when key b at 50,50 {\n  hide;\n}';
        const withRegion = scripts => {
            const text = `${DECL}\n\n${scripts.main.join('\n\n')}${scripts.main.length ? '\n\n' : ''}` +
                `region "enemies" {\n  ${scripts.region.join('\n\n  ')}\n}\n`;
            const pieces = [['decl:var:lives', DECL]];
            scripts.mainKeys.forEach((key, i) => pieces.push([key, scripts.main[i]]));
            scripts.regionKeys.forEach((key, i) => pieces.push([key, scripts.region[i]]));
            return {text, units: unitsFor(text, pieces)};
        };

        test('a script added in Blocks mode stays in the main file when its neighbour is in a region', () => {
            const base = withRegion({main: [], mainKeys: [], region: [REGION_A], regionKeys: ['script:a']});
            const mine = withRegion({
                main: [],
                mainKeys: [],
                region: [REGION_A.replace('"a"', '"mine"')],
                regionKeys: ['script:a']
            });
            const theirs = withRegion({main: [NEW],
                mainKeys: ['script:new'],
                region: [REGION_A],
                regionKeys: ['script:a']});
            const merged = rebase({base, theirs, mine});
            expect(merged.conflicts).toEqual([]);
            const regionStart = merged.text.indexOf('region "enemies"');
            expect(merged.text.indexOf(NEW)).toBeGreaterThan(-1);
            expect(merged.text.indexOf(NEW)).toBeLessThan(regionStart);
            expect(merged.text.slice(merged.units['script:new'].from, merged.units['script:new'].to)).toBe(NEW);
            expect(merged.text).toContain('say "mine"');
        });

        test('a new main script anchors after the last main script, not inside a region', () => {
            const base = withRegion({main: [A],
                mainKeys: ['script:m'],
                region: [REGION_A],
                regionKeys: ['script:a']});
            const mine = withRegion({main: [A.replace('"a"', '"x"')],
                mainKeys: ['script:m'],
                region: [REGION_A],
                regionKeys: ['script:a']});
            const theirs = withRegion({main: [A, NEW],
                mainKeys: ['script:m', 'script:new'],
                region: [REGION_A],
                regionKeys: ['script:a']});
            const merged = rebase({base, theirs, mine});
            expect(merged.text.indexOf(NEW)).toBeLessThan(merged.text.indexOf('region "enemies"'));
            expect(merged.text.indexOf(NEW)).toBeGreaterThan(merged.text.indexOf('say "x"'));
        });

        test('a new script that belongs to a region is added inside that region', () => {
            const NEW_IN = 'when key c at 9,9 {\n    hide;\n  }';
            const base = withRegion({main: [A],
                mainKeys: ['script:m'],
                region: [REGION_A],
                regionKeys: ['script:a']});
            const mine = withRegion({main: [A],
                mainKeys: ['script:m'],
                region: [REGION_A.replace('"a"', '"y"')],
                regionKeys: ['script:a']});
            const theirs = withRegion({main: [A],
                mainKeys: ['script:m'],
                region: [NEW_IN, REGION_A],
                regionKeys: ['script:c', 'script:a']});
            const merged = rebase({base, theirs, mine});
            const at = merged.text.indexOf(NEW_IN);
            expect(at).toBeGreaterThan(merged.text.indexOf('region "enemies"'));
            expect(merged.text.slice(merged.units['script:c'].from, merged.units['script:c'].to)).toBe(NEW_IN);
        });
    
        test('a new script for an empty file goes inside it with the file indentation', () => {
            const NEW_IN = 'when key c at 9,9 {\n    hide;\n  }';
            const mineText = `${DECL}\n\n${A}\n\nregion "empty" {\n}\n`;
            const mine = {text: mineText, units: unitsFor(mineText, [['decl:var:lives', DECL], ['script:m', A]])};
            const base = mine;
            const theirsText = `${DECL}\n\n${A}\n\nregion "empty" {\n  ${NEW_IN}\n}\n`;
            const theirs = {text: theirsText,
                units: unitsFor(theirsText,
                    [['decl:var:lives', DECL], ['script:m', A], ['script:c', NEW_IN]])};
            const merged = rebase({base, theirs, mine});
            expect(merged.text).toBe(theirsText);
            const tabs = `${DECL}\n\nwhen flag {\n\tsay 1;\n}\n\nregion "empty" {\n}\n`;
            const tabMine = {text: tabs, units: unitsFor(tabs, [['decl:var:lives', DECL]])};
            const tabMerged = rebase({base: tabMine, theirs, mine: tabMine});
            expect(tabMerged.text).toContain('region "empty" {\n\twhen key c at 9,9 {\n\t  hide;\n\t}\n}');
        });
    });
});
