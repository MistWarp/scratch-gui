import JSZip from '@turbowarp/jszip';

jest.mock('@isomorphic-git/lightning-fs', () => class TestFs {
    constructor () {
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        this.root = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-archive-detect-test-'));
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

const {getFs, deleteRepo} = require('../../../src/lib/git/browser-git.js');
const {createMwp, importMwp, isMwpArchive, buildSb3FromCurrentRepo} = require('../../../src/lib/git/mwp.js');
const bytes = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
});
const projectJson = JSON.stringify({
    targets: [{
        isStage: true, name: 'Stage', variables: {score: ['score', 7]}, lists: {}, broadcasts: {},
        blocks: {}, comments: {}, currentCostume: 0, costumes: [], sounds: [], volume: 100
    }],
    monitors: [], extensions: [], meta: {semver: '3.0.0', vm: '0.2.0', agent: 'test'}
});

beforeEach(() => deleteRepo());
afterAll(() => require('fs').rmSync(getFs().root, {recursive: true, force: true}));

test('a downloaded .mwp is recognised as an archive, an sb3 or JSON is not', async () => {
    const saved = await createMwp({sb3Files: {'project.json': projectJson}, commitChanges: false});
    const mwp = await bytes(saved.blob);
    expect(await isMwpArchive(mwp)).toBe(true);
    expect(await isMwpArchive(new Uint8Array(mwp))).toBe(true);

    const sb3 = new JSZip();
    sb3.file('project.json', projectJson);
    expect(await isMwpArchive(await sb3.generateAsync({type: 'arraybuffer'}))).toBe(false);
    expect(await isMwpArchive(new TextEncoder().encode(projectJson).buffer)).toBe(false);
    expect(await isMwpArchive(new ArrayBuffer(0))).toBe(false);
    expect(await isMwpArchive(new Uint8Array([0x50, 0x4b, 1, 2]).buffer)).toBe(false);
    expect(await isMwpArchive('not bytes')).toBe(false);
});

test('an .mwp fetched by URL opens as the project it was saved from', async () => {
    const saved = await createMwp({sb3Files: {'project.json': projectJson}, commitChanges: false});
    const mwp = await bytes(saved.blob);
    await deleteRepo();
    await importMwp(mwp);
    const sb3 = await bytes(await buildSb3FromCurrentRepo());
    const zip = await JSZip.loadAsync(sb3);
    const project = JSON.parse(await zip.file('project.json').async('text'));
    expect(Object.values(project.targets[0].variables)).toContainEqual(['score', 7]);
});
