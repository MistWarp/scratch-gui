import PropTypes from 'prop-types';
import React from 'react';

import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import Input from '../forms/input.jsx';
import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import {
    DEFINITIONS,
    getSetting,
    onSettingsChanged,
    setSetting
} from '../../lib/menu-bar/settings.js';
import styles from './settings-modal.css';

const BufferedInput = BufferedInputHOC(Input);

class MenuBarSettings extends React.Component {
    constructor (props) {
        super(props);
        this.state = {values: Object.fromEntries(DEFINITIONS.map(({id}) => [id, getSetting(id)]))};
        this.handleChanges = {};
        this.handleSubmits = {};
        for (const definition of DEFINITIONS) {
            this.handleChanges[definition.id] = event => {
                this.setValue(definition.id, definition.type === 'boolean' ?
                    event.target.checked : event.target.value);
            };
            this.handleSubmits[definition.id] = value => this.setValue(definition.id, value);
        }
    }

    componentDidMount () {
        this.disposeSettingsListener = onSettingsChanged(this.handleSettingsChanged);
    }

    componentWillUnmount () {
        if (this.disposeSettingsListener) this.disposeSettingsListener();
    }

    handleSettingsChanged = () => {
        this.setState({values: Object.fromEntries(DEFINITIONS.map(({id}) => [id, getSetting(id)]))});
    };

    setValue (id, value) {
        setSetting(id, value);
    }

    renderSetting (definition) {
        const value = this.state.values[definition.id];
        return (
            <label
                className={styles.menuBarSettingRow}
                key={definition.id}
            >
                <span>{definition.label}</span>
                {definition.type === 'boolean' ? (
                    <FancyCheckbox
                        checked={value}
                        onChange={this.handleChanges[definition.id]}
                    />
                ) : definition.type === 'select' ? (
                    <select
                        className={styles.select}
                        value={value}
                        onChange={this.handleChanges[definition.id]}
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
                ) : (
                    <BufferedInput
                        className={styles.numberInput}
                        max={definition.max}
                        min={definition.min}
                        type="number"
                        value={value}
                        onSubmit={this.handleSubmits[definition.id]}
                    />
                )}
            </label>
        );
    }

    render () {
        return (
            <div className={styles.menuBarSettings}>
                {DEFINITIONS
                    .filter(definition => this.props.ids.includes(definition.id))
                    .map(definition => this.renderSetting(definition))}
            </div>
        );
    }
}

MenuBarSettings.propTypes = {
    ids: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default MenuBarSettings;
