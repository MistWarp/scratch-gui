import {withProjectReplacement} from '../lib/project-replacement.js';
import {detachWorkspace} from '../lib/workspace-state.js';
import {deleteRepo} from '../lib/git/browser-git.js';
import React from 'react';
import {connect} from 'react-redux';
import {intlShape, injectIntl, defineMessages} from 'react-intl';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {showAlertWithTimeout, showStandardAlert} from '../reducers/alerts';
import {
    closeLoadingProject,
    closeRestorePointModal,
    openLoadingProject,
    openRestorePointModal
} from '../reducers/modals';
import {LoadingStates, getIsShowingProject, onLoadedProject, requestProjectUpload} from '../reducers/project-state';
import {setFileHandle} from '../reducers/tw';
import {setProjectChanged} from '../reducers/project-changed';
import TWRestorePointModal from '../components/tw-restore-point-modal/restore-point-modal.jsx';
import RecoveryPrompt from '../components/tw-restore-point-modal/recovery-prompt.jsx';
import RestorePointAPI from '../lib/api/restore-points';
import {
    HEARTBEAT_INTERVAL,
    forgetUnsavedBackup,
    getBackupDelay,
    getBackupErrorKind,
    rememberUnsavedBackup,
    takeUnsavedBackup,
    touchUnsavedBackup,
    waitForQuietMoment
} from '../lib/mw/device-backups.js';
import log from '../lib/utils/log';
import downloadBlob from '../lib/utils/download-blob.js';
import {projectFilename} from '../lib/utils/safe-filename.js';

const SAVE_DELAY = 250;
const MINIMUM_SAVE_TIME = 1000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const BACKUP_ERROR_ALERTS = {
    quota: 'twRestorePointQuotaError',
    unavailable: 'twRestorePointUnavailableError',
    other: 'twRestorePointError'
};

const messages = defineMessages({
    confirmLoad: {
        // eslint-disable-next-line max-len
        defaultMessage: 'Your current code will be kept in Device backups first. Your saved MistWarp project will stay unchanged. Cancel keeps the current workspace open.',
        description: 'Confirmation that appears when loading a device backup to confirm overwriting unsaved changes.',
        id: 'mw.restorePoints.confirmLoad'
    },
    confirmLoadTitle: {
        defaultMessage: 'Open this backup in a new workspace?',
        description: 'Title of the confirmation that appears when loading a device backup',
        id: 'mw.restorePoints.confirmLoadTitle'
    },
    confirmLoadAction: {
        defaultMessage: 'Back up and open workspace',
        description: 'Button that confirms loading a device backup',
        id: 'mw.restorePoints.confirmLoadAction'
    },
    confirmDeleteTitle: {
        defaultMessage: 'Delete this device backup?',
        description: 'Title of the confirmation that appears when deleting one device backup',
        id: 'mw.restorePoints.confirmDeleteTitle'
    },
    confirmDeleteAction: {
        defaultMessage: 'Delete',
        description: 'Button that confirms deleting one device backup',
        id: 'mw.restorePoints.confirmDeleteAction'
    },
    confirmDeleteAllTitle: {
        defaultMessage: 'Delete all device backups?',
        description: 'Title of the confirmation that appears when deleting every device backup',
        id: 'mw.restorePoints.confirmDeleteAllTitle'
    },
    confirmDeleteAllAction: {
        defaultMessage: 'Delete all',
        description: 'Button that confirms deleting every device backup',
        id: 'mw.restorePoints.confirmDeleteAllAction'
    },
    confirmDelete: {
        defaultMessage: 'Are you sure you want to delete "{projectTitle}"? This cannot be undone.',
        description: 'Confirmation that appears when deleting a restore poinnt',
        id: 'tw.restorePoints.confirmDelete'
    },
    confirmDeleteAll: {
        defaultMessage: 'Are you sure you want to delete ALL device backups? This cannot be undone.',
        description: 'Confirmation that appears when deleting ALL device backups.',
        id: 'tw.restorePoints.confirmDeleteAll'
    }
});

export class TWRestorePointManager extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleProjectChanged',
            'handleClickCreate',
            'handleClickDelete',
            'handleClickDeleteAll',
            'handleClickRefresh',
            'handleChangeInterval',
            'handleClickExport',
            'handleClickLoad',
            'handleConfirmAction',
            'handleCancelAction',
            'handlePageHidden',
            'handleRestoreRecovery',
            'handleDismissRecovery',
            'handleViewRecoveryBackups',
            'isExportingRestorePoint'
        ]);
        this.state = {
            loading: true,
            totalSize: 0,
            restorePoints: [],
            error: null,
            interval: RestorePointAPI.readInterval(),
            exportingRestorePoints: [],
            confirmation: null,
            confirmationError: '',
            recovery: null
        };
        this.timeout = null;
        // Whether an automatic backup has run, which ends the shorter first delay.
        this.hasAutomaticBackup = false;
        // Edits made since the last backup started, so hiding the page twice
        // does not back up the same state twice.
        this.changedSinceBackup = false;
        // Repeated automatic failures alert once until a backup works again.
        this.automaticFailureShown = false;
        this.createPromise = null;
        this.deleting = false;
        this.loadingRestorePoint = false;
        this.exportingRestorePoints = new Set();
        this.refreshRequest = 0;
        this.unmounted = false;
    }

    componentDidMount () {
        // This helps reduce problems when people constantly enter and leave the editor which
        // causes this component to re-mount. Still not perfect though, ideally we would
        // compensate for time already passed.
        if (this.props.projectChanged && this.props.hasEverEnteredEditor) {
            this.changedSinceBackup = true;
            this.queueRestorePoint();
        }

        RestorePointAPI.deleteLegacyRestorePoint();
        this.props.vm.on('PROJECT_CHANGED', this.handleProjectChanged);
        this.props.vm.on('TRIGGER_MANUAL_RESTORE_POINT', this.handleClickCreate);
        document.addEventListener('visibilitychange', this.handlePageHidden);
        window.addEventListener('pagehide', this.handlePageHidden);
        this.heartbeat = setInterval(() => touchUnsavedBackup(), HEARTBEAT_INTERVAL);
        this.offerUnsavedBackup();
    }

    UNSAFE_componentWillReceiveProps (nextProps) {
        // Saved (or replaced): the backup no longer holds unsaved work.
        if (this.props.projectChanged && !nextProps.projectChanged) {
            forgetUnsavedBackup();
        }
        if (nextProps.isModalVisible && !this.props.isModalVisible) {
            this.refreshState();
        } else if (!nextProps.isModalVisible && this.props.isModalVisible) {
            this.setState({
                restorePoints: [],
                confirmation: null,
                confirmationError: ''
            });
        }
    }

    componentWillUnmount () {
        this.unmounted = true;
        this.refreshRequest++;
        this.cancelQueuedRestorePoint();
        clearInterval(this.heartbeat);
        this.props.vm.off('PROJECT_CHANGED', this.handleProjectChanged);
        this.props.vm.off('TRIGGER_MANUAL_RESTORE_POINT', this.handleClickCreate);
        document.removeEventListener('visibilitychange', this.handlePageHidden);
        window.removeEventListener('pagehide', this.handlePageHidden);
    }

    handleProjectChanged () {
        this.changedSinceBackup = true;
        if (this.props.hasEverEnteredEditor && !this.timeout) {
            this.queueRestorePoint();
        }
    }

    // Leaving the tab is when work is most often lost (closed tab, crash,
    // phone killing the page), so back up unsaved edits right away. Best
    // effort: the page may be gone before the backup finishes.
    handlePageHidden (event) {
        const closing = event && event.type === 'pagehide';
        if (!closing && document.visibilityState !== 'hidden') return;
        if (this.props.projectChanged && this.changedSinceBackup && this.props.hasEverEnteredEditor &&
            this.state.interval >= 0 && !this.createPromise) {
            this.cancelQueuedRestorePoint();
            this.createRestorePoint(RestorePointAPI.TYPE_AUTOMATIC, {immediate: true});
        }
        touchUnsavedBackup(closing);
    }

    // Offer, once, a backup an earlier session made of work it never saved.
    offerUnsavedBackup () {
        if (this.props.isPlayerOnly || this.props.isEmbedded) return;
        const backup = takeUnsavedBackup();
        if (!backup) return;
        RestorePointAPI.getAllRestorePoints()
            .then(({restorePoints}) => {
                if (this.unmounted) return;
                if (restorePoints.some(restorePoint => restorePoint.id === backup.id)) {
                    this.setState({recovery: backup});
                }
            })
            .catch(error => {
                log.warn('Could not check for unsaved work', error);
            });
    }

    handleRestoreRecovery () {
        const recovery = this.state.recovery;
        if (!recovery || this.loadingRestorePoint || !this.canLoadProject()) return;
        this.setState({recovery: null});
        // The current project is backed up first (see project-replacement.js),
        // so this is safe without another confirmation.
        return this.loadRestorePoint(recovery.id, {unsavedWork: true});
    }

    handleDismissRecovery () {
        this.setState({recovery: null});
    }

    handleViewRecoveryBackups () {
        this.setState({recovery: null});
        this.props.onOpenModal();
    }

    handleClickCreate () {
        return this.createRestorePoint(RestorePointAPI.TYPE_MANUAL);
    }

    handleClickRefresh () {
        return this.refreshState();
    }

    handleClickDelete (id) {
        if (this.deleting) return;

        const restorePoint = this.state.restorePoints.find(i => i.id === id);
        if (!restorePoint) return;

        this.setState({
            confirmation: {
                type: 'delete',
                id,
                title: this.props.intl.formatMessage(messages.confirmDeleteTitle),
                message: this.props.intl.formatMessage(messages.confirmDelete, {projectTitle: restorePoint.title}),
                action: this.props.intl.formatMessage(messages.confirmDeleteAction)
            },
            confirmationError: ''
        });
    }

    handleClickDeleteAll () {
        if (this.deleting) return;
        this.setState({
            confirmation: {
                type: 'delete-all',
                title: this.props.intl.formatMessage(messages.confirmDeleteAllTitle),
                message: this.props.intl.formatMessage(messages.confirmDeleteAll),
                action: this.props.intl.formatMessage(messages.confirmDeleteAllAction)
            },
            confirmationError: ''
        });
    }

    canLoadProject () {
        // Loading a project now would break the state machine.
        return this.props.isShowingProject;
    }

    handleClickExport (id) {
        if (this.exportingRestorePoints.has(id)) {
            return;
        }

        this.exportingRestorePoints.add(id);
        this.setState(oldState => ({
            exportingRestorePoints: [...oldState.exportingRestorePoints, id]
        }));

        const removeFromExportingList = () => {
            this.exportingRestorePoints.delete(id);
            if (this.unmounted) return;
            this.setState(oldState => ({
                exportingRestorePoints: oldState.exportingRestorePoints.filter(i => i !== id)
            }));
        };

        return RestorePointAPI.exportRestorePoint(id)
            .then(result => {
                downloadBlob(projectFilename(result.title, 'restore-point', 'sb3'), result.blob);
                removeFromExportingList();
            })
            .catch(error => {
                log.error(error);
                this.props.onShowExportError();
                removeFromExportingList();
            });
    }

    isExportingRestorePoint (id) {
        return this.state.exportingRestorePoints.includes(id);
    }

    handleClickLoad (id) {
        if (this.loadingRestorePoint || !this.canLoadProject()) {
            return;
        }
        this.setState({
            confirmation: {
                type: 'load',
                id,
                title: this.props.intl.formatMessage(messages.confirmLoadTitle),
                message: this.props.intl.formatMessage(messages.confirmLoad),
                action: this.props.intl.formatMessage(messages.confirmLoadAction)
            },
            confirmationError: ''
        });
    }

    loadRestorePoint (id, {unsavedWork = false} = {}) {
        if (this.loadingRestorePoint || !this.canLoadProject()) return;

        this.loadingRestorePoint = true;
        this.props.onCloseModal();
        this.props.onStartLoadingRestorePoint(this.props.loadingState);

        return withProjectReplacement(this.props.vm, this.props.projectTitle || 'Before opening a backup', async () => {
            await RestorePointAPI.loadRestorePoint(this.props.vm, id);
            await deleteRepo();
        })
            .then(() => {
                detachWorkspace(this.props.vm);
                this.props.onFinishLoadingRestorePoint(true, this.props.loadingState);
                // Recovered work was never saved, so keep warning before it is lost again.
                if (unsavedWork) this.props.onProjectChanged();
                setTimeout(() => {
                    this.props.vm.renderer.draw();
                });
            })
            .catch(error => {
                log.error(error);
                this.props.onShowLoadError();
                this.props.onFinishLoadingRestorePoint(false, this.props.loadingState);
            })
            .then(() => {
                this.loadingRestorePoint = false;
            });
    }

    handleCancelAction () {
        if (this.deleting || this.loadingRestorePoint) return;
        this.setState({confirmation: null, confirmationError: ''});
    }

    handleConfirmAction () {
        const {confirmation} = this.state;
        if (!confirmation || this.deleting || this.loadingRestorePoint) return;
        if (confirmation.type === 'load') {
            this.setState({confirmation: null, confirmationError: ''});
            return this.loadRestorePoint(confirmation.id);
        }

        this.deleting = true;
        this.setState({confirmationError: ''});
        const deletion = confirmation.type === 'delete' ?
            RestorePointAPI.deleteRestorePoint(confirmation.id) : RestorePointAPI.deleteAllRestorePoints();
        return deletion
            .then(() => {
                this.setState({confirmation: null, confirmationError: ''});
                return this.refreshState();
            })
            .catch(error => {
                log.error('Restore point deletion error', error);
                this.setState({confirmationError: `${error}`});
            })
            .then(() => {
                this.deleting = false;
                if (!this.unmounted) this.forceUpdate();
            });
    }

    handleChangeInterval (e) {
        const interval = +e.target.value;
        RestorePointAPI.setInterval(interval);
        this.setState({
            interval
        }, () => {
            if (this.timeout) {
                this.cancelQueuedRestorePoint();
                this.queueRestorePoint();
            }
        });
    }

    queueRestorePoint () {
        const delay = getBackupDelay(this.state.interval, this.hasAutomaticBackup);
        if (this.timeout || delay < 0) {
            return;
        }
        this.timeout = setTimeout(() => {
            this.createRestorePoint(RestorePointAPI.TYPE_AUTOMATIC).then(() => {
                this.timeout = null;
            });
        }, delay);
    }

    cancelQueuedRestorePoint () {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    createRestorePoint (type, {immediate = false} = {}) {
        if (this.createPromise) return this.createPromise;

        // Automatic backups stay quiet unless they fail; manual ones show progress.
        const manual = type !== RestorePointAPI.TYPE_AUTOMATIC;
        if (this.props.isModalVisible) {
            this.setState({
                loading: true
            });
        }

        if (manual) this.props.onStartCreatingRestorePoint();
        let createdId;
        this.createPromise = Promise.all([
            // Serialising the project blocks the page. Manual backups wait a little so the UI can
            // update first; automatic ones wait until the project stops running and the page is idle.
            (manual ? sleep(SAVE_DELAY) : waitForQuietMoment(this.props.vm, {immediate}))
                .then(() => {
                    this.changedSinceBackup = false;
                    return RestorePointAPI.createRestorePoint(this.props.vm, this.props.projectTitle, type);
                })
                .then(id => {
                    createdId = id;
                    return RestorePointAPI.removeExtraneousRestorePoints();
                }),

            // Force saves to not be instant so people can see that we're making a restore point
            // It also makes refreshes less likely to cause accidental clicks in the modal
            manual ? sleep(MINIMUM_SAVE_TIME) : null
        ])
            .then(() => {
                if (manual) {
                    this.props.onFinishCreatingRestorePoint();
                } else {
                    this.hasAutomaticBackup = true;
                }
                this.automaticFailureShown = false;
                if (this.props.projectChanged && typeof createdId !== 'undefined') {
                    rememberUnsavedBackup({id: createdId, title: this.props.projectTitle, created: Date.now()});
                }
                if (this.props.isModalVisible) {
                    this.refreshState();
                }
            })
            .catch(error => {
                log.error(error);
                this.changedSinceBackup = true;
                if (manual || !this.automaticFailureShown) {
                    this.automaticFailureShown = !manual;
                    this.props.onErrorCreatingRestorePoint(getBackupErrorKind(error));
                }
                if (this.props.isModalVisible) {
                    this.refreshState();
                }
                return false;
            })
            .then(result => {
                this.createPromise = null;
                return result;
            });
        return this.createPromise;
    }

    refreshState () {
        const request = ++this.refreshRequest;
        this.setState({
            loading: true,
            error: null,
            restorePoints: []
        });
        return RestorePointAPI.getAllRestorePoints()
            .then(data => {
                if (this.unmounted || request !== this.refreshRequest) return false;
                this.setState({
                    loading: false,
                    totalSize: data.totalSize,
                    restorePoints: data.restorePoints
                });
                return true;
            })
            .catch(error => {
                if (this.unmounted || request !== this.refreshRequest) return false;
                this.handleModalError(error);
                return false;
            });
    }

    handleModalError (error) {
        log.error('Restore point error', error);
        this.setState({
            error: `${error}`,
            loading: false
        });
    }

    render () {
        if (this.state.recovery && !this.props.isModalVisible) {
            return (
                <RecoveryPrompt
                    created={this.state.recovery.created}
                    disabled={!this.props.isShowingProject}
                    title={this.state.recovery.title}
                    onDismiss={this.handleDismissRecovery}
                    onRestore={this.handleRestoreRecovery}
                    onViewAll={this.handleViewRecoveryBackups}
                />
            );
        }
        if (this.props.isModalVisible) {
            return (
                <TWRestorePointModal
                    onClose={this.props.onCloseModal}
                    onClickCreate={this.handleClickCreate}
                    onClickDelete={this.handleClickDelete}
                    onClickDeleteAll={this.handleClickDeleteAll}
                    onClickExport={this.handleClickExport}
                    onClickLoad={this.handleClickLoad}
                    onClickRefresh={this.handleClickRefresh}
                    interval={this.state.interval}
                    onChangeInterval={this.handleChangeInterval}
                    isExporting={this.isExportingRestorePoint}
                    isLoading={this.state.loading}
                    totalSize={this.state.totalSize}
                    restorePoints={this.state.restorePoints}
                    error={this.state.error}
                    confirmation={this.state.confirmation}
                    confirmationBusy={this.deleting}
                    confirmationError={this.state.confirmationError}
                    onCancelConfirmation={this.handleCancelAction}
                    onConfirm={this.handleConfirmAction}
                />
            );
        }
        return null;
    }
}

TWRestorePointManager.propTypes = {
    intl: intlShape,
    projectChanged: PropTypes.bool.isRequired,
    projectTitle: PropTypes.string.isRequired,
    onStartCreatingRestorePoint: PropTypes.func.isRequired,
    onFinishCreatingRestorePoint: PropTypes.func.isRequired,
    onErrorCreatingRestorePoint: PropTypes.func.isRequired,
    onShowExportError: PropTypes.func.isRequired,
    onShowLoadError: PropTypes.func.isRequired,
    onStartLoadingRestorePoint: PropTypes.func.isRequired,
    onFinishLoadingRestorePoint: PropTypes.func.isRequired,
    onCloseModal: PropTypes.func.isRequired,
    loadingState: PropTypes.oneOf(LoadingStates).isRequired,
    isShowingProject: PropTypes.bool.isRequired,
    isModalVisible: PropTypes.bool.isRequired,
    isEmbedded: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    hasEverEnteredEditor: PropTypes.bool.isRequired,
    onOpenModal: PropTypes.func,
    onProjectChanged: PropTypes.func,
    vm: PropTypes.shape({
        on: PropTypes.func.isRequired,
        off: PropTypes.func.isRequired,
        loadProject: PropTypes.func.isRequired,
        stop: PropTypes.func.isRequired,
        renderer: PropTypes.shape({
            draw: PropTypes.func.isRequired
        })
    }).isRequired
};

const mapStateToProps = state => ({
    projectChanged: state.scratchGui.projectChanged,
    projectTitle: state.scratchGui.projectTitle,
    loadingState: state.scratchGui.projectState.loadingState,
    isShowingProject: getIsShowingProject(state.scratchGui.projectState.loadingState),
    isModalVisible: state.scratchGui.modals.restorePointModal,
    hasEverEnteredEditor: state.scratchGui.mode.hasEverEnteredEditor,
    isEmbedded: state.scratchGui.mode.isEmbedded,
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
    vm: state.scratchGui.vm
});

export const mapDispatchToProps = dispatch => ({
    onStartCreatingRestorePoint: () => dispatch(showStandardAlert('twCreatingRestorePoint')),
    onFinishCreatingRestorePoint: () => showAlertWithTimeout(dispatch, 'twRestorePointSuccess'),
    // Failures stay until dismissed and offer a download instead.
    onErrorCreatingRestorePoint: kind => dispatch(showStandardAlert(BACKUP_ERROR_ALERTS[kind] ||
        BACKUP_ERROR_ALERTS.other)),
    onShowExportError: () => dispatch(showStandardAlert('twRestorePointExportError')),
    onShowLoadError: () => dispatch(showStandardAlert('twRestorePointLoadError')),
    onStartLoadingRestorePoint: loadingState => {
        dispatch(openLoadingProject());
        dispatch(requestProjectUpload(loadingState));
    },
    onFinishLoadingRestorePoint: (success, loadingState) => {
        dispatch(onLoadedProject(loadingState, false, success));
        dispatch(closeLoadingProject());
        if (success) dispatch(setFileHandle(null));
    },
    onCloseModal: () => dispatch(closeRestorePointModal()),
    onOpenModal: () => dispatch(openRestorePointModal()),
    onProjectChanged: () => dispatch(setProjectChanged())
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(TWRestorePointManager));
