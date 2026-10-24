import JSZip from '@turbowarp/jszip';

jest.mock('@isomorphic-git/lightning-fs', () => class TestFs {
    constructor () {
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        this.root = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-uncommitted-test-'));
        this.promises = {};
        for (const method of ['stat', 'lstat', 'readFile', 'writeFile', 'mkdir', 'rmdir', 'readdir', 'unlink', 'chmod', 'readlink']) {
            this.promises[method] = async (name, ...args) => fs.promises[method](path.join(this.root, name), ...args);
        }
        this.promises.symlink = async (target, name) => fs.promises.symlink(target, path.join(this.root, name));
        this.promises.rename = (from, to) => fs.promises.rename(path.join(this.root, from), path.join(this.root, to));
    }
});
jest.mock('../../../src/lib/rotur/identity.js', () => ({
    getMistWarpAuthor: jest.fn(() => Promise.reject(new Error('Sign in to Rotur before saving a MistWarp project')))
}));

const crypto = require('crypto');
const {getFs, deleteRepo} = require('../../../src/lib/git/browser-git.js');
const {createMwp} = require('../../../src/lib/git/mwp.js');
const {worktreeAssetPaths} = require('../../../src/lib/git/fractch-tree.js');

const bytes = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
});
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
const md5ext = `${crypto.createHash('md5').update(svg)
    .digest('hex')}.svg`;
const costume = (name, ext = md5ext) => ({
    name, md5ext: ext, assetId: ext.split('.')[0], dataFormat: 'svg', rotationCenterX: 0, rotationCenterY: 0
});
const projectFiles = (score, targets) => ({
    'project.json': JSON.stringify({
        targets: targets || [{
            isStage: true,
            name: 'Stage',
            variables: {score: ['score', score]},
            lists: {},
            broadcasts: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [costume('backdrop1')],
            sounds: [],
            volume: 100
        }],
        monitors: [],
        extensions: [],
        meta: {semver: '3.0.0', vm: '0.2.0', agent: 'test'}
    }),
    [md5ext]: svg
});

beforeEach(() => deleteRepo());
afterAll(() => require('fs').rmSync(getFs().root, {recursive: true, force: true}));

test('maps each worktree asset path to its md5ext, using the same folders the tree writer uses', async () => {
    const other = `${'0'.repeat(32)}.svg`;
    const paths = await worktreeAssetPaths(projectFiles(0, [
        {isStage: true, name: 'Stage', costumes: [costume('backdrop1')], sounds: []},
        {isStage: false, name: 'Cat!', costumes: [costume('cat')], sounds: []},
        {isStage: false, name: 'Cat?', costumes: [costume('cat', other)], sounds: []}
    ]));
    expect([...paths]).toEqual([
        ['Stage/assets/backdrop1.svg', md5ext],
        ['Cat_/assets/cat.svg', md5ext],
        ['Cat__2/assets/cat.svg', other]
    ]);
});

test('drops worktree asset paths whose md5ext is not a plain md5 name', async () => {
    const paths = await worktreeAssetPaths(projectFiles(0, [
        {isStage: true, name: 'Stage', costumes: [costume('backdrop1')], sounds: []},
        {isStage: false, name: 'Cat', costumes: [costume('cat', 'not-an-md5.svg')], sounds: []}
    ]));
    expect([...paths]).toEqual([['Stage/assets/backdrop1.svg', md5ext]]);
});

test('delta saves reference stored assets instead of uploading them', async () => {
    const initial = await createMwp({sb3Files: projectFiles(0), commitChanges: true, message: 'Initial'});
    const save = async referenceStoredAssets => {
        const result = await createMwp({
            sb3Files: projectFiles(1),
            commitChanges: false,
            remoteHead: initial.manifest.head,
            referenceStoredAssets
        });
        const zip = await JSZip.loadAsync(await bytes(result.blob));
        return {result, zip, manifest: JSON.parse(await zip.file('mwp.json').async('text'))};
    };
    const referenced = await save(true);
    expect(referenced.zip.file('Stage/assets/backdrop1.svg')).toBeNull();
    expect(referenced.manifest.worktreeAssets).toEqual({'Stage/assets/backdrop1.svg': md5ext});
    expect(referenced.result.manifest.worktreeAssets).toBeUndefined();

    const full = await save(false);
    expect(await full.zip.file('Stage/assets/backdrop1.svg').async('text')).toBe(svg);
    expect(full.manifest.worktreeAssets).toBeUndefined();
});
