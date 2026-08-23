import copyText from '../../src/community/copy-text.js';

describe('community copyText', () => {
    const originalClipboard = navigator.clipboard;
    const originalExecCommand = document.execCommand;

    afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: originalClipboard
        });
        document.execCommand = originalExecCommand;
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    test('uses the Clipboard API when available', async () => {
        const writeText = jest.fn().mockResolvedValue();
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {writeText}
        });

        await copyText('https://mistwarp.example/project/1');

        expect(writeText).toHaveBeenCalledWith('https://mistwarp.example/project/1');
    });

    test('falls back to the copy command when the Clipboard API is unavailable', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: undefined
        });
        document.execCommand = jest.fn().mockReturnValue(true);

        await copyText('fallback link');

        expect(document.execCommand).toHaveBeenCalledWith('copy');
        expect(document.querySelector('textarea')).toBeNull();
    });

    test('falls back when the Clipboard API rejects', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {writeText: jest.fn().mockRejectedValue(new Error('denied'))}
        });
        document.execCommand = jest.fn().mockReturnValue(true);

        await expect(copyText('fallback link')).resolves.toBeUndefined();
        expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
});
