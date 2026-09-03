import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import GameItemsModalComponent from '../components/mw-game-items-modal/game-items-modal.jsx';
import {closeGameItemsModal, openGameItemsModal} from '../reducers/modals.js';
import {getRememberedPlatformProjectState} from '../lib/community/publish.js';

// Hash-loaded platform projects (#mw-<id>) keep the editor's internal
// projectId unset, so fall back to the remembered platform project.
const resolveProjectId = projectId => {
    if (projectId && projectId !== '0' && projectId !== 0) return projectId;
    const platformProject = getRememberedPlatformProjectState();
    return platformProject && platformProject.id ? String(platformProject.id) : projectId;
};

class MWGameItemsModal extends React.Component {
    componentDidMount () {
        window.__mistwarpGameItemsModalToggle = this.handleToggle;
    }

    componentWillUnmount () {
        if (window.__mistwarpGameItemsModalToggle === this.handleToggle) {
            window.__mistwarpGameItemsModalToggle = null;
        }
    }

    handleToggle = () => {
        if (this.props.visible) {
            this.props.onClose();
        } else {
            this.props.onOpen();
        }
    };

    render () {
        if (!this.props.visible) return null;
        return (
            <GameItemsModalComponent
                onRequestClose={this.props.onClose}
                projectId={this.props.projectId}
                vm={this.props.vm}
            />
        );
    }
}

MWGameItemsModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    projectId: resolveProjectId(state.scratchGui.projectState.projectId),
    visible: state.scratchGui.modals.gameItemsModal,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeGameItemsModal()),
    onOpen: () => dispatch(openGameItemsModal())
});

export {MWGameItemsModal};
export default connect(mapStateToProps, mapDispatchToProps)(MWGameItemsModal);
