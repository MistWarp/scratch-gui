import VM from 'scratch-vm';

const costume = name => ({
    name,
    assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
    md5ext: 'cd21514d0531fdffb22204e0ec5ed84a.svg',
    dataFormat: 'svg',
    rotationCenterX: 0,
    rotationCenterY: 0
});

const block = (opcode, extra) => ({
    opcode,
    next: null,
    parent: null,
    inputs: {},
    fields: {},
    shadow: false,
    topLevel: false,
    ...extra
});

const spriteBlocks = () => ({
    hat: block('event_whenflagclicked', {next: 'say', topLevel: true, x: 10, y: 20}),
    say: block('looks_say', {parent: 'hat', inputs: {MESSAGE: [1, [10, 'hi']]}}),
    key: block('event_whenkeypressed', {next: 'move',
        topLevel: true,
        x: 300,
        y: 40,
        fields: {KEY_OPTION: ['space', null]}}),
    move: block('motion_movesteps', {parent: 'key', inputs: {STEPS: [1, [4, '10']]}})
});

const projectJson = (overrides = {}) => ({
    targets: [
        {
            isStage: true,
            name: 'Stage',
            variables: {v1: ['score', 3]},
            lists: {},
            broadcasts: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [costume('backdrop1')],
            sounds: [],
            volume: 100,
            layerOrder: 0
        },
        {
            isStage: false,
            name: 'Sprite1',
            variables: {v2: ['lives', 5]},
            lists: {},
            broadcasts: {},
            blocks: overrides.spriteBlocks || spriteBlocks(),
            comments: {},
            currentCostume: 0,
            costumes: [costume('costume1')],
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
        },
        {
            isStage: false,
            name: 'Sprite2',
            variables: {},
            lists: {},
            broadcasts: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [costume('costume1')],
            sounds: [],
            volume: 100,
            layerOrder: 2,
            visible: true,
            x: 0,
            y: 0,
            size: 100,
            direction: 90,
            draggable: false,
            rotationStyle: 'all around'
        }
    ],
    monitors: [],
    extensions: [],
    meta: {semver: '3.0.0'}
});

const loadVm = async overrides => {
    const vm = new VM();
    vm.runtime.storage = null;
    await vm.loadProject(projectJson(overrides));
    const sprite = vm.runtime.targets.find(target => target.getName && target.getName() === 'Sprite1');
    vm.setEditingTarget(sprite.id);
    return {vm, sprite, stage: vm.runtime.getTargetForStage()};
};

export {block, loadVm, projectJson, spriteBlocks};
