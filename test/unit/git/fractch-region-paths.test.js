const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../../../src/lib/persistence/storage', () => ({
    AssetType: {CustomAsset: {}},
    createAsset: (type, dataFormat, data) => ({
        assetId: require('crypto').createHash('md5')
            .update(Buffer.from(data))
            .digest('hex'),
        dataFormat
    })
}));

const JSZip = require('@turbowarp/jszip');
const {buildSb3FromFractchTree, writeProjectToFractchTree} = require('../../../src/lib/git/fractch-tree.js');

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

const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>');
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);

const stage = () => ({
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
});

const sprite = (name, costumes) => ({
    isStage: false,
    name,
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {},
    comments: {},
    currentCostume: 0,
    costumes,
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
});

const filesFor = (project, extra = {}) => ({
    'project.json': new TextEncoder().encode(JSON.stringify({
        monitors: [],
        extensions: [],
        meta: {semver: '3.0.0', vm: '0.2.0', agent: ''},
        ...project
    })),
    ...extra
});

const freshRepo = () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-region-paths-'));
    roots.push(root);
    const dir = path.join(root, 'repo');
    fs.mkdirSync(path.join(dir, '.git'), {recursive: true});
    return {root, dir};
};

test('custom asset names cannot leave the assets folder or reach a dot folder', async () => {
    const {root, dir} = freshRepo();
    const names = ['../.git/in_git.txt', '../../escaped.txt', '.git/nested.txt', 'C:/drive.txt', 'ok/notes.txt'];
    const extra = {};
    const customAssets = names.map((name, index) => {
        const md5ext = `${String(index).repeat(32)}.txt`;
        extra[md5ext] = new TextEncoder().encode(name);
        return {name, md5ext};
    });
    await writeProjectToFractchTree({
        sb3Files: filesFor({targets: [stage()], customAssets}, extra),
        fs: fs.promises,
        dir
    });
    expect(listFiles(root)).toEqual(['repo/assets/ok/notes.txt']);
});

test('costume and sound formats cannot steer where asset files are written', async () => {
    const {root, dir} = freshRepo();
    const svgName = `${'a'.repeat(32)}.svg`;
    const pngName = `${'b'.repeat(32)}.png`;
    const costumes = [
        {name: 'c1',
            assetId: 'a'.repeat(32),
            md5ext: svgName,
            dataFormat: 'svg/../../../escaped',
            rotationCenterX: 0,
            rotationCenterY: 0},
        {name: 'c2',
            assetId: 'b'.repeat(32),
            md5ext: pngName,
            dataFormat: 'png/../../.git/in_git',
            rotationCenterX: 0,
            rotationCenterY: 0,
            bitmapResolution: 1}
    ];
    await writeProjectToFractchTree({
        sb3Files: filesFor({targets: [stage(), sprite('S', costumes)]}, {[svgName]: SVG, [pngName]: PNG}),
        fs: fs.promises,
        dir
    });
    const files = listFiles(root);
    expect(files.every(file => file.startsWith('repo/') && !file.startsWith('repo/.git/'))).toBe(true);
    expect(files).toEqual(expect.arrayContaining(['repo/S/assets/c1.svgescaped', 'repo/S/assets/c2.pnggitingit']));
});

test('sprites whose names clean to the same folder keep their own costumes', async () => {
    const {dir} = freshRepo();
    const svgName = `${'a'.repeat(32)}.svg`;
    const pngName = `${'b'.repeat(32)}.png`;
    const svg = {name: 'x',
        assetId: 'a'.repeat(32),
        md5ext: svgName,
        dataFormat: 'svg',
        rotationCenterX: 1,
        rotationCenterY: 1};
    const png = {name: 'y',
        assetId: 'b'.repeat(32),
        md5ext: pngName,
        dataFormat: 'png',
        rotationCenterX: 1,
        rotationCenterY: 1,
        bitmapResolution: 1};
    await writeProjectToFractchTree({
        sb3Files: filesFor(
            {targets: [stage(), sprite('a b', [svg]), sprite('a_b', [png])]},
            {[svgName]: SVG, [pngName]: PNG}
        ),
        fs: fs.promises,
        dir
    });
    const zip = await JSZip.loadAsync(await buildSb3FromFractchTree({fs: fs.promises, dir}));
    const project = JSON.parse(await zip.file('project.json').async('string'));
    const costumesOf = name => project.targets.find(target => target.name === name).costumes
        .map(costume => costume.name);
    expect(costumesOf('a b')).toEqual(['x']);
    expect(costumesOf('a_b')).toEqual(['y']);
});
