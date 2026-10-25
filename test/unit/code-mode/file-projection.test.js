import {ChangeSet} from '@codemirror/state';
import {
    addFileText,
    cachedProjection,
    followLayout,
    pinLayout,
    protectedBreaks,
    unpinLayouts,
    applyEdit,
    fileAt,
    fileHasContent,
    fileLine,
    mainEnd,
    projectFile,
    rangeToFile,
    regionFiles,
    removeFileText,
    renameFileText,
    scanRegions,
    toBuffer,
    toFile,
    validateFileName
} from '../../../src/lib/code-mode/file-projection.js';

const MAIN_PART = 'var lives = 5;\n\nwhen flag {\n  say "hi";\n}';
const ENEMY = 'when key space {\n  move 10;\n}';
const BUFFER = `${MAIN_PART}\n\nregion "enemies" {\n  ${ENEMY.split('\n').join('\n  ')}\n}\n\n` +
    'region "ui/hud" {\n  when flag {\n    show;\n  }\n}\n';

const cachedProjectionFor = (source, file) => cachedProjection(source, file).text;

const edit = (source, file, from, to, insert) => {
    const projection = projectFile(source, file);
    const changes = ChangeSet.of([{from, to, insert}], projection.text.length);
    const expectedView = projection.text.slice(0, from) + insert + projection.text.slice(to);
    return {next: applyEdit(source, file, expectedView, changes), expectedView};
};

const expectRoundTrip = (source, file, from, to, insert) => {
    const {next, expectedView} = edit(source, file, from, to, insert);
    expect(projectFile(next.text, file).text).toBe(expectedView);
    expect(next.changes.length).toBe(source.length);
    return next.text;
};

describe('file projection', () => {
    test('finds top level regions with cleaned names', () => {
        expect(regionFiles(BUFFER)).toEqual(['enemies', 'ui/hud']);
        const text = 'when flag {\n  say "region \\"x\\" {}";\n  // region "y" {}\n}\nregion "a.fractch" {\n}\n';
        expect(regionFiles(text)).toEqual(['a']);
    });

    test('skips unsafe, main and duplicate region names so they stay in the main file', () => {
        const text = 'region "../x" {\n}\nregion "main" {\n}\nregion "a" {\n}\nregion "A" {\n  when flag {}\n}\n';
        expect(regionFiles(text)).toEqual(['a']);
        expect(projectFile(text, null).text).toContain('region "../x"');
        expect(projectFile(text, null).text).toContain('region "A"');
    });

    test('ignores unclosed regions and regions inside scripts', () => {
        expect(regionFiles('when flag {\n  region "x" {\n  }\n}\n')).toEqual([]);
        expect(regionFiles('region "x" {\n  when flag {\n')).toEqual([]);
    });

    test('main view hides region blocks and the blank lines before them', () => {
        expect(projectFile(BUFFER, null).text).toBe(`${MAIN_PART}\n`);
    });

    test('region view strips the common indentation', () => {
        expect(projectFile(BUFFER, 'enemies').text).toBe(ENEMY);
        expect(projectFile(BUFFER, 'ui/hud').text).toBe('when flag {\n  show;\n}');
        expect(projectFile(BUFFER, 'missing')).toBeNull();
    });

    test('maps offsets both ways', () => {
        const projection = projectFile(BUFFER, 'enemies');
        const viewPos = projection.text.indexOf('move');
        const bufPos = toBuffer(projection, viewPos);
        expect(BUFFER.slice(bufPos, bufPos + 4)).toBe('move');
        expect(toFile(projection, bufPos)).toBe(viewPos);
        expect(toFile(projection, BUFFER.indexOf('lives'))).toBeNull();
        const main = projectFile(BUFFER, null);
        expect(toFile(main, BUFFER.indexOf('move'))).toBeNull();
        expect(toFile(main, BUFFER.indexOf('say'))).toBe(main.text.indexOf('say'));
        expect(fileAt(BUFFER, BUFFER.indexOf('move'))).toBe('enemies');
        expect(fileAt(BUFFER, BUFFER.indexOf('show'))).toBe('ui/hud');
        expect(fileAt(BUFFER, BUFFER.indexOf('say'))).toBeNull();
    });

    test('maps ranges into a file', () => {
        const projection = projectFile(BUFFER, 'enemies');
        const from = BUFFER.indexOf('when key');
        const to = BUFFER.indexOf('}', BUFFER.indexOf('move')) + 1;
        expect(rangeToFile(projection, from, to)).toEqual({from: 0, to: ENEMY.length});
        expect(rangeToFile(projection, BUFFER.indexOf('lives'), BUFFER.indexOf('lives') + 5)).toBeNull();
        expect(fileLine(projection, projection.text.indexOf('move'))).toBe(2);
    });

    test('typing in a region keeps the buffer indented', () => {
        const view = projectFile(BUFFER, 'enemies').text;
        const at = view.indexOf('move 10;') + 'move 10;'.length;
        const next = expectRoundTrip(BUFFER, 'enemies', at, at, '\nturn 15;');
        expect(next).toContain('    move 10;\n  turn 15;\n');
        expect(projectFile(next, null).text).toBe(projectFile(BUFFER, null).text);
    });

    test('pasting a whole script at the end of a region', () => {
        const view = projectFile(BUFFER, 'enemies').text;
        const next = expectRoundTrip(BUFFER, 'enemies', view.length, view.length, '\n\nwhen flag {\n  hide;\n}');
        expect(next).toContain('  when flag {\n    hide;\n  }\n}');
        expect(regionFiles(next)).toEqual(['enemies', 'ui/hud']);
    });

    test('edits at the start of a region and of each line', () => {
        expectRoundTrip(BUFFER, 'enemies', 0, 0, '// first\n');
        const view = projectFile(BUFFER, 'enemies').text;
        const lineStart = view.indexOf('}');
        const next = expectRoundTrip(BUFFER, 'enemies', lineStart, lineStart, 'x');
        expect(next).toContain('\n  x}\n');
    });

    test('deleting across lines in a region joins them without leftover indentation', () => {
        const view = projectFile(BUFFER, 'enemies').text;
        const from = view.indexOf('{') + 1;
        const to = view.indexOf('move');
        const next = expectRoundTrip(BUFFER, 'enemies', from, to, ' ');
        expect(next).toContain('  when key space { move 10;\n');
    });

    test('select all and delete in a region leaves an empty file', () => {
        const view = projectFile(BUFFER, 'enemies').text;
        const next = expectRoundTrip(BUFFER, 'enemies', 0, view.length, '');
        expect(regionFiles(next)).toEqual(['enemies', 'ui/hud']);
        const typed = expectRoundTrip(next, 'enemies', 0, 0, 'when flag {\n  hide;\n}');
        expect(typed).toContain('region "enemies" {\n  when flag {\n    hide;\n  }\n}');
    });

    test('typing into an empty region adds the line breaks and indentation', () => {
        const source = 'when flag {}\n\nregion "a" {\n}\n';
        expect(projectFile(source, 'a').text).toBe('');
        const next = expectRoundTrip(source, 'a', 0, 0, 'when flag {\n  say 1;\n}');
        expect(next).toBe('when flag {}\n\nregion "a" {\n  when flag {\n    say 1;\n  }\n}\n');
        const tabs = expectRoundTrip('when flag {\n\tsay 1;\n}\n\nregion "t" {\n}\n', 't', 0, 0,
            'when flag {\n\tsay 2;\n}');
        expect(tabs).toContain('region "t" {\n\twhen flag {\n\t\tsay 2;\n\t}\n}');
    });

    test('blank lines inside a region get indentation when typed into', () => {
        const source = 'region "a" {\n  when flag {}\n\n  when key a {}\n}\n';
        const view = projectFile(source, 'a').text;
        expect(view).toBe('when flag {}\n\nwhen key a {}');
        const at = view.indexOf('\n\n') + 1;
        const next = expectRoundTrip(source, 'a', at, at, 'say 1;');
        expect(next).toContain('\n  say 1;\n');
    });

    test('raw string lines are left exactly as written', () => {
        const source = 'region "a" {\n  when flag {\n    say """line one\nline two""";\n  }\n}\n';
        const view = projectFile(source, 'a').text;
        expect(view).toBe('when flag {\n  say """line one\nline two""";\n}');
        const at = view.indexOf('line one') + 'line one'.length;
        const next = expectRoundTrip(source, 'a', at, at, '\nmiddle');
        expect(next).toContain('line one\nmiddle\nline two');
    });

    test('typing in main at the junction lands before the hidden region', () => {
        const main = projectFile(BUFFER, null).text;
        const at = main.length - 1;
        const next = expectRoundTrip(BUFFER, null, at, at, '\n\nwhen key a {\n  hide;\n}');
        expect(next.indexOf('when key a')).toBeLessThan(next.indexOf('region "enemies"'));
        expect(regionFiles(next)).toEqual(['enemies', 'ui/hud']);
        expect(projectFile(next, 'enemies').text).toBe(ENEMY);
    });

    test('select all and delete in main keeps every region', () => {
        const main = projectFile(BUFFER, null).text;
        const next = expectRoundTrip(BUFFER, null, 0, main.length, '');
        expect(regionFiles(next)).toEqual(['enemies', 'ui/hud']);
        expect(projectFile(next, 'enemies').text).toBe(ENEMY);
        const typed = expectRoundTrip(next, null, 0, 0, 'when flag {}');
        expect(typed.startsWith('when flag {}\nregion "enemies"')).toBe(true);
    });

    test('only a region written on its own lines becomes a file', () => {
        const source = 'when flag {\n  say "x";\n}\nregion "a" { when key a {} }\nregion "b" {}\nwhen key b {}\n';
        expect(regionFiles(source)).toEqual([]);
        expect(projectFile(source, null).text).toBe(source);
    });

    test('handles CRLF line endings', () => {
        const source = 'when flag {}\r\n\r\nregion "a" {\r\n  when flag {\r\n    say 1;\r\n  }\r\n}\r\n';
        const projection = projectFile(source, 'a');
        expect(projection.text).toBe('when flag {\r\n  say 1;\r\n}');
        expect(projectFile(source, null).text).toBe('when flag {}\r\n');
        const at = projection.text.indexOf('say');
        expect(source.slice(toBuffer(projection, at), toBuffer(projection, at) + 3)).toBe('say');
        expectRoundTrip(source, 'a', at, at, 'x');
    });

    test('falls back to a text diff when the view and buffer disagree', () => {
        const projection = projectFile(BUFFER, 'enemies');
        const viewText = projection.text.replace('move 10', 'move 20');
        const next = applyEdit(BUFFER, 'enemies', viewText, ChangeSet.empty(3));
        expect(next.text).toContain('    move 20;');
        expect(projectFile(next.text, 'enemies').text).toBe(viewText);
    });

    test('adds, renames and removes files', () => {
        const added = addFileText(BUFFER, 'player/move');
        expect(regionFiles(added.text)).toEqual(['enemies', 'ui/hud', 'player/move']);
        expect(added.changes.length).toBe(BUFFER.length);
        expect(projectFile(added.text, 'player/move').text).toBe('');
        expect(added.text.endsWith('region "player/move" {\n}\n')).toBe(true);
        expect(addFileText('', 'a').text).toBe('region "a" {\n}\n');
        const renamed = renameFileText(added.text, 'enemies', 'foes');
        expect(regionFiles(renamed.text)).toEqual(['foes', 'ui/hud', 'player/move']);
        expect(projectFile(renamed.text, 'foes').text).toBe(ENEMY);
        const removed = removeFileText(renamed.text, 'foes');
        expect(regionFiles(removed.text)).toEqual(['ui/hud', 'player/move']);
        expect(removed.text).not.toContain('move 10');
        expect(projectFile(removed.text, null).text).toBe(projectFile(BUFFER, null).text);
        const first = removeFileText('region "a" {\n  when flag {}\n}\n\nwhen key a {}\n', 'a');
        expect(first.text).toBe('when key a {}\n');
        expect(renameFileText(BUFFER, 'nope', 'x')).toBeNull();
    });

    test('reports whether a file has scripts', () => {
        expect(fileHasContent(BUFFER, 'enemies')).toBe(true);
        expect(fileHasContent('region "a" {\n  // note\n}\n', 'a')).toBe(true);
        expect(fileHasContent('region "a" {\n  \n}\n', 'a')).toBe(false);
        expect(fileHasContent('region "a" {\n}\n', 'a')).toBe(false);
    });

    test('finds the end of the main scripts', () => {
        expect(mainEnd(BUFFER)).toBe(MAIN_PART.length);
        expect(mainEnd('when flag {}\n\n')).toBe('when flag {}'.length);
        expect(mainEnd('region "a" {\n}\n')).toBe(0);
    });

    test('scan reports name ranges for rewriting headers', () => {
        const [region] = scanRegions('region   "a b"   {\n}\n');
        expect(region.name).toBe('a b');
        expect('region   "a b"   {\n}\n'.slice(region.nameFrom, region.nameTo)).toBe('"a b"');
    });

    test('validates new file names like fractch paths', () => {
        const existing = ['enemies', 'ui/hud'];
        expect(validateFileName('player', existing)).toEqual({name: 'player'});
        expect(validateFileName(' ui/menu.fractch ', existing)).toEqual({name: 'ui/menu'});
        expect(validateFileName('a\\b', existing)).toEqual({name: 'a/b'});
        expect(validateFileName('', existing).error).toBe('empty');
        expect(validateFileName('   ', existing).error).toBe('empty');
        expect(validateFileName('.hidden', existing).error).toBe('invalid');
        expect(validateFileName('a/../b', existing).error).toBe('invalid');
        expect(validateFileName('a/./b', existing).error).toBe('invalid');
        expect(validateFileName('bad\u0001name', existing).error).toBe('invalid');
        expect(validateFileName('what?', existing).error).toBe('invalid');
        expect(validateFileName('Main', existing).error).toBe('reserved');
        expect(validateFileName('index', existing).error).toBe('reserved');
        expect(validateFileName('ENEMIES', existing).error).toBe('taken');
        expect(validateFileName('Enemies', existing, 'enemies')).toEqual({name: 'Enemies'});
        expect(validateFileName('con', existing).error).toBe('reserved');
        expect(validateFileName('ui/NUL.notes', existing).error).toBe('reserved');
        expect(validateFileName('lpt9/boss', existing).error).toBe('reserved');
        expect(validateFileName('console', existing)).toEqual({name: 'console'});
        expect(validateFileName('trailing.', existing).error).toBe('invalid');
        expect(validateFileName('UI/menu', existing)).toEqual({error: 'folderCase', folder: 'ui'});
        expect(validateFileName('ui/menu', existing)).toEqual({name: 'ui/menu'});
        expect(validateFileName('UI/hud', ['ui/hud'], 'ui/hud')).toEqual({name: 'UI/hud'});
    });
    describe('half typed text never changes the layout', () => {
        const typeAt = (source, file, needle, insert, offset = 0) => {
            const view = projectFile(source, file).text;
            const at = view.indexOf(needle) + offset;
            return expectRoundTrip(source, file, at, at, insert);
        };

        test.each([
            ['a quote in a file', 'enemies', 'move', '"'],
            ['an opening brace in a file', 'enemies', 'move', '{'],
            ['a block comment in a file', 'enemies', 'move', '/*'],
            ['a backtick in a file', 'enemies', 'move', '`'],
            ['a raw string in a file', 'enemies', 'move', '"""'],
            ['a quote in main', null, 'say', '"'],
            ['an opening brace in main', null, 'say', '{'],
            ['a block comment in main', null, 'when flag', '/*'],
            ['a backtick in main', null, 'say', '`'],
            ['a raw string in main', null, 'when flag', '"""'],
            ['a brace at the top of main', null, 'var', '{\n']
        ])('%s', (label, file, needle, insert) => {
            const next = typeAt(BUFFER, file, needle, insert);
            expect(regionFiles(next)).toEqual(['enemies', 'ui/hud']);
            expect(projectFile(next, 'ui/hud').text).toBe('when flag {\n  show;\n}');
        });

        test('deleting the last brace of a script in a file keeps both files', () => {
            const view = projectFile(BUFFER, 'enemies').text;
            const next = expectRoundTrip(BUFFER, 'enemies', view.length - 1, view.length, '');
            expect(regionFiles(next)).toEqual(['enemies', 'ui/hud']);
            expect(projectFile(next, 'enemies').text).toBe(view.slice(0, -1));
        });

        test('deleting the line breaks after a file in main cannot join the closing brace', () => {
            const source = 'region "a" {\n  when flag {}\n}\n\nwhen key b {}\n';
            const main = projectFile(source, null).text;
            expect(main).toBe('\nwhen key b {}\n');
            const next = expectRoundTrip(source, null, 0, 1, '');
            expect(regionFiles(next)).toEqual(['a']);
            expect(next).toBe('region "a" {\n  when flag {}\n}\nwhen key b {}\n');
        });
    });

    describe('indentation survives clearing and undoing', () => {
        const clearAndRestore = (source, file) => {
            const view = projectFile(source, file).text;
            const cleared = expectRoundTrip(source, file, 0, view.length, '');
            expect(projectFile(cleared, file).text).toBe('');
            return expectRoundTrip(cleared, file, 0, 0, view);
        };

        test('a tab indented file comes back exactly', () => {
            const source = 'region "t" {\n\twhen flag {\n\t\tsay 1;\n\t}\n}\n';
            expect(projectFile(source, 't').text).toBe('when flag {\n\tsay 1;\n}');
            expect(clearAndRestore(source, 't')).toBe(source);
        });

        test('a space indented file comes back exactly', () => {
            expect(clearAndRestore(BUFFER, 'enemies')).toBe(BUFFER);
            expect(clearAndRestore(BUFFER, 'ui/hud')).toBe(BUFFER);
        });

        test('pasting into a new file uses the indentation of the sprite', () => {
            const source = 'when flag {\n\tsay 1;\n}\n\nregion "n" {\n}\n';
            const next = expectRoundTrip(source, 'n', 0, 0, 'when key a {\n\thide;\n}');
            expect(next).toContain('region "n" {\n\twhen key a {\n\t\thide;\n\t}\n}');
        });
    });

    test('a region name is read the way fractch reads it', () => {
        expect(regionFiles('region "a\\u0041" {\n}\n')).toEqual(['au0041']);
        expect(regionFiles('region "say \\"hi\\"" {\n}\n')).toEqual([]);
        expect(regionFiles('region "b.fractch" {\n}\n')).toEqual(['b']);
        expect(validateFileName('b.fractch', [])).toEqual({name: 'b'});
    });

    test('files that are being typed in main can be left out of the layout', () => {
        const source = `${BUFFER}\nregion "typed" {\n  \n}\n`;
        expect(regionFiles(source)).toEqual(['enemies', 'ui/hud', 'typed']);
        const exclude = new Set(['typed']);
        expect(regionFiles(source, exclude)).toEqual(['enemies', 'ui/hud']);
        expect(projectFile(source, null, exclude).text).toContain('region "typed" {');
        expect(fileAt(source, source.indexOf('"typed"'), exclude)).toBeNull();
        expect(fileAt(source, source.indexOf('"typed"'))).toBe('typed');
    });
    describe('second review', () => {
        test('Enter at the end of main adds a visible line before a file', () => {
            const main = projectFile(BUFFER, null).text;
            expect(main.endsWith('}\n')).toBe(true);
            const once = expectRoundTrip(BUFFER, null, main.length, main.length, '\n');
            const twice = expectRoundTrip(once, null, main.length + 1, main.length + 1, 'x');
            expect(projectFile(twice, null).text).toBe(`${main}\nx`);
            const endOfBrace = expectRoundTrip(BUFFER, null, main.length - 1, main.length - 1, '\n');
            expect(projectFile(endOfBrace, null).text).toBe(`${main.slice(0, -1)}\n\n`);
            expect(regionFiles(twice)).toEqual(['enemies', 'ui/hud']);
            const cleared = expectRoundTrip(BUFFER, null, main.length - 1, main.length, '');
            expect(regionFiles(cleared)).toEqual(['enemies', 'ui/hud']);
        });

        const RAW = 'region "a" {\n  when flag {\n    set x to """\n{\n  "k": 1\n}\n""";\n    say x;\n  }\n}\n';

        test('a raw string with a closing brace line stays inside its file', () => {
            const source = `when flag {}\n\n${RAW}`;
            expect(regionFiles(source)).toEqual(['a']);
            expect(projectFile(source, 'a').text)
                .toBe('when flag {\n  set x to """\n{\n  "k": 1\n}\n""";\n  say x;\n}');
            expect(projectFile(source, null).text).toBe('when flag {}\n');
        });

        test('one unbalanced raw quote keeps the layout and indentation of a file with raw strings', () => {
            const source = `when flag {}\n\n${RAW}`;
            const view = projectFile(source, 'a').text;
            const at = view.indexOf('say x;');
            const next = expectRoundTrip(source, 'a', at, at, '"""');
            expect(regionFiles(next)).toEqual(['a']);
            expect(projectFile(next, null).text).toBe('when flag {}\n');
        });

        test('typing a multi-line raw string in a file keeps its value', () => {
            const source = 'region "a" {\n  when flag {\n    say 1;\n  }\n}\n';
            let text = source;
            const steps = ['say """', '\n', '}', '\n', '"""'];
            let at = projectFile(text, 'a').text.indexOf('say 1;') + 'say 1;'.length;
            text = expectRoundTrip(text, 'a', at, at, '\n');
            at += 1;
            for (const step of steps) {
                text = expectRoundTrip(text, 'a', at, at, step);
                at += step.length;
                expect(regionFiles(text)).toEqual(['a']);
            }
            expect(text).toContain('say """\n}\n"""');
        });

        test('projecting a long file stays fast', () => {
            const body = Array.from({length: 5000}, (_, i) => `  when key a {\n    say "${i}";\n  }`).join('\n');
            const source = `region "big" {\n${body}\n}\n`;
            const started = Date.now();
            let text = source;
            for (let i = 0; i < 10; i++) {
                const view = cachedProjectionFor(text, 'big');
                text = applyEdit(text, 'big', `x${view}`, ChangeSet.of([{from: 0, insert: 'x'}], view.length)).text;
            }
            expect(Date.now() - started).toBeLessThan(1500);
            expect(regionFiles(text)).toEqual(['big']);
        });

        test('typing an existing file name in main never takes over that file', () => {
            const next = expectRoundTrip(BUFFER, null, 0, 0, 'region "enemies" {\n  \n}\n');
            expect(regionFiles(next)).toEqual(['enemies', 'ui/hud']);
            expect(projectFile(next, 'enemies').text).toBe(ENEMY);
            expect(projectFile(next, null).text.startsWith('region "enemies" {')).toBe(true);
        });

        test('typing into an empty file and undoing leaves it empty again', () => {
            const source = 'when flag {}\n\nregion "e" {\n}\n';
            const typed = expectRoundTrip(source, 'e', 0, 0, 'x');
            expect(expectRoundTrip(typed, 'e', 0, 1, '')).toBe(source);
        });

        test('regions with names that cannot be files stay in main', () => {
            const names = ['CON', 'a:b', 'index', 'UI/menu'];
            const source = `region "ui/hud" {\n}\n${names.map(name => `region "${name}" {\n}\n`).join('')}`;
            expect(regionFiles(source)).toEqual(['ui/hud']);
            for (const name of names) expect(projectFile(source, null).text).toContain(`region "${name}"`);
        });

        test('regions inside comments or raw strings in main are not files', () => {
            const source = 'when flag {}\n/*\nregion "c" {\n}\n*/\nsay """\nregion "r" {\n}\n""";\n';
            expect(regionFiles(source)).toEqual([]);
            expect(projectFile(source, null).text).toBe(source);
        });

        test('deleting a file between main and another file keeps a blank line', () => {
            const source = 'when flag {}\n\nregion "a" {\n  when key a {}\n}\n\nregion "b" {\n  when key b {}\n}\n';
            expect(removeFileText(source, 'a').text).toBe('when flag {}\n\nregion "b" {\n  when key b {}\n}\n');
        });
    });
    describe('third review', () => {
        test('a file between two main lines keeps them on separate lines', () => {
            const source = 'say 1; // note\nregion "a" {\n  when flag {}\n}\nsay 2;\n';
            expect(regionFiles(source)).toEqual(['a']);
            expect(projectFile(source, null).text).toBe('say 1; // note\nsay 2;\n');
            const main = projectFile(source, null).text;
            const at = main.indexOf('say 2;');
            const joined = applyEdit(source, null, null, ChangeSet.of([{from: at - 1, to: at}], main.length)).text;
            expect(regionFiles(joined)).toEqual(['a']);
            const typed = expectRoundTrip(source, null, at - 1, at - 1, '\nsay 1.5;');
            expect(projectFile(typed, null).text).toBe('say 1; // note\nsay 1.5;\nsay 2;\n');
        });

        test('a carried layout belongs to its sprite and survives other edits', () => {
            const source = 'region "a" {\n  when flag {\n    set x to """\n{\n}\n""";\n  }\n}\n\nwhen key b {}\n';
            expect(regionFiles(source)).toEqual(['a']);
            const view = projectFile(source, 'a').text;
            const close = view.lastIndexOf('"""');
            const broken = applyEdit(source, 'a', null, ChangeSet.of([{from: close, to: close + 3}], view.length)).text;
            pinLayout('sprite-a', broken);
            for (let i = 0; i < 40; i++) regionFiles(`region "x${i}" {\n}\n`);
            expect(regionFiles(broken)).toEqual(['a']);
            expect(projectFile(broken, null).text).toBe('\nwhen key b {}\n');
            const rebased = `when flag {}\n${broken}`;
            followLayout('sprite-a', rebased);
            for (let i = 0; i < 40; i++) regionFiles(`region "y${i}" {\n}\n`);
            expect(regionFiles(rebased)).toEqual(['a']);
            expect(projectFile(rebased, null).text).toBe('when flag {}\n\nwhen key b {}\n');
            unpinLayouts();
        });
    });
    describe('final review', () => {
        const X = 'region "x" {\n  b\n}\n';
        const Y = 'region "y" {\n  d\n}\n';

        test('deleting a file next to another keeps the other header on its own line', () => {
            const source = `a\n${X}${Y}c\n`;
            const removed = removeFileText(source, 'x').text;
            expect(removed).toBe(`a\n${Y}c\n`);
            expect(regionFiles(removed)).toEqual(['y']);
            expect(removeFileText(source, 'y').text).toBe(`a\n${X}c\n`);
            const atEnd = `a\n\n${X}`;
            expect(removeFileText(atEnd, 'x').text).toBe('a\n');
        });

        test('the first main line can be deleted when a file follows it', () => {
            const source = `a\n${X}c\n`;
            expect(projectFile(source, null).text).toBe('a\nc\n');
            const once = applyEdit(source, null, null, ChangeSet.of([{from: 0, to: 2}], 4)).text;
            expect(regionFiles(once)).toEqual(['x']);
            const view = projectFile(once, null).text;
            const twice = applyEdit(once, null, null, ChangeSet.of([{from: 0, to: view.indexOf('c')}], view.length)).text;
            expect(projectFile(twice, null).text).toBe('c\n');
            expect(regionFiles(twice)).toEqual(['x']);
        });

        test('adjacent files hide as one block and a pending neighbour keeps its own lines', () => {
            const source = `a\n${X}${Y}c\n`;
            expect(projectFile(source, null).text).toBe('a\nc\n');
            const pending = `a\n${X}${Y}// tail\n`;
            expect(projectFile(pending, null, new Set(['y'])).text).toBe(`a\n${Y}// tail\n`);
            expect(projectFile(pending, null, new Set(['x'])).text).toBe(`a\n${X}// tail\n`);
        });

        test('the protected line break after a file is reported in main view positions', () => {
            const source = `a\n${X}c\n`;
            const projection = projectFile(source, null);
            expect(protectedBreaks(projection)).toEqual([{at: 1, beforeFrom: 0, afterTo: 4}]);
            expect(protectedBreaks(projectFile(`a\n\n${X}`, null))).toEqual([]);
        });

        test('two sprites with the same text never share a carried layout', () => {
            const balanced = 'region "a" {\n  when flag {\n    set x to """\n{\n}\n""";\n  }\n}\n\nwhen key b {}\n';
            const view = projectFile(balanced, 'a').text;
            const close = view.lastIndexOf('"""');
            const broken = applyEdit(balanced, 'a', null, ChangeSet.of([{from: close, to: close + 3}], view.length)).text;
            const churn = tag => {
                for (let i = 0; i < 40; i++) regionFiles(`region "${tag}${i}" {\n}\n`);
            };
            pinLayout('one', broken);
            churn('p');
            expect(projectFile(broken, null).text).toBe('\nwhen key b {}\n');
            pinLayout('two', balanced);
            followLayout('two', broken);
            churn('q');
            expect(projectFile(broken, null).text).not.toBe('\nwhen key b {}\n');
            unpinLayouts(new Set(['one']));
            churn('r');
            expect(projectFile(broken, null).text).toBe('\nwhen key b {}\n');
            unpinLayouts(new Set());
            churn('s');
            expect(projectFile(broken, null).text).not.toBe('\nwhen key b {}\n');
        });
    });
});
