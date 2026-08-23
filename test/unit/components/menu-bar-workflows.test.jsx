import {MenuBar} from '../../../src/components/menu-bar/menu-bar.jsx';
import {commitProject, pull, push, repoExists} from '../../../src/lib/git/browser-git';
import {createMwp} from '../../../src/lib/git/mwp.js';

jest.mock('../../../src/lib/mw/open-fractch-terminal-window.js', () => jest.fn());
jest.mock('../../../src/lib/git/browser-git', () => ({
    REPO_DIR: '/repo',
    commitProject: jest.fn(() => Promise.resolve()),
    getDefaultAuthor: jest.fn(() => ({name: ''})),
    pull: jest.fn(() => Promise.resolve()),
    push: jest.fn(() => Promise.resolve()),
    repoExists: jest.fn(() => Promise.resolve(false))
}));
jest.mock('../../../src/lib/git/mwp.js', () => ({
    createMwp: jest.fn(() => Promise.resolve({blob: new Blob()}))
}));
jest.mock('../../../src/lib/git/project-history.js', () => ({
    getProjectHistoryState: jest.fn(() => ({phase: 'idle'})),
    preloadProjectHistory: jest.fn(() => Promise.resolve()),
    subscribeProjectHistory: jest.fn()
}));
jest.mock('../../../src/lib/mw/request-version-message.jsx', () => jest.fn(() => Promise.resolve(false)));

const makeMenuBar = props => {
    const menuBar = Object.create(MenuBar.prototype);
    menuBar.props = props;
    return menuBar;
};

describe('menu bar file workflows', () => {
    beforeEach(() => {
        createMwp.mockClear();
        createMwp.mockResolvedValue({blob: new Blob()});
        repoExists.mockClear();
        push.mockClear();
        pull.mockClear();
        commitProject.mockClear();
    });

    test('flushes a focused project title before saving with the keyboard', () => {
        jest.useFakeTimers();
        const handleSaveProject = jest.fn();
        const blur = jest.fn();
        const menuBar = makeMenuBar({handleSaveProject});
        const event = {
            altKey: false,
            ctrlKey: true,
            key: 's',
            metaKey: true,
            preventDefault: jest.fn(),
            target: {
                blur,
                dataset: {projectTitleInput: ''},
                tagName: 'INPUT'
            }
        };

        menuBar.handleKeyPress(event);
        expect(blur).toHaveBeenCalledTimes(1);
        expect(handleSaveProject).not.toHaveBeenCalled();

        jest.runOnlyPendingTimers();
        expect(handleSaveProject).toHaveBeenCalledTimes(1);
        jest.useRealTimers();
    });

    test('leaves normal save and open shortcuts to the global shortcut router', () => {
        const handleSaveProject = jest.fn();
        const onStartSelectingFileUpload = jest.fn();
        const menuBar = makeMenuBar({handleSaveProject, onStartSelectingFileUpload});
        const target = {tagName: 'DIV'};

        menuBar.handleKeyPress({
            altKey: false,
            ctrlKey: true,
            key: 's',
            metaKey: true,
            preventDefault: jest.fn(),
            shiftKey: false,
            target
        });
        menuBar.handleKeyPress({
            altKey: false,
            ctrlKey: true,
            key: 'o',
            metaKey: true,
            preventDefault: jest.fn(),
            shiftKey: false,
            target
        });

        expect(handleSaveProject).not.toHaveBeenCalled();
        expect(onStartSelectingFileUpload).not.toHaveBeenCalled();
    });

    test('closes the File menu before opening the file picker', () => {
        const calls = [];
        const menuBar = makeMenuBar({
            onRequestCloseFile: () => calls.push('close'),
            onStartSelectingFileUpload: () => calls.push('open-picker')
        });

        menuBar.handleClickLoadFromComputer();
        expect(calls).toEqual(['close', 'open-picker']);
    });

    test('does not create two projects from repeated New clicks', async () => {
        let finishConfirmation;
        const confirmReadyToReplaceProject = jest.fn(() => new Promise(resolve => {
            finishConfirmation = resolve;
        }));
        const onClickNew = jest.fn();
        const menuBar = makeMenuBar({
            canCreateNew: true,
            canSave: true,
            confirmReadyToReplaceProject,
            intl: {formatMessage: message => message.defaultMessage},
            onClickNew,
            onRequestCloseFile: jest.fn()
        });

        const first = menuBar.handleClickNew();
        await expect(menuBar.handleClickNew()).resolves.toBe(false);
        finishConfirmation(true);
        await expect(first).resolves.toBe(true);

        expect(confirmReadyToReplaceProject).toHaveBeenCalledTimes(1);
        expect(onClickNew).toHaveBeenCalledTimes(1);
    });

    test('does not rename a different bookmark if the original disappears during the prompt', async () => {
        let finishCategoryPrompt;
        const original = {name: 'Original', category: 'General', timestamp: 1};
        const remaining = {name: 'Keep me', category: 'General', timestamp: 2};
        const menuBar = makeMenuBar({
            intl: {formatMessage: message => message.defaultMessage},
            onRequestCloseWorkspaceBookmarks: jest.fn()
        });
        menuBar.state = {
            workspaceBookmarks: [original, remaining],
            workspaceBookmarksCategories: ['General']
        };
        menuBar.showPrompt = jest.fn()
            .mockResolvedValueOnce('Renamed')
            .mockImplementationOnce(() => new Promise(resolve => {
                finishCategoryPrompt = resolve;
            }));
        menuBar.saveWorkspaceBookmarksToProject = jest.fn();
        menuBar.setState = (updater, callback) => {
            const update = typeof updater === 'function' ? updater(menuBar.state) : updater;
            if (update) menuBar.state = {...menuBar.state, ...update};
            if (callback) callback();
        };

        const edit = menuBar.handleEditWorkspaceBookmark(0);
        await Promise.resolve();
        await Promise.resolve();
        menuBar.state.workspaceBookmarks = [remaining];
        finishCategoryPrompt('Changed');
        await edit;

        expect(menuBar.state.workspaceBookmarks).toEqual([remaining]);
    });

    test('reports a Git push failure in a toast and releases the action lock', async () => {
        push.mockRejectedValueOnce(new Error('network unavailable'));
        const menuBar = makeMenuBar({
            onCloseGitStatus: jest.fn(),
            onRequestCloseFile: jest.fn(),
            onShowGitStatus: jest.fn(),
            showToast: jest.fn(),
            vm: {}
        });
        menuBar.gitActionInFlight = false;

        await expect(menuBar.handleClickGitPush('origin')).resolves.toBe(false);

        expect(menuBar.props.showToast).toHaveBeenCalledWith('Push failed. network unavailable', 'error');
        expect(menuBar.gitActionInFlight).toBe(false);
    });

    test('ignores another Git action while one is still running', async () => {
        let finishPush;
        push.mockImplementationOnce(() => new Promise(resolve => {
            finishPush = resolve;
        }));
        const menuBar = makeMenuBar({
            onGitStatusDone: jest.fn(),
            onRequestCloseFile: jest.fn(),
            onShowGitStatus: jest.fn(),
            vm: {}
        });
        menuBar.gitActionInFlight = false;

        const first = menuBar.handleClickGitPush('origin');
        await expect(menuBar.handleClickGitPush('origin')).resolves.toBe(false);
        expect(push).toHaveBeenCalledTimes(1);

        finishPush();
        await expect(first).resolves.toBe(true);
        expect(menuBar.gitActionInFlight).toBe(false);
    });

    test('uses the in-app confirmation before replacing changed work with Git pull', async () => {
        const menuBar = makeMenuBar({
            intl: {formatMessage: message => message.defaultMessage},
            onRequestCloseFile: jest.fn(),
            projectChanged: true
        });
        menuBar.gitActionInFlight = false;
        menuBar.showConfirm = jest.fn(() => Promise.resolve(false));

        await expect(menuBar.handleClickGitPull('origin')).resolves.toBe(false);

        expect(menuBar.showConfirm).toHaveBeenCalledTimes(1);
        expect(pull).not.toHaveBeenCalled();
        expect(menuBar.gitActionInFlight).toBe(false);
    });

    test('uses the in-app prompt for a Git commit message', async () => {
        const menuBar = makeMenuBar({
            intl: {formatMessage: message => message.defaultMessage},
            onGitStatusDone: jest.fn(),
            onRequestCloseFile: jest.fn(),
            onShowGitStatus: jest.fn(),
            vm: {}
        });
        menuBar.gitActionInFlight = false;
        menuBar.showPrompt = jest.fn(() => Promise.resolve('  Fix costumes  '));

        await expect(menuBar.handleClickGitCommit()).resolves.toBe(true);

        expect(commitProject).toHaveBeenCalledWith(expect.objectContaining({message: 'Fix costumes'}));
        expect(menuBar.props.onGitStatusDone).toHaveBeenCalledWith('gitCommitSuccess');
    });

    test('waits for autosave to finish before showing success', async () => {
        let finishSave;
        const handleSaveProject = jest.fn(() => new Promise(resolve => {
            finishSave = resolve;
        }));
        const menuBar = makeMenuBar({
            handleSaveProject,
            projectChanged: true
        });
        menuBar.state = {
            menuBarSettings: {
                autosave_notifications: true,
                autosave_only_when_changed: false
            }
        };
        menuBar.showAutosaveNotification = jest.fn();

        const autosave = menuBar.performAutosave();
        expect(menuBar.showAutosaveNotification).not.toHaveBeenCalled();

        finishSave(true);
        await autosave;
        expect(menuBar.showAutosaveNotification).toHaveBeenCalledWith('Project autosaved.', 'success');
    });

    test('does not claim success when a save is cancelled', async () => {
        const menuBar = makeMenuBar({
            handleSaveProject: jest.fn(() => Promise.resolve(false)),
            projectChanged: true
        });
        menuBar.state = {
            menuBarSettings: {
                autosave_notifications: true,
                autosave_only_when_changed: false
            }
        };
        menuBar.showAutosaveNotification = jest.fn();

        await menuBar.performAutosave();
        expect(menuBar.showAutosaveNotification).not.toHaveBeenCalled();
    });

    test('chooses an MWP destination before exporting or committing history', async () => {
        const writable = {
            close: jest.fn(() => Promise.resolve()),
            write: jest.fn(() => Promise.resolve())
        };
        const showSaveFilePicker = jest.fn(() => Promise.resolve({
            createWritable: () => Promise.resolve(writable),
            name: 'Project.mwp'
        }));
        const menuBar = makeMenuBar({
            onRequestCloseFile: jest.fn(),
            projectTitle: 'Project',
            showSaveFilePicker,
            showToast: jest.fn(),
            vm: {}
        });
        menuBar.mwpSaving = false;
        menuBar.state = {mwpFileHandle: null};
        menuBar.setState = update => Object.assign(menuBar.state, update);

        await expect(menuBar.saveMwp(false)).resolves.toBe(true);

        expect(showSaveFilePicker.mock.invocationCallOrder[0])
            .toBeLessThan(createMwp.mock.invocationCallOrder[0]);
        expect(menuBar.props.showToast).toHaveBeenCalledWith('MistWarp project saved.', 'success');
    });

    test('ignores another MWP save while the first picker is open', async () => {
        let cancelPicker;
        const cancelled = new Error('cancelled');
        cancelled.name = 'AbortError';
        const showSaveFilePicker = jest.fn(() => new Promise((resolve, reject) => {
            cancelPicker = () => reject(cancelled);
        }));
        const menuBar = makeMenuBar({
            onRequestCloseFile: jest.fn(),
            projectTitle: 'Project',
            showSaveFilePicker,
            showToast: jest.fn(),
            vm: {}
        });
        menuBar.mwpSaving = false;
        menuBar.state = {mwpFileHandle: null};

        const firstSave = menuBar.saveMwp(false);
        await expect(menuBar.saveMwp(false)).resolves.toBe(false);
        expect(showSaveFilePicker).toHaveBeenCalledTimes(1);

        cancelPicker();
        await expect(firstSave).resolves.toBe(false);
        expect(createMwp).not.toHaveBeenCalled();
    });

    test('shows an in-app error when an MWP save fails', async () => {
        createMwp.mockRejectedValueOnce(new Error('disk full'));
        const showToast = jest.fn();
        const menuBar = makeMenuBar({
            onRequestCloseFile: jest.fn(),
            projectTitle: 'Project',
            showToast,
            vm: {}
        });
        menuBar.mwpSaving = false;
        menuBar.state = {mwpFileHandle: null};

        await expect(menuBar.saveMwp(false)).resolves.toBe(false);

        expect(showToast).toHaveBeenCalledWith('Could not save MistWarp project: disk full', 'error');
        expect(menuBar.mwpSaving).toBe(false);
    });

    test('does not update undo state after the menu bar unmounts', async () => {
        const workspace = {
            hasUndoStack: jest.fn(() => true),
            hasRedoStack: jest.fn(() => true)
        };
        const menuBar = makeMenuBar({isPlayerOnly: false});
        menuBar.unmounted = true;
        menuBar.ensureScratchBlocks = () => Promise.resolve({
            getMainWorkspace: () => workspace
        });
        menuBar.setState = jest.fn();

        menuBar.updateUndoRedoState();
        await Promise.resolve();

        expect(menuBar.setState).not.toHaveBeenCalled();
    });
});
