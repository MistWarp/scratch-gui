test('provides Object.hasOwn for browsers without it', () => {
    const original = Object.hasOwn;
    delete Object.hasOwn;
    try {
        jest.isolateModules(() => {
            require('../../../src/lib/utils/tw-polyfill');
        });
        expect(Object.hasOwn({request: null}, 'request')).toBe(true);
        expect(Object.hasOwn(Object.create({request: 1}), 'request')).toBe(false);
        expect(Object.hasOwn('text', 'length')).toBe(true);
        expect(() => Object.hasOwn(null, 'request')).toThrow(TypeError);
    } finally {
        Object.defineProperty(Object, 'hasOwn', {value: original, configurable: true, writable: true});
    }
});
