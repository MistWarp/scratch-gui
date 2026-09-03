import importCSV from '../../../src/lib/utils/import-csv.js';

describe('CSV file picker workflows', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
        HTMLInputElement.prototype.click.mockRestore();
        jest.useRealTimers();
    });

    test('settles and removes its temporary input when selection is cancelled', async () => {
        const importPromise = importCSV();
        const input = document.querySelector('input[type="file"]');
        expect(input).not.toBeNull();

        // Opening the file dialog blurs the window; closing it focuses again.
        window.dispatchEvent(new Event('blur'));
        window.dispatchEvent(new Event('focus'));
        jest.runOnlyPendingTimers();

        await expect(importPromise).rejects.toMatchObject({name: 'AbortError'});
        expect(document.body.contains(input)).toBe(false);
    });

    test('ignores focus events when the file dialog never opened', async () => {
        let settled = false;
        const importPromise = importCSV().then(
            () => {
                settled = true;
            },
            () => {
                settled = true;
            }
        );
        const input = document.querySelector('input[type="file"]');
        expect(input).not.toBeNull();

        // e.g. focus returning after the context menu closes, before a file is picked.
        window.dispatchEvent(new Event('focus'));
        jest.runOnlyPendingTimers();

        // Promise must stay pending so a later file selection still works.
        expect(settled).toBe(false);
        expect(document.body.contains(input)).toBe(true);

        // Clean up: simulate a real cancel.
        window.dispatchEvent(new Event('blur'));
        window.dispatchEvent(new Event('focus'));
        jest.runOnlyPendingTimers();
        await importPromise;
        expect(document.body.contains(input)).toBe(false);
    });
});
