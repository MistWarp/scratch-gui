import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import {Check} from 'lucide-react';
import ChevronDown from './ChevronDown.jsx';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {ACCENT_MAP, Theme} from '../../lib/themes/index.js';
import {openAccentMenu, accentMenuOpen, closeSettingsMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import styles from './settings-menu.css';

// Keep the original accent messages for FormattedMessage component
const ACCENT_MESSAGES = {};
for (const key in ACCENT_MAP) {
    ACCENT_MESSAGES[key] = {
        id: ACCENT_MAP[key].id,
        defaultMessage: ACCENT_MAP[key].defaultMessage,
        description: ACCENT_MAP[key].description
    };
}

// Use accent values for styles
for (const key in ACCENT_MAP) {
    ACCENT_MAP[key] = ACCENT_MAP[key].accent;
}

const icons = {

};

const ColorIcon = props => (icons[props.id] ? (
    <img
        className={styles.accentIconOuter}
        src={icons[props.id]}
        draggable={false}
        // Image is decorative
        alt=""
    />
) : (
    <div
        className={styles.accentIconOuter}
        style={{
            // menu-bar-background is var(...), don't want to evaluate with the current values
            backgroundColor: ACCENT_MAP[props.id].guiColors['looks-secondary'],
            backgroundImage: ACCENT_MAP[props.id].guiColors['menu-bar-background-image']
        }}
    />
));

ColorIcon.propTypes = {
    id: PropTypes.string
};

const AccentMenuItem = props => (
    <MenuItem
        onClick={props.onClick}
        title={ACCENT_MESSAGES[props.id].defaultMessage}
        aria-label={ACCENT_MESSAGES[props.id].defaultMessage}
    >
        <div className={styles.option}>
            <Check className={classNames(styles.check, {[styles.selected]: props.isSelected})} />
            <ColorIcon id={props.id} />
            <span className={styles.accentLabel}>
                <FormattedMessage {...ACCENT_MESSAGES[props.id]} />
            </span>
        </div>
    </MenuItem>
);

AccentMenuItem.propTypes = {
    id: PropTypes.string,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func
};

const AccentThemeMenu = ({
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
            <ColorIcon id={theme.accent} />
            <span className={styles.submenuLabel}>
                <FormattedMessage
                    defaultMessage="Accent"
                    description="Label for menu to choose accent color (eg. TurboWarp's red, Scratch's purple)"
                    id="tw.menuBar.accent"
                />
            </span>
            <ChevronDown className={styles.expandCaret} />
        </div>
        <Submenu
            place={isRtl ? 'left' : 'right'}
            className={styles.accentSubmenu}
        >
            {Object.keys(ACCENT_MAP).map(item => (
                <AccentMenuItem
                    key={item}
                    id={item}
                    isSelected={theme.accent === item}
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => onChangeTheme(theme.set('accent', item))}
                />
            ))}
        </Submenu>
    </MenuItem>
);

AccentThemeMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    onOpen: PropTypes.func,
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: accentMenuOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        applyTheme(theme);
    },
    onOpen: () => dispatch(openAccentMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AccentThemeMenu);
