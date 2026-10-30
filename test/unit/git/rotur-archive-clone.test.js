// Rotur Git refuses its Git endpoints from a browser, so cloning downloads a
// branch archive from the REST API and rebuilds a repository from it.
const mockRoots = new Map();
jest.mock('@isomorphic-git/lightning-fs', () => class TestFs {
    constructor (name) {
        const fs = require('fs');
        const path = require('path');
        if (!mockRoots.has(name)) mockRoots.set(name, fs.mkdtempSync(path.join(require('os').tmpdir(), 'mw-archive-')));
        this.name = name;
        this.root = mockRoots.get(name);
        this.promises = {};
        for (const method of ['stat', 'lstat', 'readFile', 'writeFile', 'mkdir', 'rmdir', 'readdir', 'unlink',
            'chmod', 'readlink', 'symlink']) {
            this.promises[method] = (file, ...args) => fs.promises[method](path.join(this.root, file), ...args);
        }
    }
});

const isomorphicGit = require('isomorphic-git').default;
const JSZip = require('@turbowarp/jszip');
const repo = require('../../../src/lib/git/browser-git.js');

const AUTHOR = {name: 'sophie', email: 'sophie@example.com'};
const URL = 'https://git.rotur.dev/Mist/game.git';

const makeArchive = async files => {
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files)) {
        zip.file(name, content);
    }
    return zip.generateAsync({type: 'uint8array'});
};

afterEach(() => {
    jest.restoreAllMocks();
});

afterAll(() => {
    for (const root of mockRoots.values()) require('fs').rmSync(root, {recursive: true, force: true});
});

test('an archive becomes a repository with a commit and an origin remote', async () => {
    sessionStorage.clear();
    await repo.deleteRepo();
    const bytes = await makeArchive({
        'game-main/code.fractch': 'when green flag clicked',
        'game-main/project.json': '{}'
    });

    await repo.cloneRepoFromArchive({url: URL, bytes, branch: 'main', author: AUTHOR});

    const fs = repo.getFs();
    // The archive's wrapper folder is stripped, so files land at the repo root.
    expect(await fs.promises.readFile('/repo/code.fractch', 'utf8')).toBe('when green flag clicked');
    expect(await fs.promises.readFile('/repo/project.json', 'utf8')).toBe('{}');

    const commits = await isomorphicGit.log({fs, dir: repo.REPO_DIR});
    expect(commits).toHaveLength(1);
    expect(commits[0].commit.author.name).toBe('sophie');

    expect(await isomorphicGit.listRemotes({fs, dir: repo.REPO_DIR}))
        .toEqual([{remote: 'origin', url: URL}]);
}, 30000);

test('a repository that keeps everything in one folder does not lose that folder', async () => {
    sessionStorage.clear();
    await repo.deleteRepo();
    // Nothing here is Gitea's `<repo>-<branch>` wrapper, so the folder is real.
    const bytes = await makeArchive({
        'src/project.json': '{}',
        'src/game.fractch': 'when green flag clicked'
    });

    await repo.cloneRepoFromArchive({url: URL, bytes, branch: 'main', author: AUTHOR});

    const fs = repo.getFs();
    expect(await fs.promises.readFile('/repo/src/project.json', 'utf8')).toBe('{}');
    expect(await fs.promises.readFile('/repo/src/game.fractch', 'utf8')).toBe('when green flag clicked');
}, 30000);

test('a zip that tries to climb out of the repo is refused and leaves the old repo alone', async () => {
    sessionStorage.clear();
    const fs = repo.getFs();
    await repo.ensureParentDir(fs.promises, '/repo/keep.fractch');
    await fs.promises.writeFile('/repo/keep.fractch', 'still here');

    // JSZip drops `..` while packing, so serve the entry directly to prove the
    // guard still refuses one that arrives intact.
    jest.spyOn(JSZip, 'loadAsync').mockResolvedValue({
        files: {
            'game-main/code.fractch': {dir: false, async: async () => new Uint8Array([1])},
            '../escaped.fractch': {dir: false, async: async () => new Uint8Array([1])}
        }
    });

    await expect(repo.cloneRepoFromArchive({url: URL, bytes: new Uint8Array([1]), author: AUTHOR}))
        .rejects.toThrow('unsafe path');

    expect(await fs.promises.readFile('/repo/keep.fractch', 'utf8')).toBe('still here');
}, 30000);
