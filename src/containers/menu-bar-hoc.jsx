import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import React from 'react';
import {openSimpleDialog} from '../reducers/modals';
import ToastNotification from '../components/toast-notification/toast-notification.jsx';
import smartSave from '../lib/mw/smart-save.js';
import {setProjectUnchanged} from '../reducers/project-changed';

const shouldConfirmProjectReplacement = ({projectChanged, canSave}) => projectChanged && !canSave;

const MenuBarHOC = function (WrappedComponent) {
    class MenuBarContainer extends React.PureComponent {
        constructor (props) {
            super(props);

            bindAll(this, [
                'confirmReadyToReplaceProject',
                'handleSaveProject',
                'shouldSaveBeforeTransition',
                'showToast'
            ]);
        }
        confirmReadyToReplaceProject (message) {
            if (!shouldConfirmProjectReplacement(this.props)) return true;
            if (this.props.confirmWithMessage) return this.props.confirmWithMessage(message);
            return new Promise(resolve => {
                this.props.openSimpleDialog({
                    type: 'confirm',
                    title: 'Replace this project?',
                    message,
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false)
                });
            });
        }
        shouldSaveBeforeTransition () {
            return (this.props.canSave && this.props.projectChanged);
        }
        handleSaveProject () {
            return smartSave({
                vm: this.props.vm,
                title: this.props.projectTitle,
                onSaved: this.props.onProjectUnchanged
            });
        }

        showToast (message, type = 'info') {
            this.props.showToast(message, type);
        }

        render () {
            const {
                /* eslint-disable no-unused-vars */
                projectChanged,
                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return (
                <React.Fragment>
                    <WrappedComponent
                        confirmReadyToReplaceProject={this.confirmReadyToReplaceProject}
                        shouldSaveBeforeTransition={this.shouldSaveBeforeTransition}
                        openSimpleDialog={this.props.openSimpleDialog}
                        showToast={this.showToast}
                        {...{handleSaveProject: this.handleSaveProject}}
                        {...props}
                    />
                    <ToastNotification
                        message={this.props.toastMessage}
                        sequence={this.props.toastSequence}
                        type={this.props.toastType}
                        visible={this.props.toastVisible}
                        onClose={this.props.handleHideToast}
                    />
                </React.Fragment>
            );
        }
    }

    MenuBarContainer.propTypes = {
        canCreateNew: PropTypes.bool,
        canSave: PropTypes.bool,
        confirmWithMessage: PropTypes.func,
        handleHideToast: PropTypes.func.isRequired,
        openSimpleDialog: PropTypes.func.isRequired,
        onProjectUnchanged: PropTypes.func.isRequired,
        projectChanged: PropTypes.bool,
        projectTitle: PropTypes.string,
        showToast: PropTypes.func.isRequired,
        toastVisible: PropTypes.bool,
        toastMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        toastSequence: PropTypes.number,
        toastType: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
        vm: PropTypes.object.isRequired // eslint-disable-line react/forbid-prop-types
    };
    const mapStateToProps = state => ({
        projectChanged: state.scratchGui.projectChanged,
        projectTitle: state.scratchGui.projectTitle,
        toastVisible: state.scratchGui.toast && state.scratchGui.toast.visible,
        toastMessage: state.scratchGui.toast && state.scratchGui.toast.message,
        toastSequence: state.scratchGui.toast && state.scratchGui.toast.sequence,
        toastType: state.scratchGui.toast && state.scratchGui.toast.type,
        vm: state.scratchGui.vm
    });
    const mapDispatchToProps = dispatch => ({
        openSimpleDialog: config => dispatch(openSimpleDialog(config)),
        onProjectUnchanged: () => dispatch(setProjectUnchanged()),
        showToast: (message, type) => dispatch({
            type: 'scratch-gui/SHOW_TOAST',
            message,
            toastType: type
        }),
        handleHideToast: () => dispatch({
            type: 'scratch-gui/HIDE_TOAST'
        })
    });
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(MenuBarContainer);
};

export default MenuBarHOC;

export {shouldConfirmProjectReplacement};
