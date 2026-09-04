import projectData from './default-project/project-data';

// These use the editor's bundled costumes, so starting never needs an asset server.
export const STARTERS = [
    {
        id: 'clicker',
        title: 'Cloud clicker',
        kind: 'Clicker game',
        description: 'Click the cloud to grow your score.',
        task: 'Change the score increase from 1 to 5, then click the cloud.',
        control: 'Click the cloud',
        accent: 'purple'
    },
    {
        id: 'explorer',
        title: 'Cloud explorer',
        kind: 'Keyboard game',
        description: 'Move your cloud around with the arrow keys.',
        task: 'Change the movement steps from 10 to 20. Try the arrow keys again.',
        control: 'Use the arrow keys',
        accent: 'blue'
    },
    {
        id: 'animation',
        title: 'Cloud dance',
        kind: 'Animation',
        description: 'Make a cloud move and bounce around the stage.',
        task: 'Change the move block from 4 to 8 to make the cloud dance faster.',
        control: 'Press the green flag',
        accent: 'pink'
    }
];

export const getStarter = id => STARTERS.find(starter => starter.id === id);

const number = value => [1, [4, String(value)]];
const text = value => [1, [10, value]];

export const createStarterProject = (id, translator) => {
    const starter = getStarter(id);
    if (!starter) throw new Error('Unknown starter project');
    const project = projectData(translator);
    const stage = project.targets[0];
    const sprite = project.targets[1];
    stage.variables = {};
    sprite.name = 'Cloud';
    sprite.size = 65;
    const blocks = sprite.blocks;
    const block = (key, opcode, parent, next, inputs = {}, fields = {}) => {
        blocks[key] = {opcode, next, parent, inputs, fields, shadow: false, topLevel: !parent};
        if (!parent) Object.assign(blocks[key], {x: 48, y: 48});
    };
    if (id === 'clicker') {
        stage.variables.score = ['Score', 0];
        project.monitors = [{
            id: 'score',
            mode: 'default',
            opcode: 'data_variable',
            params: {VARIABLE: 'Score'},
            spriteName: null,
            value: 0,
            width: 0,
            height: 0,
            x: 10,
            y: 10,
            visible: true,
            sliderMin: 0,
            sliderMax: 100,
            isDiscrete: true
        }];
        block('flag', 'event_whenflagclicked', null, 'reset');
        block('reset', 'data_setvariableto', 'flag', 'hello', {VALUE: text('0')}, {VARIABLE: ['Score', 'score']});
        block('hello', 'looks_say', 'reset', null, {MESSAGE: text('Click me!')});
        block('click', 'event_whenthisspriteclicked', null, 'score');
        blocks.click.y = 250;
        block('score', 'data_changevariableby', 'click', 'color', {VALUE: number(1)}, {VARIABLE: ['Score', 'score']});
        block('color', 'looks_changeeffectby', 'score', null, {CHANGE: number(25)}, {EFFECT: ['COLOR', null]});
    } else if (id === 'explorer') {
        block('flag', 'event_whenflagclicked', null, 'origin');
        block('origin', 'motion_gotoxy', 'flag', null, {X: number(0), Y: number(0)});
        [['right arrow', 'motion_changexby', 'DX', 10], ['left arrow', 'motion_changexby', 'DX', -10],
            ['up arrow', 'motion_changeyby', 'DY', 10], ['down arrow', 'motion_changeyby', 'DY', -10]]
            .forEach(([key, opcode, input, value], index) => {
                const hat = `key${index}`;
                const move = `move${index}`;
                block(hat, 'event_whenkeypressed', null, move, {}, {KEY_OPTION: [key, null]});
                blocks[hat].x = index % 2 === 0 ? 48 : 340;
                blocks[hat].y = 220 + (Math.floor(index / 2) * 180);
                block(move, opcode, hat, null, {[input]: number(value)});
            });
    } else {
        block('flag', 'event_whenflagclicked', null, 'direction');
        block('direction', 'motion_pointindirection', 'flag', 'loop', {DIRECTION: number(45)});
        block('loop', 'control_forever', 'direction', null, {SUBSTACK: [2, 'move']});
        block('move', 'motion_movesteps', 'loop', 'bounce', {STEPS: number(4)});
        block('bounce', 'motion_ifonedgebounce', 'move', 'color');
        block('color', 'looks_changeeffectby', 'bounce', null, {CHANGE: number(2)}, {EFFECT: ['COLOR', null]});
    }
    sprite.comments = {
        starter: {blockId: null,
            x: 650,
            y: 48,
            width: 270,
            height: 160,
            minimized: false,
            text: `${starter.title}\n\n${starter.control}.\n\nTry this: ${starter.task}\n\n` +
                'Save your version when you are ready.'}
    };
    return project;
};
