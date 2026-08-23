import {handleFileUpload} from '../../../src/lib/file-uploader.js';

describe('file upload workflow', () => {
    let OriginalFileReader;

    beforeEach(() => {
        OriginalFileReader = global.FileReader;
        global.FileReader = class {
            readAsArrayBuffer (file) {
                if (file.readError) {
                    this.onerror(new Error('read failed'));
                    return;
                }
                this.result = file.contents;
                this.onload();
            }
        };
    });

    afterEach(() => {
        global.FileReader = OriginalFileReader;
    });

    test('continues after a read failure and resets the input for retry', () => {
        const onload = jest.fn();
        const onerror = jest.fn();
        const input = {
            files: [
                {name: 'broken.png', readError: true, type: 'image/png'},
                {contents: new ArrayBuffer(1), name: 'working.png', type: 'image/png'}
            ],
            value: 'selected files'
        };

        handleFileUpload(input, onload, onerror);

        expect(onerror).toHaveBeenCalledTimes(1);
        expect(onload).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'image/png', 'working', 1, 2);
        expect(input.value).toBeNull();
    });

    test('preserves dotted names and infers an image type when the browser omits it', () => {
        const onload = jest.fn();
        const input = {
            files: [{contents: new ArrayBuffer(1), name: 'cat.v2.PNG', type: ''}],
            value: 'selected file'
        };

        handleFileUpload(input, onload, jest.fn());

        expect(onload).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'image/png', 'cat.v2', 0, 1);
    });

    test('continues and resets the input when an import callback fails', () => {
        const onload = jest.fn(() => {
            throw new Error('invalid asset');
        });
        const onerror = jest.fn();
        const input = {
            files: [{contents: new ArrayBuffer(1), name: 'asset.png', type: 'image/png'}],
            value: 'selected file'
        };

        handleFileUpload(input, onload, onerror);

        expect(onerror).toHaveBeenCalledTimes(1);
        expect(input.value).toBeNull();
    });

    test('reports the file index when FileReader throws synchronously', () => {
        global.FileReader = class {
            readAsArrayBuffer () {
                throw new Error('reader unavailable');
            }
        };
        const onerror = jest.fn();
        const input = {
            files: [{name: 'broken.png', type: 'image/png'}],
            value: 'selected file'
        };

        expect(handleFileUpload(input, jest.fn(), onerror)).toBe(1);

        expect(onerror).toHaveBeenCalledWith(expect.any(Error), 0, 1);
        expect(input.value).toBeNull();
    });
});
