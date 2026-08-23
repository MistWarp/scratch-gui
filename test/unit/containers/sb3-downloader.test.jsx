import {SB3Downloader} from '../../../src/containers/sb3-downloader.jsx';
import downloadBlob from '../../../src/lib/utils/download-blob';

jest.mock('../../../src/lib/utils/download-blob', () => jest.fn());

const makeProps = overrides => ({
    canSaveProject: true,
    children: () => null,
    fileHandle: null,
    onProjectUnchanged: jest.fn(),
    onSetFileHandle: jest.fn(),
    onSetProjectTitle: jest.fn(),
    onShowSaveErrorAlert: jest.fn(),
    onShowSaveSuccessAlert: jest.fn(),
    onShowSavingAlert: jest.fn(),
    projectFilename: 'Project.sb3',
    saveProjectSb3: jest.fn(() => Promise.resolve(new Blob())),
    saveProjectSb3Stream: jest.fn(),
    vm: {},
    ...overrides
});

describe('SB3Downloader save results', () => {
    test('ignores another save while one is running', async () => {
        let finishSave;
        const props = makeProps({
            saveProjectSb3: jest.fn(() => new Promise(resolve => {
                finishSave = resolve;
            }))
        });
        const downloader = new SB3Downloader(props);

        const firstSave = downloader.downloadProject();
        await expect(downloader.downloadProject()).resolves.toBe(false);
        expect(props.saveProjectSb3).toHaveBeenCalledTimes(1);

        finishSave(new Blob());
        await expect(firstSave).resolves.toBe(true);
        expect(props.onProjectUnchanged).toHaveBeenCalledTimes(1);
    });

    test('returns false when project serialization fails', async () => {
        const props = makeProps({
            saveProjectSb3: jest.fn(() => Promise.reject(new Error('broken project')))
        });
        const downloader = new SB3Downloader(props);

        await expect(downloader.downloadProject()).resolves.toBe(false);
        expect(props.onShowSaveErrorAlert).toHaveBeenCalledTimes(1);
        expect(props.onProjectUnchanged).not.toHaveBeenCalled();
    });

    test('does not clear an edit made while the project is serializing', async () => {
        let finishSave;
        let projectChanged;
        const props = makeProps({
            saveProjectSb3: jest.fn(() => new Promise(resolve => {
                finishSave = resolve;
            })),
            vm: {
                on: jest.fn((event, callback) => {
                    if (event === 'PROJECT_CHANGED') projectChanged = callback;
                })
            }
        });
        const downloader = new SB3Downloader(props);

        const saving = downloader.downloadProject();
        projectChanged();
        finishSave(new Blob());

        await expect(saving).resolves.toBe(true);
        expect(props.onProjectUnchanged).not.toHaveBeenCalled();
        expect(props.onShowSaveSuccessAlert).toHaveBeenCalledTimes(1);
    });

    test('does not claim success when starting the download fails', async () => {
        downloadBlob.mockImplementationOnce(() => {
            throw new Error('download blocked');
        });
        const props = makeProps();
        const downloader = new SB3Downloader(props);

        await expect(downloader.downloadProject()).resolves.toBe(false);

        expect(props.onProjectUnchanged).not.toHaveBeenCalled();
        expect(props.onShowSaveSuccessAlert).not.toHaveBeenCalled();
        expect(props.onShowSaveErrorAlert).toHaveBeenCalledTimes(1);
    });

    test('treats cancelling the file picker as an unsuccessful save without an error alert', async () => {
        const cancelled = new Error('cancelled');
        cancelled.name = 'AbortError';
        const props = makeProps({
            showSaveFilePicker: jest.fn(() => Promise.reject(cancelled))
        });
        const downloader = new SB3Downloader(props);

        await expect(downloader.saveAsNew()).resolves.toBe(false);
        expect(props.onShowSaveErrorAlert).not.toHaveBeenCalled();
        expect(props.onProjectUnchanged).not.toHaveBeenCalled();
    });

    test('aborts the writable file when stream creation fails', async () => {
        const writable = {
            abort: jest.fn(() => Promise.resolve()),
            close: jest.fn(),
            write: jest.fn()
        };
        const props = makeProps({
            saveProjectSb3Stream: jest.fn(() => {
                throw new Error('stream failed');
            }),
            showSaveFilePicker: jest.fn(() => Promise.resolve({
                createWritable: () => Promise.resolve(writable),
                name: 'Project.sb3'
            }))
        });
        const downloader = new SB3Downloader(props);

        await expect(downloader.saveAsNew()).resolves.toBe(false);

        expect(writable.abort).toHaveBeenCalledTimes(1);
        expect(props.onShowSaveErrorAlert).toHaveBeenCalledTimes(1);
        expect(props.onSetFileHandle).not.toHaveBeenCalled();
    });
});
