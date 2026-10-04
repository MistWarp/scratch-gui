import PropTypes from 'prop-types';
import React from 'react';
import {getSetting as getStageControlSetting, setSetting as setStageControlSetting}
    from '../../lib/mw-stage-controls/settings.js';
import {BooleanSetting} from './setting.jsx';

class StageControlBooleanSetting extends React.Component {
    constructor (props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {value: getStageControlSetting(props.settingId)};
    }
    handleChange (e) {
        const value = e.target.checked;
        setStageControlSetting(this.props.settingId, value);
        this.setState({value});
    }
    render () {
        return (
            <BooleanSetting
                value={this.state.value}
                onChange={this.handleChange}
                label={this.props.label}
                help={this.props.help}
            />
        );
    }
}

StageControlBooleanSetting.propTypes = {
    settingId: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    help: PropTypes.node
};

export default StageControlBooleanSetting;
