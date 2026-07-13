import {analyzeProject} from '../../../src/addons/addons/block-count/blockcount';

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
