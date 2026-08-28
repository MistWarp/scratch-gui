import React, {useState} from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import GameMarketplaceModal from '../../src/community/components/GameMarketplaceModal.jsx';
import api from '../../src/community/api.js';
import {buyGameProduct} from '../../src/community/purchase.js';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {gameProducts: jest.fn()}
}));
jest.mock('../../src/community/purchase.js', () => ({
    buyGameProduct: jest.fn()
}));

const loadModal = async (product, onResult = jest.fn()) => {
    api.gameProducts.mockResolvedValue({products: [product]});
    let wrapper;
    await act(async () => {
        wrapper = mount(<GameMarketplaceModal projectId="project-1" onResult={onResult} />);
        await Promise.resolve();
    });
    wrapper.update();
    return wrapper;
};

describe('game marketplace purchases', () => {
    beforeEach(() => jest.clearAllMocks());

    test('locks rapid paid purchase attempts', async () => {
        let finishPurchase;
        buyGameProduct.mockReturnValue(new Promise(resolve => {
            finishPurchase = resolve;
        }));
        const onResult = jest.fn();
        const wrapper = await loadModal({id: 'coins', name: 'Coins', price: 5}, onResult);
        const purchase = wrapper.find('Button').prop('onClick');

        let first;
        act(() => {
            first = purchase();
            purchase();
        });
        expect(buyGameProduct).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishPurchase({id: 'coins', owned: true});
            await first;
        });
        expect(onResult).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('returns an owned product without starting a purchase', async () => {
        const product = {id: 'owned', name: 'Owned item', price: 5, owned: true};
        const onResult = jest.fn();
        const wrapper = await loadModal(product, onResult);

        await wrapper.find('Button').prop('onClick')();

        expect(buyGameProduct).not.toHaveBeenCalled();
        expect(onResult).toHaveBeenCalledWith({status: 'owned', product});
        wrapper.unmount();
    });

    test('clears stale products while a different project loads', async () => {
        let finishSecondLoad;
        api.gameProducts
            .mockResolvedValueOnce({products: [{id: 'old', name: 'Old item', price: 1}]})
            .mockReturnValueOnce(new Promise(resolve => {
                finishSecondLoad = resolve;
            }));
        let wrapper;
        await act(async () => {
            wrapper = mount(<GameMarketplaceModal projectId="project-1" onResult={jest.fn()} />);
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.text()).toContain('Old item');

        wrapper.setProps({projectId: 'project-2'});
        expect(wrapper.text()).toContain('Loading shop…');
        expect(wrapper.text()).not.toContain('Old item');

        await act(async () => {
            finishSecondLoad({products: [{id: 'new', name: 'New item', price: 2}]});
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.text()).toContain('New item');
        wrapper.unmount();
    });

    test('does not update state after a purchase result closes the modal', async () => {
        let finishPurchase;
        buyGameProduct.mockReturnValue(new Promise(resolve => {
            finishPurchase = resolve;
        }));
        api.gameProducts.mockResolvedValue({products: [{id: 'coins', name: 'Coins', price: 5}]});
        const Host = () => {
            const [open, setOpen] = useState(true);
            return open ? (
                <GameMarketplaceModal projectId="project-1" onResult={() => setOpen(false)} />
            ) : <span>Closed</span>;
        };
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});
        let wrapper;
        await act(async () => {
            wrapper = mount(<Host />);
            await Promise.resolve();
        });
        wrapper.update();

        let purchase;
        act(() => {
            purchase = wrapper.find('Button').prop('onClick')();
        });
        await act(async () => {
            finishPurchase({id: 'coins', owned: true});
            await purchase;
        });
        wrapper.update();

        expect(wrapper.text()).toBe('Closed');
        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
        wrapper.unmount();
    });
});
