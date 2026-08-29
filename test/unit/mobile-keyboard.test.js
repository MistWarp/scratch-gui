import {
    dispatchMobileKeyboardEvent,
    getMobileGamepadKeys,
    getProjectKeyboardKeys
} from '../../src/lib/mobile-keyboard.js';

const makeVM = keys => {
    const blocks = {};
    keys.forEach((key, index) => {
        blocks[index] = {
            opcode: 'event_whenkeypressed',
            fields: {
                KEY_OPTION: {value: key}
            }
        };
    });
    const target = {
        blocks: {_blocks: blocks},
        isOriginal: true
    };
    return {
        runtime: {
            getTargetForStage: () => null,
            targets: [target]
        }
    };
};

describe('mobile keyboard input', () => {
    test('reads the same project keys used by gamepad defaults', () => {
        const vm = makeVM(['w', 'a', 's', 'd', 'space', 'x']);
        expect(getProjectKeyboardKeys(vm)).toEqual(new Set(['w', 'a', 's', 'd', ' ', 'x']));

        const mapping = getMobileGamepadKeys(vm);
        expect(mapping.directions).toEqual({
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd'
        });
        expect(mapping.actions).toContain(' ');
        expect(mapping.actions).toContain('x');
    });

    test('dispatches standard document keyboard events', () => {
        const received = [];
        const listener = event => received.push({type: event.type, key: event.key, code: event.code});
        document.addEventListener('keydown', listener);
        document.addEventListener('keyup', listener);

        dispatchMobileKeyboardEvent('ArrowLeft', true);
        dispatchMobileKeyboardEvent('ArrowLeft', false);

        document.removeEventListener('keydown', listener);
        document.removeEventListener('keyup', listener);
        expect(received).toEqual([
            {type: 'keydown', key: 'ArrowLeft', code: 'ArrowLeft'},
            {type: 'keyup', key: 'ArrowLeft', code: 'ArrowLeft'}
        ]);
    });
});
