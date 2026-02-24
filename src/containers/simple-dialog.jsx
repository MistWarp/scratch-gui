import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import SimpleDialog from '../components/simple-dialog/simple-dialog.jsx';
import {closeModal} from '../reducers/modals';

class SimpleDialogContainer extends React.PureComponent {
    handleOk = value => {
        const {onOk, simpleDialogConfig} = this.props;
        this.props.onRequestClose();
        if (onOk) {
            onOk(value);
        }
        if (simpleDialogConfig && simpleDialogConfig.onOk) {
            simpleDialogConfig.onOk(value);
        }
    };

    handleCancel = () => {
        const {onCancel, simpleDialogConfig} = this.props;
        this.props.onRequestClose();
        if (onCancel) {
            onCancel();
        }
        if (simpleDialogConfig && simpleDialogConfig.onCancel) {
            simpleDialogConfig.onCancel();
        }
    };

    render () {
        if (!this.props.simpleDialog || !this.props.simpleDialogConfig) {
            return null;
        }

        const {type, title, message, defaultValue} = this.props.simpleDialogConfig;

        return (
            <SimpleDialog
                type={type}
                title={title}
                message={message}
                defaultValue={defaultValue}
                onOk={this.handleOk}
                onCancel={this.handleCancel}
            />
        );
    }
}

SimpleDialogContainer.propTypes = {
    onRequestClose: PropTypes.func.isRequired,
    simpleDialog: PropTypes.bool,
    simpleDialogConfig: PropTypes.shape({
        type: PropTypes.oneOf(['alert', 'confirm', 'prompt']).isRequired,
        title: PropTypes.string.isRequired,
        message: PropTypes.node.isRequired,
        defaultValue: PropTypes.string,
        onOk: PropTypes.func,
        onCancel: PropTypes.func
    }),
    onOk: PropTypes.func,
    onCancel: PropTypes.func
};

const mapStateToProps = state => ({
    simpleDialog: state.scratchGui.modals.simpleDialog,
    simpleDialogConfig: state.scratchGui.modals.simpleDialogConfig
});

const mapDispatchToProps = dispatch => ({
    onRequestClose: () => dispatch(closeModal('simpleDialog'))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SimpleDialogContainer);
