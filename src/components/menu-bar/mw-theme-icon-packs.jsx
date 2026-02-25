import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import ChevronDown from './ChevronDown.jsx';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme, ICON_PACKS, ICON_PACK_DEFAULT} from '../../lib/themes/index.js';
import {closeSettingsMenu, iconPackMenuOpen, openIconPackMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import styles from './settings-menu.css';
import {useIcon} from '../icon-provider/icons.jsx';

const IconPackIcon = ({id}) => (
    <svg
        className={classNames(styles.icon, 'lucide')}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {id === 'lucide' && (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
            </>
        )}
        {id === 'carbon' && (
            <>
                <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                />
                <path d="M8 12l2-2 2 2" />
            </>
        )}
        {id === 'material' && (
            <>
                <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                />
                <circle
                    cx="8"
                    cy="8"
                    r="1.5"
                />
                <circle
                    cx="16"
                    cy="16"
                    r="1.5"
                />
                <path d="M8 16l8-8" />
            </>
        )}
        {id === 'none' && (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                />
                <line
                    x1="15"
                    y1="9"
                    x2="9"
                    y2="15"
                />
                <line
                    x1="9"
                    y1="9"
                    x2="15"
                    y2="15"
                />
            </>
        )}
    </svg>
);

IconPackIcon.propTypes = {
    id: PropTypes.string
};

const IconPackMenuItem = props => {
    const Check = useIcon('Check');
    
    return (
        <MenuItem onClick={props.onClick}>
            <div className={styles.option}>
                {Check ? (
                    <Check
                        className={classNames(styles.check, {[styles.selected]: props.isSelected})}
                        size={15}
                    />
                ) : (
                    <span
                        className={
                            classNames(
                                styles.check,
                                {[styles.selected]: props.isSelected},
                                styles.checkText
                            )
                        }
                    >
                        {'✓'}
                    </span>
                )}
                <IconPackIcon id={props.id} />
                <span className={props.name}>
                    <FormattedMessage
                        defaultMessage="{pack}"
                        description="Label for icon pack option"
                        id="tw.menuBar.iconPack.option"
                        values={{
                            pack: props.name
                        }}
                    />
                </span>
            </div>
        </MenuItem>
    );
};

IconPackMenuItem.propTypes = {
    id: PropTypes.string,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
    name: PropTypes.string
};

const IconPackMenu = ({
    isOpen,
    isRtl,
    onChangeIconPack,
    onOpen,
    theme
}) => (
    <MenuItem expanded={isOpen}>
        <div
            className={styles.option}
            onClick={onOpen}
        >
            <IconPackIcon id={theme.iconPack} />
            <span className={styles.submenuLabel}>
                <FormattedMessage
                    defaultMessage="Icon Packs"
                    description="Label for menu to choose icon pack"
                    id="tw.menuBar.iconPacks"
                />
            </span>
            <ChevronDown className={styles.expandCaret} />
        </div>
        <Submenu
            place={isRtl ? 'left' : 'right'}
            className={styles.submenu}
        >
            {ICON_PACKS.map(pack => (
                <IconPackMenuItem
                    key={pack.name}
                    id={pack.name.toLowerCase()}
                    name={pack.name}
                    isSelected={theme.iconPack === pack.name.toLowerCase()}
                    onClick={() => onChangeIconPack(theme.set('iconPack', pack.name.toLowerCase()))}
                />
            ))}
        </Submenu>
    </MenuItem>
);

IconPackMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onChangeIconPack: PropTypes.func,
    onOpen: PropTypes.func,
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: iconPackMenuOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeIconPack: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        applyTheme(theme);
    },
    onOpen: () => {
        dispatch(openIconPackMenu());
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(IconPackMenu);
