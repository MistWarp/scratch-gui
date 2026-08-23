import {ManageFont} from '../../../src/components/tw-fonts-modal/manage-font';
import downloadBlob from '../../../src/lib/utils/download-blob';

jest.mock('../../../src/lib/utils/download-blob', () => jest.fn());

describe('font management workflow', () => {
    test('exports a font with its MIME type and a safe filename', () => {
        const manager = new ManageFont({
            data: new Uint8Array([1, 2]),
            family: 'Family',
            fontManager: {deleteFont: jest.fn()},
            format: 'woff2',
            index: 0,
            intl: {formatMessage: jest.fn()},
            name: 'Heading / Bold',
            system: false
        });

        manager.handleExport();

        expect(downloadBlob).toHaveBeenCalledTimes(1);
        const [filename, blob] = downloadBlob.mock.calls[0];
        expect(filename).toBe('Heading _ Bold.woff2');
        expect(blob.type).toBe('font/woff2');
    });

    test('asks in the font row before deleting', () => {
        const deleteFont = jest.fn();
        const manager = new ManageFont({
            data: new Uint8Array([1, 2]),
            family: 'Family',
            fontManager: {deleteFont},
            format: 'woff2',
            index: 2,
            intl: {formatMessage: jest.fn()},
            name: 'Heading',
            system: false
        });
        manager.setState = update => {
            manager.state = {...manager.state, ...update};
        };

        manager.handleDelete();
        expect(deleteFont).not.toHaveBeenCalled();
        expect(manager.state.confirmingDelete).toBe(true);

        manager.handleConfirmDelete();
        expect(deleteFont).toHaveBeenCalledWith(2);
    });

    test('keeps deletion errors in the confirmation row', () => {
        const manager = new ManageFont({
            data: new Uint8Array([1]),
            family: 'Family',
            fontManager: {deleteFont: jest.fn(() => {
                throw new Error('font is in use');
            })},
            format: 'woff2',
            index: 0,
            intl: {formatMessage: jest.fn()},
            name: 'Heading',
            system: false
        });
        manager.setState = update => {
            manager.state = {...manager.state, ...update};
        };

        manager.handleDelete();
        manager.handleConfirmDelete();

        expect(manager.state.confirmingDelete).toBe(true);
        expect(manager.state.deleteError).toBe('font is in use');
    });
});
