import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import ChevronDown from './ChevronDown.jsx';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme} from '../../lib/themes/index.js';
import {openFontsMenu, fontsMenuOpen, closeSettingsMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import {loadGoogleFont, isGoogleFont} from '../../lib/themes/google-fonts.js';
import openMWFontsWindow from '../../lib/mw/open-mw-fonts-window.js';

import styles from './settings-menu.css';

import {BookType, Check, History} from 'lucide-react';

const FontListItem = ({family, onClick}) => (
    <div
        className={styles.fontItem}
        data-family={family}
        onClick={onClick}
        style={{fontFamily: family}}
        title={family}
    >
        {family}
    </div>
);

FontListItem.propTypes = {
    family: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
};

class FontsThemeMenu extends React.Component {
    static contextTypes = {
        store: PropTypes.object
    };

    getSelectedFontName = () => {
        const {theme} = this.props;
        if (theme.fonts.google.length > 0) return theme.fonts.google[0];
        if (theme.fonts.system.length > 0) return theme.fonts.system[0];
        return null;
    };

    setSelectedFont = ({google = [], system = [], historyFont}) => {
        const family = (historyFont || '').trim();
        const history = family ? [
            ...this.props.theme.fonts.history.filter(f => f !== family),
            family
        ].slice(-10) : this.props.theme.fonts.history;

        const newFonts = {
            system,
            google,
            history
        };
        this.props.onChangeTheme(this.props.theme.set('fonts', newFonts));
    };

    resetFonts = () => {
        const newFonts = {
            system: [],
            google: [],
            history: this.props.theme.fonts.history
        };
        this.props.onChangeTheme(this.props.theme.set('fonts', newFonts));
    };

    selectFromHistory = async fontFamily => {
        const family = (fontFamily || '').trim();
        if (!family) return;

        try {
            const google = await isGoogleFont(family);
            if (google) {
                await loadGoogleFont(family);
                this.setSelectedFont({google: [family], system: [], historyFont: family});
            } else {
                this.setSelectedFont({google: [], system: [family], historyFont: family});
            }
        } catch (e) {
            this.setSelectedFont({google: [], system: [family], historyFont: family});
        }
    };

    handleRecentFontClick = e => {
        const family = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.family;
        this.selectFromHistory(family);
    };

    handleRemoveSelectedFont = () => {
        this.resetFonts();
    };

    handleOpenFontsWindow = () => {
        openMWFontsWindow({
            vm: this.props.vm,
            store: this.context.store,
            locale: this.props.locale,
            messages: this.props.messages
        });
        this.props.onCloseSettingsMenu();
    };

    render () {
        const {isOpen, isRtl, theme, onOpen} = this.props;
        const selectedFont = this.getSelectedFontName();
        const history = [...theme.fonts.history].reverse();

        return (
            <MenuItem expanded={isOpen}>
                <div
                    className={styles.option}
                    onClick={onOpen}
                >
                    <BookType className={styles.icon} />
                    <span className={styles.submenuLabel}>
                        <FormattedMessage
                            defaultMessage="Fonts"
                            description="Label for menu to choose fonts for the theme"
                            id="tw.menuBar.fonts"
                        />
                    </span>
                    <ChevronDown className={styles.expandCaret} />
                </div>
                <Submenu
                    place={isRtl ? 'left' : 'right'}
                    className={styles.fontsSubmenu}
                >
                    <div className={styles.fontsContainer}>
                        <div className={styles.fontSection}>
                            <div className={styles.fontSectionTitle}>
                                <div className={styles.fontSectionTitleLeft}>
                                    <Check className={styles.icon} />
                                    <FormattedMessage
                                        defaultMessage="Selected font"
                                        description="Section title for selected font"
                                        id="tw.fonts.selectedFont"
                                    />
                                </div>
                            </div>
                            <div className={styles.selectedFontsList}>
                                {selectedFont ? (
                                    <div className={styles.selectedFont}>
                                        <span style={{fontFamily: selectedFont}}>{selectedFont}</span>
                                        <button
                                            className={styles.removeButton}
                                            onClick={this.handleRemoveSelectedFont}
                                            title="Remove font"
                                        >
                                            {'×'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.fontHint}>
                                        <FormattedMessage
                                            defaultMessage="Default"
                                            description="Shown when no custom font is selected"
                                            id="tw.fonts.default"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.fontSection}>
                            <div className={styles.fontSectionTitle}>
                                <div className={styles.fontSectionTitleLeft}>
                                    <History className={styles.icon} />
                                    <FormattedMessage
                                        defaultMessage="Recently used"
                                        description="Section title for recently used fonts"
                                        id="tw.fonts.recentlyUsed"
                                    />
                                </div>
                            </div>
                            {history.length > 0 ? (
                                <div className={styles.fontList}>
                                    {history.map(font => (
                                        <FontListItem
                                            key={font}
                                            family={font}
                                            onClick={this.handleRecentFontClick}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.fontHint}>
                                    <FormattedMessage
                                        defaultMessage="No recent fonts"
                                        description="Shown when there is no font history"
                                        id="tw.fonts.noRecent"
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            className={styles.addButton}
                            onClick={this.handleOpenFontsWindow}
                        >
                            <FormattedMessage
                                defaultMessage="Add Font"
                                description="Button to open the fonts manager window"
                                id="tw.fonts.addFont"
                            />
                        </button>
                    </div>
                </Submenu>
            </MenuItem>
        );
    }
}

FontsThemeMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    onOpen: PropTypes.func,
    onCloseSettingsMenu: PropTypes.func,
    locale: PropTypes.string,
    messages: PropTypes.object,
    vm: PropTypes.shape({
        wm: PropTypes.shape({
            createWindow: PropTypes.func
        })
    }),
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: fontsMenuOpen(state),
    isRtl: state.locales.isRtl,
    locale: state.locales.locale,
    messages: state.locales.messages,
    vm: state.scratchGui.vm,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        applyTheme(theme);
    },
    onOpen: () => dispatch(openFontsMenu()),
    onCloseSettingsMenu: () => dispatch(closeSettingsMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FontsThemeMenu);
