import {
    changedScripts,
    compactScriptDiff,
    mergeScriptDiff,
    matchScripts,
    translateCall,
    translateScript,
    translateValue
} from '../../src/community/scratchblocks-translate.js';
import {parseFractch} from 'fractch/browser';

const firstCall = (source, opcode) => {
    const parsed = parseFractch(source);
    const found = [];
    const visit = nodes => {
        for (const node of nodes || []) {
            if (node?.type === 'call' && node.callee?.type === 'opcode') {
                if (!opcode || node.callee.name === opcode) found.push(node);
            }
            if (node?.type === 'call' && node.value) visit([node.value]);
            for (const arg of node.args || []) {
                if (arg?.body) visit(arg.body);
                else if (arg?.value) visit([arg.value]);
            }
            if (node.body) visit(node.body);
        }
    };
    for (const script of parsed.scripts) visit(script.calls);
    return opcode ? found[0] : found;
};

const translateSource = source => {
    const parsed = parseFractch(source);
    return parsed.scripts.map(script => translateScript(script)).join('\n\n');
};

describe('scratchblocks translation', () => {
    test('translates hats to scratch language', () => {
        expect(translateSource('when flag {\n}\n')).toContain('when green flag clicked');
        expect(translateSource('when broadcast go {\n}\n')).toContain('when I receive [go v]');
        expect(translateSource('when clicked {\n}\n')).toContain('when this sprite clicked');
        expect(translateSource('when key "space" {\n}\n')).toContain('when [space v] key pressed');
        expect(translateSource('when clone {\n}\n')).toContain('when I start as a clone');
    });

    test('translates common statements', () => {
        const text = translateSource(
            'when flag {\n  move 10;\n  turnLeft 15;\n  say "hi" for 2;\n  hide;\n  wait 1;\n  broadcast go;\n}\n'
        );

        expect(text).toContain('move (10) steps');
        expect(text).toContain('turn left (15) degrees');
        expect(text).toContain('say [hi] for (2) seconds');
        expect(text).toContain('hide');
        expect(text).toContain('wait (1) seconds');
        expect(text).toContain('broadcast [go v]');
    });

    test('translates variables, sounds, and pen', () => {
        const text = translateSource(
            'when flag {\n  score = 0;\n  score += 1;\n  playSound pop;\n  pen_down;\n  stamp;\n}\n'
        );

        expect(text).toContain('set [score v] to (0)');
        expect(text).toContain('change [score v] by (1)');
        expect(text).toContain('play sound [pop v]');
        expect(text).toContain('pen down');
        expect(text).toContain('stamp');
    });

    test('translates control structures with nesting', () => {
        const text = translateSource(
            'when flag {\n  repeat 4 {\n    if touching("edge") {\n      stop all;\n    }\n  }\n}\n'
        );

        expect(text).toContain('repeat (4)');
        expect(text).toContain('if <touching [edge v]?> then');
        expect(text).toContain('stop [all v]');
        expect(text).toContain('end');
    });

    test('preserves empty boolean inputs', () => {
        const text = translateSource('when flag {\n  wait_until !null;\n}\n');

        expect(text).toContain('wait until <not <>>');
        expect(text).not.toContain('…');
        expect(text).not.toContain('(0)');
    });

    test('keeps extension colors and dropdown inputs', () => {
        const text = translateSource([
            'when flag {',
            '  mistwarpData.set(KEY: "coins", VALUE: vars["Meow Coin"]);',
            '  gotoXY runtimeoptions.getDimension(dimension: runtimeoptions.menu_dimension("width")) / 2, 0;',
            '  costume "boykisser";',
            '}'
        ].join('\n'));

        expect(text).toContain('set saved [coins] to (Meow Coin) :: #277a59');
        expect(text).toContain('[width v]');
        expect(text).toContain(':: extension');
        expect(text).toContain('switch costume to [boykisser v]');
    });

    test('keeps extension calls without arguments in script stacks', () => {
        const text = translateSource([
            'when flag {',
            '  mistwarpData.load();',
            '  forever {',
            '    wait 5;',
            '    mistwarpData.save();',
            '  }',
            '}'
        ].join('\n'));

        expect(text).toBe([
            'when green flag clicked',
            'load my save :: #277a59',
            'forever',
            '  wait (5) seconds',
            '  save now :: #277a59',
            'end'
        ].join('\n'));
    });

    test('translates operators and reporters', () => {
        expect(translateValue({type: 'number', value: 10, raw: '10'})).toBe('(10)');
        expect(translateValue({type: 'string', value: 'hi'})).toBe('[hi]');
        expect(translateValue({type: 'var', name: 'score'})).toBe('(score)');
        expect(translateValue({type: 'array', value: ['lives']})).toBe('[lives]');
        const equals = firstCall('when flag {\n  if a == 1 {\n  }\n}\n', 'operator_equals');
        expect(translateCall(equals)).toBe('<(a) = (1)>');
        expect(translateValue(equals)).toBe('<(a) = (1)>');
        expect(translateSource('when flag {\n  if a == 1 {\n  }\n}\n')).toContain('if <(a) = (1)> then');
        const join = firstCall('when flag {\n  say "a" ++ "b";\n}\n', 'operator_join');
        expect(translateValue(join)).toBe('(join [a] [b])');
    });

    test('falls back gracefully for unknown opcodes', () => {
        const text = translateCall({type: 'call', callee: {type: 'opcode', name: 'some_future_block'}});
        expect(text).toBe('future block :: extension');
    });

    test('marks added and removed statements', () => {
        const matches = changedScripts('when flag {\n  move 10;\n}\n', 'when flag {\n  move 20;\n}\n');

        expect(matches).toHaveLength(1);
        expect(matches[0].before).toContain('- move (10) steps');
        expect(matches[0].after).toContain('+ move (20) steps');
        expect(matches[0].diff).toBe([
            'when green flag clicked',
            '- move (10) steps',
            '+ move (20) steps'
        ].join('\n'));
    });

    test('merges unchanged context around block changes', () => {
        const merged = mergeScriptDiff(
            'when green flag clicked\nforever\n  move (10) steps\n  say [same]\nend',
            'when green flag clicked\nforever\n  move (20) steps\n  say [same]\nend'
        );
        expect(merged).toBe([
            'when green flag clicked',
            'forever',
            '-   move (10) steps',
            '+   move (20) steps',
            '  say [same]',
            'end'
        ].join('\n'));
        expect(compactScriptDiff(merged)).toBe([
            'when green flag clicked',
            'forever',
            '-   move (10) steps',
            '+   move (20) steps',
            '  say [same]',
            'end'
        ].join('\n'));
    });

    test('closes a deleted loop before adding its replacement inside a condition', () => {
        const before = [
            'when I receive [coinclaim v]',
            'change [wealth v] by (cointype)',
            'repeat (10)',
            '  turn left (5) degrees',
            '  change y by (5)',
            'end',
            'hide'
        ];
        const after = [
            before[0],
            'if <(coin claiming?) = (0)> then',
            '  set [coin claiming? v] to (1)',
            ...before.slice(1).map(line => `  ${line}`),
            'end'
        ];
        const expected = [
            before[0],
            ...before.slice(1).map(line => line.trim() === 'end' ? line : `- ${line}`),
            ...after.slice(1).map(line => line.trim() === 'end' ? line : `+ ${line}`)
        ].join('\n');

        expect(mergeScriptDiff(before.join('\n'), after.join('\n'))).toBe(expected);
        expect(compactScriptDiff(expected)).toBe(expected);
    });

    test('keeps both branches of a replaced condition outside the new condition', () => {
        const before = 'if <(x) = (1)> then\n  show\nelse\n  hide\nend';
        const after = 'if <(x) = (2)> then\n  show\nelse\n  hide\nend';
        expect(mergeScriptDiff(before, after)).toBe([
            '- if <(x) = (1)> then', '-   show', 'else', '-   hide', 'end',
            '+ if <(x) = (2)> then', '+   show', 'else', '+   hide', 'end'
        ].join('\n'));
    });

    test('keeps nearby blocks but drops distant unchanged code', () => {
        const source = [
            'when green flag clicked',
            'move (1) steps',
            'move (2) steps',
            'move (3) steps',
            '- move (4) steps',
            '+ move (40) steps',
            'move (5) steps',
            'move (6) steps',
            'move (7) steps'
        ].join('\n');

        expect(compactScriptDiff(source)).toBe([
            'when green flag clicked',
            '. . .',
            'move (2) steps',
            'move (3) steps',
            '- move (4) steps',
            '+ move (40) steps',
            'move (5) steps',
            'move (6) steps',
            '. . .'
        ].join('\n'));
    });

    test('marks omitted blocks at the right nesting level', () => {
        const source = [
            'when green flag clicked',
            'forever',
            '  move (1) steps',
            '  move (2) steps',
            '  move (3) steps',
            '-   move (4) steps',
            '+   move (40) steps',
            '  move (5) steps',
            '  move (6) steps',
            '  move (7) steps',
            'end'
        ].join('\n');

        expect(compactScriptDiff(source)).toBe([
            'when green flag clicked',
            'forever',
            '  . . .',
            '  move (2) steps',
            '  move (3) steps',
            '-   move (4) steps',
            '+   move (40) steps',
            '  move (5) steps',
            '  move (6) steps',
            '  . . .',
            'end'
        ].join('\n'));
    });

    test('detects added and removed scripts', () => {
        const matches = changedScripts(
            'when flag {\n  move 10;\n}\n',
            'when flag {\n  move 10;\n}\nwhen key "space" {\n  say "hi";\n}\n'
        );
        const added = matches.find(match => match.before === null);

        expect(added.after).toContain('when [space v] key pressed');
        expect(added.after).toContain('say [hi]');
    });

    test('matches scripts by hat and reports descriptions', () => {
        const matches = matchScripts(
            parseFractch('when broadcast go {\n  move 10;\n}\n'),
            parseFractch('when broadcast go {\n  move 10;\n}\n')
        );

        expect(matches).toHaveLength(1);
        expect(matches[0].changed).toBe(false);
    });
});
