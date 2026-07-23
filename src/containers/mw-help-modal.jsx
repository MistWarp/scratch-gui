import {connect} from 'react-redux';
import React from 'react';
import PropTypes from 'prop-types';

import HelpModal from '../components/mw-help-modal/help-modal.jsx';
import {closeHelpModal} from '../reducers/modals.js';

const MWHelpModal = props => {
    if (!props.visible) return null;
    return (
        <HelpModal
            selectedId={props.helpEntry}
            onClose={props.onClose}
        />
    );
};

MWHelpModal.propTypes = {
    visible: PropTypes.bool,
    helpEntry: PropTypes.string,
    onClose: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    visible: state.scratchGui.modals.helpModal,
    helpEntry: state.scratchGui.modals.helpEntry
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeHelpModal())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MWHelpModal);
