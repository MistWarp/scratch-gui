import JSZip from '@turbowarp/jszip';

jest.mock('@isomorphic-git/lightning-fs', () => class TestFs {
    constructor () {
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        this.root = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-project-files-test-'));
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
const {git, getFs, REPO_DIR, deleteRepo, commitProject} = require('../../../src/lib/git/browser-git.js');
const {createMwp, importMwp, isMwpArchive, buildSb3FromCurrentRepo} = require('../../../src/lib/git/mwp.js');
const {writeProjectToFractchTree} = require('../../../src/lib/git/fractch-tree.js');

const bytes = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
});

const COSTUME = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"></svg>';
const COSTUME_ID = crypto.createHash('md5').update(COSTUME)
    .digest('hex');

const target = (name, extra = {}) => ({
    isStage: name === 'Stage',
    name,
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {},
    comments: {},
    currentCostume: 0,
    costumes: [{
        name: 'look',
        assetId: COSTUME_ID,
        md5ext: `${COSTUME_ID}.svg`,
        dataFormat: 'svg',
        rotationCenterX: 2,
        rotationCenterY: 2
    }],
    sounds: [],
    volume: 100,
    ...extra
});

const projectFiles = (sprite = {}) => ({
    'project.json': JSON.stringify({
        targets: [target('Stage'), target('Cat', {x: 0, y: 0, size: 100, direction: 90, visible: true, ...sprite})],
        monitors: [],
        extensions: [],
        meta: {semver: '3.0.0', vm: '0.2.0', agent: 'test'}
    }),
    [`${COSTUME_ID}.svg`]: COSTUME
});

const author = {name: 'Test', email: 'test@example.com'};

const reopenedProject = async () => {
    const zip = await JSZip.loadAsync(await bytes(await buildSb3FromCurrentRepo()));
    return JSON.parse(await zip.file('project.json').async('text'));
};

beforeEach(() => deleteRepo());
afterAll(() => require('fs').rmSync(getFs().root, {recursive: true, force: true}));

describe('the check before a version is saved', () => {
    test('a version that would change the project is refused with the differences', async () => {
        await commitProject({sb3Files: projectFiles(), message: 'First', author});
        const lossy = projectFiles({variables: {cloudy: ['☁ cloudy', 3, true]}});
        let error;
        try {
            await commitProject({sb3Files: lossy, message: 'Second', author, allowLoss: false});
        } catch (e) {
            error = e;
        }
        expect(error && error.code).toBe('project_not_exact');
        expect(error.differences).toEqual(expect.arrayContaining([
            expect.objectContaining({path: 'sprite "Cat".variables'})
        ]));
        expect(await git.log({fs: getFs(), dir: REPO_DIR})).toHaveLength(1);

        await commitProject({sb3Files: lossy, message: 'Second', author, allowLoss: true});
        expect(await git.log({fs: getFs(), dir: REPO_DIR})).toHaveLength(2);
    });

    test('a project that survives the round trip commits without asking', async () => {
        await commitProject({sb3Files: projectFiles(), message: 'First', author, allowLoss: false});
        await commitProject({sb3Files: projectFiles({x: 40}), message: 'Moved', author, allowLoss: false});
        expect(await git.log({fs: getFs(), dir: REPO_DIR})).toHaveLength(2);
    });

    test('the first version is checked too', async () => {
        const lossy = projectFiles({variables: {cloudy: ['☁ cloudy', 3, true]}});
        await expect(commitProject({sb3Files: lossy, message: 'First', author, allowLoss: false}))
            .rejects.toMatchObject({code: 'project_not_exact'});
    });
});

describe('.mwp files saved to the computer', () => {
    test('git objects that are already in the project folder are left out and rebuilt on open', async () => {
        await commitProject({sb3Files: projectFiles(), message: 'First', author});
        const full = await createMwp({sb3Files: projectFiles(), commitChanges: false});
        const compact = await createMwp({sb3Files: projectFiles(), commitChanges: false, compact: true});
        expect(compact.manifest.version).toBe(2);
        expect(compact.manifest.worktreeBlobs).toBe(true);
        expect(compact.blob.size).toBeLessThan(full.blob.size);

        const zip = await JSZip.loadAsync(await bytes(compact.blob));
        expect(zip.file('Cat/main.fractch')).toBeTruthy();
        expect(zip.file('Cat/assets/look.svg')).toBeTruthy();
        const {oid} = await git.hashBlob({object: new TextEncoder().encode(COSTUME)});
        expect(zip.file(`.git/objects/${oid.slice(0, 2)}/${oid.slice(2)}`)).toBeNull();

        const head = compact.manifest.head;
        await deleteRepo();
        await importMwp(await bytes(compact.blob));
        expect(await git.resolveRef({fs: getFs(), dir: REPO_DIR, ref: 'HEAD'})).toBe(head);
        const {blob} = await git.readBlob({fs: getFs(), dir: REPO_DIR, oid: head, filepath: 'Cat/assets/look.svg'});
        expect(new TextDecoder().decode(blob)).toBe(COSTUME);
        const project = await reopenedProject();
        expect(project.targets.map(item => item.name)).toEqual(['Stage', 'Cat']);
    });

    test('a zip of a project folder opens and starts its history with those files', async () => {
        await commitProject({sb3Files: projectFiles({x: 12}), message: 'First', author});
        const saved = await createMwp({sb3Files: projectFiles({x: 12}), commitChanges: false});
        const source = await JSZip.loadAsync(await bytes(saved.blob));
        const folder = new JSZip();
        for (const path of Object.keys(source.files)) {
            if (source.files[path].dir || path.startsWith('.git/') || path === 'mwp.json') continue;
            folder.file(path, await source.file(path).async('uint8array'));
        }
        const archive = await folder.generateAsync({type: 'arraybuffer'});
        expect(await isMwpArchive(archive)).toBe(true);

        await deleteRepo();
        const manifest = await importMwp(archive);
        expect(manifest.branch).toBe('main');
        const log = await git.log({fs: getFs(), dir: REPO_DIR});
        expect(log).toHaveLength(1);
        expect(log[0].commit.message.trim()).toBe('Open project files');
        const project = await reopenedProject();
        expect(project.targets.find(item => item.name === 'Cat').x).toBe(12);
    });

    test('a zip with neither project files nor history is not taken for an .mwp', async () => {
        const other = new JSZip();
        other.file('notes.txt', 'hello');
        expect(await isMwpArchive(await other.generateAsync({type: 'arraybuffer'}))).toBe(false);
    });
});

describe('writing the project folder', () => {
    const nodeFs = require('fs');
    const os = require('os');
    const path = require('path');
    // LightningFS removes a whole folder when asked to unlink it, unlike node.
    const lightningLike = () => new Proxy(nodeFs.promises, {
        get: (real, property) => {
            if (property !== 'unlink') return real[property];
            return async name => {
                const stat = await real.lstat(name);
                if (stat.isDirectory()) return real.rm(name, {recursive: true});
                return real.unlink(name);
            };
        }
    });
    const withCustomAssets = assets => {
        const files = projectFiles();
        const project = JSON.parse(files['project.json']);
        project.customAssets = [];
        for (const [name, text] of assets) {
            const id = crypto.createHash('md5').update(text)
                .digest('hex');
            project.customAssets.push({name, md5ext: `${id}.json`});
            files[`${id}.json`] = text;
        }
        files['project.json'] = JSON.stringify(project);
        return files;
    };

    test('a custom asset that turns from a file into a folder keeps its contents', async () => {
        const dir = nodeFs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-type-change-'));
        const fs = lightningLike();
        try {
            await writeProjectToFractchTree({sb3Files: withCustomAssets([['data', '{"a":1}']]), fs, dir});
            expect(nodeFs.statSync(path.join(dir, 'assets', 'data')).isFile()).toBe(true);
            const written = await writeProjectToFractchTree({
                sb3Files: withCustomAssets([['data/level.json', '{"b":2}']]), fs, dir, verify: true
            });
            expect(nodeFs.readFileSync(path.join(dir, 'assets', 'data', 'level.json'), 'utf8')).toBe('{"b":2}');
            expect(written.differences).toEqual([]);
        } finally {
            nodeFs.rmSync(dir, {recursive: true, force: true});
        }
    });

    test('the check reads back what was written, not what was meant to be written', async () => {
        const dir = nodeFs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-readback-'));
        const fs = new Proxy(nodeFs.promises, {
            get: (real, property) => {
                if (property !== 'writeFile') return real[property];
                return (name, ...args) => (name.endsWith('.json') && name.includes('/assets/') ?
                    Promise.resolve() : real.writeFile(name, ...args));
            }
        });
        try {
            const written = await writeProjectToFractchTree({
                sb3Files: withCustomAssets([['data.json', '{"a":1}']]), fs, dir, verify: true
            });
            expect(written.differences).toEqual(expect.arrayContaining([
                expect.objectContaining({path: 'customAssets'})
            ]));
        } finally {
            nodeFs.rmSync(dir, {recursive: true, force: true});
        }
    });
});
