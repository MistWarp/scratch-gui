import React from 'react';
import {mount} from 'enzyme';
import {MistWarpGameHost} from '../../../src/containers/mistwarp-game-host.jsx';
import {
    blockProjectPrompts,
    BLOCKED_PROJECT_PROMPTS_KEY
} from '../../../src/lib/project-prompt-blocking.js';

describe('MistWarp game host', () => {
    afterEach(() => {
        sessionStorage.removeItem('mw:mistwarp-current-project');
        localStorage.removeItem(BLOCKED_PROJECT_PROMPTS_KEY);
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
        await expect(host.call('multiplayer.connect', ['main'])).resolves.toMatchObject({connected: false});
    });

    test('opens the shop modal for unsaved projects so creators can test purchases', async () => {
        const vm = {
            runtime: {},
            ownsProduct: jest.fn(() => false),
            grantProduct: jest.fn()
        };
        const wrapper = mount(
            <MistWarpGameHost
                projectId={0}
                userId=""
                username="tester"
                vm={vm}
            />
        );
        const host = wrapper.instance();
        const pending = host.call('marketplace.purchase', ['vip_pass']);
        wrapper.update();
        expect(wrapper.state('marketplace')).toMatchObject({
            projectId: 'draft',
            productId: 'vip_pass',
            isDraft: true
        });
        host.handleMarketplaceResult({status: 'purchased', product: {id: 'vip_pass'}});
        await expect(pending).resolves.toEqual({status: 'purchased', product: {id: 'vip_pass'}});
        expect(vm.grantProduct).toHaveBeenCalledWith('vip_pass', 'tester');
        expect(wrapper.state('marketplace')).toBe(null);
        wrapper.unmount();
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

    test('does not open the marketplace for a blocked project', async () => {
        blockProjectPrompts({id: 'blocked-project'});
        const host = new MistWarpGameHost({
            projectId: 'blocked-project',
            userId: 'user-id',
            username: 'player',
            vm: {runtime: {}}
        });

        await expect(host.call('marketplace.open', [])).resolves.toEqual({status: 'blocked'});
        expect(host.state.marketplace).toBe(null);
    });
});
