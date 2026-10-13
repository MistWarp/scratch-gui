import {Blocks} from '../../../src/containers/blocks.jsx';

describe('blocks DOM prop forwarding', () => {
    test('keeps import error callbacks out of the blocks DOM wrapper', () => {
        const blocks = Object.create(Blocks.prototype);
        blocks.state = {
            flyoutWidth: null,
            paletteResizeEnabled: false,
            prompt: null
        };
        blocks.props = {
            isFullScreen: false,
            onShowImportError: jest.fn(),
            options: {},
            theme: {wallpaper: {gridVisible: true}},
            vm: {}
        };

        const rendered = blocks.render();
        const blocksWrapper = rendered.props.children[0];

        expect(blocksWrapper.props.onShowImportError).toBeUndefined();
    });
});


describe('script loading progress', () => {
    test('keeps the progress setter out of the blocks DOM wrapper', () => {
        const blocks = Object.create(Blocks.prototype);
        blocks.state = {
            flyoutWidth: null,
            paletteResizeEnabled: false,
            prompt: null
        };
        blocks.props = {
            isFullScreen: false,
            options: {},
            setScriptLoadProgress: jest.fn(),
            theme: {wallpaper: {gridVisible: true}},
            vm: {}
        };

        const rendered = blocks.render();
        const blocksWrapper = rendered.props.children[0];

        expect(blocksWrapper.props.setScriptLoadProgress).toBeUndefined();
    });

    test('clears the shared progress when a deferred load is cancelled', () => {
        const blocks = Object.create(Blocks.prototype);
        const setScriptLoadProgress = jest.fn();
        blocks.props = {setScriptLoadProgress};
        blocks.workspace = {cancelDeferredRender: jest.fn()};
        blocks.deferredWorkspaceLoad = {};
        blocks.scriptLoadProgressShown = true;

        blocks.cancelDeferredWorkspaceLoad();

        expect(setScriptLoadProgress).toHaveBeenCalledWith(null);
        expect(blocks.workspace.cancelDeferredRender).toHaveBeenCalled();
        expect(blocks.deferredWorkspaceLoad).toBeNull();
    });

    describe('delayed indicator', () => {
        beforeEach(() => jest.useFakeTimers());
        afterEach(() => jest.useRealTimers());

        const makeBlocks = () => {
            const blocks = Object.create(Blocks.prototype);
            blocks.props = {setScriptLoadProgress: jest.fn()};
            blocks.workspace = {cancelDeferredRender: jest.fn()};
            return blocks;
        };
        const drawing = {phase: 'drawing', completed: 1, total: 10};

        test('a load that finishes quickly never shows the indicator', () => {
            const blocks = makeBlocks();
            blocks.handleScriptLoadProgress(drawing);
            blocks.handleScriptLoadProgress({phase: 'idle', completed: 0, total: 10});
            jest.runAllTimers();
            expect(blocks.props.setScriptLoadProgress).not.toHaveBeenCalled();
        });

        test('a slow load shows the latest progress, then clears it', () => {
            const blocks = makeBlocks();
            blocks.handleScriptLoadProgress(drawing);
            const later = {phase: 'layout', completed: 5, total: 10};
            blocks.handleScriptLoadProgress(later);
            expect(blocks.props.setScriptLoadProgress).not.toHaveBeenCalled();
            jest.runAllTimers();
            expect(blocks.props.setScriptLoadProgress).toHaveBeenLastCalledWith(later);
            blocks.handleScriptLoadProgress({phase: 'idle', completed: 0, total: 10});
            expect(blocks.props.setScriptLoadProgress).toHaveBeenLastCalledWith(null);
        });

        test('errors show immediately', () => {
            const blocks = makeBlocks();
            const error = {phase: 'error', completed: 0, total: 10};
            blocks.handleScriptLoadProgress(error);
            expect(blocks.props.setScriptLoadProgress).toHaveBeenCalledWith(error);
        });

        test('cancelling before the delay drops the pending indicator', () => {
            const blocks = makeBlocks();
            blocks.handleScriptLoadProgress(drawing);
            blocks.cancelDeferredWorkspaceLoad();
            jest.runAllTimers();
            expect(blocks.props.setScriptLoadProgress).not.toHaveBeenCalled();
        });
    });
});
