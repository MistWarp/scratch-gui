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
    test('updates the UI when progress changes without other prop changes', () => {
        const blocks = Object.create(Blocks.prototype);
        blocks.state = {scriptLoadProgress: null};
        blocks.props = {};
        const progress = {phase: 'building', completed: 100, total: 1200};
        expect(blocks.shouldComponentUpdate(blocks.props, {scriptLoadProgress: progress})).toBe(true);
        blocks.state = {scriptLoadProgress: progress};
        expect(blocks.shouldComponentUpdate(blocks.props, {scriptLoadProgress: null})).toBe(true);
    });
});
