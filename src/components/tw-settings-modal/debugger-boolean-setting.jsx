import PropTypes from 'prop-types';
import React from 'react';
import {getSetting as getDebuggerSetting, setSetting as setDebuggerSetting} from '../../lib/debugger/settings.js';
import {BooleanSetting} from './setting.jsx';

class DebuggerBooleanSetting extends React.Component {
    constructor (props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {value: getDebuggerSetting(props.settingId)};
    }
    handleChange (e) {
        const value = e.target.checked;
        setDebuggerSetting(this.props.settingId, value);
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

DebuggerBooleanSetting.propTypes = {
    settingId: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    help: PropTypes.node
};

export default DebuggerBooleanSetting;
