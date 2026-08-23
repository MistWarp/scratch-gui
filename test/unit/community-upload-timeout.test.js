import {uploadXhr} from '../../src/lib/community/api.js';

describe('community upload timeout', () => {
    let OriginalXMLHttpRequest;
    let request;

    beforeEach(() => {
        jest.useFakeTimers();
        OriginalXMLHttpRequest = global.XMLHttpRequest;
        global.XMLHttpRequest = class {
            constructor () {
                this.upload = {};
                this.abort = jest.fn(() => {
                    if (this.onabort) this.onabort();
                });
                request = this;
            }
            open () {}
            send () {}
            setRequestHeader () {}
        };
    });

    afterEach(() => {
        jest.useRealTimers();
        global.XMLHttpRequest = OriginalXMLHttpRequest;
    });

    test('a server that stalls after 100% produces a retryable error', async () => {
        const upload = uploadXhr('/projects/project-1/upload', new FormData(), jest.fn());
        const rejection = expect(upload).rejects.toMatchObject({
            code: 'upload_processing_timeout',
            message: expect.stringContaining('check My Stuff before retrying')
        });

        request.upload.onprogress({lengthComputable: true, loaded: 10, total: 10});
        jest.advanceTimersByTime(180000);

        await rejection;
        expect(request.abort).toHaveBeenCalledTimes(1);
    });

    test('a completed response cancels the processing deadline', async () => {
        const upload = uploadXhr('/projects/project-1/upload', new FormData(), jest.fn());
        request.upload.onprogress({lengthComputable: true, loaded: 10, total: 10});
        request.status = 200;
        request.responseText = JSON.stringify({ok: true});
        request.onload();

        await expect(upload).resolves.toEqual({ok: true});
        jest.advanceTimersByTime(180000);
        expect(request.abort).not.toHaveBeenCalled();
    });

    test('ignores a late progress event after the response completes', async () => {
        const onProgress = jest.fn();
        const upload = uploadXhr('/projects/project-1/upload', new FormData(), onProgress);
        request.status = 200;
        request.responseText = JSON.stringify({ok: true});
        request.onload();

        await expect(upload).resolves.toEqual({ok: true});
        request.upload.onprogress({lengthComputable: true, loaded: 10, total: 10});
        jest.advanceTimersByTime(180000);

        expect(onProgress).not.toHaveBeenCalled();
        expect(request.abort).not.toHaveBeenCalled();
    });
});
