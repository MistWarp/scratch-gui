import {MenuBar, mapDispatchToProps} from '../../../src/components/menu-bar/menu-bar.jsx';
import {openExtensionLibrary} from '../../../src/reducers/modals';
import {commitProject, pull, push, repoExists} from '../../../src/lib/git/browser-git';
import {createMwp} from '../../../src/lib/git/mwp.js';
import RestorePointAPI from '../../../src/lib/api/restore-points.js';

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
    ensureProjectHistoryHydrated: jest.fn(() => Promise.resolve()),
    getProjectHistoryState: jest.fn(() => ({phase: 'idle'})),
    preloadProjectHistory: jest.fn(() => Promise.resolve()),
    subscribeProjectHistory: jest.fn()
}));

jest.mock('../../../src/lib/api/restore-points.js', () => ({
    createSafetyRestorePoint: jest.fn(async () => 42)
}));

const intl = {
    formatMessage: (message, values = {}) => message.defaultMessage
        .replace(/\{(\w+)\}/g, (match, name) => (name in values ? values[name] : match))
};

const makeMenuBar = props => {
    const menuBar = Object.create(MenuBar.prototype);
    menuBar.props = props;
    return menuBar;
};

describe('menu bar file workflows', () => {
    test('opens the extension library without a callback from its parent', () => {
        const dispatch = jest.fn();
        const menuBar = makeMenuBar(mapDispatchToProps(dispatch));
        menuBar.handleOpenExtensionLibrary();
        expect(dispatch).toHaveBeenCalledWith(openExtensionLibrary());
    });

    beforeEach(() => {
        createMwp.mockClear();
        createMwp.mockResolvedValue({blob: new Blob()});
        repoExists.mockClear();
        push.mockClear();
        pull.mockClear();
        commitProject.mockClear();
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
            intl: {formatMessage: (message, values) => message.defaultMessage.replace('{error}', values.error)},
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

    test('chooses an MWP destination before exporting uncommitted history', async () => {
        const writable = {
            close: jest.fn(() => Promise.resolve()),
            write: jest.fn(() => Promise.resolve())
        };
        const showSaveFilePicker = jest.fn(() => Promise.resolve({
            createWritable: () => Promise.resolve(writable),
            name: 'Project.mwp'
        }));
        const menuBar = makeMenuBar({
            intl,
            onCloseGitStatus: jest.fn(),
            onGitStatusDone: jest.fn(),
            onRequestCloseFile: jest.fn(),
            onShowGitStatus: jest.fn(),
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
        expect(createMwp).toHaveBeenCalledWith(expect.objectContaining({
            commitChanges: false
        }));
        expect(menuBar.props.onShowGitStatus).toHaveBeenCalledWith('savingMwp');
        expect(showSaveFilePicker.mock.invocationCallOrder[0])
            .toBeLessThan(menuBar.props.onShowGitStatus.mock.invocationCallOrder[0]);
        expect(menuBar.props.onShowGitStatus.mock.invocationCallOrder[0])
            .toBeLessThan(createMwp.mock.invocationCallOrder[0]);
        expect(menuBar.props.onGitStatusDone).toHaveBeenCalledWith('twSaveToDiskSuccess');
        expect(menuBar.props.showToast).not.toHaveBeenCalled();
    });

    test('ignores another MWP save while the first picker is open', async () => {
        let cancelPicker;
        const cancelled = new Error('cancelled');
        cancelled.name = 'AbortError';
        const showSaveFilePicker = jest.fn(() => new Promise((resolve, reject) => {
            cancelPicker = () => reject(cancelled);
        }));
        const menuBar = makeMenuBar({
            intl,
            onCloseGitStatus: jest.fn(),
            onRequestCloseFile: jest.fn(),
            onShowGitStatus: jest.fn(),
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
            intl,
            onCloseGitStatus: jest.fn(),
            onRequestCloseFile: jest.fn(),
            onShowGitStatus: jest.fn(),
            projectTitle: 'Project',
            showToast,
            vm: {}
        });
        menuBar.mwpSaving = false;
        menuBar.state = {mwpFileHandle: null};

        await expect(menuBar.saveMwp(false)).resolves.toBe(false);

        expect(menuBar.props.onShowGitStatus).toHaveBeenCalledWith('savingMwp');
        expect(menuBar.props.onCloseGitStatus).toHaveBeenCalledWith('savingMwp');
        expect(showToast).toHaveBeenCalledWith('Could not save MistWarp project: disk full', 'error');
        expect(menuBar.mwpSaving).toBe(false);
    });

    test('asks before starting a new project when the backup cannot be made', async () => {
        const storageError = new Error('Device backups are not available here.');
        storageError.name = 'StorageUnavailableError';
        RestorePointAPI.createSafetyRestorePoint.mockRejectedValueOnce(storageError);
        const onClickNew = jest.fn();
        const menuBar = makeMenuBar({
            confirmReadyToReplaceProject: jest.fn(() => Promise.resolve(true)),
            intl,
            onClickNew,
            onRequestCloseFile: jest.fn(),
            projectChanged: true,
            showToast: jest.fn()
        });
        menuBar.showConfirm = jest.fn(() => Promise.resolve(false));

        await expect(menuBar.handleClickNew()).resolves.toBe(false);

        expect(menuBar.showConfirm).toHaveBeenCalledWith(
            'Start anyway without a backup?',
            expect.any(String),
            'Start without a backup'
        );
        expect(onClickNew).not.toHaveBeenCalled();
        expect(menuBar.props.showToast).not.toHaveBeenCalled();
    });

    test('starts a new project without a backup once the user agrees', async () => {
        RestorePointAPI.createSafetyRestorePoint.mockRejectedValueOnce(new Error('QuotaExceededError'));
        const onClickNew = jest.fn();
        const menuBar = makeMenuBar({
            confirmReadyToReplaceProject: jest.fn(() => Promise.resolve(true)),
            intl,
            onClickNew,
            onRequestCloseFile: jest.fn(),
            projectChanged: true
        });
        menuBar.showConfirm = jest.fn(() => Promise.resolve(true));

        await expect(menuBar.handleClickNew()).resolves.toBe(true);
        expect(onClickNew).toHaveBeenCalledWith(false);
    });

    test('does not ask about a backup when nothing unsaved would be lost', async () => {
        RestorePointAPI.createSafetyRestorePoint.mockRejectedValueOnce(new Error('QuotaExceededError'));
        const onClickNew = jest.fn();
        const menuBar = makeMenuBar({
            confirmReadyToReplaceProject: jest.fn(() => Promise.resolve(true)),
            intl,
            onClickNew,
            onRequestCloseFile: jest.fn(),
            projectChanged: false
        });
        menuBar.showConfirm = jest.fn();

        await expect(menuBar.handleClickNew()).resolves.toBe(true);
        expect(menuBar.showConfirm).not.toHaveBeenCalled();
        expect(onClickNew).toHaveBeenCalledTimes(1);
    });

    test('shows a plain error if a new project cannot be started', async () => {
        const menuBar = makeMenuBar({
            confirmReadyToReplaceProject: jest.fn(() => Promise.resolve(true)),
            intl,
            onClickNew: jest.fn(() => {
                throw new Error('internal failure');
            }),
            onRequestCloseFile: jest.fn(),
            showToast: jest.fn()
        });
        jest.spyOn(console, 'error').mockImplementationOnce(() => {});

        await expect(menuBar.handleClickNew()).resolves.toBe(false);
        expect(menuBar.props.showToast).toHaveBeenCalledWith(
            'Could not start a new project. Your current project is still open.',
            'error'
        );
    });

    test('Undo and Redo do nothing while the Costumes or Sounds tab is open', () => {
        const menuBar = makeMenuBar({blocksTabVisible: false, isPlayerOnly: false});
        menuBar.state = {canUndo: true, canRedo: true};
        menuBar.ensureScratchBlocks = jest.fn(() => Promise.resolve());

        menuBar.handleClickUndo();
        menuBar.handleClickRedo();

        expect(menuBar.ensureScratchBlocks).not.toHaveBeenCalled();
    });

    test('bookmark shortcuts ignore AltGr and other tabs', () => {
        const menuBar = makeMenuBar({blocksTabVisible: true, isPlayerOnly: false});
        menuBar.handleAddWorkspaceBookmark = jest.fn();
        menuBar.handleSwitchWorkspaceBookmark = jest.fn();
        const press = (props, extra = {}) => {
            menuBar.props = {...menuBar.props, ...props};
            const event = {
                altKey: true,
                ctrlKey: true,
                getModifierState: () => false,
                key: 't',
                preventDefault: jest.fn(),
                target: {tagName: 'DIV'},
                ...extra
            };
            menuBar.handleKeyPress(event);
            return event;
        };

        press({}, {getModifierState: modifier => modifier === 'AltGraph'});
        press({blocksTabVisible: false});
        expect(menuBar.handleAddWorkspaceBookmark).not.toHaveBeenCalled();

        const event = press({blocksTabVisible: true}, {key: '2'});
        expect(event.preventDefault).toHaveBeenCalled();
        expect(menuBar.handleSwitchWorkspaceBookmark).toHaveBeenCalledWith(1);
    });

    test('loads saved bookmarks and never overwrites ones it could not read', async () => {
        const stage = {
            comments: {c: {text: 'WORKSPACE_BOOKMARKS:{damaged'}}
        };
        const menuBar = makeMenuBar({
            intl,
            onRequestCloseWorkspaceBookmarks: jest.fn(),
            vm: {runtime: {getTargetForStage: () => stage}}
        });
        menuBar.state = {workspaceBookmarks: []};
        menuBar.setState = update => Object.assign(menuBar.state, update);
        menuBar.showAlert = jest.fn(() => Promise.resolve());
        menuBar.getCurrentWorkspaceBookmarkState = jest.fn();
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        menuBar.loadWorkspaceBookmarksFromProject();
        await menuBar.handleAddWorkspaceBookmark();
        menuBar.saveWorkspaceBookmarksToProject();

        expect(menuBar.showAlert).toHaveBeenCalledTimes(1);
        expect(menuBar.getCurrentWorkspaceBookmarkState).not.toHaveBeenCalled();
        expect(stage.comments.c.text).toBe('WORKSPACE_BOOKMARKS:{damaged');
        console.warn.mockRestore();

        stage.comments.c.text = 'WORKSPACE_BOOKMARKS:{"bookmarks":[{"name":"Loop"}]}';
        menuBar.loadWorkspaceBookmarksFromProject();
        expect(menuBar.state.workspaceBookmarks).toEqual([{name: 'Loop'}]);
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
