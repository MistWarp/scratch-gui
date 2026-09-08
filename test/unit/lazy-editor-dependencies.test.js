describe('eager paint dependencies', () => {
    test('exports paint and initializes its reducer before opening the costume tab', () => {
        jest.resetModules();
        const paint = {
            __esModule: true,
            default: () => null,
            ScratchPaintReducer: (state = {undo: []}, action) =>
                (action.type === 'draw' ? {...state, undo: [...state.undo, action.value]} : state)
        };
        jest.doMock('scratch-paint', () => paint, {virtual: true});
        const module = require('../../src/lib/tw-scratch-paint');
        expect(module.default).toBe(paint.default);
        const initial = module.ScratchPaintReducer(undefined, {type: '@@INIT'});
        expect(initial).toEqual({undo: []});
        expect(module.ScratchPaintReducer(initial, {type: 'draw', value: 'line'}).undo).toEqual(['line']);
    });
});
