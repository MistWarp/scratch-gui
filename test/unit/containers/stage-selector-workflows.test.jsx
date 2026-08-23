import {StageSelector} from '../../../src/containers/stage-selector.jsx';

describe('stage selector backdrop workflows', () => {
    test('returns the backdrop-add promise so Surprise can handle failures', async () => {
        const selector = Object.create(StageSelector.prototype);
        const failure = new Error('backdrop failed');
        selector.handleNewBackdrop = jest.fn(() => Promise.reject(failure));

        await expect(selector.addBackdropFromLibraryItem({
            name: 'Backdrop',
            md5ext: 'backdrop.svg'
        })).rejects.toBe(failure);
    });

    test('ignores touch events before its tile ref is ready', () => {
        const selector = Object.create(StageSelector.prototype);
        selector.ref = null;

        expect(() => selector.handleTouchEnd({changedTouches: []})).not.toThrow();
    });
});
