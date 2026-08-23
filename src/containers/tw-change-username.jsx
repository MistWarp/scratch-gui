import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {openUsernameModal} from '../reducers/modals';
import {closeEditMenu} from '../reducers/menus';
import {showStandardAlert} from '../reducers/alerts';
import isScratchDesktop from '../lib/utils/isScratchDesktop';

class ChangeUsername extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'changeUsername'
        ]);
    }
    changeUsername () {
        if (this.props.running && !isScratchDesktop()) {
            this.props.onShowUnavailable();
            return;
        }
        this.props.onOpenUsernameModal();
    }
    render () {
        return this.props.children(this.changeUsername);
    }
}

ChangeUsername.propTypes = {
    children: PropTypes.func,
    onOpenUsernameModal: PropTypes.func,
    onShowUnavailable: PropTypes.func,
    running: PropTypes.bool
};

const mapStateToProps = state => ({
    running: state.scratchGui.vmStatus.running
});

const mapDispatchToProps = dispatch => ({
    onOpenUsernameModal: () => {
        dispatch(openUsernameModal());
        dispatch(closeEditMenu());
    },
    onShowUnavailable: () => {
        dispatch(closeEditMenu());
        dispatch(showStandardAlert('usernameChangeUnavailable'));
    }
});

export {
    ChangeUsername
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ChangeUsername);
