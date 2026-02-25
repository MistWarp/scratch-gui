import classNames from 'classnames';
import PropTypes from 'prop-types';
// we need this import for other packages to work here
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import {Check} from 'lucide-react';
import ChevronDown from './ChevronDown.jsx';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {MENUBAR_ALIGN, Theme} from '../../lib/themes/index.js';
import {closeSettingsMenu, menubarAlignMenuOpen, openMenubarAlignMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import styles from './settings-menu.css';

const AlignIcon = ({id}) => {
    const icons = Object.entries(MENUBAR_ALIGN).reduce((acc, [key, value]) => {
        acc[key] = value.icon;
        return acc;
    }, {});

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

AlignIcon.propTypes = {
    id: PropTypes.string
};

const AlignMenuItem = props => (
    <MenuItem onClick={props.onClick}>
        <div className={styles.option}>
            <Check
                size={15}
                className={classNames(styles.check, {[styles.selected]: props.isSelected})}
            />
            <AlignIcon id={props.id} />
            <span className={styles.themeName}>
                <FormattedMessage
                    {...MENUBAR_ALIGN[props.id]}
                />
            </span>
        </div>
    </MenuItem>
);

AlignMenuItem.propTypes = {
    id: PropTypes.string,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func
};

const MenubarAlignMenu = ({
    isOpen,
    isRtl,
    onChangeMenuBarAlign,
    onOpen,
    theme
}) => {
    const MENUBAR_ALIGN_MENUS = Object.keys(MENUBAR_ALIGN).map(id => ({
        id,
        isSelected: theme.menuBarAlign === id,
        onClick: () => onChangeMenuBarAlign(theme.set('menuBarAlign', id))
    }));
    return (<MenuItem expanded={isOpen}>
        <div
            className={styles.option}
            onClick={onOpen}
        >
            <AlignIcon id={theme.menuBarAlign} />
            <span className={styles.submenuLabel}>
                <FormattedMessage
                    defaultMessage="MenuBar Alignment"
                    description="Label for menu to choose menu bar alignment (left, center, right)"
                    id="tw.menuBar.menuBarAlign"
                />
            </span>
            <ChevronDown className={styles.expandCaret} />
        </div>
        <Submenu
            place={isRtl ? 'left' : 'right'}
            className={styles.submenu}
        >
            {MENUBAR_ALIGN_MENUS.map(menu => (
                <AlignMenuItem
                    key={menu.id}
                    id={menu.id}
                    isSelected={menu.isSelected}
                    onClick={menu.onClick}
                />
            ))}
        </Submenu>
    </MenuItem>);
};

MenubarAlignMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onChangeMenuBarAlign: PropTypes.func,
    onOpen: PropTypes.func,
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: menubarAlignMenuOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeMenuBarAlign: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        applyTheme(theme);
    },
    onOpen: () => {
        dispatch(openMenubarAlignMenu());
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MenubarAlignMenu);
