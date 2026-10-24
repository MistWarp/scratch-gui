const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../../../src/lib/persistence/storage', () => ({}));

const {writeProjectToFractchTree} = require('../../../src/lib/git/fractch-tree.js');

const flagScript = (id, y) => ({
    opcode: 'event_whenflagclicked',
    next: null,
    parent: null,
    inputs: {},
    fields: {},
    shadow: false,
    topLevel: true,
    x: 0,
    y
});

const projectFiles = regions => {
    const blocks = {};
    const scripts = {};
    regions.forEach((region, index) => {
        blocks[`hat${index}`] = flagScript(`hat${index}`, index * 100);
        scripts[`hat${index}`] = region;
    });
    const map = `_fractch_map_${JSON.stringify({version: 1, scripts})}`;
    const project = {
        targets: [{
            isStage: true,
            name: 'Stage',
            variables: {},
            lists: {},
            broadcasts: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [],
            sounds: [],
            volume: 100,
            layerOrder: 0,
            tempo: 60,
            videoTransparency: 50,
            videoState: 'on',
            textToSpeechLanguage: null
        }, {
            isStage: false,
            name: 'S',
            variables: {},
            lists: {},
            broadcasts: {},
            blocks,
            comments: {map: {blockId: null, x: 0, y: 0, width: 200, height: 200, minimized: false, text: map}},
            currentCostume: 0,
            costumes: [],
            sounds: [],
            volume: 100,
            layerOrder: 1,
            visible: true,
            x: 0,
            y: 0,
            size: 100,
            direction: 90,
            draggable: false,
            rotationStyle: 'all around'
        }],
        monitors: [],
        extensions: [],
        meta: {semver: '3.0.0', vm: '0.2.0', agent: ''}
    };
    return {'project.json': new TextEncoder().encode(JSON.stringify(project))};
};

const listFiles = dir => {
    const out = [];
    const walk = current => {
        for (const entry of fs.readdirSync(current)) {
            const full = path.join(current, entry);
            if (fs.statSync(full).isDirectory()) walk(full);
            else out.push(path.relative(dir, full));
        }
    };
    walk(dir);
    return out.sort();
};

const roots = [];
afterAll(() => {
    for (const root of roots) fs.rmSync(root, {recursive: true, force: true});
});

test('a project cannot make fractch write files outside the repo or into .git', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-region-paths-'));
    roots.push(root);
    const dir = path.join(root, 'repo');
    fs.mkdirSync(path.join(dir, '.git'), {recursive: true});
    await writeProjectToFractchTree({
        sb3Files: projectFiles(['../../escaped', '../.git/hooks/pre-commit', '.hidden', 'ok/nested', 'fine']),
        fs: fs.promises,
        dir
    });
    expect(listFiles(root)).toEqual([
        'repo/S/fine.fractch',
        'repo/S/main.fractch',
        'repo/S/ok/nested.fractch'
    ]);
});

test('a project with safe regions keeps its files', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-region-paths-'));
    roots.push(root);
    await writeProjectToFractchTree({sb3Files: projectFiles(['main', 'systems/ui', 'enemies']), fs: fs.promises, dir: root});
    expect(listFiles(root)).toEqual(['S/enemies.fractch', 'S/main.fractch', 'S/systems/ui.fractch']);
});
