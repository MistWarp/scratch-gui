jest.mock('../../../src/lib/rotur/client.js', () => ({
    ensureScopes: jest.fn(async () => true),
    getRotur: jest.fn(() => ({loggedIn: true}))
}));

const {createProjectRotur} = require('../../../src/lib/account/frame-project-rotur.js');
const {ensureScopes} = require('../../../src/lib/rotur/client.js');

beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});

const setup = answers => {
    const prompts = [];
    const queue = [...answers];
    const call = jest.fn(async method => `ran ${method}`);
    const host = createProjectRotur({
        prompt: jest.fn(async (type, data) => {
            prompts.push({type, data});
            return queue.shift();
        }),
        getUsername: () => 'mist',
        call
    });
    return {host, prompts, call};
};

const game = {name: 'Game', id: 'p1'};

test('view scopes are granted without a prompt and remembered per project', async () => {
    const {host, prompts} = setup([]);
    await expect(host.ensureConsent(game, ['account:view'])).resolves.toBe(true);
    expect(prompts).toEqual([]);
    expect(ensureScopes).toHaveBeenCalledWith(['account:view'], {prompt: true});
    await expect(host.call(game, 'me.get', [])).resolves.toBe('ran me.get');
    await expect(host.call({name: 'Other', id: 'p2'}, 'me.get', [])).rejects.toThrow('not granted');
});

test('other scopes ask inside the account frame, and a refusal grants nothing', async () => {
    const {host, prompts} = setup([false, true]);
    await expect(host.ensureConsent(game, ['blocked:manage'])).resolves.toBe(false);
    expect(prompts[0]).toMatchObject({type: 'consent', data: {scopes: ['blocked:manage'], username: 'mist', name: 'Game'}});
    await expect(host.call(game, 'me.block', ['someone'])).rejects.toThrow('not granted');
    await expect(host.ensureConsent(game, ['blocked:manage'])).resolves.toBe(true);
    await expect(host.call(game, 'me.block', ['someone'])).resolves.toBe('ran me.block');
});

test('account actions always ask to confirm, even with nothing else granted', async () => {
    const {host, prompts, call} = setup([false, true]);
    await expect(host.call(game, 'gifts.claim', ['CODE'])).rejects.toThrow('cancelled');
    expect(call).not.toHaveBeenCalled();
    await expect(host.call(game, 'gifts.claim', ['CODE'])).resolves.toBe('ran gifts.claim');
    expect(prompts.map(prompt => prompt.type)).toEqual(['confirm', 'confirm']);
    expect(prompts[0].data.label).toBe('claim gift code CODE');
});

test('blocking a project stops its prompts', async () => {
    const {host, prompts} = setup(['block']);
    await expect(host.ensureConsent(game, ['blocked:manage'])).resolves.toBe(false);
    await expect(host.ensureConsent(game, ['blocked:manage'])).resolves.toBe(false);
    expect(prompts).toHaveLength(1);
});

test('prompts are shown one at a time', async () => {
    let release;
    const order = [];
    const host = createProjectRotur({
        prompt: jest.fn(type => new Promise(resolve => {
            order.push(type);
            if (release) resolve(true);
            else release = resolve;
        })),
        getUsername: () => 'mist',
        call: async () => 'ok'
    });
    const first = host.ensureConsent({name: 'Queue', id: 'p9'}, ['blocked:manage']);
    const second = host.call({name: 'Other', id: 'p2'}, 'gifts.claim', ['A']);
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(order).toEqual(['consent']);
    release(true);
    await first;
    await second;
    expect(order).toEqual(['consent', 'confirm']);
});

test('signed out projects are refused', async () => {
    const host = createProjectRotur({prompt: jest.fn(), getUsername: () => '', call: jest.fn()});
    await expect(host.ensureConsent(game, ['account:view'])).rejects.toThrow('Log in');
    await expect(host.call(game, 'me.get', [])).rejects.toThrow('Log in');
});

test('a request whose deadline passed while queued is refused without a prompt', async () => {
    const {host, prompts} = setup([true]);
    await expect(host.ensureConsent({name: 'Late', id: 'p7'}, ['blocked:manage'], Date.now() - 1)).resolves.toBe(false);
    expect(prompts).toEqual([]);
});
