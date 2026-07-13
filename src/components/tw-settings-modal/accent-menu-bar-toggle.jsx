import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import {Theme} from '../../lib/themes/index.js';
import {
    getAccentMenuBar,
    setAccentMenuBar,
    getMenuBarText,
    setMenuBarText,
    getCompactSave,
    setCompactSave
} from '../../lib/themes/menu-bar-accent.js';
import {applyGuiColors} from '../../lib/themes/guiHelpers.js';

import styles from './settings-modal.css';

class AccentMenuBarToggle extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            enabled: getAccentMenuBar(),
            textColor: getMenuBarText(),
            compactSave: getCompactSave()
        };
    }
    handleChangeCompactSave = e => {
        const compactSave = e.target.checked;
        setCompactSave(compactSave);
        this.setState({compactSave});
    };
    handleChange = e => {
        const enabled = e.target.checked;
        setAccentMenuBar(enabled);
        this.setState({enabled});
        applyGuiColors(this.props.theme);
    };
    handleChangeTextColor = e => {
        const textColor = e.target.value;
        setMenuBarText(textColor);
        this.setState({textColor});
        applyGuiColors(this.props.theme);
    };
    render () {
        return (
            <React.Fragment>
                <div className={classNames(styles.setting, {[styles.active]: this.state.enabled})}>
                    <label className={styles.label}>
                        <FancyCheckbox
                            className={styles.checkbox}
                            checked={this.state.enabled}
                            onChange={this.handleChange}
                        />
                        <FormattedMessage
                            defaultMessage="Use the accent color for the menu bar"
                            description="Label for toggle that colors the menu bar with the accent color"
                            id="tw.menuBar.accentMenuBar"
                        />
                    </label>
                </div>
                <div className={classNames(styles.setting, {[styles.active]: this.state.compactSave})}>
                    <label className={styles.label}>
                        <FancyCheckbox
                            className={styles.checkbox}
                            checked={this.state.compactSave}
                            onChange={this.handleChangeCompactSave}
                        />
                        <FormattedMessage
                            defaultMessage="Show the save button as an icon only"
                            description="Label for toggle that shrinks the save button to an icon"
                            id="tw.menuBar.compactSave"
                        />
                    </label>
                </div>
                <div className={styles.setting}>
                    <label className={styles.label}>
                        <FormattedMessage
                            defaultMessage="Menu bar text"
                            description="Label for the menu bar text color setting"
                            id="tw.menuBar.textColor"
                        />
                        <select
                            className={styles.select}
                            value={this.state.textColor}
                            onChange={this.handleChangeTextColor}
                        >
                            <option value="auto">{'Automatic'}</option>
                            <option value="light">{'Light'}</option>
                            <option value="dark">{'Dark'}</option>
                        </select>
                    </label>
                </div>
            </React.Fragment>
        );
    }
}

AccentMenuBarToggle.propTypes = {
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    theme: state.scratchGui.theme.theme
});

export default connect(mapStateToProps)(AccentMenuBarToggle);
