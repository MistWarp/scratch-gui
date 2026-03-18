import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import LanguageMenu from './language-menu.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuSection} from '../menu/menu.jsx';
import MenuLabel from './tw-menu-label.jsx';
import TWAccentThemeMenu from './tw-theme-accent.jsx';
import TWGuiThemeMenu from './tw-theme-gui.jsx';
import TWWarpThemeMenu from './mw-warptheme-menu.jsx';
import TWBlocksThemeMenu from './tw-theme-blocks.jsx';
import TWWallpaperMenu from './tw-theme-wallpaper.jsx';
import TWFontsThemeMenu from './tw-theme-fonts.jsx';
import TWMenuBarAlignMenu from './tw-menubar-align.jsx';
import TWCustomThemeMenu from './tw-theme-custom.jsx';

import menuBarStyles from './menu-bar.css';
import styles from './settings-menu.css';

import ChevronDown from './ChevronDown.jsx';
import {Eye} from 'lucide-react';

const SettingsMenu = ({
    canChangeLanguage,
    canChangeTheme,
    isRtl,
    onOpenCustomSettings,
    onRequestClose,
    onRequestOpen,
    settingsMenuOpen
}) => (
    <MenuLabel
        open={settingsMenuOpen}
        onOpen={onRequestOpen}
        onClose={onRequestClose}
    >
        <Eye
            width={20}
            height={20}
            size={20}
        />
        <span className={styles.dropdownLabel}>
            <FormattedMessage
                defaultMessage="View"
                description="View menu"
                id="gui.menuBar.theme"
            />
        </span>
        <ChevronDown />
        <MenuBarMenu
            className={menuBarStyles.menuBarMenu}
            open={settingsMenuOpen}
            place={isRtl ? 'left' : 'right'}
        >
            <MenuSection>
                {canChangeLanguage && <LanguageMenu onRequestCloseSettings={onRequestClose} />}
                {canChangeTheme && (
                    <React.Fragment>
                        <TWCustomThemeMenu />
                        <TWGuiThemeMenu />
                        <TWWallpaperMenu />
                        <TWFontsThemeMenu />
                    </React.Fragment>
                )}
            </MenuSection>
            <div className={styles.menuSeparator} />
            {canChangeTheme && (
                <MenuSection>
                    <TWBlocksThemeMenu />
                    <TWMenuBarAlignMenu />
                    <TWAccentThemeMenu />
                    <TWWarpThemeMenu />
                </MenuSection>
            )}
        </MenuBarMenu>
    </MenuLabel>
);

SettingsMenu.propTypes = {
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    isRtl: PropTypes.bool,
    onOpenCustomSettings: PropTypes.func,
    onRequestClose: PropTypes.func,
    onRequestOpen: PropTypes.func,
    settingsMenuOpen: PropTypes.bool
};

export default SettingsMenu;
