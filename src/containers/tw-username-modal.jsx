import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {setUsername, setUsernameInvalid} from '../reducers/tw';
import UsernameModalComponent from '../components/tw-username-modal/username-modal.jsx';
import {closeUsernameModal} from '../reducers/modals';
import {setRoturUsernameOverride} from '../reducers/rotur';
import {setUsernameOverride} from '../lib/rotur/cloud-sync.js';
import {generateRandomUsername} from '../lib/utils/tw-username';
import isScratchDesktop from '../lib/utils/isScratchDesktop';

class UsernameModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleKeyPress',
            'handleFocus',
            'handleOk',
            'handleCancel',
            'handleChange',
            'handleReset'
        ]);
        this.state = {
            value: this.props.username,
            valueValid: !this.props.usernameInvalid
        };
    }
    handleKeyPress (event) {
        if (event.key === 'Enter' && this.state.valueValid) {
            this.handleOk();
        }
    }
    handleFocus (event) {
        event.target.select();
    }
    handleOk () {
        if (this.props.roturUsername) {
            const isOwnHandle = this.state.value.toLowerCase() === `@${this.props.roturUsername}`.toLowerCase();
            this.props.onSetRoturUsernameOverride(isOwnHandle ? null : this.state.value);
        } else {
            this.props.onSetUsername(this.state.value);
        }
        this.props.onCloseUsernameModal();
    }
    handleCancel () {
        this.props.onCloseUsernameModal();
    }
    handleChange (e) {
        this.setState({
            value: e.target.value,
            valueValid: e.target.checkValidity()
        });
    }
    handleReset () {
        this.props.onCloseUsernameModal();
        if (this.props.roturUsername) {
            this.props.onSetRoturUsernameOverride(null);
            return;
        }
        this.props.onSetUsername(isScratchDesktop() ? 'player' : generateRandomUsername());
    }
    render () {
        return (
            <UsernameModalComponent
                mustChangeUsername={this.props.usernameInvalid}
                roturUsername={this.props.roturUsername}
                value={this.state.value}
                valueValid={this.state.valueValid}
                onKeyPress={this.handleKeyPress}
                onFocus={this.handleFocus}
                onOk={this.handleOk}
                onCancel={this.handleCancel}
                onChange={this.handleChange}
                onReset={this.handleReset}
            />
        );
    }
}

UsernameModal.propTypes = {
    onCloseUsernameModal: PropTypes.func,
    onSetUsername: PropTypes.func,
    onSetRoturUsernameOverride: PropTypes.func,
    roturUsername: PropTypes.string,
    username: PropTypes.string,
    usernameInvalid: PropTypes.bool
};

const mapStateToProps = state => ({
    username: state.scratchGui.tw.username,
    usernameInvalid: state.scratchGui.tw.usernameInvalid,
    roturUsername: state.scratchGui.rotur.username
});

const mapDispatchToProps = dispatch => ({
    onCloseUsernameModal: () => dispatch(closeUsernameModal()),
    onSetUsername: username => {
        dispatch(setUsername(username));
        dispatch(setUsernameInvalid(false));
    },
    onSetRoturUsernameOverride: username => {
        setUsernameOverride(username);
        dispatch(setRoturUsernameOverride(username));
        dispatch(setUsernameInvalid(false));
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(UsernameModal);
