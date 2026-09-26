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

        blocks.cancelDeferredWorkspaceLoad();

        expect(setScriptLoadProgress).toHaveBeenCalledWith(null);
        expect(blocks.workspace.cancelDeferredRender).toHaveBeenCalled();
        expect(blocks.deferredWorkspaceLoad).toBeNull();
    });
});
