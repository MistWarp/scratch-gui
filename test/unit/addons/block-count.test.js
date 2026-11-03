import {analyzeProject} from '../../../src/lib/menu-bar/block-count-analysis';

const block = (id, opcode, extra = {}) => ({
    id,
    opcode,
    inputs: {},
    next: null,
    parent: null,
    shadow: false,
    ...extra
});

test('analyzes original targets, nested substacks, and cyclic references once', () => {
    const blocks = {
        event: block('event', 'event_whenflagclicked', {next: 'if'}),
        if: block('if', 'control_if', {
            parent: 'event',
            next: 'say',
            inputs: {
                CONDITION: {block: 'shadow'},
                SUBSTACK: {block: 'repeat'}
            }
        }),
        shadow: block('shadow', 'operator_equals', {shadow: true, parent: 'if'}),
        repeat: block('repeat', 'control_repeat', {
            parent: 'if',
            inputs: {SUBSTACK: {block: 'move'}}
        }),
        move: block('move', 'motion_movesteps', {parent: 'repeat', next: 'if'}),
        say: block('say', 'looks_say', {parent: 'if'})
    };
    const sprite = {
        id: 'sprite',
        isOriginal: true,
        isStage: false,
        getName: () => 'Cat',
        sprite: {costumes: [{}, {}], sounds: [{}]},
        variables: {
            score: {id: 'score', type: ''},
            items: {id: 'items', type: 'list'}
        },
        blocks: {
            _blocks: blocks,
            getScripts: () => ['event']
        }
    };
    const clone = {...sprite, id: 'clone', isOriginal: false};
    const stage = {
        id: 'stage',
        isOriginal: true,
        isStage: true,
        getName: () => 'Stage',
        sprite: {costumes: [{}], sounds: []},
        variables: {},
        blocks: {_blocks: {}, getScripts: () => []}
    };

    const result = analyzeProject({targets: [stage, sprite, clone]});

    expect(result).toMatchObject({
        blockCount: 5,
        scriptCount: 1,
        spriteCount: 1,
        costumeCount: 3,
        soundCount: 1,
        scalarCount: 1,
        listCount: 1,
        conditionalCount: 1,
        loopCount: 1,
        maxDepth: 2,
        longestScript: 5
    });
    expect(result.scripts[0]).toMatchObject({targetName: 'Cat', length: 5, maxDepth: 2, controlCount: 2});
    expect(result.complexityScore).toBeGreaterThanOrEqual(0);
    expect(result.complexityScore).toBeLessThanOrEqual(100);
});

// A sprite with `scripts` scripts, each a hat block then `length` blocks, nested `depth` repeats deep when depth > 0.
const makeSprite = (name, {scripts, length, depth = 0}) => {
    const blocks = {};
    const roots = [];
    for (let s = 0; s < scripts; s++) {
        const hat = `${name}-${s}-hat`;
        roots.push(hat);
        blocks[hat] = block(hat, 'event_whenflagclicked');
        let parent = hat;
        let attach = id => {
            blocks[hat].next = id;
        };
        for (let d = 0; d < depth; d++) {
            const loop = `${name}-${s}-loop${d}`;
            blocks[loop] = block(loop, 'control_repeat', {parent});
            attach(loop);
            parent = loop;
            attach = id => {
                blocks[loop].inputs.SUBSTACK = {block: id};
            };
        }
        for (let i = 0; i < length - depth; i++) {
            const id = `${name}-${s}-${i}`;
            blocks[id] = block(id, 'motion_movesteps', {parent});
            attach(id);
            const previous = id;
            parent = id;
            attach = next => {
                blocks[previous].next = next;
            };
        }
    }
    return {
        id: name,
        isOriginal: true,
        isStage: false,
        getName: () => name,
        sprite: {costumes: [], sounds: []},
        variables: {},
        blocks: {_blocks: blocks, getScripts: () => roots}
    };
};

const score = sprites => analyzeProject({targets: sprites});

test('bigger projects keep scoring higher instead of reaching 100', () => {
    const sprites = (count, scripts) => Array.from({length: count}, (_, i) => makeSprite(`S${i}`, {scripts, length: 20}));
    const small = score(sprites(1, 25));
    const medium = score(sprites(5, 20));
    const large = score(sprites(50, 20));
    expect(small.blockCount).toBe(525);
    expect(large.blockCount).toBe(21000);
    expect(small.complexityScore).toBeLessThan(medium.complexityScore);
    expect(medium.complexityScore).toBeLessThan(large.complexityScore);
    expect(large.complexityScore).toBeLessThan(100);
});

test('deeper nesting raises the score of a project of the same size', () => {
    const flat = score([makeSprite('Cat', {scripts: 20, length: 30})]);
    const nested = score([makeSprite('Cat', {scripts: 20, length: 30, depth: 6})]);
    expect(nested.blockCount).toBe(flat.blockCount);
    expect(nested.complexityScore).toBeGreaterThan(flat.complexityScore);
});

test('a big but tidy project gets no recommendations', () => {
    const tidy = score(Array.from({length: 50}, (_, i) => makeSprite(`S${i}`, {scripts: 20, length: 20})));
    expect(tidy.blockCount).toBe(21000);
    expect(tidy.recommendations.map(r => r.id)).toEqual(['custom-blocks']);
});

test('recommendations name the sprite to look at', () => {
    const result = score([
        makeSprite('Tidy', {scripts: 5, length: 10}),
        makeSprite('Deep', {scripts: 2, length: 20, depth: 6}),
        makeSprite('Long', {scripts: 1, length: 90}),
        makeSprite('Busy', {scripts: 45, length: 5})
    ]);
    const byId = Object.fromEntries(result.recommendations.map(r => [r.id, r]));
    expect(byId.nesting).toEqual({id: 'nesting', count: 2, sprite: 'Deep'});
    expect(byId.length).toEqual({id: 'length', count: 1, sprite: 'Long'});
    expect(byId.scripts).toEqual({id: 'scripts', count: 45, sprite: 'Busy'});
});
