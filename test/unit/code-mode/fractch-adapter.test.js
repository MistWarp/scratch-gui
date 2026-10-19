import {loadVm} from '../../helpers/code-mode-fixture.js';
import {
    emitTarget,
    opcodeTable,
    scriptAtOffset,
    scriptForTopId,
    unitsOf
} from '../../../src/lib/code-mode/fractch-adapter.js';
import {createEngine, stripKeptBlocks} from '../../../src/lib/code-mode/fractch-engine.js';
import {createFractchClient} from '../../../src/lib/code-mode/fractch-client.js';
import {fractchLanguage} from '../../../src/lib/code-mode/fractch-language.js';

describe('fractch adapter', () => {
    let vm;
    let sprite;
    let stage;

    beforeEach(async () => {
        ({vm, sprite, stage} = await loadVm());
        stage.createComment('cfg', null, 'Configuration for https://turbowarp.org/\n{"framerate":60} // _twconfig_',
            0, 0, 100, 100, false);
    });

    afterEach(() => vm.quit());

    test('emits one text per target without assets, sprite properties or reserved comments', () => {
        const context = vm.getFractchContext();
        const {text, lockedScripts} = emitTarget(context, sprite.id, {opcodes: opcodeTable});
        expect(text).toContain('when flag');
        expect(text).not.toMatch(/^costume /m);
        expect(text).not.toMatch(/^sprite /m);
        expect(lockedScripts).toEqual([]);
        const stageText = emitTarget(context, stage.id, {opcodes: opcodeTable}).text;
        expect(stageText).toContain('score');
        expect(stageText).not.toContain('_twconfig_');
    });

    test('maps every script to its top block and back', () => {
        const {text, sourceMap} = emitTarget(vm.getFractchContext(), sprite.id, {opcodes: opcodeTable});
        const flag = scriptForTopId(sourceMap, 'hat');
        const key = scriptForTopId(sourceMap, 'key');
        expect(text.slice(flag.from, flag.to)).toContain('when flag');
        expect(text.slice(key.from, key.to)).toContain('space');
        expect(scriptAtOffset(sourceMap, key.from + 2).topId).toBe('key');
        const units = unitsOf(sourceMap);
        expect(Object.keys(units)).toEqual(expect.arrayContaining(['script:hat', 'script:key', 'decl:var:lives']));
    });

    test('does not change its input', () => {
        const context = vm.getFractchContext();
        const before = JSON.stringify(context);
        emitTarget(context, sprite.id, {opcodes: opcodeTable});
        expect(JSON.stringify(context)).toBe(before);
    });

    test('rejects an unknown target', () => {
        expect(() => emitTarget(vm.getFractchContext(), 'missing')).toThrow();
    });

    test('the worker engine strips kept scripts from the change it posts back', () => {
        const engine = createEngine();
        const context = vm.getFractchContext();
        engine.handle({type: 'update',
            generation: context.generation,
            extensionSignatures: {},
            targets: context.targets});
        const emitted = engine.handle({type: 'emit', targetId: sprite.id});
        const built = engine.handle({
            type: 'build',
            targetId: sprite.id,
            text: emitted.text.replace('"hi"', '"hey"'),
            previous: emitted
        });
        expect(built.change.keepScripts).toEqual(['key']);
        expect(built.change.blocks.key).toBeUndefined();
        expect(built.change.blocks.move).toBeUndefined();
        expect(built.change.blocks.hat).toBeTruthy();
        expect(stripKeptBlocks({keepScripts: [], blocks: {a: {}}}).blocks).toEqual({a: {}});
    });

    test('the client reposts only targets whose change key moved', async () => {
        const client = createFractchClient();
        await client.emit(vm, sprite.id);
        const first = client.postedTag(sprite.id);
        const stageTag = client.postedTag(stage.id);
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        const emitted = await client.emit(vm, sprite.id);
        expect(emitted.text).toContain('when key a');
        expect(client.postedTag(sprite.id).changeKey).not.toBe(first.changeKey);
        expect(client.postedTag(stage.id)).toEqual(stageTag);
        client.dispose();
    });

    test('the fractch language highlights keywords, strings and comments', () => {
        const tree = fractchLanguage.parser.parse('when flag {\n  say "hi"; // note\n}\n');
        expect(tree.length).toBeGreaterThan(0);
    });
});
