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

        window.dispatchEvent(new Event('focus'));
        jest.runOnlyPendingTimers();

        await expect(importPromise).rejects.toMatchObject({name: 'AbortError'});
        expect(document.body.contains(input)).toBe(false);
    });
});
