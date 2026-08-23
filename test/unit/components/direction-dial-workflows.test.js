import {Dial} from '../../../src/components/direction-picker/dial.jsx';

const makeDial = () => {
    const dial = new Dial({
        direction: 90,
        onChange: jest.fn(),
        radius: 56
    });
    dial.containerElement = {
        getBoundingClientRect: () => ({
            top: 0,
            left: 0,
            width: 112,
            height: 112
        })
    };
    return dial;
};

describe('direction dial workflows', () => {
    test('ignores non-left mouse clicks', () => {
        const dial = makeDial();
        const addEventListener = jest.spyOn(window, 'addEventListener');

        dial.handleMouseDown({
            button: 2,
            clientX: 56,
            clientY: 0,
            preventDefault: jest.fn()
        });

        expect(addEventListener).not.toHaveBeenCalled();
        addEventListener.mockRestore();
    });

    test('cleans up a cancelled touch drag', () => {
        const dial = makeDial();
        const addEventListener = jest.spyOn(window, 'addEventListener');
        const removeEventListener = jest.spyOn(window, 'removeEventListener');

        dial.handleMouseDown({
            changedTouches: [{clientX: 56, clientY: 0}],
            preventDefault: jest.fn()
        });
        expect(addEventListener).toHaveBeenCalledWith('touchcancel', dial.unbindMouseEvents);

        dial.unbindMouseEvents();
        expect(removeEventListener).toHaveBeenCalledWith('touchcancel', dial.unbindMouseEvents);
        addEventListener.mockRestore();
        removeEventListener.mockRestore();
    });
});
