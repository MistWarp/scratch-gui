// Rotur Git cannot be cloned over the smart-HTTP endpoints from a browser, so
// its repositories are rebuilt from the REST API's object database. Rebuilt
// objects keep their original shas, which is what makes the history real.
const mockRoots = new Map();
jest.mock('@isomorphic-git/lightning-fs', () => class TestFs {
    constructor (name) {
        const fs = require('fs');
        const path = require('path');
        if (!mockRoots.has(name)) mockRoots.set(name, fs.mkdtempSync(path.join(require('os').tmpdir(), 'mw-history-')));
        this.name = name;
        this.root = mockRoots.get(name);
        this.promises = {};
        for (const method of ['stat', 'lstat', 'readFile', 'writeFile', 'mkdir', 'rmdir', 'readdir', 'unlink',
            'chmod', 'readlink', 'symlink']) {
            this.promises[method] = (file, ...args) => fs.promises[method](path.join(this.root, file), ...args);
        }
    }
});

const FixtureFs = require('fs');
const FixturePath = require('path');
const FixtureOs = require('os');
const isomorphicGit = require('isomorphic-git').default;
const repo = require('../../../src/lib/git/browser-git.js');

const OWNER = 'Mist';
const NAME = 'scratch-parity';
const URL_UNDER_TEST = 'https://git.rotur.dev/Mist/scratch-parity.git';

// A real repository on disk, so the API mock serves objects this code did not
// make in memory.
const buildFixture = async () => {
    const dir = FixtureFs.mkdtempSync(FixturePath.join(FixtureOs.tmpdir(), 'mw-fixture-'));
    await isomorphicGit.init({fs: FixtureFs, dir, defaultBranch: 'main'});

    // +01:00, the offset git stores as -60 minutes west of UTC.
    const author = {name: 'Mist', email: 'mist@mistium.com', timestamp: 1790424721, timezoneOffset: -60};
    const files = async entries => {
        const tree = [];
        for (const [filePath, content] of Object.entries(entries)) {
            const oid = await isomorphicGit.writeBlob({fs: FixtureFs, dir, blob: Buffer.from(content)});
            tree.push({mode: '100644', path: filePath, oid, type: 'blob'});
        }
        return isomorphicGit.writeTree({fs: FixtureFs, dir, tree});
    };

    const firstTree = await files({'project.json': '{"v":1}', 'README.md': 'first'});
    const first = await isomorphicGit.writeCommit({
        fs: FixtureFs,
        dir,
        commit: {tree: firstTree, parent: [], author, committer: author, message: 'First version'}
    });

    const secondTree = await files({'project.json': '{"v":2}', 'README.md': 'second'});
    const second = await isomorphicGit.writeCommit({
        fs: FixtureFs,
        dir,
        commit: {tree: secondTree, parent: [first], author, committer: author, message: 'Second version\n\nWith detail.'}
    });

    // Read the repository back the way the forge would report it.
    const readTreeRecursive = async (oid, prefix = '') => {
        const {tree} = await isomorphicGit.readTree({fs: FixtureFs, dir, oid});
        const entries = [];
        for (const entry of tree) {
            const entryPath = prefix ? `${prefix}/${entry.path}` : entry.path;
            if (entry.type === 'tree') {
                entries.push(...await readTreeRecursive(entry.oid, entryPath));
            } else {
                entries.push({path: entryPath, mode: entry.mode, type: entry.type, sha: entry.oid});
            }
        }
        return entries;
    };

    const blobs = new Map();
    const commits = new Map();
    for (const sha of [first, second]) {
        const {commit} = await isomorphicGit.readCommit({fs: FixtureFs, dir, oid: sha});
        const trees = await readTreeRecursive(commit.tree);
        commits.set(sha, {commit, trees});
        for (const entry of trees) {
            if (blobs.has(entry.sha)) continue;
            const {object} = await isomorphicGit.readObject({fs: FixtureFs, dir, oid: entry.sha, format: 'content'});
            blobs.set(entry.sha, Buffer.from(object));
        }
    }

    const isoDate = seconds => new Date((seconds + 3600) * 1000)
        .toISOString()
        .replace('Z', '+01:00');
    const branches = [{name: 'main', commit: {id: second}}];

    const api = async requestUrl => {
        const path = new URL(requestUrl).pathname.replace('/api/v1/repos', '');
        const route = path.replace(`/${OWNER}/${NAME}`, '');
        if (route === '/branches') return branches;
        if (route.startsWith('/commits')) {
            return [second, first].map(sha => {
                const {commit} = commits.get(sha);
                return {sha, parents: commit.parent.map(parent => ({sha: parent})), commit: {message: commit.message}};
            });
        }
        const commitMatch = /^\/git\/commits\/(\w+)$/.exec(route);
        if (commitMatch) {
            const {commit} = commits.get(commitMatch[1]);
            const asPerson = person => ({
                name: person.name,
                email: person.email,
                date: isoDate(person.timestamp)
            });
            return {
                sha: commitMatch[1],
                parents: commit.parent.map(sha => ({sha})),
                commit: {
                    message: commit.message,
                    author: asPerson(commit.author),
                    committer: asPerson(commit.committer)
                }
            };
        }
        const treeMatch = /^\/git\/trees\/(\w+)$/.exec(route);
        if (treeMatch) {
            const {trees} = commits.get(treeMatch[1]);
            const page = Number(new URL(requestUrl).searchParams.get('page') || 1);
            const perPage = Number(new URL(requestUrl).searchParams.get('per_page') || 500);
            return {tree: trees.slice((page - 1) * perPage, page * perPage)};
        }
        const blobMatch = /^\/git\/blobs\/(\w+)$/.exec(route);
        if (blobMatch) {
            const bytes = blobs.get(blobMatch[1]);
            return {
                sha: blobMatch[1],
                size: bytes.length,
                encoding: 'base64',
                content: bytes.toString('base64')
            };
        }
        throw new Error(`Unexpected API request in test: ${requestUrl}`);
    };

    return {head: second, first, api, cleanup: () => FixtureFs.rmSync(dir, {recursive: true, force: true})};
};

afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
});

afterAll(() => {
    for (const root of mockRoots.values()) FixtureFs.rmSync(root, {recursive: true, force: true});
});

test('a Rotur repository rebuilds with its real commits and shas', async () => {
    sessionStorage.clear();
    await repo.deleteRepo();
    const fixture = await buildFixture();
    global.fetch = jest.fn(url => Promise.resolve({
        ok: true,
        status: 200,
        json: () => fixture.api(String(url))
    }));

    const result = await repo.cloneRepoFromHistory({url: URL_UNDER_TEST, owner: OWNER, name: NAME});

    expect(result.branch).toBe('main');
    expect(result.commits).toBe(2);

    const fs = repo.getFs();
    const commits = await isomorphicGit.log({fs, dir: repo.REPO_DIR});
    expect(commits.map(entry => entry.oid)).toEqual([fixture.head, fixture.first]);
    // The shas above already prove the objects are byte-identical; the reader
    // just keeps a trailing newline on some messages.
    expect(commits[1].commit.message.trimEnd()).toBe('First version');
    expect(commits[0].commit.message.trimEnd()).toBe('Second version\n\nWith detail.');
    // The +01:00 offset came back as the original author details.
    expect(commits[0].commit.author.timestamp).toBe(1790424721);
    expect(commits[0].commit.author.timezoneOffset).toBe(-60);

    // The worktree is checked out at the tip.
    expect(await fs.promises.readFile('/repo/project.json', 'utf8')).toBe('{"v":2}');
    expect(await isomorphicGit.currentBranch({fs, dir: repo.REPO_DIR, fullname: false})).toBe('main');
    const remotes = await isomorphicGit.listRemotes({fs, dir: repo.REPO_DIR});
    expect(remotes).toEqual([{remote: 'origin', url: URL_UNDER_TEST}]);

    fixture.cleanup();
});

test('history that cannot be rebuilt exactly is refused instead of invented', async () => {
    sessionStorage.clear();
    await repo.deleteRepo();
    const fixture = await buildFixture();
    // Serve a message that does not match the commit it claims to be: the
    // rebuilt sha diverges, and a clone must stop rather than rewrite history.
    global.fetch = jest.fn(url => {
        const requestUrl = String(url);
        if (requestUrl.includes('/git/commits/') && !requestUrl.includes('/commits?')) {
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => {
                    const sha = requestUrl.split('/').pop();
                    return {
                        sha,
                        parents: [],
                        commit: {
                            message: 'A message nobody committed',
                            author: {name: 'Mist', email: 'mist@mistium.com', date: '2026-09-26T13:12:01+01:00'},
                            committer: {name: 'Mist', email: 'mist@mistium.com', date: '2026-09-26T13:12:01+01:00'}
                        }
                    };
                }
            });
        }
        return Promise.resolve({ok: true, status: 200, json: () => fixture.api(requestUrl)});
    });

    await expect(repo.cloneRepoFromHistory({url: URL_UNDER_TEST, owner: OWNER, name: NAME}))
        .rejects.toThrow('could not serve enough of this history');

    // The half-written clone is cleaned up and the old repository is untouched.
    expect(await repo.repoExists()).toBe(false);

    fixture.cleanup();
});
