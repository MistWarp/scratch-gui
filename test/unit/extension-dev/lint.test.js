import {lintExtension} from '../../../src/lib/extension-dev/lint.js';
import {blankTemplate, unsandboxedTemplate, deriveExtensionId} from '../../../src/lib/extension-dev/templates.js';
import {findOpcodeDefinition} from '../../../src/lib/extension-dev/source-locate.js';

const HEADER = '// Name: Test\n// Description: A test extension.\n// License: MIT\n\n';

const ext = ({top = '', ctor = '', methods = '', blocks = '', header = HEADER, register = true} = {}) =>
    `${header}(function (Scratch) {
  "use strict";
${top}
  class Test {
    constructor() {
${ctor}
    }

    /** @returns {Scratch.Info} */
    getInfo() {
      return {id: "test", name: "Test", blocks: [${blocks}]};
    }
${methods}
  }
${register ? '  Scratch.extensions.register(new Test());' : ''}
})(Scratch);
`;

const dollar = text => text.replace(/@\{/g, '$${');

const codes = (source, options) => lintExtension(source, options).map(diagnostic => diagnostic.code);

const only = (source, code, options) => lintExtension(source, options).filter(each => each.code === code);

const applyFix = (source, fix) => {
    const changes = [...fix.changes].sort((a, b) => b.from - a.from);
    let result = source;
    for (const change of changes) {
        result = result.slice(0, change.from) + change.insert + result.slice(change.to);
    }
    return result;
};

const fakeScratch = () => {
    const registered = [];
    return {
        registered,
        extensions: {unsandboxed: true, register: instance => registered.push(instance)},
        vm: {runtime: {on: () => {}}}
    };
};

const run = source => {
    const Scratch = fakeScratch();
    new Function('Scratch', source).call({}, Scratch);
    return Scratch.registered;
};

describe('lintExtension', () => {
    test('a well formed extension has no diagnostics', () => {
        expect(lintExtension(ext())).toEqual([]);
    });

    test('templates lint clean in both modes', () => {
        for (const template of [blankTemplate, unsandboxedTemplate]) {
            const source = template({name: 'My Cool Thing', id: 'mycoolthing'});
            expect(lintExtension(source, {unsandboxed: false})).toEqual([]);
            expect(lintExtension(source, {unsandboxed: true})).toEqual([]);
            expect(run(source)).toHaveLength(1);
        }
    });

    test('syntax errors become one diagnostic with a position', () => {
        const diagnostics = lintExtension('const a = 1;\nconst b = ;\n');
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0]).toMatchObject({severity: 'error', code: 'syntax', line: 2, column: 11});
        expect(diagnostics[0].message).not.toMatch(/\(\d+:\d+\)/);
    });

    test('diagnostics carry offsets and 1-based positions', () => {
        const source = ext({ctor: '      fetch("https://example.com");'});
        const [diagnostic] = only(source, 'raw-fetch', {unsandboxed: true});
        expect(source.slice(diagnostic.from, diagnostic.to)).toBe('fetch');
        const lineText = source.split('\n')[diagnostic.line - 1];
        expect(lineText.slice(diagnostic.column - 1, diagnostic.column + 4)).toBe('fetch');
    });

    describe('global-leak', () => {
        test('flags top-level declarations and wraps the file', () => {
            const source = `${HEADER}"use strict";\nconst value = 5;\nclass Test {\n  getInfo() {\n` +
                '    return {id: "test", blocks: []};\n  }\n}\nScratch.extensions.register(new Test());\n';
            const leaks = only(source, 'global-leak');
            expect(leaks.map(each => source.slice(each.from, each.to))).toEqual(['value', 'Test']);
            expect(leaks[0].severity).toBe('warning');
            const fixed = applyFix(source, leaks[0].fix);
            expect(only(fixed, 'global-leak')).toEqual([]);
            expect(fixed).toMatch(/\(function \(Scratch\) \{\n"use strict";/);
            expect(fixed.trim().endsWith('}).call(this, Scratch);')).toBe(true);
            expect(fixed.startsWith(HEADER)).toBe(true);
            expect(run(fixed)).toHaveLength(1);
        });

        test('declares implicit globals with let and keeps sloppy files sloppy', () => {
            const source = 'counter = 0;\nScratch.extensions.register({getInfo() { return {id: "a", blocks: []}; }});\n';
            const [leak] = only(source, 'global-leak');
            expect(source.slice(leak.from, leak.to)).toBe('counter');
            const fixed = applyFix(source, leak.fix);
            expect(fixed).toContain('let counter;');
            expect(fixed).not.toContain('use strict');
            expect(only(fixed, 'global-leak')).toEqual([]);
            expect(run(fixed)).toHaveLength(1);
        });

        test('ignores code inside an IIFE and assignments inside functions', () => {
            expect(only(ext({top: '  const shared = 1;', ctor: '      this.x = shared;'}), 'global-leak'))
                .toEqual([]);
        });
    });

    describe('unsandboxed-guard', () => {
        test('flags Scratch.vm without a guard and inserts the standard guard', () => {
            const source = ext({ctor: '      Scratch.vm.runtime.on("PROJECT_START", () => {});'});
            const [diagnostic] = only(source, 'unsandboxed-guard');
            expect(diagnostic.severity).toBe('warning');
            const fixed = applyFix(source, diagnostic.fix);
            expect(fixed).toContain('  "use strict";\n\n  if (!Scratch.extensions.unsandboxed) {\n' +
                '    throw new Error("Test must run unsandboxed");\n  }\n');
            expect(lintExtension(fixed)).toEqual([]);
        });

        test('flags storage globals, input listeners, and destructured vm', () => {
            expect(only(ext({ctor: '      localStorage.getItem("a");'}), 'unsandboxed-guard')).toHaveLength(1);
            expect(only(ext({ctor: '      document.addEventListener("keydown", () => {});'}), 'unsandboxed-guard'))
                .toHaveLength(1);
            expect(only(ext({top: '  const {vm} = Scratch;'}), 'unsandboxed-guard')).toHaveLength(1);
        });

        test('accepts any unsandboxed check or a Scratch.vm feature detect', () => {
            const guarded = '  if (!Scratch.extensions.unsandboxed) throw new Error("no");';
            expect(only(ext({top: guarded, ctor: '      Scratch.vm.runtime.on("A", () => {});'}),
                'unsandboxed-guard')).toEqual([]);
            expect(only(ext({ctor: '      if (Scratch.vm) Scratch.vm.runtime.on("A", () => {});'}),
                'unsandboxed-guard')).toEqual([]);
        });

        test('does not flag sandbox-safe DOM use', () => {
            const source = ext({ctor: '      const canvas = document.createElement("canvas");\n' +
                '      canvas.addEventListener("click", () => {});'});
            expect(only(source, 'unsandboxed-guard')).toEqual([]);
        });
    });

    describe('raw-fetch', () => {
        const source = ext({methods: '    load() {\n      return fetch("https://example.com");\n    }\n' +
            '    go() {\n      window.open("https://example.com");\n      location.href = "https://a.b";\n' +
            '      new XMLHttpRequest();\n      new WebSocket("wss://a.b");\n    }'});

        test('reports raw network APIs in unsandboxed files only', () => {
            const found = only(source, 'raw-fetch', {unsandboxed: true});
            expect(found).toHaveLength(5);
            expect(found.every(each => each.severity === 'info')).toBe(true);
            expect(only(source, 'raw-fetch', {unsandboxed: false})).toEqual([]);
        });

        test('fixes rewrite to the Scratch APIs', () => {
            let fixed = source;
            for (let i = 0; i < 3; i++) {
                const next = only(fixed, 'raw-fetch', {unsandboxed: true}).find(each => each.fix);
                if (!next) break;
                fixed = applyFix(fixed, next.fix);
            }
            expect(fixed).toContain('Scratch.fetch("https://example.com")');
            expect(fixed).toContain('Scratch.openWindow("https://example.com")');
            expect(fixed).toContain('Scratch.redirect("https://a.b")');
            expect(only(fixed, 'raw-fetch', {unsandboxed: true}).map(each => source.slice(each.from, each.to)))
                .toHaveLength(2);
        });

        test('a WebSocket is fine when the file checks canFetch', () => {
            const checked = ext({methods: '    async go(url) {\n      if (await Scratch.canFetch(url)) ' +
                'new WebSocket(url);\n    }'});
            expect(only(checked, 'raw-fetch', {unsandboxed: true})).toEqual([]);
        });

        test('a local function named fetch is not flagged', () => {
            expect(only(ext({top: '  const fetch = () => 1;', ctor: '      fetch();'}), 'raw-fetch',
                {unsandboxed: true})).toEqual([]);
        });
    });

    describe('no-register', () => {
        test('reports a missing register call and fixes it', () => {
            const source = ext({register: false});
            const [diagnostic] = only(source, 'no-register');
            expect(diagnostic.severity).toBe('error');
            const fixed = applyFix(source, diagnostic.fix);
            expect(only(fixed, 'no-register')).toEqual([]);
            expect(run(fixed)).toHaveLength(1);
        });

        test('accepts several registrations', () => {
            const source = ext({top: '  Scratch.extensions.register({getInfo: () => ({id: "b", blocks: []})});'});
            expect(only(source, 'no-register')).toEqual([]);
        });
    });

    describe('async-getinfo', () => {
        test('reports async getInfo', () => {
            const source = ext().replace('getInfo() {', 'async getInfo() {');
            const found = only(source, 'async-getinfo');
            expect(found).toHaveLength(1);
            expect(found[0].severity).toBe('error');
            expect(source.slice(found[0].from, found[0].to)).toBe('getInfo');
            expect(only(ext(), 'async-getinfo')).toEqual([]);
        });

        test('reports async getInfo properties', () => {
            const source = `${HEADER}Scratch.extensions.register({getInfo: async () => ({id: "a"})});\n`;
            expect(only(source, 'async-getinfo')).toHaveLength(1);
        });
    });

    describe('patches-internals', () => {
        test('flags writes to vm internals through aliases', () => {
            const source = ext({top: '  const vm = Scratch.vm;\n  const {runtime} = vm;\n' +
                '  vm.toJSON = () => "";\n  runtime.startHats = () => [];\n  runtime.serializers.x = {};',
            ctor: '      this.rt = Scratch.vm.runtime;\n      this.rt.stepThreads = () => {};'});
            const found = only(source, 'patches-internals').map(each => source.slice(each.from, each.to));
            expect(found).toEqual(['vm.toJSON', 'runtime.startHats', 'runtime.serializers.x',
                'this.rt.stepThreads']);
        });

        test('flags prototype patches and Blockly writes', () => {
            const source = ext({top: '  Object.prototype.oops = 1;',
                methods: '    patch(ScratchBlocks) {\n      ScratchBlocks.Blocks.x = {};\n    }'});
            expect(only(source, 'patches-internals')).toHaveLength(2);
        });

        test('ignores extension state, runtime.ext_ and extensionStorage', () => {
            const source = ext({top: '  class Box {}\n  Box.prototype.toString = () => "box";',
                ctor: '      this.value = 1;\n      Scratch.vm.runtime.ext_test = this;\n' +
                    '      Scratch.vm.runtime.extensionStorage.test = {};\n' +
                    '      const store = Scratch.vm.runtime.extensionStorage;\n      store.test = {};'});
            expect(only(source, 'patches-internals')).toEqual([]);
        });
    });

    describe('compfunc-raw-source', () => {
        test('flags raw splices in compFunc methods', () => {
            const source = ext({blocks: '{opcode: "a", blockType: "reporter", compFunc: "aCompiled"}',
                methods: dollar('    aCompiled(args, {cast}) {\n      return `@{args.X.value} + @{cast.toRaw(args.Y)}`;\n    }\n' +
                    '    a() {}')});
            const found = only(source, 'compfunc-raw-source');
            expect(found.map(each => source.slice(each.from, each.to))).toEqual(['args.X.value', 'cast.toRaw(args.Y)']);
            expect(found[0].severity).toBe('warning');
        });

        test('flags input.raw and mutation in compiler.register compile functions', () => {
            const source = ext({top: '  Scratch.vm.exports.compiler.register("test", {\n' +
                '    a: {type: 0, compile: ({input, mutation}) => "(" + input.raw("X") + mutation.count + ")"}\n  });'
            }).replace('"use strict";', '"use strict";\n  if (!Scratch.extensions.unsandboxed) throw new Error("x");');
            expect(only(source, 'compfunc-raw-source')).toHaveLength(2);
        });

        test('accepts cast helpers and plain args', () => {
            const source = ext({blocks: '{opcode: "a", blockType: "reporter", compFunc: "aCompiled"}',
                methods: dollar('    aCompiled(args, {cast}) {\n      return `(@{cast.toNumber(args.X)} + @{args.Y})`;\n    }\n' +
                    '    a() {}')});
            expect(only(source, 'compfunc-raw-source')).toEqual([]);
        });
    });

    describe('missing-metadata', () => {
        test('lists the missing header fields', () => {
            const [diagnostic] = only(ext({header: '// Name: Test\n'}), 'missing-metadata');
            expect(diagnostic.severity).toBe('info');
            expect(diagnostic.message).toContain('Description, License');
        });

        test('reads By, Author, and block comment headers', () => {
            const header = '/*\n * Name: Test\n * Description: Hi\n */\n// By: me\n\n// License: MIT\n';
            expect(only(ext({header}), 'missing-metadata')).toEqual([]);
        });
    });

    describe('getinfo-type-hint', () => {
        test('reports a getInfo without the type hint and adds it', () => {
            const source = ext().replace('    /** @returns {Scratch.Info} */\n', '');
            const [diagnostic] = only(source, 'getinfo-type-hint');
            expect(diagnostic.severity).toBe('info');
            const fixed = applyFix(source, diagnostic.fix);
            expect(fixed).toContain('    /** @returns {Scratch.Info} */\n    getInfo() {');
            expect(lintExtension(fixed)).toEqual([]);
        });
    });

    test('suppression comments hide the next line', () => {
        const source = ext({ctor: '      // mw-ext-disable-next-line raw-fetch\n      fetch("a");\n      fetch("b");'});
        expect(only(source, 'raw-fetch', {unsandboxed: true})).toHaveLength(1);
        const all = ext({ctor: '      // mw-ext-disable-next-line\n      fetch("a");'});
        expect(only(all, 'raw-fetch', {unsandboxed: true})).toEqual([]);
        const other = ext({ctor: '      // mw-ext-disable-next-line global-leak\n      fetch("a");'});
        expect(only(other, 'raw-fetch', {unsandboxed: true})).toHaveLength(1);
    });

    test('skips esbuild node_modules regions', () => {
        const source = ext({top: '  // node_modules/lib/index.js\n  var lib = () => fetch("x");\n\n' +
            '  // src/index.js\n  const mine = () => fetch("y");'});
        const found = only(source, 'raw-fetch', {unsandboxed: true});
        expect(found).toHaveLength(1);
        expect(source.slice(found[0].from - 20, found[0].to)).toContain('mine');
    });

    test('codes are stable', () => {
        expect(codes('')).toEqual(['no-register', 'missing-metadata']);
    });
});

describe('review regressions', () => {
    test('async getInfo on an unregistered object is not reported', () => {
        const source = ext({top: '  const api = {async getInfo(user) {\n    return user;\n  }};'});
        expect(only(source, 'async-getinfo')).toEqual([]);
        const viaVariable = ext({register: false}).replace('getInfo() {', 'async getInfo() {')
            .replace('})(Scratch);', '  const instance = new Test();\n  Scratch.extensions.register(instance);\n})(Scratch);');
        expect(only(viaVariable, 'async-getinfo')).toHaveLength(1);
    });

    test('register through an IIFE parameter or a destructured register counts', () => {
        const param = `${HEADER}(function (ext) {\n  ext.register({getInfo() {\n    return {id: "a", blocks: []};\n` +
            '  }});\n})(Scratch.extensions);\n';
        expect(only(param, 'no-register')).toEqual([]);
        const destructured = ext({register: false, top: '  const {register} = Scratch.extensions;'})
            .replace('})(Scratch);', '  register(new Test());\n})(Scratch);');
        expect(only(destructured, 'no-register')).toEqual([]);
    });

    test('file-level suppression and line 1 suppression cover no-register', () => {
        const helper = 'const helper = 1;\n';
        expect(only(`// mw-ext-disable no-register\n${helper}`, 'no-register')).toEqual([]);
        expect(only(`// mw-ext-disable-next-line no-register\n${helper}`, 'no-register')).toEqual([]);
        expect(only(`// mw-ext-disable-next-line no-register\n${helper}`, 'missing-metadata')).toHaveLength(1);
        expect(only(`// mw-ext-disable global-leak, no-register\n${helper}`, 'global-leak')).toEqual([]);
        expect(lintExtension(`// mw-ext-disable\n${helper}`)).toEqual([]);
    });

    test('suppression lines match Babel with CR and line separator breaks', () => {
        for (const br of ['\r', '\u2028', '\r\n']) {
            const source = ext({ctor: `      a();${br}      // mw-ext-disable-next-line raw-fetch${br}` +
                `      fetch("a");${br}      fetch("b");`});
            const found = only(source, 'raw-fetch', {unsandboxed: true});
            expect(found).toHaveLength(1);
            expect(source.slice(found[0].from, found[0].from + 10)).toBe('fetch("b")');
            const lines = source.split(/\r\n?|[\n\u2028\u2029]/);
            expect(lines[found[0].line - 1].slice(found[0].column - 1)).toBe('fetch("b");');
        }
    });

    test('block comment suppression markers work', () => {
        const source = ext({ctor: '      /** mw-ext-disable-next-line raw-fetch */\n      fetch("a");'});
        expect(only(source, 'raw-fetch', {unsandboxed: true})).toEqual([]);
    });

    test('guard fix in a file without an IIFE goes after the directive', () => {
        const source = `${HEADER}"use strict";\nScratch.vm.runtime.on("A", () => {});\n` +
            '// mw-ext-disable global-leak\nclass Test {\n  getInfo() {\n    return {id: "t", blocks: []};\n  }\n}\n' +
            'Scratch.extensions.register(new Test());\n';
        const [diagnostic] = only(source, 'unsandboxed-guard');
        const fixed = applyFix(source, diagnostic.fix);
        expect(fixed).toContain('"use strict";\n\nif (!Scratch.extensions.unsandboxed) {');
        expect(only(fixed, 'unsandboxed-guard')).toEqual([]);
        expect(only(fixed, 'syntax')).toEqual([]);
    });

    test('guard fix for an async IIFE goes before the IIFE', () => {
        const source = ext({ctor: '      Scratch.vm.runtime.on("A", () => {});'})
            .replace('(function (Scratch) {', '(async function (Scratch) {');
        const [diagnostic] = only(source, 'unsandboxed-guard');
        const fixed = applyFix(source, diagnostic.fix);
        expect(fixed.indexOf('if (!Scratch.extensions.unsandboxed)')).toBeLessThan(fixed.indexOf('(async function'));
        expect(fixed).toContain('}\n\n(async function (Scratch) {');
        expect(only(fixed, 'unsandboxed-guard')).toEqual([]);
        const Scratch = fakeScratch();
        Scratch.extensions.unsandboxed = false;
        expect(() => new Function('Scratch', fixed)(Scratch)).toThrow('Test must run unsandboxed');
    });

    test('global-leak fix does not shadow a Scratch the file binds itself', () => {
        const body = 'class Test {\n  getInfo() {\n    return {id: "t", blocks: []};\n  }\n}\n' +
            'Scratch.extensions.register(new Test());\n';
        for (const binding of ['const Scratch = window.Scratch;\n', 'Scratch = window.Scratch;\n']) {
            const source = `${HEADER}${binding}${body}`;
            const [leak] = only(source, 'global-leak');
            const fixed = applyFix(source, leak.fix);
            expect(fixed).toContain('(function () {');
            expect(fixed).toContain('}).call(this);');
            expect(fixed).not.toMatch(/let [^;]*Scratch/);
            expect(only(fixed, 'global-leak')).toEqual([]);
            const Scratch = fakeScratch();
            new Function('window', 'Scratch', fixed).call({}, {Scratch});
            expect(Scratch.registered).toHaveLength(1);
        }
    });

    test('patches-internals aliases follow scope and skip project state', () => {
        const shadowed = ext({top: '  const vm = Scratch.vm;\n  function f() {\n    const vm = {x: 1};\n' +
            '    vm.x = 2;\n  }\n  if (vm) f();'});
        expect(only(shadowed, 'patches-internals')).toEqual([]);
        const state = ext({ctor: '      if (!Scratch.vm) return;\n' +
            '      Scratch.vm.editingTarget.variables[this.id] = 1;\n' +
            '      Scratch.vm.editingTarget.variables.abc = {value: 1};\n' +
            '      const stage = Scratch.vm.runtime._stageTarget;\n      stage.variables.abc = 1;\n' +
            '      Scratch.vm.runtime.targets[0].x = 3;'});
        expect(only(state, 'patches-internals')).toEqual([]);
        const outer = ext({top: '  const vm = Scratch.vm;\n  function f() {\n    vm.x = 2;\n  }\n  if (vm) f();'});
        expect(only(outer, 'patches-internals')).toHaveLength(1);
    });

    test('no-register fix picks the extension class in scope', () => {
        const source = `${HEADER}(function (Scratch) {\n  "use strict";\n  class Helper {\n    getInfo() {\n` +
            '      return this.data;\n    }\n  }\n  function make() {\n    class Inner {\n      getInfo() {\n' +
            '        return {id: "inner", blocks: []};\n      }\n    }\n    return Inner;\n  }\n' +
            '  class Real {\n    /** @returns {Scratch.Info} */\n    getInfo() {\n      return {id: "real", blocks: []};\n' +
            '    }\n  }\n})(Scratch);\n';
        const [diagnostic] = only(source, 'no-register');
        expect(diagnostic.fix.changes[0].insert).toContain('new Real()');
        expect(run(applyFix(source, diagnostic.fix))[0].getInfo().id).toBe('real');
    });

    test('missing-metadata reads headers after a BOM and a shebang', () => {
        expect(only(`\uFEFF#!/usr/bin/env node\n${ext()}`, 'missing-metadata')).toEqual([]);
        expect(only(`\uFEFF${ext()}`, 'missing-metadata')).toEqual([]);
    });

    test('a template name with line separators stays on one line', () => {
        const source = blankTemplate({name: 'A\u2028B\u2029C', id: 'abc'});
        expect(source.split('\n')[0]).toBe('// Name: A B C');
        expect(lintExtension(source)).toEqual([]);
    });
});

describe('second review regressions', () => {
    const deep = (count, make) => `${HEADER}${make(count)}\n${ext()}`;

    test('deeply nested valid code lints without throwing', () => {
        const cases = [
            deep(3000, n => `const chained = Scratch.Cast${'.toString(1)'.repeat(n)};`),
            deep(3000, n => `const sum = "a"${' + "b"'.repeat(n)};`),
            deep(3000, n => `if (a) {}${' else if (a) {}'.repeat(n)}`),
            deep(3000, n => `const pick = ${'a ? 1 : '.repeat(n)}0;`),
            deep(3000, n => `const member = window${'.x'.repeat(n)};`)
        ];
        for (const source of cases) {
            const diagnostics = lintExtension(source);
            expect(diagnostics.every(each => each.severity !== 'error')).toBe(true);
            expect(findOpcodeDefinition(source, 'nothing')).not.toBeUndefined();
        }
    });

    test('a parser stack overflow becomes one info diagnostic', () => {
        const source = `${'['.repeat(200000)}${']'.repeat(200000)}`;
        const diagnostics = lintExtension(source);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0]).toMatchObject({severity: 'info',
            code: 'nesting',
            message: 'This file is nested too deeply to check.'});
        expect(() => findOpcodeDefinition(source, 'x')).not.toThrow();
    });

    test('multi-line block directives read codes from the first line only', () => {
        const helper = '/* mw-ext-disable no-register\n * helper module\n */\nconst helper = 1;\n';
        expect(codes(helper)).toEqual(['missing-metadata', 'global-leak']);
        const next = ext({ctor: '      /* mw-ext-disable-next-line raw-fetch\n       * reason\n       */\n' +
            '      fetch("a"); localStorage.x;'});
        expect(only(next, 'raw-fetch', {unsandboxed: true})).toEqual([]);
        expect(only(next, 'unsandboxed-guard')).toHaveLength(1);
    });

    test('a -- description after the codes is ignored', () => {
        const source = ext({ctor: '      // mw-ext-disable-next-line raw-fetch -- needs the raw response\n' +
            '      fetch("a"); localStorage.x;'});
        expect(only(source, 'raw-fetch', {unsandboxed: true})).toEqual([]);
        expect(only(source, 'unsandboxed-guard')).toHaveLength(1);
    });

    test('suppressing one internal write keeps identical writes elsewhere', () => {
        const source = ext({top: '  if (!Scratch.vm) throw new Error("x");\n' +
            '  // mw-ext-disable-next-line patches-internals\n  Scratch.vm.toJSON = () => "";\n' +
            '  Scratch.vm.toJSON = () => "";\n  Scratch.vm.toJSON = () => "";'});
        const found = only(source, 'patches-internals');
        expect(found).toHaveLength(1);
        expect(found[0].line).toBe(source.split('\n').findIndex(line => line === '  Scratch.vm.toJSON = () => "";' &&
            true) + 2);
    });

    test('mw-ext-disable applies from its line onward and only on its own line', () => {
        const before = ext({ctor: '      fetch("a");\n      // mw-ext-disable raw-fetch\n      fetch("b");'});
        const found = only(before, 'raw-fetch', {unsandboxed: true});
        expect(found).toHaveLength(1);
        expect(before.slice(found[0].from, found[0].from + 10)).toBe('fetch("a")');
        const trailing = ext({ctor: '      fetch("a"); // mw-ext-disable\n      fetch("b");'});
        expect(only(trailing, 'raw-fetch', {unsandboxed: true})).toHaveLength(2);
        expect(only(`const helper = 1;\n// mw-ext-disable no-register\n`, 'no-register')).toEqual([]);
    });

    test('risky template names produce valid, runnable extensions', () => {
        for (const name of ['Scratch', 'Error', 'Promise', 'Object', 'Math', 'window', 'document', 'Target']) {
            for (const template of [blankTemplate, unsandboxedTemplate]) {
                const source = template({name, id: deriveExtensionId(name)});
                expect(lintExtension(source, {unsandboxed: true})).toEqual([]);
                expect(run(source)).toHaveLength(1);
                const sandboxed = fakeScratch();
                sandboxed.extensions.unsandboxed = false;
                if (template === unsandboxedTemplate) {
                    expect(() => new Function('Scratch', source)(sandboxed)).toThrow(`${name} must run unsandboxed`);
                }
            }
        }
    });

    test('aliases follow ||, ??, ?: and getBlockly results', () => {
        const source = ext({top: '  if (!Scratch.vm) throw new Error("x");\n' +
            '  const a = null || Scratch.vm;\n  a.one = 1;\n' +
            '  const b = window.missing ?? Scratch.vm.runtime;\n  b.two = 2;\n' +
            '  const c = Math.random() ? {} : Scratch.vm;\n  c.three = 3;\n' +
            '  Scratch.gui.getBlockly().then(SB => {\n    SB.four = 4;\n  });\n' +
            '  (async () => {\n    const blocks = await Scratch.gui.getBlockly();\n    blocks.five = 5;\n  })();'});
        const found = only(source, 'patches-internals').map(each => source.slice(each.from, each.to));
        expect(found).toEqual(['a.one', 'b.two', 'c.three', 'SB.four', 'blocks.five']);
    });

    test('updates, deletes, destructuring and for-of targets count as writes', () => {
        const source = ext({top: '  if (!Scratch.vm) throw new Error("x");\n  const vm = Scratch.vm;\n' +
            '  vm.count++;\n  --vm.other;\n  delete vm.loadProject;\n  ({a: vm.alpha} = {a: 1});\n' +
            '  [vm.beta] = [1];\n  for (vm.gamma of [1]) {}\n  for (vm.delta in {}) {}'});
        const found = only(source, 'patches-internals').map(each => source.slice(each.from, each.to));
        expect(found).toEqual(['vm.count', 'vm.other', 'vm.loadProject', 'vm.alpha', 'vm.beta', 'vm.gamma',
            'vm.delta']);
    });

    test('a runtime constructor parameter is the runtime', () => {
        const source = ext({ctor: '      if (!Scratch.vm) return;', methods: '  '}).replace('constructor() {',
            'constructor(runtime) {\n      runtime.startHats = () => [];\n      runtime.ext_test = this;');
        const found = only(source, 'patches-internals').map(each => source.slice(each.from, each.to));
        expect(found).toEqual(['runtime.startHats']);
        const plain = ext({methods: '    helper(runtime) {\n      runtime.x = 1;\n    }'});
        expect(only(plain, 'patches-internals')).toEqual([]);
    });

    test('private names and labels called localStorage are not storage access', () => {
        const source = ext({methods: '    #localStorage = 1;\n    read() {\n      localStorage: for (;;) {\n' +
            '        break localStorage;\n      }\n      return this.#localStorage;\n    }'});
        expect(only(source, 'unsandboxed-guard')).toEqual([]);
    });

    test('async getInfo class fields and inherited async getInfo are reported', () => {
        const field = ext().replace('getInfo() {', 'getInfo = async () => {')
            .replace(
                '      return {id: "test", name: "Test", blocks: []};\n    }', '      return {id: "test", blocks: []};\n    };');
        expect(only(field, 'async-getinfo')).toHaveLength(1);
        const inherited = `${HEADER}(function (Scratch) {\n  class Base {\n    async getInfo() {\n` +
            '      return {id: "b", blocks: []};\n    }\n  }\n  class Child extends Base {}\n' +
            '  Scratch.extensions.register(new Child());\n})(Scratch);\n';
        const [diagnostic] = only(inherited, 'async-getinfo');
        expect(inherited.slice(diagnostic.from - 6, diagnostic.to)).toBe('async getInfo');
        const overridden = inherited.replace('class Child extends Base {}',
            'class Child extends Base {\n    getInfo() {\n      return {id: "c", blocks: []};\n    }\n  }');
        expect(only(overridden, 'async-getinfo')).toEqual([]);
    });
});

describe('third review regressions', () => {
    test('window.open only gets a fix as a statement with one argument', () => {
        const source = ext({methods: '    a(url) {\n      window.open(url);\n    }\n' +
            '    b(url) {\n      const w = window.open(url);\n      return w;\n    }\n' +
            '    c(url) {\n      window.open(url, "_blank");\n    }'});
        const found = only(source, 'raw-fetch', {unsandboxed: true});
        expect(found).toHaveLength(3);
        expect(found.map(each => Boolean(each.fix))).toEqual([true, false, false]);
    });

    test('the guard goes after a body-level Scratch declaration', () => {
        const source = `${HEADER}(function () {\n  "use strict";\n  const Scratch = window.Scratch;\n` +
            '  class Test {\n    getInfo() {\n      Scratch.vm.runtime.on("A", () => {});\n' +
            '      return {id: "t", blocks: []};\n    }\n  }\n  Scratch.extensions.register(new Test());\n})();\n';
        const [diagnostic] = only(source, 'unsandboxed-guard');
        const fixed = applyFix(source, diagnostic.fix);
        expect(fixed.indexOf('if (!Scratch.extensions.unsandboxed)'))
            .toBeGreaterThan(fixed.indexOf('const Scratch = window.Scratch;'));
        const Scratch = fakeScratch();
        Scratch.extensions.unsandboxed = false;
        expect(() => new Function('window', fixed)({Scratch})).toThrow('Test must run unsandboxed');
    });

    test('registration through helpers, nested destructuring, and window.ScratchExtensions', () => {
        const helper = `${HEADER}(function (Scratch) {\n  function init(ext) {\n    ext.register({getInfo() {\n` +
            '      return {id: "a", blocks: []};\n    }});\n  }\n  init(Scratch.extensions);\n})(Scratch);\n';
        expect(only(helper, 'no-register')).toEqual([]);
        const nested = ext({register: false, top: '  const {extensions: {register}} = Scratch;'})
            .replace('})(Scratch);', '  register(new Test());\n})(Scratch);');
        expect(only(nested, 'no-register')).toEqual([]);
        const legacy = ext({register: false})
            .replace('})(Scratch);', '  window.ScratchExtensions.register("t", {}, new Test());\n})(Scratch);');
        expect(only(legacy, 'no-register')).toEqual([]);
    });

    test('prototype writes on local bindings are not internal patches', () => {
        const local = ext({top: '  function addToJSON(Ctor) {\n    Ctor.prototype.toJSON = () => "";\n  }\n' +
            '  const Thing = makeThing();\n  Thing.prototype.x = 1;'});
        expect(only(local, 'patches-internals')).toEqual([]);
        const global = ext({top: '  Element.prototype.oops = 1;'});
        expect(only(global, 'patches-internals')).toHaveLength(1);
    });

    test('this aliases are per class and plain objects override the convention', () => {
        const source = ext({top: '  if (!Scratch.vm) throw new Error("x");\n' +
            '  class A {\n    constructor() {\n      this.store = Scratch.vm.runtime;\n      this.store.patched = 1;\n' +
            '    }\n  }\n  class B {\n    constructor() {\n      this.store = {};\n      this.store.fine = 1;\n' +
            '      this.runtime = {};\n      this.runtime.fine = 2;\n    }\n  }\n' +
            '  class C {\n    go() {\n      this.runtime.patched = 3;\n    }\n  }'});
        const found = only(source, 'patches-internals').map(each => source.slice(each.from, each.to));
        expect(found).toEqual(['this.store.patched', 'this.runtime.patched']);
    });

    test('writes to browser globals are not leaks and are never declared', () => {
        const source = `${HEADER}onbeforeunload = () => "";\nlocation = "x";\ncounter = 1;\n` +
            'Scratch.extensions.register({getInfo() { return {id: "a", blocks: []}; }});\n';
        const leaks = only(source, 'global-leak');
        expect(leaks.map(each => source.slice(each.from, each.to))).toEqual(['counter']);
        const fixed = applyFix(source, leaks[0].fix);
        expect(fixed).toContain('let counter;');
        expect(fixed).not.toMatch(/let [^;]*(onbeforeunload|location)/);
    });

    test('location checks respect shadowed window and location', () => {
        const source = ext({methods: '    go(window, location) {\n      window.location.href = "a";\n' +
            '      location.assign("b");\n      window.location.assign("c");\n    }'});
        expect(only(source, 'raw-fetch', {unsandboxed: true})).toEqual([]);
        const real = ext({methods: '    go() {\n      window.location.assign("c");\n      self.location = "d";\n    }'});
        expect(only(real, 'raw-fetch', {unsandboxed: true})).toHaveLength(2);
    });

    test('a destructured unsandboxed flag is a guard', () => {
        const source = ext({top: '  const {unsandboxed} = Scratch.extensions;\n' +
            '  if (!unsandboxed) throw new Error("no");',
        ctor: '      Scratch.vm.runtime.on("A", () => {});'});
        expect(only(source, 'unsandboxed-guard')).toEqual([]);
    });
});
