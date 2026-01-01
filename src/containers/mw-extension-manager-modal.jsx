import {connect} from 'react-redux';
import React from 'react';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';

import ExtensionManagerModal from '../components/mw-extension-manager-modal/extension-manager-modal.jsx';
import {closeExtensionManagerModal} from '../reducers/modals.js';

const mapStateToProps = state => ({
    visible: state.scratchGui.modals.extensionManagerModal,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeExtensionManagerModal())
});

const mergeProps = (stateProps, dispatchProps, ownProps) => {
    if (!stateProps.visible) return {visible: false};
    return {
        ...ownProps,
        ...stateProps,
        ...dispatchProps
    };
};

const MWExtensionManagerModal = props => (props.visible ? (
    <ExtensionManagerModal
        vm={props.vm}
        onClose={props.onClose}
    />
) : null);

MWExtensionManagerModal.propTypes = {
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM),
    onClose: PropTypes.func
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
)(MWExtensionManagerModal);
