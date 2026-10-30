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

const sidecar = dir => JSON.parse(fs.readFileSync(path.join(dir, 'fractch.json'), 'utf8'));

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

    test('font entries can only point at font files inside fonts/', async () => {
        const dir = makeDir();
        await write(projectJson(), dir);
        fs.mkdirSync(path.join(dir, '.git'));
        fs.writeFileSync(path.join(dir, '.git', 'config'), '[user]\n');
        fs.writeFileSync(path.join(dir, 'Sprite_1', 'notes.ttf'), FONT);
        fs.writeFileSync(path.join(dir, 'mistwarp.json'), JSON.stringify({
            fonts: [
                {family: 'A', fallback: '', file: '../outside.ttf'},
                {family: 'B', fallback: '', file: '.git/config'},
                {family: 'C', fallback: '', file: 'Sprite_1/notes.ttf'},
                {family: 'D', fallback: '', file: 'fonts/../.git/config'},
                {family: 'E', fallback: '', file: 'fonts/.hidden.ttf'}
            ]
        }));
        const {project} = await rebuild(dir);
        expect(project.customFonts).toBeUndefined();
    });

    test('a font that is not a font format is not written into the tree', async () => {
        const fractchMd5ext = `${md5(FONT)}.fractch`;
        const dir = makeDir();
        await writeProjectToFractchTree({
            sb3Files: {
                ...filesFor(projectJson({
                    customFonts: [{system: false, family: 'Sneaky', fallback: '', md5ext: fractchMd5ext}]
                })),
                [fractchMd5ext]: FONT
            },
            fs: fs.promises,
            dir
        });
        expect(fs.existsSync(path.join(dir, 'fonts'))).toBe(false);
    });

    test('removing every font removes its files on the next write', async () => {
        const dir = makeDir();
        await write(projectJson({
            customFonts: [{system: false, family: 'Comic', fallback: '', md5ext: FONT_MD5EXT}]
        }), dir);
        expect(fs.existsSync(path.join(dir, 'fonts', 'Comic.ttf'))).toBe(true);
        await write(projectJson(), dir);
        expect(fs.existsSync(path.join(dir, 'fonts'))).toBe(false);
        expect(fs.existsSync(path.join(dir, 'fractch.json'))).toBe(false);
    });
});

describe('project data fractch has no syntax for', () => {
    test('a plain project writes no fractch.json', async () => {
        const {dir, project} = await roundTrip(projectJson());
        expect(fs.existsSync(path.join(dir, 'fractch.json'))).toBe(false);
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

    test('a tree saved before the rename still reads mistwarp.json', async () => {
        const dir = makeDir();
        await write(projectJson({targets: [stage(), sprite('Zed'), sprite('Alpha')]}), dir);
        fs.renameSync(path.join(dir, 'fractch.json'), path.join(dir, 'mistwarp.json'));
        const {project} = await rebuild(dir);
        expect(project.targets.map(target => target.name)).toEqual(['Stage', 'Zed', 'Alpha']);
        await write(projectJson({targets: [stage(), sprite('Zed'), sprite('Alpha')]}), dir);
        expect(fs.existsSync(path.join(dir, 'mistwarp.json'))).toBe(false);
        expect(fs.existsSync(path.join(dir, 'fractch.json'))).toBe(true);
    });

    test('sprites missing from the saved order keep their place after the ordered ones', async () => {
        const dir = makeDir();
        await write(projectJson({targets: [stage(), sprite('Zed'), sprite('Alpha')]}), dir);
        fs.writeFileSync(path.join(dir, 'fractch.json'), JSON.stringify({spriteOrder: ['Zed', 'Gone']}));
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
        expect(sidecar(dir).frames['Sprite 1'].shut.scripts).toEqual([
            {opcode: 'event_whenflagclicked', x: 10, y: 20, stack: expect.stringMatching(/^[0-9a-f]+:2$/)}
        ]);
        expect(Object.keys(sidecar(dir).frames)).toEqual(['_stage_', 'Sprite 1']);
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

    test('collapsed frames whose scripts sit at the same spot keep their own scripts', async () => {
        const blocks = {
            ...flagScript('a', 10, 10, 'first'),
            ...flagScript('b', 10, 10, 'second')
        };
        blocks.bsay.next = 'bwait';
        blocks.bwait = {
            opcode: 'control_wait',
            next: null,
            parent: 'bsay',
            inputs: {DURATION: [1, [5, '1']]},
            fields: {},
            shadow: false,
            topLevel: false
        };
        const {project} = await roundTrip(projectJson({
            targets: [stage(), sprite('Sprite 1', {
                blocks,
                frames: {
                    f2: {title: 'Second', x: 0, y: 0, width: 320, height: 200, collapsed: true, blocks: ['b']},
                    f1: {title: 'First', x: 0, y: 300, width: 320, height: 200, collapsed: true, blocks: ['a']}
                }
            })]
        }));
        const target = targetNamed(project, 'Sprite 1');
        const said = frameId => {
            const top = target.blocks[target.frames[frameId].blocks[0]];
            return target.blocks[top.next].inputs.MESSAGE[1][1];
        };
        expect(said('f1')).toBe('first');
        expect(said('f2')).toBe('second');
    });

    test('a sprite named __proto__ keeps its frames and extension storage', async () => {
        const {project} = await roundTrip(projectJson({
            targets: [stage(), sprite('__proto__', {
                frames: {f: {title: 'Odd', x: 0, y: 0, width: 320, height: 200, collapsed: false}},
                extensionStorage: {ext: {kept: true}}
            }), sprite('Other')]
        }));
        const target = targetNamed(project, '__proto__');
        expect(target.frames.f.title).toBe('Odd');
        expect(target.extensionStorage).toEqual({ext: {kept: true}});
    });

    test('the project origin survives', async () => {
        const {project} = await roundTrip(projectJson({meta: {origin: 'scratch.mit.edu'}}));
        expect(project.meta.origin).toBe('scratch.mit.edu');
    });
});

describe('free comments', () => {
    const note = (text, x, y) => ({blockId: null, x, y, width: 200, height: 200, minimized: false, text});

    test('free comment positions survive a write and rebuild', async () => {
        const {dir, project} = await roundTrip(projectJson({
            targets: [stage(), sprite('Sprite 1', {
                blocks: flagScript('hat', 10, 20, 'hi'),
                comments: {
                    first: note('Remember to fix the score', 340, 75),
                    twin: note('same text', 10, 500),
                    twinTwo: note('same text', 600, 500)
                }
            })]
        }));
        expect(sidecar(dir).comments['Sprite 1']).toHaveLength(3);
        const comments = Object.values(targetNamed(project, 'Sprite 1').comments)
            .filter(comment => !String(comment.text).startsWith('_fractch_map_'));
        const at = text => comments.filter(comment => comment.text === text).map(({x, y}) => [x, y]);
        expect(at('Remember to fix the score')).toEqual([[340, 75]]);
        expect(at('same text').sort((a, b) => a[0] - b[0])).toEqual([[10, 500], [600, 500]]);
    });

    test('attached comment positions survive too, and the file map is not stored', async () => {
        const blocks = flagScript('hat', 10, 20, 'hi');
        blocks.hat.comment = 'attached';
        const {dir, project} = await roundTrip(projectJson({
            targets: [stage(), sprite('Sprite 1', {
                blocks,
                comments: {attached: {...note('on the hat', 412, -37), blockId: 'hat'}}
            })]
        }));
        expect(sidecar(dir).comments['Sprite 1']).toEqual([{text: expect.any(String), on: expect.any(String), x: 412, y: -37}]);
        const restored = Object.values(targetNamed(project, 'Sprite 1').comments)
            .find(comment => comment.text === 'on the hat');
        expect([restored.x, restored.y]).toEqual([412, -37]);
        expect(restored.blockId).toBeTruthy();
    });

    test('comments with the same text go back to their own blocks', async () => {
        const blocks = {...flagScript('one', 10, 20, 'a'), ...flagScript('two', 10, 400, 'b')};
        blocks.onesay.comment = 'onA';
        blocks.twosay.comment = 'onB';
        const {dir, project} = await roundTrip(projectJson({
            targets: [stage(), sprite('Sprite 1', {
                blocks,
                comments: {
                    free: note('TODO', 700, 900),
                    onA: {...note('TODO', 300, 0), blockId: 'onesay'},
                    onB: {...note('TODO', 300, 400), blockId: 'twosay'}
                }
            })]
        }));
        const stored = sidecar(dir).comments['Sprite 1'];
        expect(stored.filter(entry => entry.on)).toHaveLength(2);
        const rebuilt = targetNamed(project, 'Sprite 1');
        const sayText = comment => rebuilt.blocks[rebuilt.blocks[comment.blockId].inputs.MESSAGE[1]] ||
            rebuilt.blocks[comment.blockId].inputs.MESSAGE[1][1];
        const placed = Object.values(rebuilt.comments).filter(comment => comment.text === 'TODO');
        const free = placed.find(comment => !comment.blockId);
        expect([free.x, free.y]).toEqual([700, 900]);
        const attached = placed.filter(comment => comment.blockId)
            .map(comment => [sayText(comment), comment.x, comment.y])
            .sort();
        expect(attached).toEqual([['a', 300, 0], ['b', 300, 400]]);
    });

    test('the stored layout does not depend on the order comments were created in', async () => {
        const make = order => {
            const comments = {};
            for (const [id, text, x] of order) comments[id] = note(text, x, 0);
            return projectJson({targets: [stage(), sprite('Sprite 1', {comments})]});
        };
        const first = await roundTrip(make([['p', 'alpha', 1], ['q', 'beta', 2]]));
        const second = await roundTrip(make([['q', 'beta', 2], ['p', 'alpha', 1]]));
        expect(sidecar(first.dir).comments).toEqual(sidecar(second.dir).comments);
    });

    test('copies of one script keep their own comment positions', async () => {
        const blocks = {...flagScript('copy', 10, 0, 'same'), ...flagScript('original', 10, 400, 'same')};
        blocks.copysay.comment = 'onCopy';
        blocks.originalsay.comment = 'onOriginal';
        const {project} = await roundTrip(projectJson({
            targets: [stage(), sprite('Sprite 1', {
                blocks,
                comments: {
                    onOriginal: {...note('TODO', 300, 420), blockId: 'originalsay'},
                    onCopy: {...note('TODO', 300, 20), blockId: 'copysay'}
                }
            })]
        }));
        const rebuilt = targetNamed(project, 'Sprite 1');
        const scriptY = comment => {
            let id = comment.blockId;
            while (rebuilt.blocks[id].parent) id = rebuilt.blocks[id].parent;
            return rebuilt.blocks[id].y;
        };
        const pairs = Object.values(rebuilt.comments).filter(comment => comment.text === 'TODO')
            .map(comment => [scriptY(comment), comment.y])
            .sort((a, b) => a[0] - b[0]);
        expect(pairs).toEqual([[0, 20], [400, 420]]);
    });

    test('an attached comment with no stored match is left for the editor to place', async () => {
        const blocks = flagScript('hat', 10, 20, 'hi');
        blocks.hatsay.comment = 'note';
        const dir = makeDir();
        await write(projectJson({
            targets: [stage(), sprite('Sprite 1', {
                blocks,
                comments: {note: {...note('first text', 300, 0), blockId: 'hatsay'}}
            })]
        }), dir);
        const full = fs.readdirSync(dir, {recursive: true}).map(name => path.join(dir, name))
            .find(name => name.endsWith('.fractch') && fs.readFileSync(name, 'utf8').includes('first text'));
        fs.writeFileSync(full, fs.readFileSync(full, 'utf8').replace('first text', 'edited text'));
        const {project} = await rebuild(dir);
        const edited = Object.values(targetNamed(project, 'Sprite 1').comments)
            .find(comment => comment.text === 'edited text');
        expect(edited.blockId).toBeTruthy();
        expect([edited.x, edited.y]).toEqual([null, null]);
    });

    test('same text on two blocks of one script keeps each position on its block', async () => {
        const blocks = flagScript('hat', 10, 20, 'first');
        blocks.hatsay.next = 'second';
        blocks.second = {...blocks.hatsay, parent: 'hatsay', next: null, inputs: {MESSAGE: [1, [10, 'second']]}};
        blocks.hatsay.comment = 'lower';
        blocks.second.comment = 'upper';
        const {project} = await roundTrip(projectJson({
            targets: [stage(), sprite('Sprite 1', {
                blocks,
                comments: {
                    upper: {...note('same', 300, 300), blockId: 'second'},
                    lower: {...note('same', 300, 100), blockId: 'hatsay'}
                }
            })]
        }));
        const rebuilt = targetNamed(project, 'Sprite 1');
        const said = comment => rebuilt.blocks[comment.blockId].inputs.MESSAGE[1][1];
        const pairs = Object.values(rebuilt.comments).filter(comment => comment.text === 'same')
            .map(comment => [said(comment), comment.y])
            .sort();
        expect(pairs).toEqual([['first', 100], ['second', 300]]);
    });

    test('a commented block whose parent is missing does not stop the save', async () => {
        const blocks = flagScript('hat', 10, 20, 'hi');
        blocks.hatsay.parent = 'gone';
        blocks.hatsay.topLevel = false;
        blocks.hatsay.comment = 'orphan';
        const dir = makeDir();
        await expect(write(projectJson({
            targets: [stage(), sprite('Sprite 1', {
                blocks,
                comments: {orphan: {...note('orphaned note', 50, 60), blockId: 'hatsay'}}
            })]
        }), dir)).resolves.not.toThrow();
    });
});
