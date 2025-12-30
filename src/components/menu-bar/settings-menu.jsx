import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import LanguageMenu from './language-menu.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuSection} from '../menu/menu.jsx';
import MenuLabel from './tw-menu-label.jsx';
import TWAccentThemeMenu from './tw-theme-accent.jsx';
import TWGuiThemeMenu from './tw-theme-gui.jsx';
import TWBlocksThemeMenu from './tw-theme-blocks.jsx';
import TWWallpaperMenu from './tw-theme-wallpaper.jsx';
import TWFontsThemeMenu from './tw-theme-fonts.jsx';
import TWMenuBarAlignMenu from './tw-menubar-align.jsx';
import TWCustomThemeMenu from './tw-theme-custom.jsx';
import TWDesktopSettings from './tw-desktop-settings.jsx';

import {Palette} from 'lucide-react';

import menuBarStyles from './menu-bar.css';
import styles from './settings-menu.css';

import ChevronDown from './ChevronDown.jsx';

const SettingsMenu = ({
    canChangeLanguage,
    canChangeTheme,
    isRtl,
    onClickDesktopSettings,
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
        <Palette size={20} />
        <span className={styles.dropdownLabel}>
            <FormattedMessage
                defaultMessage="Theme"
                description="Theme menu"
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
                {onClickDesktopSettings && <TWDesktopSettings onClick={onClickDesktopSettings} />}
            </MenuSection>
            <div className={styles.menuSeparator} />
            {canChangeTheme && (
                <MenuSection>
                    <TWBlocksThemeMenu onOpenCustomSettings={onOpenCustomSettings} />
                    <TWMenuBarAlignMenu />
                    <TWAccentThemeMenu />
                </MenuSection>
            )}
        </MenuBarMenu>
    </MenuLabel>
);

SettingsMenu.propTypes = {
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    isRtl: PropTypes.bool,
    onClickDesktopSettings: PropTypes.func,
    onOpenCustomSettings: PropTypes.func,
    onRequestClose: PropTypes.func,
    onRequestOpen: PropTypes.func,
    settingsMenuOpen: PropTypes.bool
};

export default SettingsMenu;
