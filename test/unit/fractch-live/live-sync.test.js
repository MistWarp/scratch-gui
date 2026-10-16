import {loadVm, projectJson, spriteBlocks} from '../../helpers/code-mode-fixture.js';
import {createFractchClient} from '../../../src/lib/code-mode/fractch-client.js';
import {createTextController} from '../../../src/lib/code-mode/text-controller.js';
import {clearCodeHistory, latestUndo} from '../../../src/lib/code-mode/code-history.js';
import {clearTexts, getText} from '../../../src/lib/code-mode/text-store.js';
import {resetDraftStore} from '../../../src/lib/code-mode/code-drafts.js';
import {createLiveSync, reloadReason} from '../../../src/lib/fractch-live/live-sync.js';
import {socketUrlFor} from '../../../src/lib/fractch-live/index.js';
import {prepareProjectReplacement, withProjectReplacement} from '../../../src/lib/project-replacement.js';

jest.mock('../../../src/lib/tw-lazy-scratch-blocks.js', () => ({
    isLoaded: () => false,
    get: () => null
}));

jest.mock('../../../src/lib/project-replacement.js', () => ({
    prepareProjectReplacement: jest.fn(() => Promise.resolve(() => Promise.resolve())),
    withProjectReplacement: jest.fn((vm, title, operation) => operation())
}));

const withSay = (text, extra = {}) => {
    const blocks = spriteBlocks();
    blocks.say.inputs.MESSAGE = [1, [10, text]];
    Object.assign(blocks.move.inputs, extra.move ? {STEPS: [1, [4, extra.move]]} : {});
    const project = projectJson({spriteBlocks: blocks});
    if (extra.costume) project.targets[1].costumes[0].name = extra.costume;
    return project;
};

const sayValue = sprite => {
    const say = Object.values(sprite.blocks._blocks).find(block => block.opcode === 'looks_say');
    return sprite.blocks.getBlock(say.inputs.MESSAGE.block).fields.TEXT.value;
};

describe('fractch live reload', () => {
    let vm;
    let sprite;
    let client;
    let controller;
    let problems;
    let ask;
    let reveal;
    let live;

    beforeEach(async () => {
        clearTexts();
        clearCodeHistory();
        resetDraftStore();
        ({vm, sprite} = await loadVm());
        client = createFractchClient();
        controller = createTextController({vm, client});
        problems = null;
        ask = jest.fn(() => Promise.resolve(null));
        reveal = jest.fn();
        live = createLiveSync({
            vm,
            client,
            controller,
            intl: {formatMessage: descriptor => descriptor.id},
            dispatchProblems: value => {
                problems = value;
            },
            ask,
            reveal,
            confirmImpact: () => Promise.resolve(true),
            confirmBackupFailure: () => Promise.resolve(true)
        });
        await live.prime(projectJson());
        prepareProjectReplacement.mockClear();
        withProjectReplacement.mockClear();
    });

    afterEach(() => {
        controller.dispose();
        client.dispose();
        vm.quit();
    });

    test('applies a file change by target id with a restore point and a history entry', async () => {
        const before = sprite.blocks.getScripts().slice();
        const result = await live.sync(withSay('from file'), {loadProject: jest.fn()});
        expect(result.status).toBe('synced');
        expect(problems).toEqual({});
        expect(sayValue(sprite)).toBe('from file');
        expect(prepareProjectReplacement).toHaveBeenCalledTimes(1);
        expect(latestUndo(sprite.id).targetId).toBe(sprite.id);
        const keyTop = before.find(id => sprite.blocks.getBlock(id) &&
            sprite.blocks.getBlock(id).opcode === 'event_whenkeypressed');
        expect(sprite.blocks.getScripts()).toContain(keyTop);
    });

    test('keeps editor edits to other scripts when the file changes', async () => {
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        await live.sync(withSay('from file'), {loadProject: jest.fn()});
        expect(problems).toEqual({});
        expect(sayValue(sprite)).toBe('from file');
        expect(sprite.blocks.getBlock(sprite.blocks.getScripts().find(id =>
            sprite.blocks.getBlock(id).opcode === 'event_whenkeypressed')).fields.KEY_OPTION.value).toBe('a');
    });

    test('a script changed on both sides goes to the conflict flow and is not applied', async () => {
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        await live.sync(withSay('hi', {move: '99'}), {loadProject: jest.fn()});
        expect(problems[sprite.id]).toEqual(['mw.fractchLive.conflicts']);
        expect(reveal).toHaveBeenCalledWith(sprite.id);
        const state = getText(sprite.id);
        expect(state.conflicts.length).toBe(1);
        expect(state.conflicts[0].mine).toContain('move 99');
        expect(state.conflicts[0].theirs).toContain('when key a');
    });

    test('does nothing during collaboration', async () => {
        vm.editingCommands.handler = () => {};
        const result = await live.sync(withSay('blocked'), {loadProject: jest.fn()});
        vm.editingCommands.handler = null;
        expect(result.status).toBe('collaboration');
        expect(problems.project).toEqual(['mw.fractchLive.collaboration']);
        expect(sayValue(sprite)).toBe('hi');
    });

    test('a change that needs a reload asks first and still patches scripts when declined', async () => {
        const loadProject = jest.fn();
        await live.sync(withSay('patched', {costume: 'renamed'}), {loadProject});
        expect(ask).toHaveBeenCalledTimes(1);
        expect(loadProject).not.toHaveBeenCalled();
        expect(sayValue(sprite)).toBe('patched');
    });

    test('an accepted reload goes through withProjectReplacement', async () => {
        ask.mockReturnValue(Promise.resolve('reload'));
        const loadProject = jest.fn(() => Promise.resolve());
        const result = await live.sync(withSay('hi', {costume: 'renamed'}), {loadProject});
        expect(result.status).toBe('reloaded');
        expect(withProjectReplacement).toHaveBeenCalledTimes(1);
        expect(loadProject).toHaveBeenCalledTimes(1);
    });

    test('reload reasons', () => {
        expect(reloadReason(projectJson(), withSay('x'))).toBe(null);
        expect(reloadReason(projectJson(), withSay('x', {costume: 'y'}))).toEqual({kind: 'target', name: 'Sprite1'});
        const fewer = projectJson();
        fewer.targets.pop();
        expect(reloadReason(projectJson(), fewer)).toEqual({kind: 'targets'});
    });

    test('socket urls must be loopback', () => {
        expect(socketUrlFor('http://127.0.0.1:4000/project.sb3', '1')).toBe('ws://127.0.0.1:4000/live');
        expect(socketUrlFor('x', 'ws://localhost:9/live')).toBe('ws://localhost:9/live');
        expect(socketUrlFor('x', 'ws://[::1]:9/live')).toBe('ws://[::1]:9/live');
        expect(socketUrlFor('x', 'wss://evil.example/live')).toBe(null);
        expect(socketUrlFor('https://evil.example/p.sb3', 'true')).toBe(null);
        expect(socketUrlFor('x', 'ws://127.0.0.1.evil.example/live')).toBe(null);
    });
});
