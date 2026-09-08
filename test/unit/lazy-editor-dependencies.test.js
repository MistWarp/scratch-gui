describe('lazy paint dependencies', () => {
    let paint;
    let load;
    let reducer;

    beforeEach(() => {
        jest.resetModules();
        paint = {
            __esModule: true,
            default: () => null,
            ScratchPaintReducer: jest.fn((state = {undo: []}, action) =>
                (action.type === 'draw' ? {...state, undo: [...state.undo, action.value]} : state))
        };
        jest.doMock('scratch-paint', () => paint, {virtual: true});
        const module = require('../../src/lib/tw-scratch-paint');
        load = module.loadScratchPaint;
        reducer = module.ScratchPaintReducer;
    });

    test('does not initialize paint when opening the code editor', () => {
        const initial = reducer(undefined, {type: '@@INIT'});
        expect(reducer(initial, {type: 'scratch-gui/navigation/ACTIVATE_TAB', activeTabIndex: 0})).toBe(initial);
        expect(paint.ScratchPaintReducer).not.toHaveBeenCalled();
    });

    test('shares loading and initializes each store before paint actions', async () => {
        const firstStore = reducer(undefined, {type: '@@INIT'});
        const secondStore = reducer(undefined, {type: '@@INIT'});
        const firstLoad = load();
        expect(load()).toBe(firstLoad);
        await firstLoad;
        const initialized = reducer(firstStore, {type: 'scratch-gui/paint/LOADED'});
        const edited = reducer(initialized, {type: 'draw', value: 'line'});
        expect(edited.undo).toEqual(['line']);
        expect(reducer(edited, {type: 'scratch-gui/navigation/ACTIVATE_TAB', activeTabIndex: 0})).toBe(edited);
        expect(reducer(secondStore, {type: 'scratch-gui/paint/LOADED'}).undo).toEqual([]);
    });
});

test('eager core components preserve optional lazy components', () => {
    const {getGuiComponents, setGuiComponents} = require('../../src/components/gui/gui-components');
    const original = getGuiComponents();
    const MenuBar = () => null;
    setGuiComponents({MenuBar});
    expect(getGuiComponents().MenuBar).toBe(MenuBar);
    expect(getGuiComponents().TWSettingsModal).toBe(original.TWSettingsModal);
});
