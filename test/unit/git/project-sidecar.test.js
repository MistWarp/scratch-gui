const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const JSZip = require('@turbowarp/jszip');

jest.mock('../../../src/lib/persistence/storage', () => ({
    AssetType: {Font: {name: 'Font'}, CustomAsset: {name: 'CustomAsset'}},
    createAsset: (type, dataFormat, data) => ({
        assetId: require('crypto').createHash('md5')
            .update(Buffer.from(data))
            .digest('hex'),
        dataFormat
    })
}));

const {writeProjectToFractchTree, buildSb3FromFractchTree} = require('../../../src/lib/git/fractch-tree.js');

const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>');
const FONT = new Uint8Array([0, 1, 0, 0, 0, 4, 0, 128, 0, 3, 0, 64]);
const md5 = data => crypto.createHash('md5').update(Buffer.from(data))
    .digest('hex');
const FONT_MD5EXT = `${md5(FONT)}.ttf`;
const SVG_MD5 = md5(SVG);

const costume = name => ({
    name,
    bitmapResolution: 1,
    dataFormat: 'svg',
    assetId: SVG_MD5,
    md5ext: `${SVG_MD5}.svg`,
    rotationCenterX: 1,
    rotationCenterY: 1
});

const flagScript = (hat, x, y, message) => ({
    [hat]: {
        opcode: 'event_whenflagclicked',
        next: `${hat}say`,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x,
        y
    },
    [`${hat}say`]: {
        opcode: 'looks_say',
        next: null,
        parent: hat,
        inputs: {MESSAGE: [1, [10, message]]},
        fields: {},
        shadow: false,
        topLevel: false
    }
});

const sprite = (name, fields = {}) => ({
    isStage: false,
    name,
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {},
    comments: {},
    currentCostume: 0,
    costumes: [costume('cat')],
    sounds: [],
    volume: 100,
    layerOrder: 1,
    visible: true,
    x: 0,
    y: 0,
    size: 100,
    direction: 90,
    draggable: false,
    rotationStyle: 'all around',
    ...fields
});

const stage = (fields = {}) => ({
    isStage: true,
    name: 'Stage',
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {},
    comments: {},
    currentCostume: 0,
    costumes: [costume('backdrop')],
    sounds: [],
    volume: 100,
    layerOrder: 0,
    tempo: 60,
    videoTransparency: 50,
    videoState: 'on',
    textToSpeechLanguage: null,
    ...fields
});

const projectJson = ({targets = [stage(), sprite('Sprite 1')], meta = {}, ...rest} = {}) => ({
    targets,
    monitors: [],
    extensions: [],
    meta: {semver: '3.0.0', vm: '0.2.0', agent: '', ...meta},
    ...rest
});

const filesFor = json => ({
    'project.json': new TextEncoder().encode(JSON.stringify(json)),
    [`${SVG_MD5}.svg`]: SVG,
    [FONT_MD5EXT]: FONT
});

const roots = [];
const makeDir = () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-project-sidecar-'));
    roots.push(root);
    return root;
};
afterAll(() => {
    for (const root of roots) fs.rmSync(root, {recursive: true, force: true});
});

const write = (json, dir) => writeProjectToFractchTree({sb3Files: filesFor(json), fs: fs.promises, dir});

const rebuild = async dir => {
    const zip = await JSZip.loadAsync(await buildSb3FromFractchTree({fs: fs.promises, dir}));
    return {zip, project: JSON.parse(await zip.file('project.json').async('string'))};
};

const roundTrip = async json => {
    const dir = makeDir();
    await write(json, dir);
    return {dir, ...await rebuild(dir)};
};

const sidecar = dir => JSON.parse(fs.readFileSync(path.join(dir, 'mistwarp.json'), 'utf8'));

const targetNamed = (project, name) => project.targets.find(target => target.name === name);

describe('fonts', () => {
    test('custom and system fonts survive a write and rebuild', async () => {
        const {dir, zip, project} = await roundTrip(projectJson({
            customFonts: [
                {system: false, family: 'Comic Neue', fallback: 'sans-serif', md5ext: FONT_MD5EXT},
                {system: true, family: 'Arial', fallback: 'serif'}
            ]
        }));
        expect(fs.readFileSync(path.join(dir, 'fonts', 'Comic_Neue.ttf'))).toEqual(Buffer.from(FONT));
        expect(sidecar(dir).fonts).toEqual([
            {family: 'Comic Neue', fallback: 'sans-serif', file: 'fonts/Comic_Neue.ttf'},
            {family: 'Arial', fallback: 'serif', system: true}
        ]);
        expect(project.customFonts).toEqual([
            {system: false, family: 'Comic Neue', fallback: 'sans-serif', md5ext: FONT_MD5EXT},
            {system: true, family: 'Arial', fallback: 'serif'}
        ]);
        expect(await zip.file(FONT_MD5EXT).async('uint8array')).toEqual(FONT);
    });

    test('fonts whose names sanitize the same get separate files', async () => {
        const {dir, project} = await roundTrip(projectJson({
            customFonts: [
                {system: false, family: 'A/B', fallback: '', md5ext: FONT_MD5EXT},
                {system: false, family: 'A?B', fallback: '', md5ext: FONT_MD5EXT}
            ]
        }));
        expect(fs.readdirSync(path.join(dir, 'fonts')).sort()).toEqual(['A_B.ttf', 'A_B_2.ttf']);
        expect(project.customFonts.map(font => font.family)).toEqual(['A/B', 'A?B']);
    });

    test('a font file outside the project folder is ignored', async () => {
        const dir = makeDir();
        await write(projectJson(), dir);
        fs.writeFileSync(path.join(dir, 'mistwarp.json'), JSON.stringify({
            fonts: [{family: 'Evil', fallback: '', file: '../outside.ttf'}]
        }));
        const {project} = await rebuild(dir);
        expect(project.customFonts).toBeUndefined();
    });

    test('removing every font removes its files on the next write', async () => {
        const dir = makeDir();
        await write(projectJson({
            customFonts: [{system: false, family: 'Comic', fallback: '', md5ext: FONT_MD5EXT}]
        }), dir);
        expect(fs.existsSync(path.join(dir, 'fonts', 'Comic.ttf'))).toBe(true);
        await write(projectJson(), dir);
        expect(fs.existsSync(path.join(dir, 'fonts'))).toBe(false);
        expect(fs.existsSync(path.join(dir, 'mistwarp.json'))).toBe(false);
    });
});

describe('project data fractch has no syntax for', () => {
    test('a plain project writes no mistwarp.json', async () => {
        const {dir, project} = await roundTrip(projectJson());
        expect(fs.existsSync(path.join(dir, 'mistwarp.json'))).toBe(false);
        expect(project.customFonts).toBeUndefined();
        expect(project.extensionStorage).toBeUndefined();
    });

    test('project and sprite extension storage survive a write and rebuild', async () => {
        const {project} = await roundTrip(projectJson({
            targets: [
                stage({extensionStorage: {stageExt: {mode: 'stage'}}}),
                sprite('Sprite 1', {extensionStorage: {spriteExt: {count: 3}}})
            ],
            extensionStorage: {projectExt: {theme: 'dark'}}
        }));
        expect(project.extensionStorage).toEqual({projectExt: {theme: 'dark'}});
        expect(targetNamed(project, 'Stage').extensionStorage).toEqual({stageExt: {mode: 'stage'}});
        expect(targetNamed(project, 'Sprite 1').extensionStorage).toEqual({spriteExt: {count: 3}});
    });

    test('sprite order survives instead of coming back alphabetical', async () => {
        const {project} = await roundTrip(projectJson({
            targets: [stage(), sprite('Zed'), sprite('Alpha'), sprite('Mid')]
        }));
        expect(project.targets.map(target => target.name)).toEqual(['Stage', 'Zed', 'Alpha', 'Mid']);
    });

    test('sprites missing from the saved order keep their place after the ordered ones', async () => {
        const dir = makeDir();
        await write(projectJson({targets: [stage(), sprite('Zed'), sprite('Alpha')]}), dir);
        fs.writeFileSync(path.join(dir, 'mistwarp.json'), JSON.stringify({spriteOrder: ['Zed', 'Gone']}));
        const {project} = await rebuild(dir);
        expect(project.targets.map(target => target.name)).toEqual(['Stage', 'Zed', 'Alpha']);
    });

    test('frames survive, and a collapsed frame finds its scripts again after block ids change', async () => {
        const {dir, project} = await roundTrip(projectJson({
            targets: [
                stage({frames: {stageFrame: {title: 'Stage', x: 5, y: 5, width: 120, height: 80, collapsed: false}}}),
                sprite('Sprite 1', {
                    blocks: {...flagScript('inside', 10, 20, 'in'), ...flagScript('outside', 600, 20, 'out')},
                    frames: {
                        open: {title: 'Open', x: 400, y: 0, width: 320, height: 200, collapsed: false},
                        shut: {title: 'Shut', x: 0, y: 0, width: 320, height: 200, collapsed: true, blocks: ['inside']}
                    }
                })
            ]
        }));
        expect(sidecar(dir).frames['Sprite 1'].shut.scripts).toEqual([{opcode: 'event_whenflagclicked', x: 10, y: 20}]);
        expect(targetNamed(project, 'Stage').frames).toEqual({
            stageFrame: {title: 'Stage', x: 5, y: 5, width: 120, height: 80, collapsed: false}
        });
        const {frames, blocks} = targetNamed(project, 'Sprite 1');
        expect(frames.open).toEqual({title: 'Open', x: 400, y: 0, width: 320, height: 200, collapsed: false});
        expect(frames.shut.collapsed).toBe(true);
        expect(frames.shut.blocks).toHaveLength(1);
        const member = blocks[frames.shut.blocks[0]];
        expect(member).toMatchObject({opcode: 'event_whenflagclicked', topLevel: true, x: 10, y: 20});
        expect(blocks[member.next].inputs.MESSAGE[1][1]).toBe('in');
    });

    test('the project origin survives', async () => {
        const {project} = await roundTrip(projectJson({meta: {origin: 'scratch.mit.edu'}}));
        expect(project.meta.origin).toBe('scratch.mit.edu');
    });
});
