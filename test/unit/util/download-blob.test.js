import downloadBlob from '../../../src/lib/utils/download-blob.js';

describe('blob downloads', () => {
    let originalCreateObjectURL;
    let originalRevokeObjectURL;

    beforeEach(() => {
        jest.useFakeTimers();
        originalCreateObjectURL = window.URL.createObjectURL;
        originalRevokeObjectURL = window.URL.revokeObjectURL;
        window.URL.createObjectURL = jest.fn(() => 'blob:test');
        window.URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        window.URL.createObjectURL = originalCreateObjectURL;
        window.URL.revokeObjectURL = originalRevokeObjectURL;
        delete navigator.msSaveOrOpenBlob;
        document.body.innerHTML = '';
    });

    test('cleans up the temporary link and object URL', () => {
        downloadBlob('project.mwp', new Blob(['project']));
        expect(document.body.querySelectorAll('a')).toHaveLength(1);

        jest.runOnlyPendingTimers();

        expect(document.body.querySelectorAll('a')).toHaveLength(0);
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    test('does not append a link when using the legacy native saver', () => {
        navigator.msSaveOrOpenBlob = jest.fn();
        const blob = new Blob(['project']);

        downloadBlob('project.mwp', blob);

        expect(navigator.msSaveOrOpenBlob).toHaveBeenCalledWith(blob, 'project.mwp');
        expect(document.body.querySelectorAll('a')).toHaveLength(0);
    });
});
