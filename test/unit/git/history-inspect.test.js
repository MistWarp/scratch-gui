jest.mock('@isomorphic-git/lightning-fs', () => class TestFs {
    constructor () {
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        this.root = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-history-inspect-test-'));
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

const {commitProject, deleteRepo, getFs, git, REPO_DIR} = require('../../../src/lib/git/browser-git.js');
const {createMwp, inspectHistoryCommit, inspectHistoryWorktree} = require('../../../src/lib/git/mwp.js');

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>';
const SVG_MD5 = require('crypto').createHash('md5')
    .update(SVG)
    .digest('hex');

const projectFiles = ({score, say, withCostume = false}) => {
    const blocks = {
        hat: {opcode: 'event_whenflagclicked',
            next: 'say',
            parent: null,
            inputs: {},
            fields: {},
            shadow: false,
            topLevel: true,
            x: 0,
            y: 0},
        say: {opcode: 'looks_say',
            next: null,
            parent: 'hat',
            inputs: {MESSAGE: [1, [10, say]]},
            fields: {},
            shadow: false,
            topLevel: false}
    };
    const costumes = withCostume ? [{
        name: 'dot',
        assetId: SVG_MD5,
        md5ext: `${SVG_MD5}.svg`,
        dataFormat: 'svg',
        rotationCenterX: 1,
        rotationCenterY: 1
    }] : [];
    const files = {
        'project.json': JSON.stringify({
            targets: [{
                isStage: true,
                name: 'Stage',
                variables: {score: ['score', score]},
                lists: {},
                broadcasts: {},
                blocks: {},
                comments: {},
                currentCostume: 0,
                costumes: [],
                sounds: [],
                volume: 100
            }, {
                isStage: false,
                name: 'Cat',
                variables: {},
                lists: {},
                broadcasts: {},
                blocks,
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
            }],
            monitors: [],
            extensions: [],
            meta: {semver: '3.0.0', vm: '0.2.0', agent: 'test'}
        })
    };
    if (withCostume) files[`${SVG_MD5}.svg`] = SVG;
    return files;
};

const author = {name: 'mist', email: 'mist@mistium.com'};

const buildHistory = async () => {
    await createMwp({sb3Files: projectFiles({score: 0, say: 'hello'}), commitChanges: true, message: 'First'});
    const first = await git.resolveRef({fs: getFs(), dir: REPO_DIR, ref: 'HEAD'});
    await commitProject({sb3Files: projectFiles({score: 5, say: 'hello there'}), message: 'Second', author});
    const second = await git.resolveRef({fs: getFs(), dir: REPO_DIR, ref: 'HEAD'});
    await commitProject({
        sb3Files: projectFiles({score: 5, say: 'hello there', withCostume: true}),
        message: 'Third',
        author
    });
    const third = await git.resolveRef({fs: getFs(), dir: REPO_DIR, ref: 'HEAD'});
    return {first, second, third};
};

beforeEach(() => deleteRepo());
afterAll(() => require('fs').rmSync(getFs().root, {recursive: true, force: true}));

test('a commit is compared with the commit before it, with context lines and fractch texts', async () => {
    const {second} = await buildHistory();
    const result = await inspectHistoryCommit({oid: second});
    expect(result.diff).toContain('diff --mwp a/Cat/main.fractch b/Cat/main.fractch');
    expect(result.diff.split('\n').some(line => line.startsWith(' '))).toBe(true);
    expect(result.fileTexts['Cat/main.fractch'].before).toContain('"hello"');
    expect(result.fileTexts['Cat/main.fractch'].after).toContain('"hello there"');
    expect(result.files.map(file => file.path)).toEqual(expect.arrayContaining(['Cat/main.fractch']));
});

test('the first commit shows everything as added', async () => {
    const {first} = await buildHistory();
    const result = await inspectHistoryCommit({oid: first});
    expect(result.base).toBe('');
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.files.every(file => file.type === 'added')).toBe(true);
    expect(result.diff).toContain('--- /dev/null');
});

test('a commit can be compared with an older commit than its parent', async () => {
    const {first, third} = await buildHistory();
    const result = await inspectHistoryCommit({oid: third, baseOid: first});
    expect(result.base).toBe(first);
    expect(result.fileTexts['Cat/main.fractch'].before).toContain('"hello"');
    expect(result.fileTexts['Cat/main.fractch'].after).toContain('"hello there"');
});

test('added costumes come with their bytes so the diff can show them', async () => {
    const {third} = await buildHistory();
    const result = await inspectHistoryCommit({oid: third});
    const costume = result.assets['Cat/assets/dot.svg'];
    expect(costume).toBeTruthy();
    expect(costume.old).toBeNull();
    expect(new TextDecoder().decode(costume.new)).toBe(SVG);
    expect(costume.mediaType).toBe('image/svg+xml');
    expect(result.diff).toContain('diff --mwp a/Cat/assets/dot.svg b/Cat/assets/dot.svg\nBinary file changed');
});

test('uncommitted changes are compared with the last commit', async () => {
    const {third} = await buildHistory();
    const vm = {saveProjectSb3DontZip: () => projectFiles({score: 9, say: 'bye', withCostume: true})};
    const result = await inspectHistoryWorktree({vm});
    expect(result.base).toBe(third);
    expect(result.fileTexts['Cat/main.fractch'].before).toContain('"hello there"');
    expect(result.fileTexts['Cat/main.fractch'].after).toContain('"bye"');
    expect(result.files.find(file => file.path === 'Cat/main.fractch').type).toBe('modified');
});
