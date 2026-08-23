import React from 'react';
import {connect} from 'react-redux';
import {intlShape, injectIntl, defineMessages} from 'react-intl';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {showAlertWithTimeout, showStandardAlert} from '../reducers/alerts';
import {closeLoadingProject, closeRestorePointModal, openLoadingProject} from '../reducers/modals';
import {LoadingStates, getIsShowingProject, onLoadedProject, requestProjectUpload} from '../reducers/project-state';
import {setFileHandle} from '../reducers/tw';
import TWRestorePointModal from '../components/tw-restore-point-modal/restore-point-modal.jsx';
import RestorePointAPI from '../lib/api/restore-points';
import log from '../lib/utils/log';
import downloadBlob from '../lib/utils/download-blob.js';
import {projectFilename} from '../lib/utils/safe-filename.js';

const SAVE_DELAY = 250;
const MINIMUM_SAVE_TIME = 1000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const messages = defineMessages({
    confirmLoad: {
        defaultMessage: 'You have unsaved changes. Replace existing project?',
        description: 'Confirmation that appears when loading a restore point to confirm overwriting unsaved changes.',
        id: 'tw.restorePoints.confirmLoad'
    },
    confirmDelete: {
        defaultMessage: 'Are you sure you want to delete "{projectTitle}"? This cannot be undone.',
        description: 'Confirmation that appears when deleting a restore poinnt',
        id: 'tw.restorePoints.confirmDelete'
    },
    confirmDeleteAll: {
        defaultMessage: 'Are you sure you want to delete ALL restore points? This cannot be undone.',
        description: 'Confirmation that appears when deleting ALL restore points.',
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
            confirmationError: ''
        };
        this.timeout = null;
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
            this.queueRestorePoint();
        }

        RestorePointAPI.deleteLegacyRestorePoint();
        this.props.vm.on('PROJECT_CHANGED', this.handleProjectChanged);
        this.props.vm.on('TRIGGER_MANUAL_RESTORE_POINT', this.handleClickCreate);
    }

    UNSAFE_componentWillReceiveProps (nextProps) {
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
        this.props.vm.off('PROJECT_CHANGED', this.handleProjectChanged);
        this.props.vm.off('TRIGGER_MANUAL_RESTORE_POINT', this.handleClickCreate);
    }

    handleProjectChanged () {
        if (this.props.hasEverEnteredEditor && !this.timeout) {
            this.queueRestorePoint();
        }
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
                title: 'Delete restore point?',
                message: this.props.intl.formatMessage(messages.confirmDelete, {projectTitle: restorePoint.title}),
                action: 'Delete'
            },
            confirmationError: ''
        });
    }

    handleClickDeleteAll () {
        if (this.deleting) return;
        this.setState({
            confirmation: {
                type: 'delete-all',
                title: 'Delete all restore points?',
                message: this.props.intl.formatMessage(messages.confirmDeleteAll),
                action: 'Delete all'
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
        if (this.props.projectChanged) {
            this.setState({
                confirmation: {
                    type: 'load',
                    id,
                    title: 'Replace current project?',
                    message: this.props.intl.formatMessage(messages.confirmLoad),
                    action: 'Load restore point'
                },
                confirmationError: ''
            });
            return;
        }

        return this.loadRestorePoint(id);
    }

    loadRestorePoint (id) {
        if (this.loadingRestorePoint || !this.canLoadProject()) return;

        this.loadingRestorePoint = true;
        this.props.onCloseModal();
        this.props.onStartLoadingRestorePoint(this.props.loadingState);

        const backup = this.props.projectChanged ?
            RestorePointAPI.createSafetyRestorePoint(this.props.vm, this.props.projectTitle) :
            Promise.resolve();
        return backup
            .then(() => RestorePointAPI.loadRestorePoint(this.props.vm, id))
            .then(() => {
                this.props.onFinishLoadingRestorePoint(true, this.props.loadingState);
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
        if (this.timeout || this.state.interval < 0) {
            return;
        }
        this.timeout = setTimeout(() => {
            this.createRestorePoint(RestorePointAPI.TYPE_AUTOMATIC).then(() => {
                this.timeout = null;
            });
        }, this.state.interval);
    }

    cancelQueuedRestorePoint () {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    createRestorePoint (type) {
        if (this.createPromise) return this.createPromise;

        if (this.props.isModalVisible) {
            this.setState({
                loading: true
            });
        }

        this.props.onStartCreatingRestorePoint();
        this.createPromise = Promise.all([
            // Wait a little bit before saving so UI can update before saving, which can cause stutter
            sleep(SAVE_DELAY)
                .then(() => RestorePointAPI.createRestorePoint(this.props.vm, this.props.projectTitle, type))
                .then(() => RestorePointAPI.removeExtraneousRestorePoints()),

            // Force saves to not be instant so people can see that we're making a restore point
            // It also makes refreshes less likely to cause accidental clicks in the modal
            sleep(MINIMUM_SAVE_TIME)
        ])
            .then(() => {
                this.props.onFinishCreatingRestorePoint();
                if (this.props.isModalVisible) {
                    this.refreshState();
                }
            })
            .catch(error => {
                log.error(error);
                this.props.onErrorCreatingRestorePoint();
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
    hasEverEnteredEditor: PropTypes.bool.isRequired,
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
    vm: state.scratchGui.vm
});

export const mapDispatchToProps = dispatch => ({
    onStartCreatingRestorePoint: () => dispatch(showStandardAlert('twCreatingRestorePoint')),
    onFinishCreatingRestorePoint: () => showAlertWithTimeout(dispatch, 'twRestorePointSuccess'),
    onErrorCreatingRestorePoint: () => showAlertWithTimeout(dispatch, 'twRestorePointError'),
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
    onCloseModal: () => dispatch(closeRestorePointModal())
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(TWRestorePointManager));
