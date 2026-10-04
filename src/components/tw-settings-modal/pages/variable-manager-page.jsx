import {defineMessages, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import Box from '../../box/box.jsx';
import Input from '../../forms/input.jsx';
import BufferedInputHOC from '../../forms/buffered-input-hoc.jsx';
import Header from '../settings-header.jsx';
import {BooleanSetting, Setting} from '../setting.jsx';
import styles from '../settings-modal.css';
import {DEFINITIONS as VARIABLE_MANAGER_SETTINGS, getSetting as getVariableManagerSetting,
    setSetting as setVariableManagerSetting} from '../../../lib/variable-manager/settings.js';

const BufferedInput = BufferedInputHOC(Input);

const messages = defineMessages({
    header: {
        defaultMessage: 'Variable Manager',
        id: 'mw.settings.variableManagerHeader'
    }
});

class VmSetting extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, ['handleBooleanChange', 'handleSelectChange', 'handleNumberChange']);
        this.state = {value: getVariableManagerSetting(props.definition.id)};
    }
    commit (value) {
        setVariableManagerSetting(this.props.definition.id, value);
        this.setState({value: getVariableManagerSetting(this.props.definition.id)});
    }
    handleBooleanChange (e) {
        this.commit(e.target.checked);
    }
    handleSelectChange (e) {
        this.commit(e.target.value);
    }
    handleNumberChange (value) {
        this.commit(value);
    }
    render () {
        const {definition} = this.props;
        const {value} = this.state;
        if (definition.type === 'boolean') {
            return (
                <BooleanSetting
                    value={value}
                    onChange={this.handleBooleanChange}
                    label={definition.label}
                    help={definition.help}
                />
            );
        }
        if (definition.type === 'select') {
            return (
                <Setting
                    help={definition.help}
                    primary={
                        <div className={styles.label}>
                            <span className={styles.settingText}>{definition.label}</span>
                            <select
                                className={styles.select}
                                value={value}
                                onChange={this.handleSelectChange}
                            >
                                {definition.options.map(option => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    }
                />
            );
        }
        return (
            <Setting
                help={definition.help}
                primary={
                    <div className={styles.label}>
                        <span className={styles.settingText}>{definition.label}</span>
                        <BufferedInput
                            className={styles.numberInput}
                            type="number"
                            value={value}
                            min={definition.min}
                            max={definition.max}
                            step={definition.step}
                            onSubmit={this.handleNumberChange}
                        />
                    </div>
                }
            />
        );
    }
}
VmSetting.propTypes = {
    definition: PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        label: PropTypes.string,
        help: PropTypes.string,
        min: PropTypes.number,
        max: PropTypes.number,
        step: PropTypes.number,
        options: PropTypes.array
    }).isRequired
};

const UnwrappedVariableManagerPage = ({intl}) => (
    <Box className={styles.body}>
        <Header>{intl.formatMessage(messages.header)}</Header>
        {VARIABLE_MANAGER_SETTINGS.map(definition => (
            <VmSetting
                key={definition.id}
                definition={definition}
            />
        ))}
    </Box>
);
UnwrappedVariableManagerPage.propTypes = {
    intl: intlShape.isRequired
};
const VariableManagerPage = injectIntl(UnwrappedVariableManagerPage);

export default VariableManagerPage;
