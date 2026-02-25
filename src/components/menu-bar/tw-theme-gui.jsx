import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import ChevronDown from './ChevronDown.jsx';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme, GUI_MAP} from '../../lib/themes/index.js';
import {closeSettingsMenu, guiMenuOpen, openGuiMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import styles from './settings-menu.css';

const ThemeIcon = ({id}) => (
    <svg
        className={classNames(styles.icon, 'lucide')}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        dangerouslySetInnerHTML={{__html: GUI_MAP[id].icon}}
    />
);

ThemeIcon.propTypes = {
    id: PropTypes.string
};

const ThemeMenuItem = props => {
    return (
        <MenuItem onClick={props.onClick}>
            <div className={styles.option}>
                <span className={classNames(styles.check, {[styles.selected]: props.isSelected}, styles.checkText)}>✓</span>
                <ThemeIcon id={props.id} />
                <span className={props.name}>
                    <FormattedMessage
                        defaultMessage="{theme}"
                        description="Label for theme option"
                        id="tw.theme.option"
                        values={{
                            theme: props.name
                        }}
                    />
                </span>
            </div>
        </MenuItem>
    );
};

ThemeMenuItem.propTypes = {
    id: PropTypes.string,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
    name: PropTypes.string
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
            <ChevronDown className={styles.expandCaret} />
        </div>
        <Submenu
            place={isRtl ? 'left' : 'right'}
            className={styles.submenu}
        >
            {Object.entries(Theme.defaults).map(([themeId, t]) => (
                <ThemeMenuItem
                    key={themeId}
                    id={themeId}
                    name={t.name || t.gui}
                    isSelected={theme.gui === themeId}
                    onClick={() => onChangeTheme(theme.set('gui', themeId))}
                />
            ))}
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
        applyTheme(theme);
    },
    onOpen: () => {
        dispatch(openGuiMenu());
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GuiThemeMenu);
