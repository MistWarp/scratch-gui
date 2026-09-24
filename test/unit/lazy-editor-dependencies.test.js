describe('lazy paint reducer', () => {
    let paint;

    beforeEach(() => {
        jest.resetModules();
        paint = require('../../src/lib/tw-scratch-paint');
    });

    const realReducer = (state = {undo: []}, action) =>
        (action.type === 'draw' ? {...state, undo: [...state.undo, action.value]} : state);

    test('keeps one empty state until paint is loaded', () => {
        const initial = paint.ScratchPaintReducer(void 0, {type: '@@INIT'});
        expect(paint.ScratchPaintReducer(initial, {type: 'draw', value: 'line'})).toBe(initial);
    });

    test('initializes the store when paint loads later', () => {
        let state = paint.ScratchPaintReducer(void 0, {type: '@@INIT'});
        const dispatch = jest.fn(action => {
            state = paint.ScratchPaintReducer(state, action);
        });
        paint.onScratchPaintLoaded(() => dispatch({type: paint.PAINT_LOADED}));
        paint.setScratchPaintReducer(realReducer);
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(state).toEqual({undo: []});
        state = paint.ScratchPaintReducer(state, {type: 'draw', value: 'line'});
        expect(state.undo).toEqual(['line']);
    });

    test('uses the real reducer from the first action when paint is loaded first', () => {
        paint.setScratchPaintReducer(realReducer);
        const callback = jest.fn();
        paint.onScratchPaintLoaded(callback);
        expect(callback).not.toHaveBeenCalled();
        expect(paint.ScratchPaintReducer(void 0, {type: '@@INIT'})).toEqual({undo: []});
    });
});

describe('lazy editor components', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('player pages get lazy components', () => {
        const {getGuiComponents} = require('../../src/components/gui/gui-components');
        const components = getGuiComponents();
        expect(components.Blocks.$$typeof).toBe(Symbol.for('react.lazy'));
        expect(components.TWSettingsModal.$$typeof).toBe(Symbol.for('react.lazy'));
    });

    test('the editor registers its components before rendering', () => {
        const {getGuiComponents, setGuiComponents} = require('../../src/components/gui/gui-components');
        const Blocks = () => null;
        setGuiComponents({Blocks});
        expect(getGuiComponents().Blocks).toBe(Blocks);
    });
});
