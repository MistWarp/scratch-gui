import smartSave from '../../../src/lib/mw/smart-save.js';
import openMistWarpShareWindow from '../../../src/lib/mw/open-mw-share-window.js';
import {createMwp} from '../../../src/lib/git/mwp.js';
import {getRememberedPlatformProjectState, publishToMistWarp} from '../../../src/lib/community/publish.js';
import downloadBlob from '../../../src/lib/utils/download-blob';

jest.mock('../../../src/lib/community/enabled.js', () => true);
jest.mock('../../../src/lib/mw/open-mw-share-window.js', () => jest.fn());
jest.mock('../../../src/lib/git/mwp.js', () => ({
    createMwp: jest.fn(() => Promise.resolve({blob: new Blob()}))
}));
jest.mock('../../../src/lib/community/api.js', () => ({
    request: jest.fn(() => Promise.resolve({agreement: {accepted: true, version: 1}}))
}));
jest.mock('../../../src/lib/community/publish.js', () => ({
    getRememberedPlatformProjectState: jest.fn(),
    publishToMistWarp: jest.fn()
}));
jest.mock('../../../src/lib/utils/download-blob', () => jest.fn());

describe('MistWarp smart save results', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns true after downloading a new native project', async () => {
        getRememberedPlatformProjectState.mockReturnValue(null);
        const onSaved = jest.fn();

        await expect(smartSave({vm: {}, title: 'My/Project', onSaved})).resolves.toBe(true);
        expect(createMwp).toHaveBeenCalledTimes(1);
        expect(downloadBlob).toHaveBeenCalledWith('My_Project.mwp', expect.any(Blob));
        expect(onSaved).toHaveBeenCalledTimes(1);
    });

    test('returns false when saving needs a remix window', async () => {
        getRememberedPlatformProjectState.mockReturnValue({isOwner: false});

        await expect(smartSave({vm: {}, title: 'Project'})).resolves.toBe(false);
        expect(openMistWarpShareWindow).toHaveBeenCalledWith(expect.objectContaining({action: 'remix'}));
    });

    test('returns true after a silent platform update', async () => {
        getRememberedPlatformProjectState.mockReturnValue({isOwner: true});
        publishToMistWarp.mockResolvedValue({id: 'project'});
        const onSaved = jest.fn();

        await expect(smartSave({vm: {}, title: 'Project', onSaved})).resolves.toBe(true);
        expect(onSaved).toHaveBeenCalledWith({id: 'project'});
    });

    test('returns false when a failed update opens recovery UI', async () => {
        getRememberedPlatformProjectState.mockReturnValue({isOwner: true});
        publishToMistWarp.mockRejectedValue(new Error('offline'));

        await expect(smartSave({vm: {}, title: 'Project'})).resolves.toBe(false);
        expect(openMistWarpShareWindow).toHaveBeenCalledWith(expect.objectContaining({
            action: 'update',
            initialError: expect.any(Error)
        }));
    });

    test('does not clear a newer edit when a slow update finishes', async () => {
        let finishPublish;
        let projectChanged;
        const vm = {
            on: jest.fn((event, callback) => {
                if (event === 'PROJECT_CHANGED') projectChanged = callback;
            })
        };
        const onSaved = jest.fn();
        getRememberedPlatformProjectState.mockReturnValue({isOwner: true});
        publishToMistWarp.mockImplementationOnce(() => new Promise(resolve => {
            finishPublish = resolve;
        }));

        const saving = smartSave({vm, title: 'Project', onSaved});
        await Promise.resolve();
        await Promise.resolve();
        projectChanged();
        finishPublish({id: 'saved-version'});

        await expect(saving).resolves.toBe(true);
        expect(onSaved).not.toHaveBeenCalled();
    });

    test('does not clear a newer edit after publishing through the save window', async () => {
        let projectChanged;
        const vm = {
            on: jest.fn((event, callback) => {
                if (event === 'PROJECT_CHANGED') projectChanged = callback;
            })
        };
        const onSaved = jest.fn();
        getRememberedPlatformProjectState.mockReturnValue({isOwner: false});

        await smartSave({vm, title: 'Project', onSaved});
        const {onPublished} = openMistWarpShareWindow.mock.calls[0][0];
        projectChanged();
        onPublished({id: 'remix'});

        expect(onSaved).not.toHaveBeenCalled();
    });
});
