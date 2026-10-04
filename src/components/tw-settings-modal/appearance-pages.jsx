import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';
import locales from '@turbowarp/scratch-l10n';

import Box from '../box/box.jsx';
import {BooleanSetting} from './setting.jsx';
import {Theme, BLOCKS_CUSTOM, BLOCKS_DARK, BLOCKS_HIGH_CONTRAST, BLOCKS_THREE}
    from '../../lib/themes/index.js';
import {PageHeader} from './theme-accent-panel.jsx';
import CustomThemesPage from './custom-themes-page.jsx';
import communityEnabled from '../../lib/community/enabled.js';
import {themeStateToProps, themeDispatchToProps} from './theme-connect.js';
import {selectLocale} from '../../reducers/locales.js';
import {getCatBlocks, getCatBlocksWatch, setCatBlocks, setCatBlocksWatch} from '../../lib/mw-cat-blocks.js';

import styles from './settings-modal.css';

import threeIcon from '../menu-bar/tw-blocks-three.svg';
import highContrastIcon from '../menu-bar/tw-blocks-high-contrast.svg';
import darkIcon from '../menu-bar/tw-blocks-dark.svg';

import {ExternalLink} from 'lucide-react';

const UnconnectedLanguagePage = ({currentLocale, onChangeLanguage}) => {
    const handleChange = React.useCallback(e => onChangeLanguage(e.target.value), [onChangeLanguage]);
    return (
        <Box className={styles.body}>
            <PageHeader>
                <FormattedMessage
                    defaultMessage="Language"
                    description="Language sub-menu"
                    id="gui.menuBar.language"
                />
            </PageHeader>
            <div className={styles.setting}>
                <select
                    className={styles.select}
                    value={currentLocale}
                    onChange={handleChange}
                >
                    {Object.keys(locales).map(locale => (
                        <option
                            key={locale}
                            value={locale}
                        >
                            {locales[locale].name}
                        </option>
                    ))}
                </select>
                <p className={styles.detail}>
                    <FormattedMessage
                        defaultMessage="Changes the language of the editor interface."
                        id="mw.settings.languageHelp"
                    />
                </p>
            </div>
        </Box>
    );
};
UnconnectedLanguagePage.propTypes = {
    currentLocale: PropTypes.string,
    onChangeLanguage: PropTypes.func
};
export const LanguagePage = connect(
    state => ({currentLocale: state.locales.locale}),
    dispatch => ({onChangeLanguage: locale => dispatch(selectLocale(locale))})
)(UnconnectedLanguagePage);

const BLOCKS_OPTIONS = [
    {
        id: BLOCKS_THREE,
        icon: threeIcon,
        message: {
            defaultMessage: 'Original',
            description: 'Name of normal Scratch block colors.',
            id: 'tw.blockColors.three'
        }
    },
    {
        id: BLOCKS_HIGH_CONTRAST,
        icon: highContrastIcon,
        message: {
            defaultMessage: 'High Contrast',
            description: 'Name of the high contrast block colors.',
            id: 'tw.blockColors.highContrast'
        }
    },
    {
        id: BLOCKS_DARK,
        icon: darkIcon,
        message: {
            defaultMessage: 'Dark (Beta)',
            description: 'Name of the dark block colors',
            id: 'tw.blockColors.dark'
        }
    }
];

const openBlocksAddonSettings = () => {
    if (window.handleClickAddonSettings) {
        window.handleClickAddonSettings('editor-theme3');
    }
};

class CatBlocksSettings extends React.Component {
    constructor (props) {
        super(props);
        this.handleEnabledChange = this.handleEnabledChange.bind(this);
        this.handleWatchChange = this.handleWatchChange.bind(this);
        this.state = {
            enabled: getCatBlocks(),
            watch: getCatBlocksWatch()
        };
    }
    handleEnabledChange (e) {
        const enabled = e.target.checked;
        setCatBlocks(enabled);
        this.setState({enabled});
    }
    handleWatchChange (e) {
        const watch = e.target.checked;
        setCatBlocksWatch(watch);
        this.setState({watch});
    }
    render () {
        return (
            <React.Fragment>
                <BooleanSetting
                    value={this.state.enabled}
                    onChange={this.handleEnabledChange}
                    label={<FormattedMessage
                        defaultMessage="Cat Hat Blocks"
                        id="mw.settingsModal.scratchHatBlocks"
                    />}
                    help={<FormattedMessage
                        defaultMessage={'Draws cat ears and a face on hat blocks, like Scratch did ' +
                            'for April Fools\' Day 2020. Takes effect after blocks reload.'}
                        id="mw.settingsModal.scratchHatBlocksHelp"
                    />}
                />
                <BooleanSetting
                    value={this.state.watch}
                    onChange={this.handleWatchChange}
                    label={<FormattedMessage
                        defaultMessage="Cat eyes follow mouse cursor"
                        id="mw.settingsModal.scratchHatBlocksWatch"
                    />}
                    help={<FormattedMessage
                        defaultMessage={'The face on hat blocks watches the mouse cursor. ' +
                            'This may impact performance while the editor is open.'}
                        id="mw.settingsModal.scratchHatBlocksWatchHelp"
                    />}
                />
            </React.Fragment>
        );
    }
}

const UnconnectedThemePage = ({theme, onChangeTheme}) => {
    const handleSelectBlocks = React.useCallback(e => {
        onChangeTheme(theme.set('blocks', e.currentTarget.value));
    }, [theme, onChangeTheme]);
    return (
        <Box className={styles.body}>
            <PageHeader>
                <FormattedMessage
                    defaultMessage="Block Colors"
                    description="Label for to choose what color blocks should be, eg. original or high contrast"
                    id="tw.menuBar.blockColors"
                />
            </PageHeader>
            <div className={styles.stylePicker}>
                {BLOCKS_OPTIONS.map(option => (
                    <button
                        key={option.id}
                        type="button"
                        disabled={theme.blocks === BLOCKS_CUSTOM}
                        className={classNames(styles.styleOption, {
                            [styles.styleOptionSelected]: theme.blocks === option.id
                        })}
                        value={option.id}
                        onClick={handleSelectBlocks}
                    >
                        <div className={styles.themeCardPreview}>
                            <img
                                src={option.icon}
                                draggable={false}
                                width={32}
                            />
                        </div>
                        <span className={styles.styleOptionLabel}>
                            <FormattedMessage {...option.message} />
                        </span>
                    </button>
                ))}
            </div>
            <div className={styles.setting}>
                <button
                    type="button"
                    className={styles.button}
                    onClick={openBlocksAddonSettings}
                >
                    <FormattedMessage
                        defaultMessage="Customize in Addon Settings"
                        description="Link in block color list to open addon settings for more customization"
                        id="tw.blockColors.custom"
                    />
                    {' '}
                    <ExternalLink size={14} />
                </button>
            </div>
            <CatBlocksSettings />
        </Box>
    );
};
UnconnectedThemePage.propTypes = {
    theme: PropTypes.instanceOf(Theme),
    onChangeTheme: PropTypes.func
};
export const ThemePage = connect(themeStateToProps, themeDispatchToProps)(UnconnectedThemePage);

export {UnconnectedWallpaperPage, WallpaperPage} from './wallpaper-page.jsx';
export {FontsPage} from './fonts-page.jsx';
export {ColorThemePage} from './color-theme-page.jsx';

const openThemeMarketplace = () => {
    window.open('/themes', '_blank', 'noopener');
};

const UnconnectedCustomThemesSettingsPage = ({theme, onChangeTheme}) => (
    <Box className={styles.body}>
        <PageHeader>
            <FormattedMessage
                defaultMessage="Custom themes"
                id="mw.settingsModal.customThemes"
            />
        </PageHeader>
        <CustomThemesPage
            theme={theme}
            onChangeTheme={onChangeTheme}
            onOpenThemeMarketplace={communityEnabled ? openThemeMarketplace : null}
        />
    </Box>
);
UnconnectedCustomThemesSettingsPage.propTypes = {
    theme: PropTypes.instanceOf(Theme),
    onChangeTheme: PropTypes.func
};
export const CustomThemesSettingsPage = connect(
    themeStateToProps,
    themeDispatchToProps
)(UnconnectedCustomThemesSettingsPage);
