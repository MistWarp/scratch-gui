import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme} from '../../lib/themes/index.js';
import {openFontsMenu, fontsMenuOpen, closeSettingsMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {persistTheme} from '../../lib/themes/themePersistance.js';
import {loadGoogleFont, searchGoogleFonts, getPopularGoogleFonts} from '../../lib/themes/google-fonts.js';

import dropdownCaret from './dropdown-caret.svg';
import fontIcon from './icon--font.svg';
import styles from './settings-menu.css';

class FontsThemeMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            googleFontInput: '',
            systemFontInput: '',
            popularFonts: [],
            searchResults: [],
            loading: false
        };
        
        this.searchTimeout = null;
        this._isMounted = false;
    }

    componentDidMount() {
        // Load popular fonts on mount
        this._isMounted = true;
        if (this._isMounted) {
            this.setState({
                popularFonts: getPopularGoogleFonts()
            });
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }
    }

    handleGoogleFontInputChange = (e) => {
        const value = e.target.value;
        this.setState({ googleFontInput: value });

        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.searchGoogleFonts(value);
        }, 300);
    }

    handleSystemFontInputChange = (e) => {
        this.setState({ systemFontInput: e.target.value });
    }

    searchGoogleFonts = async (query) => {
        if (!query.trim()) {
            if (this._isMounted) this.setState({ searchResults: [] });
            return;
        }

        if (this._isMounted) this.setState({ loading: true });
        try {
            const results = await searchGoogleFonts(query);
            if (this._isMounted) this.setState({ searchResults: results });
        } catch (error) {
            console.error('Error searching Google Fonts:', error);
            if (this._isMounted) this.setState({ searchResults: [] });
        } finally {
            if (this._isMounted) this.setState({ loading: false });
        }
    }

    addGoogleFont = async (fontFamily) => {
        try {
            await loadGoogleFont(fontFamily);
            
            // Only allow one font - replace all existing fonts
            const newFonts = {
                system: [], // Clear system fonts
                google: [fontFamily], // Only this Google font
                history: [...this.props.theme.fonts.history.filter(f => f !== fontFamily), fontFamily].slice(-10)
            };

            this.props.onChangeTheme(this.props.theme.set('fonts', newFonts));
            if (this._isMounted) this.setState({ googleFontInput: '' });
        } catch (error) {
            console.error('Error loading Google Font:', error);
            // Could show error message to user
        }
    }

    addSystemFont = () => {
        const fontFamily = this.state.systemFontInput.trim();
        if (!fontFamily) return;

        // Only allow one font - replace all existing fonts
        const newFonts = {
            system: [fontFamily], // Only this system font
            google: [], // Clear Google fonts
            history: [...this.props.theme.fonts.history.filter(f => f !== fontFamily), fontFamily].slice(-10)
        };

        this.props.onChangeTheme(this.props.theme.set('fonts', newFonts));
        this.setState({ systemFontInput: '' });
    }

    resetFonts = () => {
        // Reset to default fonts (empty arrays)
        const newFonts = {
            system: [],
            google: [],
            history: this.props.theme.fonts.history // Keep history
        };

        this.props.onChangeTheme(this.props.theme.set('fonts', newFonts));
    }

    removeFont = (fontFamily, type) => {
        // Since we only allow one font, removing it should reset all fonts
        const newFonts = {
            system: [],
            google: [],
            history: this.props.theme.fonts.history
        };

        this.props.onChangeTheme(this.props.theme.set('fonts', newFonts));
    }

    handleKeyPress = (e, action) => {
        if (e.key === 'Enter') {
            action();
        }
    }

    render() {
        const { isOpen, isRtl, theme, onOpen } = this.props;
        const { googleFontInput, systemFontInput, popularFonts, searchResults, loading } = this.state;

        const displayResults = googleFontInput.trim() ? searchResults : popularFonts.slice(0, 8);

        return (
            <MenuItem expanded={isOpen}>
                <div
                    className={styles.option}
                    onClick={onOpen}
                >
                    <img
                        className={styles.icon}
                        src={fontIcon}
                        draggable={false}
                        width={20}
                        height={20}
                    />
                    <span className={styles.submenuLabel}>
                        <FormattedMessage
                            defaultMessage="Fonts"
                            description="Label for menu to choose fonts for the theme"
                            id="tw.menuBar.fonts"
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
                    className={styles.fontsSubmenu}
                >
                    <div className={styles.fontsContainer}>
                        {/* Google Fonts Section */}
                        <div className={styles.fontSection}>
                            <div className={styles.fontSectionTitle}>
                                <FormattedMessage
                                    defaultMessage="Google Fonts"
                                    description="Section title for Google Fonts"
                                    id="tw.fonts.googleFonts"
                                />
                            </div>
                            <div className={styles.fontInputContainer}>
                                <input
                                    type="text"
                                    className={styles.fontInput}
                                    placeholder="Search Google Fonts..."
                                    value={googleFontInput}
                                    onChange={this.handleGoogleFontInputChange}
                                    onKeyPress={(e) => this.handleKeyPress(e, () => {
                                        if (searchResults.length > 0) {
                                            this.addGoogleFont(searchResults[0].family);
                                        }
                                    })}
                                />
                                {loading && <div className={styles.loading}>Searching...</div>}
                            </div>
                            <div className={styles.fontList}>
                                {displayResults.map(font => (
                                    <div
                                        key={typeof font === 'string' ? font : font.family}
                                        className={styles.fontItem}
                                        onClick={() => this.addGoogleFont(typeof font === 'string' ? font : font.family)}
                                        style={{ fontFamily: typeof font === 'string' ? font : font.family }}
                                    >
                                        {typeof font === 'string' ? font : font.family}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* System Fonts Section */}
                        <div className={styles.fontSection}>
                            <div className={styles.fontSectionTitle}>
                                <FormattedMessage
                                    defaultMessage="System Fonts"
                                    description="Section title for system fonts"
                                    id="tw.fonts.systemFonts"
                                />
                            </div>
                            <div className={styles.fontInputContainer}>
                                <input
                                    type="text"
                                    className={styles.fontInput}
                                    placeholder="Enter font name..."
                                    value={systemFontInput}
                                    onChange={this.handleSystemFontInputChange}
                                    onKeyPress={(e) => this.handleKeyPress(e, this.addSystemFont)}
                                />
                                <button
                                    className={styles.addButton}
                                    onClick={this.addSystemFont}
                                    disabled={!systemFontInput.trim()}
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Current Fonts */}
                        {(theme.fonts.google.length > 0 || theme.fonts.system.length > 0) && (
                            <div className={styles.fontSection}>
                                <div className={styles.fontSectionTitle}>
                                    <FormattedMessage
                                        defaultMessage="Selected Font"
                                        description="Section title for currently selected font"
                                        id="tw.fonts.selectedFont"
                                    />
                                    <button
                                        className={styles.resetButton}
                                        onClick={this.resetFonts}
                                        title="Reset to default font"
                                    >
                                        <FormattedMessage
                                            defaultMessage="Reset"
                                            description="Button to reset fonts to default"
                                            id="tw.fonts.reset"
                                        />
                                    </button>
                                </div>
                                <div className={styles.selectedFontsList}>
                                    {theme.fonts.google.map(font => (
                                        <div key={font} className={styles.selectedFont}>
                                            <span style={{ fontFamily: font }}>{font}</span>
                                            <span className={styles.fontType}>(Google)</span>
                                            <button
                                                className={styles.removeButton}
                                                onClick={() => this.removeFont(font, 'google')}
                                                title="Remove font"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {theme.fonts.system.map(font => (
                                        <div key={font} className={styles.selectedFont}>
                                            <span style={{ fontFamily: font }}>{font}</span>
                                            <span className={styles.fontType}>(System)</span>
                                            <button
                                                className={styles.removeButton}
                                                onClick={() => this.removeFont(font, 'system')}
                                                title="Remove font"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recently Used */}
                        {theme.fonts.history.length > 0 && (
                            <div className={styles.fontSection}>
                                <div className={styles.fontSectionTitle}>
                                    <FormattedMessage
                                        defaultMessage="Recently Used"
                                        description="Section title for recently used fonts"
                                        id="tw.fonts.recentlyUsed"
                                    />
                                </div>
                                <div className={styles.fontList}>
                                    {theme.fonts.history.reverse().map(font => (
                                        <div
                                            key={font}
                                            className={styles.fontItem}
                                            onClick={() => this.addGoogleFont(font)}
                                            style={{ fontFamily: font }}
                                        >
                                            {font}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: fontsMenuOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        persistTheme(theme);
    },
    onOpen: () => dispatch(openFontsMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FontsThemeMenu);
