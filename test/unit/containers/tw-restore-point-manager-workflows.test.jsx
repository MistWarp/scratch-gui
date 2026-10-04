import {
    TWRestorePointManager,
    mapDispatchToProps
} from '../../../src/containers/tw-restore-point-manager.jsx';
import RestorePointAPI from '../../../src/lib/api/restore-points';
import {setFileHandle} from '../../../src/reducers/tw';
import {showStandardAlert} from '../../../src/reducers/alerts';
import {FIRST_BACKUP_DELAY} from '../../../src/lib/mw/device-backups.js';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

jest.mock('../../../src/lib/api/restore-points', () => ({
    TYPE_AUTOMATIC: 0,
    TYPE_MANUAL: 1,
    readInterval: jest.fn(() => -1),
    createRestorePoint: jest.fn(() => Promise.resolve()),
    removeExtraneousRestorePoints: jest.fn(() => Promise.resolve()),
    createSafetyRestorePoint: jest.fn(() => Promise.resolve()),
    exportRestorePoint: jest.fn(() => Promise.resolve()),
    loadRestorePoint: jest.fn(() => Promise.resolve()),
    deleteRestorePoint: jest.fn(() => Promise.resolve()),
    deleteAllRestorePoints: jest.fn(() => Promise.resolve()),
    getAllRestorePoints: jest.fn(() => Promise.resolve({
        restorePoints: [],
        totalSize: 0
    }))
}));

jest.mock('../../../src/lib/git/browser-git.js', () => ({
    createRepoBackup: jest.fn(async () => jest.fn()), deleteRepo: jest.fn()
}));

const makeManager = overrides => {
    const props = {
        intl: {formatMessage: jest.fn(message => message.defaultMessage)},
        projectChanged: false,
        projectTitle: 'Project',
        onStartCreatingRestorePoint: jest.fn(),
        onFinishCreatingRestorePoint: jest.fn(),
        onErrorCreatingRestorePoint: jest.fn(),
        onShowExportError: jest.fn(),
        onShowLoadError: jest.fn(),
        onStartLoadingRestorePoint: jest.fn(),
        onFinishLoadingRestorePoint: jest.fn(),
        onCloseModal: jest.fn(),
        onOpenModal: jest.fn(),
        onProjectChanged: jest.fn(),
        loadingState: 'SHOWING_WITH_ID',
        isShowingProject: true,
        isModalVisible: false,
        hasEverEnteredEditor: true,
        vm: {
            on: jest.fn(),
            off: jest.fn(),
            loadProject: jest.fn(),
            stop: jest.fn(),
            renderer: {draw: jest.fn()}
        },
        ...overrides
    };
    const manager = new TWRestorePointManager(props);
    manager.setState = update => {
        const nextState = typeof update === 'function' ? update(manager.state, manager.props) : update;
        manager.state = {...manager.state, ...nextState};
    };
    return manager;
};

describe('restore point manager workflows', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('ignores duplicate restore clicks while a restore is loading', async () => {
        let finishLoad;
        RestorePointAPI.loadRestorePoint.mockImplementation(() => new Promise(resolve => {
            finishLoad = resolve;
        }));
        const manager = makeManager();

        manager.handleClickLoad(4);
        const firstLoad = manager.handleConfirmAction();
        manager.handleClickLoad(4);
        for (let i = 0; i < 10; i++) await Promise.resolve();
        expect(RestorePointAPI.loadRestorePoint).toHaveBeenCalledTimes(1);

        finishLoad();
        await firstLoad;
        expect(manager.props.onFinishLoadingRestorePoint).toHaveBeenCalledWith(true, 'SHOWING_WITH_ID');
    });

    test('asks in the app before replacing unsaved work', async () => {
        RestorePointAPI.loadRestorePoint.mockResolvedValueOnce();
        const manager = makeManager({projectChanged: true});

        manager.handleClickLoad(4);
        expect(RestorePointAPI.loadRestorePoint).not.toHaveBeenCalled();
        expect(manager.state.confirmation).toMatchObject({type: 'load', id: 4});

        await manager.handleConfirmAction();
        expect(RestorePointAPI.loadRestorePoint).toHaveBeenCalledWith(manager.props.vm, 4);
    });

    test('asks before deleting and keeps a failed deletion retryable', async () => {
        RestorePointAPI.deleteRestorePoint.mockRejectedValueOnce(new Error('storage unavailable'));
        const manager = makeManager();
        manager.state.restorePoints = [{id: 4, title: 'Earlier version'}];

        manager.handleClickDelete(4);
        expect(RestorePointAPI.deleteRestorePoint).not.toHaveBeenCalled();
        expect(manager.state.confirmation).toMatchObject({type: 'delete', id: 4});

        await manager.handleConfirmAction();
        expect(manager.state.confirmationError).toContain('storage unavailable');
        expect(manager.deleting).toBe(false);
    });

    test('ignores an older refresh response that arrives last', async () => {
        let finishFirst;
        let finishSecond;
        RestorePointAPI.getAllRestorePoints
            .mockImplementationOnce(() => new Promise(resolve => {
                finishFirst = resolve;
            }))
            .mockImplementationOnce(() => new Promise(resolve => {
                finishSecond = resolve;
            }));
        const manager = makeManager();

        const firstRefresh = manager.refreshState();
        const secondRefresh = manager.refreshState();
        finishSecond({restorePoints: [{id: 2}], totalSize: 20});
        await secondRefresh;
        finishFirst({restorePoints: [{id: 1}], totalSize: 10});
        await firstRefresh;

        expect(manager.state.restorePoints).toEqual([{id: 2}]);
        expect(manager.state.totalSize).toBe(20);
    });

    test('keeps the native save destination when loading fails', () => {
        const dispatch = jest.fn();
        const actions = mapDispatchToProps(dispatch);

        actions.onFinishLoadingRestorePoint(false, 'SHOWING_WITH_ID');

        expect(dispatch).not.toHaveBeenCalledWith(setFileHandle(null));
    });

    test('shows an app error and unlocks after an export fails', async () => {
        RestorePointAPI.exportRestorePoint.mockRejectedValueOnce(new Error('storage unavailable'));
        const manager = makeManager();

        await manager.handleClickExport(4);

        expect(manager.props.onShowExportError).toHaveBeenCalledTimes(1);
        expect(manager.isExportingRestorePoint(4)).toBe(false);
    });

    test('shows an app error and unlocks after a restore fails', async () => {
        RestorePointAPI.loadRestorePoint.mockRejectedValueOnce(new Error('damaged restore point'));
        const manager = makeManager();

        manager.handleClickLoad(4);
        await manager.handleConfirmAction();

        expect(manager.props.onShowLoadError).toHaveBeenCalledTimes(1);
        expect(manager.props.onFinishLoadingRestorePoint).toHaveBeenCalledWith(false, 'SHOWING_WITH_ID');
        expect(manager.loadingRestorePoint).toBe(false);
    });

    test('automatic backups stay quiet when they work', async () => {
        RestorePointAPI.createRestorePoint.mockResolvedValueOnce(5);
        const manager = makeManager();

        await manager.createRestorePoint(RestorePointAPI.TYPE_AUTOMATIC);

        expect(RestorePointAPI.createRestorePoint).toHaveBeenCalledTimes(1);
        expect(manager.props.onStartCreatingRestorePoint).not.toHaveBeenCalled();
        expect(manager.props.onFinishCreatingRestorePoint).not.toHaveBeenCalled();
        expect(manager.hasAutomaticBackup).toBe(true);
    });

    test('manual backups show progress and success', async () => {
        const manager = makeManager();

        await manager.createRestorePoint(RestorePointAPI.TYPE_MANUAL);

        expect(manager.props.onStartCreatingRestorePoint).toHaveBeenCalledTimes(1);
        expect(manager.props.onFinishCreatingRestorePoint).toHaveBeenCalledTimes(1);
    });

    test('backup failures always alert with a reason, but repeated automatic ones only once', async () => {
        const quota = new Error('Creating restore point: QuotaExceededError: full');
        RestorePointAPI.createRestorePoint.mockRejectedValue(quota);
        const manager = makeManager();

        await manager.createRestorePoint(RestorePointAPI.TYPE_AUTOMATIC);
        await manager.createRestorePoint(RestorePointAPI.TYPE_AUTOMATIC);
        expect(manager.props.onErrorCreatingRestorePoint).toHaveBeenCalledTimes(1);
        expect(manager.props.onErrorCreatingRestorePoint).toHaveBeenCalledWith('quota');

        await manager.createRestorePoint(RestorePointAPI.TYPE_MANUAL);
        expect(manager.props.onErrorCreatingRestorePoint).toHaveBeenCalledTimes(2);
        RestorePointAPI.createRestorePoint.mockReset();
        RestorePointAPI.createRestorePoint.mockImplementation(() => Promise.resolve());
    });

    test('backup failure alerts stay until dismissed and name the reason', () => {
        const dispatch = jest.fn();
        const actions = mapDispatchToProps(dispatch);

        actions.onErrorCreatingRestorePoint('quota');
        actions.onErrorCreatingRestorePoint('unavailable');
        actions.onErrorCreatingRestorePoint('other');

        expect(dispatch.mock.calls.map(call => call[0])).toEqual([
            showStandardAlert('twRestorePointQuotaError'),
            showStandardAlert('twRestorePointUnavailableError'),
            showStandardAlert('twRestorePointError')
        ]);
    });

    test('the first automatic backup is queued sooner than the interval', () => {
        jest.useFakeTimers();
        try {
            const manager = makeManager();
            manager.state.interval = 5 * 60 * 1000;
            const create = jest.spyOn(manager, 'createRestorePoint').mockResolvedValue();

            manager.handleProjectChanged();
            jest.advanceTimersByTime(FIRST_BACKUP_DELAY);
            expect(create).toHaveBeenCalledWith(RestorePointAPI.TYPE_AUTOMATIC);
            manager.cancelQueuedRestorePoint();

            create.mockClear();
            manager.hasAutomaticBackup = true;
            manager.handleProjectChanged();
            jest.advanceTimersByTime(FIRST_BACKUP_DELAY);
            expect(create).not.toHaveBeenCalled();
            manager.cancelQueuedRestorePoint();
        } finally {
            jest.useRealTimers();
        }
    });

    test('backs up unsaved edits right away when the page is hidden', () => {
        const manager = makeManager({projectChanged: true});
        manager.state.interval = 5 * 60 * 1000;
        const create = jest.spyOn(manager, 'createRestorePoint').mockResolvedValue();

        manager.handlePageHidden({type: 'pagehide'});
        expect(create).not.toHaveBeenCalled();

        manager.changedSinceBackup = true;
        manager.handlePageHidden({type: 'pagehide'});
        expect(create).toHaveBeenCalledWith(RestorePointAPI.TYPE_AUTOMATIC, {immediate: true});

        create.mockClear();
        manager.state.interval = -1;
        manager.handlePageHidden({type: 'pagehide'});
        expect(create).not.toHaveBeenCalled();
    });

    test('offers unsaved work from an earlier session and restores it as unsaved', async () => {
        localStorage.setItem('mw:unsaved-device-backup', JSON.stringify({
            id: 9, title: 'Game', created: 1000, session: 'earlier', alive: 0
        }));
        RestorePointAPI.getAllRestorePoints.mockResolvedValueOnce({restorePoints: [{id: 9}], totalSize: 0});
        RestorePointAPI.loadRestorePoint.mockResolvedValueOnce();
        const manager = makeManager();

        manager.offerUnsavedBackup();
        for (let i = 0; i < 5; i++) await Promise.resolve();
        expect(manager.state.recovery).toEqual({id: 9, title: 'Game', created: 1000});

        await manager.handleRestoreRecovery();
        expect(manager.state.recovery).toBeNull();
        expect(RestorePointAPI.loadRestorePoint).toHaveBeenCalledWith(manager.props.vm, 9);
        expect(manager.props.onProjectChanged).toHaveBeenCalledTimes(1);
    });

    test('does not offer a backup that was deleted, or in embeds', async () => {
        localStorage.setItem('mw:unsaved-device-backup', JSON.stringify({
            id: 9, title: 'Game', created: 1000, session: 'earlier', alive: 0
        }));
        const embedded = makeManager({isEmbedded: true});
        embedded.offerUnsavedBackup();
        expect(RestorePointAPI.getAllRestorePoints).not.toHaveBeenCalled();

        RestorePointAPI.getAllRestorePoints.mockResolvedValueOnce({restorePoints: [{id: 2}], totalSize: 0});
        const manager = makeManager();
        manager.offerUnsavedBackup();
        for (let i = 0; i < 5; i++) await Promise.resolve();
        expect(manager.state.recovery).toBeNull();
    });

    test('remembers a backup of unsaved work for the next session', async () => {
        localStorage.clear();
        RestorePointAPI.createRestorePoint.mockResolvedValueOnce(12);
        const manager = makeManager({projectChanged: true, projectTitle: 'Game'});

        await manager.createRestorePoint(RestorePointAPI.TYPE_AUTOMATIC);

        const record = JSON.parse(localStorage.getItem('mw:unsaved-device-backup'));
        expect(record).toMatchObject({id: 12, title: 'Game'});
        // Saving forgets it again.
        manager.UNSAFE_componentWillReceiveProps({...manager.props, projectChanged: false});
        expect(localStorage.getItem('mw:unsaved-device-backup')).toBeNull();
        // ...but not one another session left behind.
        localStorage.setItem('mw:unsaved-device-backup', JSON.stringify({
            id: 9, title: 'Game', created: 1000, session: 'earlier', alive: 0
        }));
        manager.UNSAFE_componentWillReceiveProps({...manager.props, projectChanged: false});
        expect(localStorage.getItem('mw:unsaved-device-backup')).not.toBeNull();
        localStorage.clear();
    });

    test('shows a dismissible prompt for recoverable work', () => {
        const manager = makeManager();
        manager.state.recovery = {id: 9, title: 'Game', created: Date.UTC(2026, 0, 2, 3, 4)};
        const wrapper = mountWithIntl(manager.render());
        expect(wrapper.text()).toContain('Restore unsaved work from');
        expect(wrapper.text()).toContain('“Game”');

        wrapper.find('button[aria-label="Dismiss"]').simulate('click');
        expect(manager.state.recovery).toBeNull();
        wrapper.unmount();
    });
});
