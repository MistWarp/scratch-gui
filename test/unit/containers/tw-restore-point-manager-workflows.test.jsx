import {
    TWRestorePointManager,
    mapDispatchToProps
} from '../../../src/containers/tw-restore-point-manager.jsx';
import RestorePointAPI from '../../../src/lib/api/restore-points';
import {setFileHandle} from '../../../src/reducers/tw';

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

        const firstLoad = manager.handleClickLoad(4);
        manager.handleClickLoad(4);
        await Promise.resolve();
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

        await manager.handleClickLoad(4);

        expect(manager.props.onShowLoadError).toHaveBeenCalledTimes(1);
        expect(manager.props.onFinishLoadingRestorePoint).toHaveBeenCalledWith(false, 'SHOWING_WITH_ID');
        expect(manager.loadingRestorePoint).toBe(false);
    });
});
