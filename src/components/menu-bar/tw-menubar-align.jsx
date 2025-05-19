import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import dropdownCaret from './dropdown-caret.svg';
import alignLeftIcon from './tw-align-left.svg';
import alignCenterIcon from './tw-align-center.svg';
import alignRightIcon from './tw-align-right.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {
    MENUBAR_ALIGN_LEFT,
    MENUBAR_ALIGN_CENTER,
    MENUBAR_ALIGN_RIGHT,
    Theme
} from '../../lib/themes/index.js';
import {closeSettingsMenu, menubarAlignMenuOpen, openMenubarAlignMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {persistTheme} from '../../lib/themes/themePersistance.js';
import styles from './settings-menu.css';

const AlignIcon = ({id}) => {
    const icons = {
        [MENUBAR_ALIGN_LEFT]: alignLeftIcon,
        [MENUBAR_ALIGN_CENTER]: alignCenterIcon,
        [MENUBAR_ALIGN_RIGHT]: alignRightIcon
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

AlignIcon.propTypes = {
    id: PropTypes.string
};

const AlignMenuItem = props => (
    <MenuItem onClick={props.onClick}>
        <div className={styles.option}>
            <img
                className={classNames(styles.check, {[styles.selected]: props.isSelected})}
                width={15}
                height={12}
                src={check}
                draggable={false}
            />
            <AlignIcon id={props.id} />
            <span className={styles.themeName}>
                {props.id === MENUBAR_ALIGN_LEFT && (
                    <FormattedMessage
                        defaultMessage="Left"
                        description="Label for left alignment option"
                        id="tw.menuBar.left"
                    />
                )}
                {props.id === MENUBAR_ALIGN_CENTER && (
                    <FormattedMessage
                        defaultMessage="Center"
                        description="Label for center alignment option"
                        id="tw.menuBar.center"
                    />
                )}
                {props.id === MENUBAR_ALIGN_RIGHT && (
                    <FormattedMessage
                        defaultMessage="Right"
                        description="Label for right alignment option"
                        id="tw.menuBar.right"
                    />
                )}
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
}) => (
    <MenuItem expanded={isOpen}>
        <div
            className={styles.option}
            onClick={onOpen}
        >
            <AlignIcon id={theme.menuBarAlign} />
            <span className={styles.submenuLabel}>
                <FormattedMessage
                    defaultMessage="Menu Bar Alignment"
                    description="Label for menu to choose menu bar alignment (left, center, right)"
                    id="tw.menuBar.menuBarAlign"
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
            <AlignMenuItem
                id={MENUBAR_ALIGN_LEFT}
                isSelected={theme.menuBarAlign === MENUBAR_ALIGN_LEFT}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => onChangeMenuBarAlign(theme.set('menuBarAlign', MENUBAR_ALIGN_LEFT))}
            />
            <AlignMenuItem
                id={MENUBAR_ALIGN_CENTER}
                isSelected={theme.menuBarAlign === MENUBAR_ALIGN_CENTER}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => onChangeMenuBarAlign(theme.set('menuBarAlign', MENUBAR_ALIGN_CENTER))}
            />
            <AlignMenuItem
                id={MENUBAR_ALIGN_RIGHT}
                isSelected={theme.menuBarAlign === MENUBAR_ALIGN_RIGHT}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => onChangeMenuBarAlign(theme.set('menuBarAlign', MENUBAR_ALIGN_RIGHT))}
            />
        </Submenu>
    </MenuItem>
);

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
        persistTheme(theme);
    },
    onOpen: () => {
        dispatch(openMenubarAlignMenu());
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MenubarAlignMenu);
