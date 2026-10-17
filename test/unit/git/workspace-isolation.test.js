const mockRoots = new Map();
// Replaces methods on every filesystem opened afterwards, keyed by method name.
let mockOverrides = {};
jest.mock('@isomorphic-git/lightning-fs', () => class TestFs {
    constructor (name) {
        const fs = require('fs');
        const path = require('path');
        if (!mockRoots.has(name)) mockRoots.set(name, fs.mkdtempSync(path.join(require('os').tmpdir(), 'mw-workspace-')));
        this.name = name;
        this.root = mockRoots.get(name);
        this.promises = {};
        for (const method of ['stat', 'lstat', 'readFile', 'writeFile', 'mkdir', 'rmdir', 'readdir', 'unlink', 'chmod']) {
            this.promises[method] = (file, ...args) => fs.promises[method](path.join(this.root, file), ...args);
        }
        Object.assign(this.promises, mockOverrides);
    }
});

const openPage = () => {
    let git;
    jest.isolateModules(() => {
        git = require('../../../src/lib/git/browser-git.js');
    });
    return git;
};

beforeAll(() => {
    openPage();
}, 30000);

const heldLocks = new Set();
const deletedDatabases = [];

const installBrowserApis = () => {
    navigator.locks = {
        request: async (name, options, callback) => {
            if (heldLocks.has(name)) return callback(null);
            heldLocks.add(name);
            const result = await callback({name});
            heldLocks.delete(name);
            return result;
        }
    };
    global.indexedDB = {
        databases: async () => [...mockRoots.keys()].filter(Boolean)
            .flatMap(name => [{name}, {name: `${name}_lock`}]),
        deleteDatabase: name => {
            deletedDatabases.push(name);
            const request = {};
            setTimeout(() => request.onsuccess());
            return request;
        }
    };
};

const closeAllPages = () => heldLocks.clear();

const flush = () => new Promise(resolve => setTimeout(resolve, 10));

afterEach(() => {
    mockOverrides = {};
    delete navigator.locks;
    delete global.indexedDB;
    heldLocks.clear();
    deletedDatabases.length = 0;
});

afterAll(() => {
    for (const root of mockRoots.values()) require('fs').rmSync(root, {recursive: true, force: true});
});

test('duplicated tabs copy history and never share later writes or deletions', async () => {
    sessionStorage.clear();
    const first = openPage();
    const fs1 = first.getFs();
    await first.ensureParentDir(fs1.promises, '/repo/.git/HEAD');
    await fs1.promises.writeFile('/repo/.git/HEAD', 'ref: refs/heads/main');
    await fs1.promises.writeFile('/repo/code.fractch', 'original code');
    const second = openPage();
    const fs2 = second.getFs();
    expect(await fs2.promises.readFile('/repo/code.fractch', 'utf8')).toBe('original code');
    await fs1.promises.writeFile('/repo/code.fractch', 'edits in first tab');
    await second.deleteRepo();
    expect(await fs1.promises.readFile('/repo/code.fractch', 'utf8')).toBe('edits in first tab');
});

test('rollback restores uncommitted files and all branch refs', async () => {
    sessionStorage.clear();
    const repo = openPage();
    const pfs = repo.getFs().promises;
    await repo.ensureParentDir(pfs, '/repo/.git/refs/heads/feature');
    await pfs.writeFile('/repo/.git/refs/heads/feature', 'feature commit');
    await pfs.writeFile('/repo/unsaved.fractch', 'uncommitted edits');
    const rollback = await repo.createRepoBackup();
    await repo.deleteRepo();
    await rollback();
    expect(await pfs.readFile('/repo/unsaved.fractch', 'utf8')).toBe('uncommitted edits');
    expect(await pfs.readFile('/repo/.git/refs/heads/feature', 'utf8')).toBe('feature commit');
});

test('a duplicated tab skips files whose contents the browser evicted', async () => {
    sessionStorage.clear();
    const first = openPage();
    const fs1 = first.getFs();
    await first.ensureParentDir(fs1.promises, '/repo/.git/HEAD');
    await fs1.promises.writeFile('/repo/.git/HEAD', 'ref: refs/heads/main');
    await fs1.promises.writeFile('/repo/evicted.fractch', 'gone');
    const readFile = fs1.promises.readFile;
    // LightningFS keeps metadata for evicted files but resolves their contents as undefined.
    mockOverrides = {readFile: (file, ...args) => (file.endsWith('evicted.fractch') ? undefined : readFile(file, ...args))};
    const second = openPage();
    const pfs = second.getFs().promises;
    expect(await pfs.readFile('/repo/.git/HEAD', 'utf8')).toBe('ref: refs/heads/main');
    await expect(pfs.stat('/repo/evicted.fractch')).rejects.toMatchObject({code: 'ENOENT'});
});

test('deleting history succeeds when storage refuses to open', async () => {
    sessionStorage.clear();
    const refused = Object.assign(new Error('Unable to open database file on disk'), {name: 'UnknownError'});
    mockOverrides = {stat: () => Promise.reject(refused)};
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const repo = openPage();
    await expect(repo.deleteRepo()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Project history storage is unavailable', refused);
    warn.mockRestore();
});

test('a reload reopens its own workspace instead of creating another', async () => {
    sessionStorage.clear();
    installBrowserApis();
    const first = openPage();
    const fs1 = first.getFs();
    await first.ensureParentDir(fs1.promises, '/repo/.git/HEAD');
    await fs1.promises.writeFile('/repo/code.fractch', 'saved before reload');
    const workspace = sessionStorage.getItem('mw:git-workspace');
    const databaseCount = [...mockRoots.keys()].filter(Boolean).length;
    closeAllPages();
    const reloaded = openPage();
    const pfs = reloaded.getFs().promises;
    expect(await pfs.readFile('/repo/code.fractch', 'utf8')).toBe('saved before reload');
    expect(sessionStorage.getItem('mw:git-workspace')).toBe(workspace);
    expect([...mockRoots.keys()].filter(Boolean)).toHaveLength(databaseCount);
});

const openWorkspace = async () => {
    const page = openPage();
    await page.getFs().promises.readdir('/').catch(() => {});
    await flush();
    return sessionStorage.getItem('mw:git-workspace');
};

test('closed pages leave no databases behind but open pages keep theirs', async () => {
    sessionStorage.clear();
    localStorage.clear();
    installBrowserApis();
    const closedName = await openWorkspace();
    closeAllPages();
    sessionStorage.clear();
    const openName = await openWorkspace();
    sessionStorage.clear();
    await openWorkspace();
    expect(deletedDatabases).toEqual([]);
    localStorage.setItem(`mw:git-orphan:${closedName}`, String(Date.now() - 61000));
    sessionStorage.clear();
    await openWorkspace();
    expect(deletedDatabases).toEqual(expect.arrayContaining([closedName, `${closedName}_lock`]));
    expect(deletedDatabases).not.toContain(openName);
});

test('a page reloading while another page cleans up keeps its history', async () => {
    sessionStorage.clear();
    localStorage.clear();
    installBrowserApis();
    const first = openPage();
    const fs1 = first.getFs();
    await first.ensureParentDir(fs1.promises, '/repo/.git/HEAD');
    await fs1.promises.writeFile('/repo/code.fractch', 'survives cleanup');
    const reloadingName = sessionStorage.getItem('mw:git-workspace');
    await flush();
    closeAllPages();
    sessionStorage.clear();
    await openWorkspace();
    expect(localStorage.getItem(`mw:git-orphan:${reloadingName}`)).not.toBeNull();
    localStorage.setItem(`mw:git-orphan:${reloadingName}`, String(Date.now() - 61000));
    sessionStorage.setItem('mw:git-workspace', reloadingName);
    const reloaded = openPage();
    expect(localStorage.getItem(`mw:git-orphan:${reloadingName}`)).toBeNull();
    sessionStorage.clear();
    await openWorkspace();
    expect(deletedDatabases).not.toContain(reloadingName);
    expect(await reloaded.getFs().promises.readFile('/repo/code.fractch', 'utf8')).toBe('survives cleanup');
});
