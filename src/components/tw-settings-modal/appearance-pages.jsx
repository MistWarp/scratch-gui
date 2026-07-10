import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';
import locales from '@turbowarp/scratch-l10n';

import Box from '../box/box.jsx';
import Input from '../forms/input.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import {Theme, GUI_MAP, ACCENT_MAP, BLOCKS_CUSTOM, BLOCKS_DARK, BLOCKS_HIGH_CONTRAST, BLOCKS_THREE}
    from '../../lib/themes/index.js';
import {ACCENT_GROUPS} from '../../lib/themes/accents.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import {selectLocale} from '../../reducers/locales.js';
import {loadGoogleFont, isGoogleFont} from '../../lib/themes/google-fonts.js';
import openMWFontsWindow from '../../lib/mw/open-mw-fonts-window.js';

import styles from './settings-modal.css';

import threeIcon from '../menu-bar/tw-blocks-three.svg';
import highContrastIcon from '../menu-bar/tw-blocks-high-contrast.svg';
import darkIcon from '../menu-bar/tw-blocks-dark.svg';

import {ExternalLink, Trash} from 'lucide-react';

const PageHeader = ({children}) => (
    <div className={styles.header}>
        {children}
        <div className={styles.divider} />
    </div>
);
PageHeader.propTypes = {
    children: PropTypes.node
};

const themeStateToProps = state => ({
    theme: state.scratchGui.theme.theme
});
const themeDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        applyTheme(theme);
    }
});

const UnconnectedLanguagePage = ({currentLocale, onChangeLanguage}) => (
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
                onChange={e => onChangeLanguage(e.target.value)}
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
UnconnectedLanguagePage.propTypes = {
    currentLocale: PropTypes.string,
    onChangeLanguage: PropTypes.func
};
export const LanguagePage = connect(
    state => ({currentLocale: state.locales.locale}),
    dispatch => ({onChangeLanguage: locale => dispatch(selectLocale(locale))})
)(UnconnectedLanguagePage);

const ACCENT_MESSAGES = {};
for (const key of Object.keys(ACCENT_MAP)) {
    ACCENT_MESSAGES[key] = {
        id: ACCENT_MAP[key].id,
        defaultMessage: ACCENT_MAP[key].defaultMessage,
        description: ACCENT_MAP[key].description
    };
}

const GuiThemeIcon = ({id}) => (
    <svg
        className={styles.themeCardIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        dangerouslySetInnerHTML={{__html: GUI_MAP[id].icon}}
    />
);
GuiThemeIcon.propTypes = {
    id: PropTypes.string
};

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

const UnconnectedThemePage = ({theme, onChangeTheme}) => (
    <Box className={styles.body}>
        <PageHeader>
            <FormattedMessage
                defaultMessage="Theme"
                description="Label for menu to choose theme"
                id="tw.menuBar.theme"
            />
        </PageHeader>
        <div className={styles.stylePicker}>
            {Object.entries(Theme.defaults).map(([themeId, t]) => (
                <button
                    key={themeId}
                    type="button"
                    className={classNames(styles.styleOption, {
                        [styles.styleOptionSelected]: theme.gui === themeId
                    })}
                    onClick={() => onChangeTheme(theme.set('gui', themeId))}
                >
                    <div className={styles.themeCardPreview}>
                        <GuiThemeIcon id={themeId} />
                    </div>
                    <span className={styles.styleOptionLabel}>{t.name || t.gui}</span>
                </button>
            ))}
        </div>

        <PageHeader>
            <FormattedMessage
                defaultMessage="Accent"
                description="Label for menu to choose accent color (eg. TurboWarp's red, Scratch's purple)"
                id="tw.menuBar.accent"
            />
        </PageHeader>
        {ACCENT_GROUPS.map(group => (
            <React.Fragment key={group.label.id}>
                <div className={styles.accentGroupLabel}>
                    <FormattedMessage {...group.label} />
                </div>
                <div className={styles.accentGrid}>
                    {group.accents.filter(accentId => ACCENT_MAP[accentId]).map(accentId => (
                        <button
                            key={accentId}
                            type="button"
                            className={classNames(styles.accentOption, {
                                [styles.accentOptionSelected]: theme.accent === accentId
                            })}
                            onClick={() => onChangeTheme(theme.set('accent', accentId))}
                        >
                            <div
                                className={styles.accentSwatch}
                                style={{
                                    backgroundColor: ACCENT_MAP[accentId].guiColors['looks-secondary'],
                                    backgroundImage: ACCENT_MAP[accentId].guiColors['menu-bar-background-image']
                                }}
                            />
                            <span className={styles.accentName}>
                                <FormattedMessage {...ACCENT_MESSAGES[accentId]} />
                            </span>
                        </button>
                    ))}
                </div>
            </React.Fragment>
        ))}

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
                    onClick={() => onChangeTheme(theme.set('blocks', option.id))}
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
    </Box>
);
UnconnectedThemePage.propTypes = {
    theme: PropTypes.instanceOf(Theme),
    onChangeTheme: PropTypes.func
};
export const ThemePage = connect(themeStateToProps, themeDispatchToProps)(UnconnectedThemePage);

class UnconnectedWallpaperPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            url: ''
        };
    }
    setWallpaper (patch) {
        const {theme, onChangeTheme} = this.props;
        onChangeTheme(theme.set('wallpaper', {...theme.wallpaper, ...patch}));
    }
    handleAdd = e => {
        e.preventDefault();
        const url = this.state.url.trim();
        if (!url) return;
        const history = [url, ...(this.props.theme.wallpaper.history || []).filter(u => u !== url)].slice(0, 10);
        this.setWallpaper({url, history});
        this.setState({url: ''});
    };
    handleRemove = url => {
        const wallpaper = this.props.theme.wallpaper;
        this.setWallpaper({
            history: (wallpaper.history || []).filter(u => u !== url),
            ...(wallpaper.url === url ? {url: ''} : null)
        });
    };
    render () {
        const {theme} = this.props;
        const wallpaper = theme.wallpaper;

        return (
            <Box className={styles.body}>
                <PageHeader>
                    <FormattedMessage
                        defaultMessage="Wallpaper"
                        description="Label for wallpaper menu"
                        id="tw.menuBar.wallpaper"
                    />
                </PageHeader>
                <form
                    className={styles.setting}
                    onSubmit={this.handleAdd}
                >
                    <div className={styles.textSettingLabel}>
                        <FormattedMessage
                            defaultMessage="Image URL"
                            id="mw.settings.wallpaperUrl"
                        />
                    </div>
                    <div className={styles.wallpaperInputRow}>
                        <Input
                            type="url"
                            className={styles.textInput}
                            placeholder="Enter image URL..."
                            value={this.state.url}
                            onChange={e => this.setState({url: e.target.value})}
                        />
                        <button
                            type="submit"
                            className={styles.button}
                            disabled={!this.state.url.trim()}
                        >
                            <FormattedMessage
                                defaultMessage="Add"
                                description="Button to add wallpaper"
                                id="tw.wallpaper.add"
                            />
                        </button>
                    </div>
                </form>

                <div className={styles.setting}>
                    <label className={styles.sliderRow}>
                        <span className={styles.sliderLabel}>
                            <FormattedMessage
                                defaultMessage="Opacity:"
                                description="Label for wallpaper opacity slider"
                                id="tw.wallpaper.opacity"
                            />
                        </span>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={wallpaper.opacity}
                            onChange={e => this.setWallpaper({opacity: parseFloat(e.target.value)})}
                        />
                        <span className={styles.sliderValue}>{`${Math.round(wallpaper.opacity * 100)}%`}</span>
                    </label>
                    <label className={styles.sliderRow}>
                        <span className={styles.sliderLabel}>
                            <FormattedMessage
                                defaultMessage="Darkness:"
                                description="Label for wallpaper darkness slider"
                                id="tw.wallpaper.darkness"
                            />
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="0.8"
                            step="0.1"
                            value={wallpaper.darkness || 0}
                            onChange={e => this.setWallpaper({darkness: parseFloat(e.target.value)})}
                        />
                        <span className={styles.sliderValue}>{`${Math.round((wallpaper.darkness || 0) * 100)}%`}</span>
                    </label>
                    <label className={styles.sliderRow}>
                        <span className={styles.sliderLabel}>
                            <FormattedMessage
                                defaultMessage="Show Grid:"
                                description="Label for wallpaper grid visibility toggle"
                                id="tw.wallpaper.showGrid"
                            />
                        </span>
                        <FancyCheckbox
                            className={styles.checkbox}
                            checked={wallpaper.gridVisible !== false}
                            onChange={e => this.setWallpaper({gridVisible: e.target.checked})}
                        />
                    </label>
                </div>

                <div className={styles.wallpaperList}>
                    <div
                        className={classNames(styles.wallpaperItem, {
                            [styles.wallpaperItemSelected]: !wallpaper.url
                        })}
                        onClick={() => this.setWallpaper({url: ''})}
                    >
                        <div className={styles.wallpaperThumb}>
                            <FormattedMessage
                                defaultMessage="None"
                                description="Label for no wallpaper option"
                                id="tw.wallpaper.none"
                            />
                        </div>
                        <span className={styles.wallpaperItemUrl}>
                            <FormattedMessage
                                defaultMessage="No wallpaper"
                                description="Label for no wallpaper selected"
                                id="tw.wallpaper.noWallpaper"
                            />
                        </span>
                    </div>
                    {(wallpaper.history || []).map(url => (
                        <div
                            key={url}
                            className={classNames(styles.wallpaperItem, {
                                [styles.wallpaperItemSelected]: wallpaper.url === url
                            })}
                            onClick={() => this.setWallpaper({url})}
                        >
                            <div className={styles.wallpaperThumb}>
                                <img
                                    src={url}
                                    alt=""
                                    onError={e => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                            <span
                                className={styles.wallpaperItemUrl}
                                title={url}
                            >
                                {url}
                            </span>
                            <button
                                type="button"
                                className={styles.iconButton}
                                title="Remove wallpaper"
                                aria-label="Remove wallpaper"
                                onClick={e => {
                                    e.stopPropagation();
                                    this.handleRemove(url);
                                }}
                            >
                                <Trash size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </Box>
        );
    }
}
UnconnectedWallpaperPage.propTypes = {
    theme: PropTypes.instanceOf(Theme),
    onChangeTheme: PropTypes.func
};
export const WallpaperPage = connect(themeStateToProps, themeDispatchToProps)(UnconnectedWallpaperPage);

class UnconnectedFontsPage extends React.Component {
    static contextTypes = {
        store: PropTypes.object
    };

    getSelectedFontName () {
        const {theme} = this.props;
        if (theme.fonts.google.length > 0) return theme.fonts.google[0];
        if (theme.fonts.system.length > 0) return theme.fonts.system[0];
        return null;
    }

    setSelectedFont ({google = [], system = [], historyFont}) {
        const family = (historyFont || '').trim();
        const history = family ? [
            ...this.props.theme.fonts.history.filter(f => f !== family),
            family
        ].slice(-10) : this.props.theme.fonts.history;

        this.props.onChangeTheme(this.props.theme.set('fonts', {system, google, history}));
    }

    handleReset = () => {
        this.setSelectedFont({});
    };

    handleRecentFontClick = async e => {
        const family = (e.currentTarget.dataset.family || '').trim();
        if (!family) return;

        try {
            const google = await isGoogleFont(family);
            if (google) {
                await loadGoogleFont(family);
                this.setSelectedFont({google: [family], system: [], historyFont: family});
            } else {
                this.setSelectedFont({google: [], system: [family], historyFont: family});
            }
        } catch (err) {
            this.setSelectedFont({google: [], system: [family], historyFont: family});
        }
    };

    handleOpenFontsWindow = () => {
        openMWFontsWindow({
            vm: this.props.vm,
            store: this.context.store,
            locale: this.props.locale,
            messages: this.props.messages
        });
    };

    render () {
        const {theme} = this.props;
        const selectedFont = this.getSelectedFontName();
        const history = [...theme.fonts.history].reverse();

        return (
            <Box className={styles.body}>
                <PageHeader>
                    <FormattedMessage
                        defaultMessage="Fonts"
                        description="Label for menu to choose fonts for the theme"
                        id="tw.menuBar.fonts"
                    />
                </PageHeader>
                <div className={styles.setting}>
                    <div className={styles.textSettingLabel}>
                        <FormattedMessage
                            defaultMessage="Selected font"
                            description="Section title for selected font"
                            id="tw.fonts.selectedFont"
                        />
                    </div>
                    {selectedFont ? (
                        <div className={styles.fontRow}>
                            <span style={{fontFamily: selectedFont}}>{selectedFont}</span>
                            <button
                                type="button"
                                className={styles.iconButton}
                                onClick={this.handleReset}
                                title="Remove font"
                            >
                                {'×'}
                            </button>
                        </div>
                    ) : (
                        <p className={styles.detail}>
                            <FormattedMessage
                                defaultMessage="Default"
                                description="Shown when no custom font is selected"
                                id="tw.fonts.default"
                            />
                        </p>
                    )}
                    <button
                        className={styles.button}
                        onClick={this.handleOpenFontsWindow}
                    >
                        <FormattedMessage
                            defaultMessage="Add Font"
                            description="Button to open the fonts manager window"
                            id="tw.fonts.addFont"
                        />
                    </button>
                </div>
                <div className={styles.setting}>
                    <div className={styles.textSettingLabel}>
                        <FormattedMessage
                            defaultMessage="Recently used"
                            description="Section title for recently used fonts"
                            id="tw.fonts.recentlyUsed"
                        />
                    </div>
                    {history.length > 0 ? (
                        <div className={styles.fontList}>
                            {history.map(font => (
                                <div
                                    key={font}
                                    className={styles.fontRow}
                                    data-family={font}
                                    style={{fontFamily: font, cursor: 'pointer'}}
                                    title={font}
                                    onClick={this.handleRecentFontClick}
                                >
                                    {font}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.detail}>
                            <FormattedMessage
                                defaultMessage="No recent fonts"
                                description="Shown when there is no font history"
                                id="tw.fonts.noRecent"
                            />
                        </p>
                    )}
                </div>
            </Box>
        );
    }
}
UnconnectedFontsPage.propTypes = {
    theme: PropTypes.instanceOf(Theme),
    onChangeTheme: PropTypes.func,
    locale: PropTypes.string,
    messages: PropTypes.object,
    vm: PropTypes.object
};
export const FontsPage = connect(
    state => ({
        theme: state.scratchGui.theme.theme,
        locale: state.locales.locale,
        messages: state.locales.messages,
        vm: state.scratchGui.vm
    }),
    themeDispatchToProps
)(UnconnectedFontsPage);
