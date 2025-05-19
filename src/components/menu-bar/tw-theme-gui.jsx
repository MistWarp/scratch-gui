import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import dropdownCaret from './dropdown-caret.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {GUI_DARK, GUI_LIGHT, GUI_MIDNIGHT, Theme} from '../../lib/themes/index.js';
import {closeSettingsMenu, guiMenuOpen, openGuiMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {persistTheme} from '../../lib/themes/themePersistance.js';
import lightModeIcon from './tw-sun.svg';
import darkModeIcon from './tw-moon.svg';
import midnightModeIcon from './tw-star.svg';
import styles from './settings-menu.css';

const ThemeIcon = ({id}) => {
    const icons = {
        [GUI_LIGHT]: lightModeIcon,
        [GUI_DARK]: darkModeIcon,
        [GUI_MIDNIGHT]: midnightModeIcon
    };
    
    return (
        <img
            className={styles.accentIconOuter}
            src={icons[id]}
            draggable={false}
            width={24}
            height={24}
            // Image is decorative
            alt=""
        />
    );
};

ThemeIcon.propTypes = {
    id: PropTypes.string
};

const ThemeMenuItem = props => (
    <MenuItem onClick={props.onClick}>
        <div className={styles.option}>
            <img
                className={classNames(styles.check, {[styles.selected]: props.isSelected})}
                width={15}
                height={12}
                src={check}
                draggable={false}
            />
            <ThemeIcon id={props.id} />
            <span className={styles.themeName}>
                {props.id === GUI_LIGHT && (
                    <FormattedMessage
                        defaultMessage="Light"
                        description="Label for light theme option"
                        id="tw.theme.light"
                    />
                )}
                {props.id === GUI_DARK && (
                    <FormattedMessage
                        defaultMessage="Dark"
                        description="Label for dark theme option"
                        id="tw.theme.dark"
                    />
                )}
                {props.id === GUI_MIDNIGHT && (
                    <FormattedMessage
                        defaultMessage="Midnight"
                        description="Label for midnight (pure black) theme option"
                        id="tw.theme.midnight"
                    />
                )}
            </span>
        </div>
    </MenuItem>
);

ThemeMenuItem.propTypes = {
    id: PropTypes.string,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func
};

const GuiThemeMenu = ({
    isOpen,
    isRtl,
    onChangeTheme,
    onOpen,
    theme
}) => (
    <MenuItem expanded={isOpen}>
        <div
            className={styles.option}
            onClick={onOpen}
        >
            <ThemeIcon id={theme.gui} />
            <span className={styles.submenuLabel}>
                <FormattedMessage
                    defaultMessage="Theme"
                    description="Label for menu to choose theme (light, dark, midnight)"
                    id="tw.menuBar.theme"
                />
            </span>
            <img
                className={styles.expandCaret}
                src={dropdownCaret}
                draggable={false}
            />
        </div>
        <Submenu
            place={isRtl ? 'left' : 'right'}
            className={styles.submenu}
        >
            <ThemeMenuItem
                id={GUI_LIGHT}
                isSelected={theme.gui === GUI_LIGHT}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => onChangeTheme(theme.set('gui', GUI_LIGHT))}
            />
            <ThemeMenuItem
                id={GUI_DARK}
                isSelected={theme.gui === GUI_DARK}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => onChangeTheme(theme.set('gui', GUI_DARK))}
            />
            <ThemeMenuItem
                id={GUI_MIDNIGHT}
                isSelected={theme.gui === GUI_MIDNIGHT}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => onChangeTheme(theme.set('gui', GUI_MIDNIGHT))}
            />
        </Submenu>
    </MenuItem>
);

GuiThemeMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    onOpen: PropTypes.func,
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: guiMenuOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        persistTheme(theme);
    },
    onOpen: () => {
        dispatch(openGuiMenu());
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GuiThemeMenu);
