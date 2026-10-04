import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';

import Box from '../box/box.jsx';
import {BooleanSetting} from './setting.jsx';
import {Theme} from '../../lib/themes/index.js';
import {PageHeader, ThemeAccentPanel} from './theme-accent-panel.jsx';
import {themeStateToProps, themeDispatchToProps} from './theme-connect.js';
import {
    getAccentMenuBar,
    setAccentMenuBar,
    getMenuBarText,
    setMenuBarText,
    MENU_BAR_TEXT_OPTIONS
} from '../../lib/themes/menu-bar-accent.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';

import styles from './settings-modal.css';

const MENU_BAR_TEXT_MESSAGES = defineMessages({
    auto: {defaultMessage: 'Automatic', id: 'mw.settingsModal.menuBarTextAuto'},
    light: {defaultMessage: 'Light', id: 'mw.settingsModal.menuBarTextLight'},
    dark: {defaultMessage: 'Dark', id: 'mw.settingsModal.menuBarTextDark'}
});

class UnconnectedColorThemePage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            accentMenuBar: getAccentMenuBar(),
            menuBarText: getMenuBarText()
        };
        this.handleAccentMenuBarChange = this.handleAccentMenuBarChange.bind(this);
        this.handleMenuBarTextChange = this.handleMenuBarTextChange.bind(this);
    }

    handleAccentMenuBarChange (event) {
        setAccentMenuBar(event.target.checked);
        this.setState({accentMenuBar: event.target.checked});
        applyTheme(this.props.theme);
    }

    handleMenuBarTextChange (event) {
        setMenuBarText(event.target.value);
        this.setState({menuBarText: event.target.value});
        applyTheme(this.props.theme);
    }

    render () {
        const {theme, onChangeTheme} = this.props;
        return (
            <Box className={styles.body}>
                <PageHeader>
                    <FormattedMessage
                        defaultMessage="Theme"
                        description="Label for menu to choose between light and dark mode"
                        id="tw.menuBar.theme"
                    />
                </PageHeader>
                <ThemeAccentPanel
                    theme={theme}
                    onChangeTheme={onChangeTheme}
                />
                <PageHeader>
                    <FormattedMessage
                        defaultMessage="Menu bar colors"
                        id="mw.settingsModal.menuBarColors"
                    />
                </PageHeader>
                <BooleanSetting
                    value={this.state.accentMenuBar}
                    onChange={this.handleAccentMenuBarChange}
                    label={<FormattedMessage
                        defaultMessage="Use the accent color for the menu bar"
                        description="Label for toggle that colors the menu bar with the accent color"
                        id="tw.menuBar.accentMenuBar"
                    />}
                    help={<FormattedMessage
                        defaultMessage="When this is off, the menu bar uses the plain color of the light or dark theme."
                        id="mw.settingsModal.accentMenuBarHelp"
                    />}
                />
                <label className={styles.menuBarSettingRow}>
                    <span>
                        <FormattedMessage
                            defaultMessage="Menu bar text"
                            description="Label for the menu bar text color setting"
                            id="tw.menuBar.textColor"
                        />
                    </span>
                    <select
                        className={styles.select}
                        value={this.state.menuBarText}
                        onChange={this.handleMenuBarTextChange}
                    >
                        {MENU_BAR_TEXT_OPTIONS.map(option => (
                            <option
                                key={option}
                                value={option}
                            >
                                {this.props.intl.formatMessage(MENU_BAR_TEXT_MESSAGES[option])}
                            </option>
                        ))}
                    </select>
                </label>
            </Box>
        );
    }
}
UnconnectedColorThemePage.propTypes = {
    intl: intlShape,
    theme: PropTypes.instanceOf(Theme),
    onChangeTheme: PropTypes.func
};
export const ColorThemePage = connect(
    themeStateToProps,
    themeDispatchToProps
)(injectIntl(UnconnectedColorThemePage));
