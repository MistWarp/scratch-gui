import {MistWarpGameHost} from '../../../src/containers/mistwarp-game-host.jsx';

describe('MistWarp game host', () => {
    afterEach(() => {
        sessionStorage.removeItem('mw:mistwarp-current-project');
    });

    test('keeps save blocks usable before the project is saved', async () => {
        const host = new MistWarpGameHost({
            projectId: 0,
            userId: '',
            username: '',
            vm: {runtime: {}}
        });

        await expect(host.call('data.load', [])).resolves.toEqual({revision: 0, value: {}});
        await expect(host.call('data.save', [{value: {level: 3}}])).resolves.toEqual({
            revision: 1,
            value: {level: 3}
        });
        await expect(host.call('data.load', [])).resolves.toEqual({revision: 1, value: {level: 3}});
        await expect(host.call('marketplace.open', [])).resolves.toEqual({status: 'save project first'});
        await expect(host.call('multiplayer.connect', ['main'])).resolves.toMatchObject({connected: false});
    });

    test('keeps multiplayer disabled for saved projects', async () => {
        sessionStorage.setItem('mw:mistwarp-current-project', JSON.stringify({id: 'platform-project'}));
        const host = new MistWarpGameHost({
            projectId: 0,
            userId: 'user-id',
            username: 'player',
            vm: {runtime: {}}
        });
        await expect(host.call('multiplayer.connect', ['room'])).resolves.toEqual({
            connected: false,
            self: '',
            players: [],
            status: 'multiplayer disabled'
        });
        await expect(host.call('multiplayer.setState', [{x: 10}])).resolves.toBe(false);
    });
});
