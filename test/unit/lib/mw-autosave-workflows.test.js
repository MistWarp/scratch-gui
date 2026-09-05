import {runAutosave} from '../../../src/lib/mw/autosave.js';
import {getRememberedPlatformProjectState, publishToMistWarp} from '../../../src/lib/community/publish.js';

jest.mock('../../../src/lib/community/publish.js', () => ({
    getRememberedPlatformProjectState: jest.fn(),
    publishToMistWarp: jest.fn()
}));
jest.mock('../../../src/lib/community/enabled.js', () => ({
    __esModule: true,
    default: true
}));

const settings = {
    enabled: true,
    interval: 5,
    notifications: true,
    only_when_changed: true
};

beforeEach(() => {
    localStorage.clear();
    publishToMistWarp.mockReset();
    getRememberedPlatformProjectState.mockReset();
    getRememberedPlatformProjectState.mockReturnValue({id: '1', isOwner: true});
    publishToMistWarp.mockResolvedValue({id: '1'});
});

test('does nothing when autosave is disabled', async () => {
    const showToast = jest.fn();

    await expect(runAutosave({
        vm: {},
        projectChanged: true,
        showToast,
        settings: {...settings, enabled: false}
    })).resolves.toBe(false);

    expect(publishToMistWarp).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
});

test('skips unchanged projects when configured', async () => {
    await expect(runAutosave({
        vm: {},
        projectChanged: false,
        showToast: jest.fn(),
        settings
    })).resolves.toBe(false);

    expect(publishToMistWarp).not.toHaveBeenCalled();
});

test('skips projects missing from MistWarp or owned by someone else', async () => {
    getRememberedPlatformProjectState.mockReturnValueOnce(null);
    await expect(runAutosave({vm: {}, projectChanged: true, settings})).resolves.toBe(false);

    getRememberedPlatformProjectState.mockReturnValueOnce({id: '1', isOwner: false});
    await expect(runAutosave({vm: {}, projectChanged: true, settings})).resolves.toBe(false);

    expect(publishToMistWarp).not.toHaveBeenCalled();
});

test('pushes the worktree without committing', async () => {
    const onSaved = jest.fn();
    const showToast = jest.fn();

    await expect(runAutosave({
        vm: {},
        projectChanged: true,
        onSaved,
        showToast,
        settings
    })).resolves.toBe(true);

    expect(publishToMistWarp).toHaveBeenCalledWith(expect.objectContaining({
        updateOnly: true,
        commitChanges: false
    }));
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith('Project autosaved.', 'success');
});

test('stays quiet when the upload agreement is pending', async () => {
    publishToMistWarp.mockRejectedValue(Object.assign(new Error('Accept the guidelines'), {
        code: 'agreement_required'
    }));
    const showToast = jest.fn();

    await expect(runAutosave({
        vm: {},
        projectChanged: true,
        showToast,
        settings
    })).resolves.toBe(false);

    expect(showToast).not.toHaveBeenCalled();
});

test('notifies on unexpected failures', async () => {
    publishToMistWarp.mockRejectedValue(new Error('offline'));
    const showToast = jest.fn();

    await expect(runAutosave({
        vm: {},
        projectChanged: true,
        showToast,
        settings
    })).resolves.toBe(false);

    expect(showToast).toHaveBeenCalledWith('Autosave failed.', 'error');
});


test.each([
    {_mwPendingDiskOverwrite: true},
    {_mwHistoryHydration: {replaceHistory: true}}
])('does not publish an imported replacement before a manual save', async vm => {
    await expect(runAutosave({vm, projectChanged: true, settings})).resolves.toBe(false);
    expect(publishToMistWarp).not.toHaveBeenCalled();
});
