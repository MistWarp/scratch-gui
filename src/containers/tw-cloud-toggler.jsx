import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {setCloud} from '../reducers/tw';
import {openSettingsModal} from '../reducers/modals';
import {setSettingsModalInitialView} from '../lib/settings/modal-view.js';
import isScratchDesktop from '../lib/utils/isScratchDesktop';

class CloudVariablesToggler extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'toggleCloudVariables'
        ]);
    }
    toggleCloudVariables () {
        if (!this.props.canUseCloudVariables) {
            // Point to the setting that does apply here rather than a dead end.
            this.props.onOpenCloudSettings();
            return;
        }
        this.props.onCloudChange(!this.props.enabled);
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            children,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        return this.props.children(this.toggleCloudVariables, props);
    }
}

CloudVariablesToggler.propTypes = {
    children: PropTypes.func,
    enabled: PropTypes.bool,
    username: PropTypes.string,
    onCloudChange: PropTypes.func,
    onOpenCloudSettings: PropTypes.func,
    canUseCloudVariables: PropTypes.bool
};

const mapStateToProps = state => ({
    username: state.scratchGui.tw.username,
    enabled: state.scratchGui.tw.cloud,
    canUseCloudVariables: isScratchDesktop() || !state.scratchGui.mode.hasEverEnteredEditor
});

const mapDispatchToProps = dispatch => ({
    onCloudChange: enabled => dispatch(setCloud(enabled)),
    onOpenCloudSettings: () => {
        // "Disable cloud variables in editor" is on the Editor page.
        setSettingsModalInitialView('editor');
        dispatch(openSettingsModal());
    }
});

export {
    CloudVariablesToggler
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CloudVariablesToggler);
