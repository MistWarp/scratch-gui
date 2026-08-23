import {selectedIndexAfterDelete} from '../../../src/lib/utils/asset-selection.js';

describe('asset selection after deletion', () => {
    test('keeps the selected item when deleting a later item', () => {
        expect(selectedIndexAfterDelete(1, 3, 5)).toBe(1);
    });

    test('tracks the selected item when an earlier item is deleted', () => {
        expect(selectedIndexAfterDelete(3, 1, 5)).toBe(2);
    });

    test('selects the next item when deleting the selected item', () => {
        expect(selectedIndexAfterDelete(1, 1, 4)).toBe(1);
    });

    test('selects the previous item when deleting the last item', () => {
        expect(selectedIndexAfterDelete(3, 3, 4)).toBe(2);
    });
});
