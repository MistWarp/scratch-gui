const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../../../src/lib/persistence/storage', () => ({}));

const {writeProjectToFractchTree, clearWorkingTree} = require('../../../src/lib/git/fractch-tree.js');

const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>');
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);
const WAV = new Uint8Array([82, 73, 70, 70, 4, 0, 0, 0, 87, 65, 86, 69]);

const costume = (name, md5, dataFormat) => ({
    name,
    bitmapResolution: 1,
    dataFormat,
    assetId: md5,
    md5ext: `${md5}.${dataFormat}`,
    rotationCenterX: 1,
    rotationCenterY: 1
});

const sprite = (name, say, costumes, sounds = []) => ({
    isStage: false,
    name,
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {
        hat: {
            opcode: 'event_whenflagclicked',
            next: 'say',
            parent: null,
            inputs: {},
            fields: {},
            shadow: false,
            topLevel: true,
            x: 0,
            y: 0
        },
        say: {
            opcode: 'looks_say',
            next: null,
            parent: 'hat',
            inputs: {MESSAGE: [1, [10, say]]},
            fields: {},
            shadow: false,
            topLevel: false
        }
    },
    comments: {},
    currentCostume: 0,
    costumes,
    sounds,
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

const makeFiles = sprites => ({
    'project.json': new TextEncoder().encode(JSON.stringify({
        targets: [{
            isStage: true,
            name: 'Stage',
            variables: {},
            lists: {},
            broadcasts: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [costume('backdrop', 'aaaa', 'svg')],
            sounds: [],
            volume: 100,
            layerOrder: 0,
            tempo: 60,
            videoTransparency: 50,
            videoState: 'on',
            textToSpeechLanguage: null
        }, ...sprites],
        monitors: [],
        extensions: [],
        meta: {semver: '3.0.0', vm: '0.2.0', agent: ''}
    })),
    'aaaa.svg': SVG,
    'bbbb.png': PNG,
    'cccc.wav': WAV
});

const sound = {name: 'pop', assetId: 'cccc', dataFormat: 'wav', format: '', rate: 22050, sampleCount: 1, md5ext: 'cccc.wav'};

const roots = [];
const makeDir = () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-fractch-sync-'));
    roots.push(root);
    return root;
};
afterAll(() => {
    for (const root of roots) fs.rmSync(root, {recursive: true, force: true});
});

const listTree = dir => {
    const out = {};
    const walk = current => {
        for (const entry of fs.readdirSync(current)) {
            const full = path.join(current, entry);
            if (fs.statSync(full).isDirectory()) walk(full);
            else out[path.relative(dir, full)] = fs.readFileSync(full).toString('base64');
        }
    };
    walk(dir);
    return out;
};

const listDirs = dir => {
    const out = [];
    const walk = current => {
        for (const entry of fs.readdirSync(current)) {
            const full = path.join(current, entry);
            if (fs.statSync(full).isDirectory()) {
                out.push(path.relative(dir, full));
                walk(full);
            }
        }
    };
    walk(dir);
    return out.sort();
};

const mtimes = dir => {
    const out = {};
    for (const file of Object.keys(listTree(dir))) out[file] = fs.statSync(path.join(dir, file)).mtimeMs;
    return out;
};

const writeFresh = async files => {
    const dir = makeDir();
    await writeProjectToFractchTree({sb3Files: files, fs: fs.promises, dir});
    return dir;
};

const first = makeFiles([
    sprite('Cat', 'Hello', [costume('cat', 'bbbb', 'png')], [sound]),
    sprite('Dog', 'Woof', [costume('dog', 'aaaa', 'svg')])
]);
const second = makeFiles([
    sprite('Cat', 'Hello again', [costume('cat', 'bbbb', 'png')], [sound])
]);

test('rewriting the same project leaves every file untouched', async () => {
    const dir = await writeFresh(first);
    const before = mtimes(dir);
    const contents = listTree(dir);
    await new Promise(resolve => setTimeout(resolve, 50));
    await writeProjectToFractchTree({sb3Files: first, fs: fs.promises, dir});
    expect(listTree(dir)).toEqual(contents);
    expect(mtimes(dir)).toEqual(before);
});

test('an incremental write matches a clean write of the new project', async () => {
    const dir = await writeFresh(first);
    fs.mkdirSync(path.join(dir, '.git'));
    fs.writeFileSync(path.join(dir, '.git', 'HEAD'), 'ref: refs/heads/main\n');
    fs.writeFileSync(path.join(dir, 'README.md'), '# Notes\n');
    const untouched = fs.statSync(path.join(dir, 'Cat', 'assets', 'cat.png')).mtimeMs;
    await new Promise(resolve => setTimeout(resolve, 50));
    await writeProjectToFractchTree({sb3Files: second, fs: fs.promises, dir});

    const clean = await writeFresh(second);
    const result = listTree(dir);
    expect(result['.git/HEAD']).toBe(Buffer.from('ref: refs/heads/main\n').toString('base64'));
    expect(result['README.md']).toBe(Buffer.from('# Notes\n').toString('base64'));
    delete result['.git/HEAD'];
    delete result['README.md'];
    expect(result).toEqual(listTree(clean));
    expect(listDirs(dir).filter(item => item !== '.git')).toEqual(listDirs(clean));
    expect(fs.existsSync(path.join(dir, 'Dog'))).toBe(false);
    expect(fs.statSync(path.join(dir, 'Cat', 'assets', 'cat.png')).mtimeMs).toBe(untouched);
});

test('a path that changes from a file into a folder is written like a fresh tree', async () => {
    const dir = await writeFresh(second);
    const clean = listTree(dir);
    await clearWorkingTree({pfs: fs.promises, dir});
    fs.writeFileSync(path.join(dir, 'Cat'), 'not a folder');
    await writeProjectToFractchTree({sb3Files: second, fs: fs.promises, dir});
    expect(listTree(dir)).toEqual(clean);
});

test('a VM project is read without zipping it', async () => {
    const vm = {
        saveProjectSb3: jest.fn(),
        saveProjectSb3DontZip: jest.fn(() => first)
    };
    const dir = makeDir();
    await writeProjectToFractchTree({vm, fs: fs.promises, dir});
    expect(vm.saveProjectSb3).not.toHaveBeenCalled();
    expect(vm.saveProjectSb3DontZip).toHaveBeenCalledTimes(1);
    expect(listTree(dir)).toEqual(listTree(await writeFresh(first)));
});
