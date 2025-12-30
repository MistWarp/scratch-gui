import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import dropdownCaret from './dropdown-caret.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme, GUI_MAP} from '../../lib/themes/index.js';
import {closeSettingsMenu, guiMenuOpen, openGuiMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {persistTheme} from '../../lib/themes/themePersistance.js';
import styles from './settings-menu.css';

const ThemeIcon = ({id}) => {
    return (
        <img
            className={styles.accentIconOuter}
            src={GUI_MAP[id].icon}
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
                <FormattedMessage
                    defaultMessage="{theme}"
                    description="Label for theme option"
                    id="tw.theme.option"
                    values={{
                        theme: props.id
                    }}
                />
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
                    description="Label for menu to choose theme"
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
            {Object.entries(Theme.defaults).map(([themeId, t]) => (
                <ThemeMenuItem
                    key={themeId}
                    id={themeId}
                    name={t.name}
                    isSelected={theme.gui === themeId}
                    onClick={() => onChangeTheme(theme.set('gui', themeId))}
                />
            ))}
        </Submenu>
    </MenuItem>
);

console.log(Theme.defaults);

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
