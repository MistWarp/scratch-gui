import createMemoryTab from '../../../src/components/tw-debugger/tabs/memory.js';
import createPerformanceTab from '../../../src/components/tw-debugger/tabs/performance.js';

jest.mock('../../../src/addons/libraries/thirdparty/cs/chart.min.js', () => jest.fn(() => ({
    data: {datasets: [{data: []}]},
    options: {scales: {y: {}}},
    update: jest.fn(),
    destroy: jest.fn()
})));
jest.mock('../../../src/lib/debugger/settings.js', () => ({getSetting: () => false}));

const makeController = () => {
    const removers = [];
    const track = () => {
        const remove = jest.fn();
        removers.push(remove);
        return remove;
    };
    return {
        removers,
        vm: {runtime: {targets: [], _cloneCounter: 0, frameLoop: {framerate: 30}}},
        engine: {isPaused: () => false, onPauseChanged: jest.fn(track)},
        addAfterStepCallback: jest.fn(track)
    };
};

describe('debugger tabs', () => {
    beforeAll(() => {
        jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
    });

    test.each([
        ['memory', createMemoryTab],
        ['performance', createPerformanceTab]
    ])('the %s tab stops listening to the runtime when it is destroyed', (name, createTab) => {
        const controller = makeController();
        const tab = createTab(controller);
        expect(tab.id).toBe(name);
        expect(controller.addAfterStepCallback).toHaveBeenCalledTimes(1);
        expect(controller.engine.onPauseChanged).toHaveBeenCalledTimes(1);
        expect(controller.removers.every(remove => remove.mock.calls.length === 0)).toBe(true);

        tab.destroy();

        expect(controller.removers).toHaveLength(2);
        for (const remove of controller.removers) expect(remove).toHaveBeenCalledTimes(1);
    });
});
