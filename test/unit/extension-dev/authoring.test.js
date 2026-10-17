import {EditorState} from '@codemirror/state';
import {history, undo} from '@codemirror/commands';
import {EditorView} from '@codemirror/view';
import {CompletionContext} from '@codemirror/autocomplete';
import {javascript} from '@codemirror/lang-javascript';
import {ensureSyntaxTree} from '@codemirror/language';
import {findOpcodeDefinition, readHeaderMetadata} from '../../../src/lib/extension-dev/source-locate.js';
import {scratchCompletionSource, scratchHoverSource, scratchAutocomplete} from
    '../../../src/lib/extension-dev/completions.js';
import {
    deriveExtensionId,
    isValidExtensionId,
    blankTemplate,
    snippets
} from '../../../src/lib/extension-dev/templates.js';
import {createLinter} from '../../../src/lib/extension-dev/lint-client.js';
import {lintExtension} from '../../../src/lib/extension-dev/lint.js';
import {findMemberDoc, findKeyDoc, memberDocs, keyDocs} from '../../../src/lib/extension-dev/api-docs.js';

const stateFor = doc => {
    const state = EditorState.create({doc, extensions: [javascript()]});
    ensureSyntaxTree(state, doc.length, 5000);
    return state;
};

const completeAt = (doc, marker = '|', explicit = false) => {
    const pos = doc.indexOf(marker);
    const text = doc.slice(0, pos) + doc.slice(pos + marker.length);
    const state = stateFor(text);
    return scratchCompletionSource(new CompletionContext(state, pos, explicit));
};

const labels = result => (result ? result.options.map(option => option.label) : []);

const INFO_DOC = `class A {
  getInfo() {
    return {
      |
      blocks: [{ opcode: "a", arguments: { X: { ty } } }],
      menus: { m: { it } },
    };
  }
}`;

describe('source-locate', () => {
    const source = `// Name: Locate
// ID: locate
// By: Someone
// Version: 2
// Description: Finds things.

// License: MIT
(function (Scratch) {
  class Locate {
    getInfo() {
      return {
        id: "locate",
        blocks: [
          {opcode: "viaFunc", func: "realMethod"},
          {opcode: "direct"},
          {opcode: "noMethod"},
        ],
      };
    }
    realMethod() {}
    direct() {}
  }
  Scratch.extensions.register(new Locate());
})(Scratch);
`;

    test('finds the method named by func, then by opcode', () => {
        const viaFunc = findOpcodeDefinition(source, 'viaFunc');
        expect(source.slice(viaFunc.from, viaFunc.to)).toBe('realMethod');
        const direct = findOpcodeDefinition(source, 'direct');
        expect(source.slice(direct.from, direct.to)).toBe('direct');
        expect(source.slice(direct.from - 4, direct.from)).toBe('    ');
    });

    test('falls back to the string literal, then getInfo', () => {
        const literal = findOpcodeDefinition(source, 'noMethod');
        expect(source.slice(literal.from, literal.to)).toBe('"noMethod"');
        const info = findOpcodeDefinition(source, 'missing');
        expect(source.slice(info.from, info.to)).toBe('getInfo');
        expect(source.slice(...Object.values(findOpcodeDefinition(source, 'locate_direct')))).toBe('getInfo');
        expect(findOpcodeDefinition('', 'a')).toBeNull();
    });

    test('prefers the method of the class that declares the opcode', () => {
        const twoClasses = `class Other {\n  run() {}\n}\nclass Ext {\n  getInfo() {\n` +
            '    return {id: "e", blocks: [{opcode: "run"}]};\n  }\n  run() {}\n}\n';
        const found = findOpcodeDefinition(twoClasses, 'run');
        expect(found.from).toBe(twoClasses.lastIndexOf('run() {}'));
    });

    test('works on files that do not parse', () => {
        const broken = 'const x = {opcode: "abc", ;\n';
        const found = findOpcodeDefinition(broken, 'abc');
        expect(broken.slice(found.from, found.to)).toBe('"abc"');
    });

    test('reads header metadata', () => {
        expect(readHeaderMetadata(source)).toEqual({
            name: 'Locate',
            id: 'locate',
            description: 'Finds things.',
            license: 'MIT',
            author: 'Someone',
            version: '2'
        });
        expect(readHeaderMetadata('/**\n * @author Mist\n * @version 6.0\n */\n// License: MIT\ncode();'))
            .toMatchObject({author: 'Mist', version: '6.0', license: 'MIT', name: ''});
        expect(readHeaderMetadata('code();\n// Name: Late')).toMatchObject({name: ''});
    });
});

describe('templates', () => {
    test('derives and validates ids', () => {
        expect(deriveExtensionId('My Cool Ext!')).toBe('mycoolext');
        expect(deriveExtensionId('***')).toBe('myextension');
        expect(isValidExtensionId('abc123')).toBe(true);
        expect(isValidExtensionId('ABC')).toBe(true);
        expect(isValidExtensionId('a_b')).toBe(false);
        expect(isValidExtensionId('')).toBe(false);
    });

    test('templates carry the name, id, and metadata', () => {
        const source = blankTemplate({name: '3D "Fun"', id: 'fun3d'});
        expect(readHeaderMetadata(source)).toMatchObject({name: '3D "Fun"', id: 'fun3d', license: 'MPL-2.0'});
        expect(source).toContain('id: "fun3d"');
        expect(source).toContain('name: "3D \\"Fun\\""');
        expect(source).toContain('class Extension3DFun');
        expect(lintExtension(source)).toEqual([]);
    });

    test('provides the planned snippets', () => {
        expect(snippets.map(each => each.label)).toEqual(
            ['block', 'reporter', 'boolean', 'hat', 'label', 'compiled reporter', 'menu']);
    });

    test('block snippets insert the block and a matching method', () => {
        const doc = blankTemplate({name: 'Snip', id: 'snip'});
        const at = doc.indexOf('blocks: [') + 'blocks: ['.length;
        const parent = document.createElement('div');
        const view = new EditorView({
            state: EditorState.create({doc, extensions: [javascript()]}),
            parent
        });
        ensureSyntaxTree(view.state, doc.length, 5000);
        const compiled = snippets.find(each => each.label === 'compiled reporter');
        compiled.apply(view, compiled, at, at);
        const result = view.state.doc.toString();
        view.destroy();
        expect(result).toContain('opcode: "double1"');
        expect(result).toContain('compFunc: "double1Compiled"');
        expect(result).toContain('    double1Compiled(args, {cast}) {');
        expect(result).toContain('    double1(args) {');
        expect(lintExtension(result)).toEqual([]);
    });
});

describe('completions', () => {
    test('completes Scratch members', () => {
        const result = completeAt('Scratch.|');
        expect(labels(result)).toEqual(expect.arrayContaining(['BlockType', 'ArgumentType', 'vm', 'extensions',
            'Cast', 'fetch', 'translate']));
        expect(result.from).toBe('Scratch.'.length);
    });

    test('completes enums, Cast, extensions and runtime members', () => {
        expect(labels(completeAt('Scratch.BlockType.RE|'))).toContain('REPORTER');
        expect(labels(completeAt('x = Scratch.ArgumentType.|'))).toContain('STRING');
        expect(labels(completeAt('Scratch.TargetType.|'))).toEqual(['SPRITE', 'STAGE']);
        expect(labels(completeAt('Scratch.Cast.|'))).toContain('toNumber');
        expect(labels(completeAt('Scratch.extensions.|'))).toContain('unsandboxed');
        expect(labels(completeAt('Scratch.vm.runtime.|'))).toContain('startHats');
        expect(labels(completeAt('const {vm} = Scratch; vm.runtime.|'))).toContain('targets');
        expect(completeAt('foo.|')).toBeNull();
        expect(completeAt('"Scratch.|"')).toBeNull();
    });

    test('completes getInfo, block, argument, and menu keys', () => {
        expect(labels(completeAt(INFO_DOC, '|', true))).toEqual(expect.arrayContaining(['id', 'name', 'color1']));
        expect(labels(completeAt(INFO_DOC.replace('|', '').replace('{ ty }', '{ ty| }')))).toContain('type');
        expect(labels(completeAt(INFO_DOC.replace('|', '').replace('{ it }', '{ it| }')))).toContain('items');
        expect(labels(completeAt(INFO_DOC.replace('|', '').replace('opcode: "a",', 'opcode: "a", bl|'))))
            .toContain('blockType');
        expect(completeAt(INFO_DOC.replace('|', '').replace('{ ty }', '{ type: ty| }'))).toBeNull();
    });

    test('offers block snippets in the blocks array and menu snippets in menus', () => {
        const blocks = completeAt(INFO_DOC.replace('|', '').replace('blocks: [', 'blocks: [re|'));
        expect(labels(blocks)).toContain('reporter');
        expect(labels(blocks)).not.toContain('menu');
        const menus = completeAt(INFO_DOC.replace('|', '').replace('menus: {', 'menus: {me|'));
        expect(labels(menus)).toEqual(['menu']);
    });

    test('hover shows the doc for Scratch members and getInfo keys', () => {
        const doc = `class A {\n  getInfo() {\n    return {blocks: [{blockType: Scratch.BlockType.REPORTER}]};\n  }\n}`;
        const state = stateFor(doc);
        const at = doc.indexOf('REPORTER') + 2;
        const tooltip = scratchHoverSource({state}, at, 1);
        expect(doc.slice(tooltip.pos, tooltip.end)).toBe('REPORTER');
        const {dom} = tooltip.create();
        expect(dom.className).toBe('mw-ext-hover');
        expect(dom.querySelector('.mw-ext-hover-detail').textContent).toContain('Scratch.BlockType.REPORTER');
        const key = scratchHoverSource({state}, doc.indexOf('blockType') + 1, 1);
        expect(key.create().dom.textContent).toContain('The kind of block');
        expect(scratchHoverSource({state}, doc.indexOf('class') + 1, 1)).toBeNull();
    });

    test('key context works deep in a large document', () => {
        const filler = 'const filler = [1, 2, 3];\n'.repeat(100000);
        const text = `${filler}${INFO_DOC.replace('|', '')}`;
        const pos = text.indexOf('{ ty }') + 4;
        for (const state of [stateFor(text), EditorState.create({doc: text, extensions: [javascript()]})]) {
            const started = performance.now();
            const result = scratchCompletionSource(new CompletionContext(state, pos, false));
            expect(performance.now() - started).toBeLessThan(50);
            expect(labels(result)).toContain('type');
        }
    });

    test('hover explains suppression markers', () => {
        const doc = '// mw-ext-disable-next-line raw-fetch\nfetch("a");';
        const tooltip = scratchHoverSource({state: stateFor(doc)}, 8, 1);
        expect(doc.slice(tooltip.pos, tooltip.end)).toBe('mw-ext-disable-next-line');
        expect(tooltip.create().dom.textContent).toContain('next line');
        const file = '// mw-ext-disable no-register\n';
        expect(scratchHoverSource({state: stateFor(file)}, 6, 1).create().dom.textContent).toContain('end of the file');
    });

    test('hover ignores Scratch members inside strings and comments', () => {
        for (const doc of ['const s = "Scratch.BlockType.REPORTER";', '// Scratch.BlockType.REPORTER']) {
            expect(scratchHoverSource({state: stateFor(doc)}, doc.indexOf('REPORTER') + 2, 1)).toBeNull();
        }
    });

    test('scratchAutocomplete returns an extension', () => {
        expect(scratchAutocomplete()).toBeTruthy();
    });
});

describe('api docs', () => {
    test('entries have the documented shape', () => {
        const entries = [...Object.values(memberDocs), ...Object.values(keyDocs)].flat();
        for (const entry of entries) {
            expect(['function', 'property', 'constant', 'class', 'key']).toContain(entry.type);
            expect(entry.docsPath).toMatch(/^building-extensions\//);
            expect(typeof entry.unsandboxedOnly).toBe('boolean');
            expect(entry.info.includes(String.fromCharCode(0x2014))).toBe(false);
        }
        expect(findMemberDoc('Scratch.vm').unsandboxedOnly).toBe(true);
        expect(findKeyDoc('acceptReporters', 'menu').label).toBe('acceptReporters');
    });
});

describe('createLinter', () => {
    const source = 'Scratch.extensions.register({});';

    test('falls back to direct linting without Worker', async () => {
        const linter = createLinter();
        await expect(linter.lint(source, {})).resolves.toEqual(lintExtension(source, {}));
        linter.dispose();
        await expect(linter.lint(source)).resolves.toBeNull();
    });

    test('falls back when the worker cannot start', async () => {
        const original = global.Worker;
        global.Worker = class {
            constructor () {
                throw new Error('no workers');
            }
        };
        try {
            const linter = createLinter();
            await expect(linter.lint(source, {unsandboxed: true})).resolves.toEqual(lintExtension(source, {}));
            linter.dispose();
        } finally {
            global.Worker = original;
        }
    });
});

describe('third review regressions', () => {
    const viewFor = (doc, extensions = []) => new EditorView({
        state: EditorState.create({doc, extensions: [javascript(), ...extensions]}),
        parent: document.createElement('div')
    });

    test('the hat snippet adds a predicate method that returns true', () => {
        const doc = blankTemplate({name: 'Hats', id: 'hats'});
        const at = doc.indexOf('blocks: [') + 'blocks: ['.length;
        const view = viewFor(doc);
        const hat = snippets.find(each => each.label === 'hat');
        hat.apply(view, hat, at, at);
        const result = view.state.doc.toString();
        view.destroy();
        expect(result).toContain('blockType: Scratch.BlockType.HAT');
        expect(result).toContain('    whenSomething1() {\n      return true;\n    }');
        expect(lintExtension(result)).toEqual([]);
    });

    test('hat docs describe the predicate and EVENT defaults', () => {
        expect(findMemberDoc('Scratch.BlockType.HAT').info).toContain('must still return true');
        expect(findMemberDoc('Scratch.BlockType.EVENT').info).toContain('runs every frame');
        expect(findKeyDoc('isEdgeActivated', 'block').info).toContain('must return true');
        expect(findKeyDoc('allowDropAnywhere', 'block').info).toContain('reporter');
    });

    test('a block snippet is undone in one step', () => {
        const doc = blankTemplate({name: 'Undo', id: 'undo'});
        const at = doc.indexOf('blocks: [') + 'blocks: ['.length;
        const view = viewFor(doc, [history()]);
        const compiled = snippets.find(each => each.label === 'compiled reporter');
        compiled.apply(view, compiled, at, at);
        expect(view.state.doc.toString()).toContain('double1Compiled(args, {cast}) {');
        undo(view);
        const result = view.state.doc.toString();
        view.destroy();
        expect(result).toBe(doc);
    });

    test('key completion before an existing colon does not add another', () => {
        const result = completeAt(INFO_DOC.replace('|', '').replace('opcode: "a",', 'opcode: "a", bl|: 1,'));
        const option = result.options.find(each => each.label === 'blockType');
        expect(option.apply).toBe('blockType');
        const fresh = completeAt(INFO_DOC.replace('|', '').replace('opcode: "a",', 'opcode: "a", bl|'));
        expect(fresh.options.find(each => each.label === 'blockType').apply).toBe('blockType: ');
        expect(completeAt('const a = foo(b|);')).toBeNull();
    });

    test('optional chains complete and hover', () => {
        expect(labels(completeAt('Scratch?.vm?.runtime?.|'))).toContain('startHats');
        expect(labels(completeAt('Scratch?.BlockType.|'))).toContain('REPORTER');
        const doc = 'const a = Scratch?.BlockType?.REPORTER;';
        const tooltip = scratchHoverSource({state: stateFor(doc)}, doc.indexOf('REPORTER') + 2, 1);
        expect(tooltip.create().dom.textContent).toContain('Scratch.BlockType.REPORTER');
    });

    test('hover skips markers in strings and values in ternaries', () => {
        const marker = 'const s = "mw-ext-disable-next-line raw-fetch";';
        expect(scratchHoverSource({state: stateFor(marker)}, marker.indexOf('mw-ext') + 3, 1)).toBeNull();
        const doc = 'class A {\n  getInfo() {\n    return {blocks: [{text: c ? text : y}]};\n  }\n}';
        const state = stateFor(doc);
        expect(scratchHoverSource({state}, doc.indexOf('? text') + 3, 1)).toBeNull();
        expect(scratchHoverSource({state}, doc.indexOf('text:') + 1, 1).create().dom.textContent)
            .toContain('The block text');
    });

    test('the scanner survives nested templates and regex classes', () => {
        const doc = INFO_DOC.replace('|', `name: \`$\{\`a$\{"}"}\`}\`,\n      pattern: /[(]/g,\n      other: /\\//,`)
            .replace('{ ty }', '{ ty| }');
        expect(labels(completeAt(doc))).toContain('type');
        const division = INFO_DOC.replace('|', 'value: a / b / c,').replace('{ ty }', '{ ty| }');
        expect(labels(completeAt(division))).toContain('type');
    });
});
