import blockSwitching from '../../../src/addons/addons/block-switching/userscript';

const extensionInfo = {
    id: 'speed',
    blocks: [
        {info: {opcode: 'setSpeed', text: 'set speed to [VALUE]', switches: ['changeSpeed', {
            id: 'motion_movesteps',
            rawId: true,
            text: 'move _ steps',
            inputs: [['VALUE', 'STEPS']]
        }]}},
        {info: {opcode: 'changeSpeed', text: ['change speed by [VALUE]'], switches: [{
            id: 'setSpeed',
            inputs: [['VALUE', 'VALUE']]
        }, {id: 'setSpeedFor', splitInputs: ['SECS']}, {id: 'missing'}]}},
        {info: {opcode: 'setSpeedFor', text: {default: 'set speed to [VALUE] for [SECS] secs'}}},
        {info: {opcode: 'speed', text: 'speed'}}
    ]
};

const loadAddon = async ({noop = true} = {}) => {
    let contextMenu = null;
    await blockSwitching({
        addon: {
            self: {disabled: false},
            settings: {
                get: key => key === 'noop',
                addEventListener: () => {}
            },
            tab: {
                traps: {
                    getBlockly: () => Promise.resolve({Msg: {}}),
                    vm: {runtime: {_blockInfo: [extensionInfo]}}
                },
                createBlockContextMenu: callback => {
                    contextMenu = callback;
                }
            }
        },
        console,
        msg: key => key
    });
    return (type, items = []) => contextMenu(items, {type, isShadow: () => false});
};

test('extension blocks list the switches they declare', async () => {
    const menu = await loadAddon();
    const items = menu('speed_setSpeed');

    expect(items.map(item => item.text)).toEqual(['set speed to _', 'change speed by _', 'move _ steps']);
    expect(items[0].separator).toBe(true);
});

test('string entries, rawId, input remaps, and split inputs are honoured', async () => {
    const menu = await loadAddon();
    const items = menu('speed_changeSpeed');

    expect(items.map(item => item.text)).toEqual([
        'change speed by _',
        'set speed to _',
        'set speed to _ for _ secs'
    ]);
});

test('blocks without switches get no extra items', async () => {
    const menu = await loadAddon();
    expect(menu('speed_speed')).toEqual([]);
    expect(menu('other_block')).toEqual([]);
});

test('a switch to an unknown block in the same extension is skipped', async () => {
    const menu = await loadAddon();
    expect(menu('speed_changeSpeed').some(item => /missing/.test(item.text))).toBe(false);
});
