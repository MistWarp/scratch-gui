import {parseDimensions} from '../../../src/reducers/custom-stage-size';

describe('custom stage size URL parsing', () => {
    test('accepts common separators and clamps oversized dimensions', () => {
        expect(parseDimensions('640x480')).toEqual({width: 640, height: 480});
        expect(parseDimensions('9000,5000')).toEqual({width: 4096, height: 4096});
    });

    test('ignores malformed dimensions without opening a browser alert', () => {
        const originalAlert = global.alert;
        global.alert = jest.fn();

        expect(parseDimensions('wide')).toBeNull();
        expect(global.alert).not.toHaveBeenCalled();

        global.alert = originalAlert;
    });
});
