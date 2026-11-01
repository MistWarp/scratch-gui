import {afterEach, describe, expect, jest, test} from '@jest/globals';

jest.mock('../../../src/lib/rotur/availability.js', () => ({hasRotur: () => true}));

import api from '../../../src/community/api';
import {MistWarpGameHost} from '../../../src/containers/mistwarp-game-host.jsx';

describe('configuring game products from a project', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('keeps the other products, including their icons, when one product changes', async () => {
        jest.spyOn(api, 'gameProducts').mockResolvedValue({products: [
            {id: 'vip', name: 'VIP', description: 'Shiny', price: 50, icon: 'https://example.com/vip.png', grantsItem: 'p1:crown'},
            {id: 'coins', name: 'Coins', description: '', price: 5, icon: '', grantsItem: ''},
            {id: 'old', name: 'Old', description: '', price: 1, icon: 'data:image/png;base64,AAAA', grantsItem: ''}
        ]});
        const update = jest.spyOn(api, 'updateProject').mockResolvedValue({ok: true});
        const host = new MistWarpGameHost({projectId: 'p1', userId: 'u', username: 'creator', vm: {runtime: {}}});

        await expect(host.call('marketplace.configure', [{id: 'old', name: 'Renamed', price: 2}])).resolves.toBe(true);

        expect(update).toHaveBeenCalledWith('p1', {gameProducts: [
            {id: 'vip', name: 'VIP', description: 'Shiny', price: 50, icon: 'https://example.com/vip.png', grantsItem: 'crown'},
            {id: 'coins', name: 'Coins', description: '', price: 5, icon: '', grantsItem: ''},
            {id: 'old', name: 'Renamed', price: 2}
        ]});
    });
});
