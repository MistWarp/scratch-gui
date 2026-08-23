import listenForStagePanelDrag from '../../../src/lib/utils/stage-panel-drag';

describe('stage resize gesture listeners', () => {
    test('pointer up finishes once and removes pointer and mouse listeners', () => {
        const onMove = jest.fn();
        const onFinish = jest.fn();
        listenForStagePanelDrag(onMove, onFinish);

        window.dispatchEvent(new MouseEvent('pointermove'));
        window.dispatchEvent(new MouseEvent('pointerup'));
        window.dispatchEvent(new MouseEvent('mousemove'));
        window.dispatchEvent(new MouseEvent('mouseup'));

        expect(onMove).toHaveBeenCalledTimes(1);
        expect(onFinish).toHaveBeenCalledTimes(1);
    });

    test('manual cleanup removes every listener without finishing the gesture', () => {
        const onMove = jest.fn();
        const onFinish = jest.fn();
        const cleanup = listenForStagePanelDrag(onMove, onFinish);

        cleanup();
        cleanup();
        window.dispatchEvent(new MouseEvent('pointermove'));
        window.dispatchEvent(new MouseEvent('pointerup'));
        window.dispatchEvent(new MouseEvent('mousemove'));
        window.dispatchEvent(new MouseEvent('mouseup'));

        expect(onMove).not.toHaveBeenCalled();
        expect(onFinish).not.toHaveBeenCalled();
    });
});
