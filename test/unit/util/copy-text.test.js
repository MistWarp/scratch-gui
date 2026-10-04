import copyText from '../../../src/lib/utils/copy-text';

describe('copyText', () => {
    const originalClipboard = navigator.clipboard;
    const originalExecCommand = document.execCommand;

    afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: originalClipboard
        });
        document.execCommand = originalExecCommand;
        document.body.innerHTML = '';
    });

    test('falls back when the Clipboard API throws synchronously', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: () => {
                    throw new Error('not allowed');
                }
            }
        });
        document.execCommand = jest.fn().mockReturnValue(true);

        await expect(copyText('text')).resolves.toBeUndefined();
        expect(document.execCommand).toHaveBeenCalledWith('copy');
        expect(document.querySelector('textarea')).toBeNull();
    });

    test('rejects when neither the Clipboard API nor the copy command works', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: null
        });
        document.execCommand = jest.fn().mockReturnValue(false);

        await expect(copyText('text')).rejects.toThrow('Copy command failed.');
    });

    test('copies through the document it is given', async () => {
        const otherDocument = document.implementation.createHTMLDocument('other');
        otherDocument.execCommand = jest.fn().mockReturnValue(true);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: null
        });
        document.execCommand = jest.fn().mockReturnValue(true);

        await copyText('text', {document: otherDocument});

        expect(otherDocument.execCommand).toHaveBeenCalledWith('copy');
        expect(document.execCommand).not.toHaveBeenCalled();
    });
});
