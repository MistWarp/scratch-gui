import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {setCloud} from '../reducers/tw';
import {showStandardAlert} from '../reducers/alerts';
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
            this.props.onShowCloudUnavailable();
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
    onShowCloudUnavailable: PropTypes.func,
    canUseCloudVariables: PropTypes.bool
};

const mapStateToProps = state => ({
    username: state.scratchGui.tw.username,
    enabled: state.scratchGui.tw.cloud,
    canUseCloudVariables: isScratchDesktop() || !state.scratchGui.mode.hasEverEnteredEditor
});

const mapDispatchToProps = dispatch => ({
    onCloudChange: enabled => dispatch(setCloud(enabled)),
    onShowCloudUnavailable: () => dispatch(showStandardAlert('cloudUnavailable'))
});

export {
    CloudVariablesToggler
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CloudVariablesToggler);
