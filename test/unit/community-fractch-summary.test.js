import {
    cancelMovedAssets,
    filterCoveredDiffLines,
    isEmptySummary,
    summarizeFractchChange,
    textsFromInspectionFiles
} from '../../src/community/fractch-summary.js';

const BEFORE = `sprite "Cat" at 10,20 layer 1;
var score = 14 id "abc";
watch var "score" at 5,5;
costume "a" file "assets/a.svg";
costume "b" file "assets/b.svg" current;
when flag at 0,0 {
  score = 0;
}
`;

const AFTER = `sprite "Cat" at 30,20 layer 1;
var score = 13 id "abc";
var lives = 3 id "def";
costume "a" file "assets/a.svg" current;
costume "c" file "assets/c.svg";
when flag at 100,200 {
  score = 0;
}
`;

const encode = value => btoa(unescape(encodeURIComponent(value)));

describe('fractch summaries', () => {
    test('builds file texts from inline inspection data and skips other files', () => {
        const texts = textsFromInspectionFiles([
            {path: 'Sprite/main.fractch', status: 'modified', oldData: encode(BEFORE), newData: encode(AFTER)},
            {path: 'Sprite/assets/a.svg', oldData: encode('<svg/>'), newData: encode('<svg/>')},
            {path: 'Sprite/main.fractch', oldData: null, newData: null}
        ]);

        expect(Object.keys(texts)).toEqual(['Sprite/main.fractch']);
        expect(texts['Sprite/main.fractch'].before).toBe(BEFORE);
    });

    test('refuses to summarize modified files with a missing side', () => {
        expect(textsFromInspectionFiles([
            {path: 'Sprite/main.fractch', status: 'modified', oldData: encode(BEFORE), newData: null}
        ])).toEqual({});
        expect(textsFromInspectionFiles([
            {path: 'Sprite/main.fractch', status: 'modified', oldData: null, newData: encode(AFTER)}
        ])).toEqual({});
        expect(Object.keys(textsFromInspectionFiles([
            {path: 'Sprite/main.fractch', status: 'added', oldData: null, newData: encode(AFTER)}
        ]))).toEqual(['Sprite/main.fractch']);
        expect(Object.keys(textsFromInspectionFiles([
            {path: 'Sprite/main.fractch', status: 'removed', oldData: encode(BEFORE), newData: null}
        ]))).toEqual(['Sprite/main.fractch']);
    });

    test('reports variable defaults without code lines', () => {
        const summary = summarizeFractchChange(BEFORE, AFTER);

        expect(summary.variables).toEqual([
            expect.objectContaining({change: 'changed', text: '"score" now starts at 13 instead of 14'}),
            expect.objectContaining({change: 'added', text: 'Variable "lives" created with default 3'})
        ]);
        expect(summary.watchers).toEqual([
            expect.objectContaining({change: 'removed', text: 'Stopped showing "score" on the stage'})
        ]);
    });

    test('reports sprite moves and costume metadata, not block edits', () => {
        const summary = summarizeFractchChange(BEFORE, AFTER);

        expect(summary.sprite).toEqual([
            expect.objectContaining({text: 'Moved to (30, 20)'})
        ]);
        expect(summary.assets).toEqual(expect.arrayContaining([
            expect.objectContaining({text: 'Costume "c" added'}),
            expect.objectContaining({text: 'Costume "b" removed'}),
            expect.objectContaining({text: 'Switched sprite to costume "a"'})
        ]));
        expect(summary).not.toHaveProperty('blocks');
    });

    test('reports scripts that moved on the canvas', () => {
        const summary = summarizeFractchChange(BEFORE, AFTER);

        expect(summary.scripts).toEqual([
            expect.objectContaining({text: 'When green flag clicked moved on the canvas'})
        ]);
    });

    test('ignores float noise but reports small visible moves', () => {
        const noise = BEFORE.replace('at 10,20', 'at 10.001,20.001');
        expect(summarizeFractchChange(BEFORE, noise).sprite).toEqual([]);
        const drifted = BEFORE.replace('at 10,20', 'at 10.27,20');
        expect(summarizeFractchChange(BEFORE, drifted).sprite).toEqual([
            expect.objectContaining({text: 'Moved to (10.27, 20)'})
        ]);
        expect(isEmptySummary(summarizeFractchChange('(((not fractch', '(((still not'))).toBe(true);
    });

    test('covers summarized lines and drops fully covered hunks', () => {
        const lines = [
            {type: 'hunk', content: '@@ -7,3 +7,3 @@'},
            {type: 'ctx', content: ' use "pen";'},
            {type: 'del', content: '-var wealth = 14 id "abc";'},
            {type: 'add', content: '+var wealth = 13 id "abc";'},
            {type: 'ctx', content: ' var state = 0 id "def";'}
        ];
        const summary = summarizeFractchChange(
            'var wealth = 14 id "abc";\nvar state = 0 id "def";\n',
            'var wealth = 13 id "abc";\nvar state = 0 id "def";\n'
        );

        expect(filterCoveredDiffLines(lines, summary)).toEqual({lines: [], fullyCovered: true});
    });

    test('keeps block lines while hiding summarized declaration lines', () => {
        const lines = [
            {type: 'hunk', content: '@@ -1,4 +1,4 @@'},
            {type: 'del', content: '-var v = 1 id "a";'},
            {type: 'add', content: '+var v = 2 id "a";'},
            {type: 'del', content: '-  move 10;'},
            {type: 'add', content: '+  move 20;'}
        ];
        const summary = summarizeFractchChange(
            'var v = 1 id "a";\nwhen flag {\n  move 10;\n}\n',
            'var v = 2 id "a";\nwhen flag {\n  move 20;\n}\n'
        );
        const result = filterCoveredDiffLines(lines, summary);

        expect(result.fullyCovered).toBe(false);
        expect(result.lines.map(line => line.content)).toEqual([
            '@@ -1,4 +1,4 @@',
            '-  move 10;',
            '+  move 20;'
        ]);
    });

    test('labels stage variables as global variables', () => {
        const before = 'stage;\nvar wealth = 14 id "abc";\n';
        const after = 'stage;\nvar wealth = 13 id "abc";\nvar lives = 3 id "def";\n';
        const summary = summarizeFractchChange(before, after, {global: true});

        expect(summary.variables).toEqual([
            expect.objectContaining({text: 'Global variable "wealth" now starts at 13 instead of 14'}),
            expect.objectContaining({text: 'Global variable "lives" created with default 3'})
        ]);
    });

    test('stays silent for hidden watchers but reports visibility changes', () => {
        const base = 'sprite "Cat" at 10,20 layer 1;\n';
        expect(summarizeFractchChange(base, `${base}watch var "v" at 5,5 hidden;\n`).watchers).toEqual([]);
        expect(summarizeFractchChange(
            `${base}watch var "v" at 5,5 hidden;\n`,
            base
        ).watchers).toEqual([]);
        expect(summarizeFractchChange(base, `${base}watch var "v" at 5,5;\n`).watchers).toEqual([
            expect.objectContaining({change: 'added', text: 'Now showing "v" on the stage'})
        ]);
        expect(summarizeFractchChange(
            `${base}watch var "v" at 5,5 hidden;\n`,
            `${base}watch var "v" at 5,5;\n`
        ).watchers).toEqual([
            expect.objectContaining({change: 'changed', text: 'Now showing "v" on the stage'})
        ]);
        expect(summarizeFractchChange(
            `${base}watch var "v" at 5,5;\n`,
            `${base}watch var "v" at 5,5 hidden;\n`
        ).watchers).toEqual([
            expect.objectContaining({change: 'changed', text: 'Stopped showing "v" on the stage'})
        ]);
    });

    test('reports renames and artwork swaps instead of remove/add pairs', () => {
        const base = 'sprite "Cat" at 10,20 layer 1;\n';
        const renamed = summarizeFractchChange(
            `${base}costume "a" file "assets/a.svg";\n`,
            `${base}costume "b" file "assets/a.svg";\n`
        ).assets;
        expect(renamed).toEqual([
            expect.objectContaining({change: 'renamed', text: 'Costume "a" renamed to "b"'})
        ]);

        const replaced = summarizeFractchChange(
            `${base}costume "a" file "assets/a.svg";\n`,
            `${base}costume "a" file "assets/a2.svg";\n`
        ).assets;
        expect(replaced).toEqual([
            expect.objectContaining({change: 'changed', text: 'Costume "a" artwork replaced'})
        ]);
    });

    test('cancels costumes removed in one file and re-added in another', () => {
        const gone = {assets: [{type: 'asset', asset: 'costume', change: 'removed', name: 'x', text: 'gone'}]};
        const back = {assets: [{type: 'asset', asset: 'costume', change: 'added', name: 'x', text: 'back'}]};
        const kept = {assets: [{type: 'asset', asset: 'costume', change: 'added', name: 'y', text: 'kept'}]};
        const result = cancelMovedAssets({A: gone, B: back, C: kept});

        expect(gone.assets).toEqual([]);
        expect(back.assets).toEqual([]);
        expect(kept.assets).toHaveLength(1);
        expect(result).not.toHaveProperty('A');
        expect(result).not.toHaveProperty('B');
        expect(result).toHaveProperty('C');
    });

    test('reports re-encoded sounds as audio updates', () => {
        const base = 'sprite "Cat" at 10,20 layer 1;\n';
        const summary = summarizeFractchChange(
            `${base}sound "meow1" file "assets/meow1.wav" rate 48000 samples 43997;\n`,
            `${base}sound "meow1" file "assets/meow1.wav" rate 44100 samples 40422;\n`
        );

        expect(summary.assets).toEqual([
            expect.objectContaining({change: 'changed', text: 'Sound "meow1" audio updated'})
        ]);

        const lines = [
            {type: 'hunk', content: '@@ -2,2 +2,2 @@'},
            {type: 'del', content: '-sound "meow1" file "assets/meow1.wav" rate 48000 samples 43997;'},
            {type: 'add', content: '+sound "meow1" file "assets/meow1.wav" rate 44100 samples 40422;'}
        ];
        expect(filterCoveredDiffLines(lines, summary)).toEqual({lines: [], fullyCovered: true});
    });

    test('reports visibility toggles against the shown default', () => {
        const base = 'sprite "Cat" at 10,20 layer 1;\n';
        expect(summarizeFractchChange(base, `${base.replace('layer 1', 'layer 1 hidden')}`).sprite).toEqual([
            expect.objectContaining({text: 'Now hidden'})
        ]);
        expect(summarizeFractchChange(
            `${base.replace('layer 1', 'layer 1 hidden')}`,
            base
        ).sprite).toEqual([expect.objectContaining({text: 'Now shown'})]);
    });

    test('summarizes extension adds and removes but ignores moves', () => {
        const base = 'stage;\n';
        const moved = summarizeFractchChange(
            `${base}use "runtimeoptions" from "https://extensions.turbowarp.org/runtime-options.js";\nuse "pen";\n`,
            `${base}use "pen";\nuse "runtimeoptions" from "https://extensions.turbowarp.org/runtime-options.js";\n`
        );
        expect(moved.extensions).toEqual([]);

        const changed = summarizeFractchChange(
            `${base}use "pen";\n`,
            `${base}use "pen";\nuse "mistwarpData";\n`
        );
        expect(changed.extensions).toEqual([
            expect.objectContaining({type: 'extension', change: 'added', id: 'mistwarpData'})
        ]);

        const removed = summarizeFractchChange(
            `${base}use "pen";\nuse "music";\n`,
            `${base}use "pen";\n`
        );
        expect(removed.extensions).toEqual([
            expect.objectContaining({type: 'extension', change: 'removed', id: 'music'})
        ]);
    });

    test('covers extension lines and hides pure moves', () => {
        const moved = [
            {type: 'hunk', content: '@@ -1,2 +1,2 @@'},
            {type: 'del', content: '-use "pen";'},
            {type: 'del', content: '-use "runtimeoptions" from "https://extensions.turbowarp.org/runtime-options.js";'},
            {type: 'add', content: '+use "runtimeoptions" from "https://extensions.turbowarp.org/runtime-options.js";'},
            {type: 'add', content: '+use "mistwarpData";'}
        ];
        const summary = {
            variables: [], sprite: [], scripts: [], assets: [], watchers: [],
            extensions: [{type: 'extension', change: 'added', id: 'mistwarpData', url: null}]
        };
        const result = filterCoveredDiffLines(moved, summary);

        expect(result.fullyCovered).toBe(false);
        expect(result.lines.map(line => line.content)).toEqual([
            '@@ -1,2 +1,2 @@',
            '-use "pen";'
        ]);
    });

    test('covers costume lines when the current costume changes', () => {
        const lines = [
            {type: 'hunk', content: '@@ -9,5 +9,5 @@'},
            {type: 'ctx', content: ' costume "a" file "assets/a.png" center 63,90 bitmap 2;'},
            {type: 'del', content: '-costume "b" file "assets/b.png" center 75,103 bitmap 2;'},
            {type: 'del', content: '-costume "c" file "assets/c.png" center 75,95 bitmap 2 current;'},
            {type: 'add', content: '+costume "b" file "assets/b.png" center 75,103 bitmap 2 current;'},
            {type: 'add', content: '+costume "c" file "assets/c.png" center 75,95 bitmap 2;'}
        ];
        const summary = {
            variables: [], sprite: [], scripts: [], watchers: [],
            assets: [{type: 'asset', change: 'changed', name: 'b', names: ['c', 'b'], text: 'Switched sprite to costume "b"'}]
        };

        expect(filterCoveredDiffLines(lines, summary)).toEqual({lines: [], fullyCovered: true});
    });

    test('pairs moved script headers and keeps new scripts', () => {
        const moved = [
            {type: 'hunk', content: '@@ -1,1 +1,1 @@'},
            {type: 'del', content: '-script at 1,1 {'},
            {type: 'add', content: '+script at 9,9 {'}
        ];
        const withMoves = {variables: [], sprite: [], assets: [], watchers: [], scripts: [{text: 'moved'}]};
        expect(filterCoveredDiffLines(moved, withMoves)).toEqual({lines: [], fullyCovered: true});

        const added = [
            {type: 'hunk', content: '@@ -1,1 +1,2 @@'},
            {type: 'ctx', content: ' when flag {'},
            {type: 'add', content: '+script at 9,9 {'}
        ];
        const kept = filterCoveredDiffLines(added, withMoves);
        expect(kept.fullyCovered).toBe(false);
        expect(kept.lines).toHaveLength(3);
    });
});
