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

const {git, getFs, REPO_DIR, deleteRepo} = require('../../../src/lib/git/browser-git.js');
const {createMwp, importMwp, buildSb3FromCurrentRepo} = require('../../../src/lib/git/mwp.js');
const bytes = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
});
const projectFiles = value => ({
    'project.json': JSON.stringify({
        targets: [{
            isStage: true, name: 'Stage', variables: {score: ['score', value]}, lists: {}, broadcasts: {},
            blocks: {}, comments: {}, currentCostume: 0, costumes: [], sounds: [], volume: 100
        }],
        monitors: [], extensions: [], meta: {semver: '3.0.0', vm: '0.2.0', agent: 'test'}
    })
});
const source = (kind, value) => {
    const sb3Files = projectFiles(value);
    if (kind === 'sb3Files') return {sb3Files};
    return {vm: {saveProjectSb3: async () => {
        const zip = new JSZip();
        for (const [name, data] of Object.entries(sb3Files)) zip.file(name, data);
        return zip.generateAsync({type: 'arraybuffer'});
    }}};
};

beforeEach(() => deleteRepo());
afterAll(() => require('fs').rmSync(getFs().root, {recursive: true, force: true}));

test.each(['vm', 'sb3Files'])('repeated MWP saves preserve uncommitted %s edits when reopened', async kind => {
    const initial = await createMwp({...source(kind, 0), commitChanges: false});
    const head = initial.manifest.head;
    const fs = getFs();
    await git.branch({fs, dir: REPO_DIR, ref: 'other'});

    for (const value of [42, 99]) {
        const index = await fs.promises.readFile(`${REPO_DIR}/.git/index`);
        const saved = await createMwp({...source(kind, value), commitChanges: false});
        expect(saved.manifest.head).toBe(head);
        expect(saved.manifest.worktree).toBe(true);
        expect(await fs.promises.readFile(`${REPO_DIR}/.git/index`)).toEqual(index);

        // Open the file with no existing repository, as on another computer.
        await deleteRepo();
        await importMwp(await bytes(saved.blob));
        const zip = await JSZip.loadAsync(await bytes(await buildSb3FromCurrentRepo()));
        const project = JSON.parse(await zip.file('project.json').async('text'));
        expect(Object.values(project.targets[0].variables)).toContainEqual(['score', value]);
        expect(await git.resolveRef({fs, dir: REPO_DIR, ref: 'HEAD'})).toBe(head);
        expect(await git.resolveRef({fs, dir: REPO_DIR, ref: 'other'})).toBe(head);
        expect(await git.log({fs, dir: REPO_DIR})).toHaveLength(1);
        const status = await git.statusMatrix({fs, dir: REPO_DIR});
        expect(status.some(([, committed, worktree]) => committed !== worktree)).toBe(true);
    }
});

test('MWP files retain uncommitted scripts and costume bytes, and remove deleted sprites', async () => {
    const initial = await createMwp({sb3Files: projectFiles(0), commitChanges: false});
    for (const message of ['first edit', 'second edit', null]) {
        const files = projectFiles(0);
        const project = JSON.parse(files['project.json']);
        let costume;
        if (message) {
            costume = `<svg xmlns="http://www.w3.org/2000/svg"><text>${message}</text></svg>`;
            const assetId = require('crypto').createHash('md5').update(costume).digest('hex');
            project.targets.push({
                isStage: false, name: 'New sprite', variables: {}, lists: {}, broadcasts: {}, comments: {},
                currentCostume: 0, costumes: [{
                    assetId, md5ext: `${assetId}.svg`, dataFormat: 'svg', name: 'New costume',
                    rotationCenterX: 0, rotationCenterY: 0, bitmapResolution: 1
                }],
                sounds: [], volume: 100, visible: true, x: 10, y: 20, size: 100, direction: 90,
                draggable: false, rotationStyle: 'all around',
                blocks: {
                    start: {opcode: 'event_whenflagclicked', next: 'say', parent: null,
                        inputs: {}, fields: {}, shadow: false, topLevel: true, x: 0, y: 0},
                    say: {opcode: 'looks_say', next: null, parent: 'start',
                        inputs: {MESSAGE: [1, [10, message]]}, fields: {}, shadow: false, topLevel: false}
                }
            });
            files[`${assetId}.svg`] = costume;
        }
        files['project.json'] = JSON.stringify(project);
        const saved = await createMwp({sb3Files: files, commitChanges: false});
        await deleteRepo();
        await importMwp(await bytes(saved.blob));
        const zip = await JSZip.loadAsync(await bytes(await buildSb3FromCurrentRepo()));
        const reopened = JSON.parse(await zip.file('project.json').async('text'));
        expect(reopened.targets).toHaveLength(message ? 2 : 1);
        if (message) {
            const sprite = reopened.targets.find(target => target.name === 'New sprite');
            expect(Object.values(sprite.blocks)).toEqual(expect.arrayContaining([
                expect.objectContaining({opcode: 'event_whenflagclicked'}),
                expect.objectContaining({opcode: 'looks_say', inputs: {MESSAGE: [1, [10, message]]}})
            ]));
            expect(await zip.file(sprite.costumes[0].md5ext).async('text')).toBe(costume);
        } else {
            expect(Object.keys(zip.files).filter(path => path.endsWith('.svg'))).toHaveLength(0);
        }
        expect(saved.manifest.head).toBe(initial.manifest.head);
    }
});

test('browsing another project preserves uncommitted files and incomplete repositories', async () => {
    const {inspectMwpFiles} = require('../../../src/lib/git/mwp.js');
    const archive = await createMwp({sb3Files: projectFiles(0), commitChanges: false});
    const workspace = await bytes(archive.blob);
    const fs = getFs();
    const scratchFile = `${REPO_DIR}/unsaved.txt`;
    await fs.promises.writeFile(scratchFile, 'Uncommitted work');
    const head = await fs.promises.readFile(`${REPO_DIR}/.git/HEAD`);
    const index = await fs.promises.readFile(`${REPO_DIR}/.git/index`);
    await inspectMwpFiles({workspace});
    expect(String(await fs.promises.readFile(scratchFile))).toBe('Uncommitted work');
    expect(await fs.promises.readFile(`${REPO_DIR}/.git/HEAD`)).toEqual(head);
    expect(await fs.promises.readFile(`${REPO_DIR}/.git/index`)).toEqual(index);

    // A half-initialized repo cannot be exported as an MWP, but must still survive inspection.
    await deleteRepo();
    await fs.promises.mkdir(REPO_DIR);
    await fs.promises.writeFile(scratchFile, 'Work before the first commit');
    await inspectMwpFiles({workspace});
    expect(String(await fs.promises.readFile(scratchFile))).toBe('Work before the first commit');
    expect(await fs.promises.readdir(REPO_DIR)).toEqual(['unsaved.txt']);
});
