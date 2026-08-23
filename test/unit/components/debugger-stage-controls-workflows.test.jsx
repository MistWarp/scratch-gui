import React from 'react';
import {shallow} from 'enzyme';
import VM from 'scratch-vm';
import {DebuggerStageControls} from '../../../src/components/tw-debugger/stage-controls';
import initDebugger from '../../../src/lib/debugger/controller';

const mockEngine = {
    isPaused: jest.fn(() => false),
    setPaused: jest.fn()
};

jest.mock('../../../src/lib/debugger/controller', () => jest.fn(() => ({
    engine: mockEngine,
    events: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    }
})));
jest.mock('../../../src/lib/debugger/settings', () => ({
    getSetting: jest.fn(() => true),
    onSettingChanged: jest.fn(() => jest.fn())
}));

const makeControls = overrides => {
    const controls = new DebuggerStageControls({
        vm: {
            runtime: {_step: jest.fn()},
            ...overrides
        }
    });
    controls.setState = update => {
        controls.state = {...controls.state, ...update};
    };
    return controls;
};

describe('debugger stage controls', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockEngine.isPaused.mockReturnValue(false);
        initDebugger.mockClear();
    });

    test('does not toggle pause while typing or from a repeated key event', () => {
        const controls = makeControls();
        const event = {
            altKey: true,
            key: 'x',
            keyCode: 88,
            preventDefault: jest.fn(),
            stopImmediatePropagation: jest.fn()
        };

        controls.handleKeyDown({...event, target: {tagName: 'INPUT'}});
        controls.handleKeyDown({...event, repeat: true, target: {tagName: 'DIV'}});

        expect(mockEngine.setPaused).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test('toggles pause once for Alt+X outside an editor field', () => {
        const controls = makeControls();
        const event = {
            altKey: true,
            key: 'X',
            keyCode: 88,
            preventDefault: jest.fn(),
            repeat: false,
            stopImmediatePropagation: jest.fn(),
            target: {tagName: 'DIV'}
        };

        controls.handleKeyDown(event);

        expect(mockEngine.setPaused).toHaveBeenCalledWith(true);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    test('returns to paused state when stepping throws', () => {
        const step = jest.fn(() => {
            throw new Error('step failed');
        });
        const controls = makeControls({runtime: {_step: step}});
        mockEngine.isPaused.mockReturnValue(true);

        expect(() => controls.handleStep()).toThrow('step failed');
        expect(mockEngine.setPaused.mock.calls).toEqual([[false], [true]]);
    });

    test('renders pause and step actions as native buttons', () => {
        mockEngine.isPaused.mockReturnValue(true);
        const vm = Object.assign(Object.create(VM.prototype), {runtime: {_step: jest.fn()}});
        const wrapper = shallow(<DebuggerStageControls vm={vm} />);

        expect(wrapper.find('button[aria-label="Play"]').prop('type')).toBe('button');
        expect(wrapper.find('button[aria-label="Step one frame"]').prop('type')).toBe('button');
    });
});
