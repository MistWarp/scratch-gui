import JSZip from '@turbowarp/jszip';

jest.mock('@isomorphic-git/lightning-fs', () => class TestFs {
    constructor () {
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        this.root = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-git-test-'));
        this.promises = {};
        for (const method of ['stat', 'lstat', 'readFile', 'writeFile', 'mkdir', 'rmdir', 'readdir', 'unlink', 'chmod', 'readlink']) {
            this.promises[method] = async (name, ...args) => fs.promises[method](path.join(this.root, name), ...args);
        }
        this.promises.symlink = async (target, name) => fs.promises.symlink(target, path.join(this.root, name));
        this.promises.rename = (from, to) => fs.promises.rename(path.join(this.root, from), path.join(this.root, to));
    }
});
jest.mock('../../../src/lib/git/fractch-tree.js', () => ({
    buildSb3FromFractchTree: jest.fn(), writeProjectToFractchTree: jest.fn()
}));
jest.mock('../../../src/lib/rotur/identity.js', () => ({getMistWarpAuthor: jest.fn()}));

const {git, getFs, REPO_DIR, deleteRepo, ensureParentDir} = require('../../../src/lib/git/browser-git.js');
const {exportCurrentMwp, importMwp} = require('../../../src/lib/git/mwp.js');
const author = {name: 'Test', email: 'test@example.com', timestamp: 1000};
const bytes = async blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
});

beforeEach(async () => {
    await deleteRepo();
    const fs = getFs();
    await ensureParentDir(fs.promises, `${REPO_DIR}/file`);
    await git.init({fs, dir: REPO_DIR, defaultBranch: 'main'});
});
afterAll(() => require('fs').rmSync(getFs().root, {recursive: true, force: true}));
const commit = async text => {
    const fs = getFs();
    await fs.promises.writeFile(`${REPO_DIR}/file.txt`, text);
    await git.add({fs, dir: REPO_DIR, filepath: 'file.txt'});
    return git.commit({fs, dir: REPO_DIR, message: text, author});
};

test('a normal save descends from inherited history and full import uses refs for HEAD', async () => {
    const base = await commit('inherited');
    const parent = await exportCurrentMwp({});
    await importMwp(await bytes(parent.blob));
    const head = await commit('edited');
    const saved = await exportCurrentMwp({baseCommit: base});
    const zip = await JSZip.loadAsync(await bytes(saved.blob));
    const manifest = JSON.parse(await zip.file('mwp.json').async('text'));
    manifest.head = base;
    zip.file('mwp.json', JSON.stringify(manifest));
    const imported = await importMwp(await zip.generateAsync({type: 'uint8array'}));
    expect(imported.head).toBe(head);
    const entry = await git.readCommit({fs: getFs(), dir: REPO_DIR, oid: head});
    expect(entry.commit.parent).toEqual([base]);
    expect(await getFs().promises.readFile(`${REPO_DIR}/file.txt`, 'utf8')).toBe('edited');
});

test.each(['parent', 'tree', 'blob'])('missing %s rejects import and preserves the current worktree', async missing => {
    const base = await commit('inherited');
    await commit('edited');
    const exported = await exportCurrentMwp({});
    const zip = await JSZip.loadAsync(await bytes(exported.blob));
    const parent = await git.readCommit({fs: getFs(), dir: REPO_DIR, oid: base});
    const tree = await git.readTree({fs: getFs(), dir: REPO_DIR, oid: parent.commit.tree});
    const oid = missing === 'parent' ? base : missing === 'tree' ? parent.commit.tree : tree.tree[0].oid;
    zip.remove(`.git/objects/${oid.slice(0, 2)}/${oid.slice(2)}`);
    const before = await git.resolveRef({fs: getFs(), dir: REPO_DIR, ref: 'HEAD'});
    await expect(importMwp(await zip.generateAsync({type: 'uint8array'}))).rejects.toThrow();
    expect(await git.resolveRef({fs: getFs(), dir: REPO_DIR, ref: 'HEAD'})).toBe(before);
    expect(await getFs().promises.readFile(`${REPO_DIR}/file.txt`, 'utf8')).toBe('edited');
});

test('a delta declares its base and cannot be imported as a full workspace', async () => {
    const base = await commit('base');
    await commit('edit');
    const delta = await exportCurrentMwp({}, {baseHead: base});
    expect(delta.manifest.delta).toBe(true);
    expect(delta.manifest.baseHead).toBe(base);
    await expect(importMwp(await bytes(delta.blob))).rejects.toThrow('combined with its base');
});
