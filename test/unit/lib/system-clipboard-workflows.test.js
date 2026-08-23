import installSystemClipboardForBlocks from '../../../src/lib/mw/system-clipboard.js';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const makeScratchBlocks = ({paste = jest.fn()} = {}) => ({
    copy_: jest.fn(),
    duplicate_: jest.fn(),
    onKeyDown_: jest.fn(),
    clipboardXml_: document.createElement('block'),
    clipboardSource_: null,
    Xml: {
        domToText: node => node.outerHTML,
        textToDom: text => new DOMParser().parseFromString(text, 'text/xml').documentElement
    },
    Events: {
        setGroup: jest.fn()
    },
    utils: {
        isTargetInput: () => false
    },
    mainWorkspace: {
        options: {readOnly: false},
        rendered: true,
        isVisible: () => true,
        isDragging: () => false,
        paste
    }
});

const pasteShortcut = {
    altKey: false,
    ctrlKey: true,
    metaKey: false,
    keyCode: 86
};

describe('system block clipboard failure handling', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                readText: jest.fn(),
                writeText: jest.fn(() => Promise.resolve())
            }
        });
    });

    test('always closes the Blockly event group when pasting throws', async () => {
        const paste = jest.fn(() => {
            throw new Error('paste failed');
        });
        const onImportError = jest.fn();
        const ScratchBlocks = makeScratchBlocks({paste});
        navigator.clipboard.readText.mockResolvedValue('ordinary clipboard text');

        installSystemClipboardForBlocks(ScratchBlocks, null, onImportError);
        ScratchBlocks.onKeyDown_(pasteShortcut);
        await flushPromises();

        expect(ScratchBlocks.Events.setGroup.mock.calls).toEqual([[true], [false]]);
        expect(paste).toHaveBeenCalledTimes(1);
        expect(onImportError).toHaveBeenCalledTimes(1);
    });

    test('does not paste blocks when a required extension cannot load', async () => {
        const onImportError = jest.fn();
        const ScratchBlocks = makeScratchBlocks();
        const meta = btoa(JSON.stringify({v: 1, ids: ['missing'], urls: {}}));
        navigator.clipboard.readText.mockResolvedValue(
            `<!--mistwarp-extensions-base64:${meta}--><block type="missing_do"></block>`
        );
        const vm = {
            extensionManager: {
                isExtensionLoaded: () => false,
                loadExtensionIdSync: jest.fn(() => {
                    throw new Error('extension failed');
                })
            }
        };

        installSystemClipboardForBlocks(ScratchBlocks, vm, onImportError);
        ScratchBlocks.onKeyDown_(pasteShortcut);
        await flushPromises();

        expect(ScratchBlocks.mainWorkspace.paste).not.toHaveBeenCalled();
        expect(onImportError).toHaveBeenCalledTimes(1);
    });
});
