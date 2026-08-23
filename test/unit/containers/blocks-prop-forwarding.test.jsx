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
