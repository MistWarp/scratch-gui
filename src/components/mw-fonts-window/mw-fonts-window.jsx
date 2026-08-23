import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';
import classNames from 'classnames';

import {Theme} from '../../lib/themes/index.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import {
    loadGoogleFont,
    searchGoogleFonts,
    getPopularGoogleFonts,
    isGoogleFont
} from '../../lib/themes/google-fonts.js';
import {RotateCcw, Globe, Monitor, Check, History} from 'lucide-react';

import styles from '../menu-bar/settings-menu.css';
import localFontsStyles from '../tw-fonts-modal/fonts-modal.css';
import AddSystemFont from '../tw-fonts-modal/add-system-font.jsx';
import AddCustomFont from '../tw-fonts-modal/add-custom-font.jsx';
import ManageFont from '../tw-fonts-modal/manage-font.jsx';
import systemIcon from '../tw-fonts-modal/system.svg';
import customIcon from '../tw-fonts-modal/custom.svg';

const getFontFamily = font => (typeof font === 'string' ? font : font.family);

// Reusable Font List Item
export const FontListItem = ({family, onClick}) => (
    <button
        type="button"
        className={styles.fontItem}
        data-family={family}
        onClick={onClick}
        style={{fontFamily: family}}
        title={family}
    >
        {family}
    </button>
);

FontListItem.propTypes = {
    family: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
};

// New: Generic Font Section Component
// Note: React Intl message IDs must be statically analyzable for extraction.
// Pass a <FormattedMessage/> element from the callsite instead of passing id/defaultMessage as props.
const FontSection = ({icon: Icon, title, children}) => (
    <div className={styles.fontSection}>
        <div className={styles.fontSectionTitle}>
            <div className={styles.fontSectionTitleLeft}>
                <Icon className={styles.icon} />
                {title}
            </div>
        </div>
        {children}
    </div>
);

FontSection.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.node.isRequired,
    children: PropTypes.node
};

// New: Selected Font Display
const SelectedFontDisplay = ({selectedFont, onReset, onRemove}) => (
    <div className={styles.fontSection}>
        <div className={styles.fontSectionTitle}>
            <div className={styles.fontSectionTitleLeft}>
                <Check className={styles.icon} />
                <FormattedMessage
                    defaultMessage="Selected font"
                    id="tw.fonts.selectedFont"
                />
            </div>
            <button
                type="button"
                className={styles.resetButton}
                onClick={onReset}
                title="Reset to default font"
            >
                <RotateCcw
                    size={14}
                    className={styles.inlineIcon}
                />
                <FormattedMessage
                    defaultMessage="Reset"
                    id="tw.fonts.reset"
                />
            </button>
        </div>
        <div className={styles.selectedFontsList}>
            {selectedFont ? (
                <div className={styles.selectedFont}>
                    <span style={{fontFamily: selectedFont}}>{selectedFont}</span>
                    <button
                        type="button"
                        className={styles.removeButton}
                        onClick={onRemove}
                        title="Remove font"
                    >
                        {'×'}
                    </button>
                </div>
            ) : (
                <div className={styles.fontHint}>
                    <FormattedMessage
                        defaultMessage="Default"
                        id="tw.fonts.default"
                    />
                </div>
            )}
        </div>
    </div>
);

SelectedFontDisplay.propTypes = {
    selectedFont: PropTypes.string,
    onReset: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
};

class MWFontsWindow extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            googleFontInput: '',
            systemFontInput: '',
            popularFonts: getPopularGoogleFonts(),
            searchResults: [],
            loading: false,
            localFonts: [],
            localScreen: ''
        };
        this.searchTimeout = null;
        this._isMounted = false;
    }

    componentDidMount () {
        this._isMounted = true;
        const fontManager = this.getFontManager();
        if (fontManager) {
            this.refreshLocalFonts();
            fontManager.on('change', this.refreshLocalFonts);
        }
    }

    componentWillUnmount () {
        this._isMounted = false;
        const fontManager = this.getFontManager();
        if (fontManager) fontManager.off('change', this.refreshLocalFonts);
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
    }

    getFontManager = () => this.props.vm?.runtime?.fontManager || null;

    refreshLocalFonts = () => {
        const fontManager = this.getFontManager();
        if (fontManager) {
            this.setState({localFonts: fontManager.getFonts()});
        }
    };

    setSelectedFont = ({google = [], system = [], historyFont} = {}) => {
        const family = historyFont?.trim();
        const history = family ?
            [...this.props.theme.fonts.history.filter(f => f !== family), family].slice(-10) :
            this.props.theme.fonts.history;

        const newFonts = {google, system, history};
        this.props.onChangeTheme(this.props.theme.set('fonts', newFonts));
    };

    handleResetFonts = () => this.setSelectedFont({google: [], system: []});

    getSelectedFontName = () =>
        this.props.theme.fonts.google[0] || this.props.theme.fonts.system[0] || null;

    // DRY: Unified history selection
    selectFromHistory = async family => {
        if (!family) return;
        try {
            const isGoogle = await isGoogleFont(family);
            if (isGoogle) {
                await loadGoogleFont(family);
                this.setSelectedFont({google: [family], historyFont: family});
            } else {
                this.setSelectedFont({system: [family], historyFont: family});
            }
        } catch {
            this.setSelectedFont({system: [family], historyFont: family});
        }
    };

    handleHistoryFontClick = event => {
        this.selectFromHistory(event.currentTarget.dataset.family);
    };

    // DRY: Google Fonts handling
    handleGoogleFontInputChange = e => {
        const value = e.target.value;
        this.setState({googleFontInput: value});

        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.searchGoogleFonts(value), 300);
    };

    searchGoogleFonts = async query => {
        const trimmed = query.trim();
        if (!trimmed) return this.setState({searchResults: []});

        this.setState({loading: true});
        try {
            const results = await searchGoogleFonts(trimmed);
            if (this._isMounted) this.setState({searchResults: results});
        } catch (err) {
            console.error('Error searching Google Fonts:', err);
            if (this._isMounted) this.setState({searchResults: []});
        } finally {
            if (this._isMounted) this.setState({loading: false});
        }
    };

    addGoogleFont = async fontFamily => {
        const family = fontFamily?.trim();
        if (!family) return;

        try {
            await loadGoogleFont(family);
            this.setSelectedFont({google: [family], historyFont: family});
            this.setState({googleFontInput: ''});
        } catch (err) {
            console.error('Error loading Google Font:', err);
        }
    };

    handleGoogleFontClick = event => {
        this.addGoogleFont(event.currentTarget.dataset.family);
    };

    handleGoogleInputKeyDown = e => {
        if (e.key === 'Enter' && this.getGoogleDisplayFonts().length > 0) {
            this.addGoogleFont(getFontFamily(this.getGoogleDisplayFonts()[0]));
        }
    };

    getGoogleDisplayFonts = () =>
        (this.state.googleFontInput.trim() ?
            this.state.searchResults :
            this.state.popularFonts.slice(0, 5));

    renderGoogleFontsList = () => {
        const query = this.state.googleFontInput.trim();
        const list = this.getGoogleDisplayFonts();

        if (this.state.loading) {
            return (<div className={styles.fontHint}><FormattedMessage
                defaultMessage="Searching…"
                id="tw.fonts.searching"
            /></div>);
        }
        if (query && list.length === 0) {
            return (<div className={styles.fontHint}><FormattedMessage
                defaultMessage="No results"
                id="tw.fonts.noResults"
            /></div>);
        }

        return (
            <div className={styles.fontList}>
                {list.map(font => (
                    <FontListItem
                        key={getFontFamily(font)}
                        family={getFontFamily(font)}
                        onClick={this.handleGoogleFontClick}
                    />
                ))}
            </div>
        );
    };

    // DRY: Local/System font handling
    handleSystemFontInputChange = e => this.setState({systemFontInput: e.target.value});

    handleAddSystemFont = () => {
        const family = this.state.systemFontInput.trim();
        if (family) {
            this.setSelectedFont({system: [family], historyFont: family});
            this.setState({systemFontInput: ''});
        }
    };

    handleSystemInputKeyDown = e => {
        if (e.key === 'Enter') this.handleAddSystemFont();
    };

    handleCloseLocalScreen = () => this.setState({localScreen: ''});

    handleOpenSystemFonts = () => this.setState({localScreen: 'system'});

    handleOpenCustomFonts = () => this.setState({localScreen: 'custom'});

    // Local fonts manager (unchanged structure, but extracted for clarity)
    renderLocalFontsManager = () => {
        const fontManager = this.getFontManager();
        if (!fontManager) return null;

        if (this.state.localScreen === 'system') {
            return (<AddSystemFont
                fontManager={fontManager}
                onClose={this.handleCloseLocalScreen}
            />);
        }
        if (this.state.localScreen === 'custom') {
            return (<AddCustomFont
                fontManager={fontManager}
                onClose={this.handleCloseLocalScreen}
            />);
        }

        // Main local fonts view (unchanged but kept compact)
        return (
            <React.Fragment>
                <div className={localFontsStyles.openButtons}>
                    {/* ... buttons unchanged ... */}
                    <button
                        type="button"
                        className={localFontsStyles.openButton}
                        onClick={this.handleOpenSystemFonts}
                    >
                        <img
                            className={classNames(localFontsStyles.openButtonImage, localFontsStyles.systemImage)}
                            src={systemIcon}
                            alt=""
                            draggable={false}
                        />
                        <div className={localFontsStyles.openButtonText}>
                            <div className={localFontsStyles.openButtonTextMain}><FormattedMessage
                                defaultMessage="Add a system font"
                                id="tw.fonts.system1"
                            /></div>
                            <div className={localFontsStyles.openButtonTextSub}><FormattedMessage
                                defaultMessage="May work in Scratch, but will not appear correctly for everyone."
                                id="tw.fonts.system2"
                            /></div>
                        </div>
                    </button>
                    <button
                        type="button"
                        className={localFontsStyles.openButton}
                        onClick={this.handleOpenCustomFonts}
                    >
                        <img
                            className={classNames(localFontsStyles.openButtonImage, localFontsStyles.customImage)}
                            src={customIcon}
                            alt=""
                            draggable={false}
                        />
                        <div className={localFontsStyles.openButtonText}>
                            <div className={localFontsStyles.openButtonTextMain}><FormattedMessage
                                defaultMessage="Add font from a file"
                                id="tw.fonts.custom1"
                            /></div>
                            <div className={localFontsStyles.openButtonTextSub}>
                                <FormattedMessage
                                    defaultMessage="Usually will not work in Scratch. Supported formats: {formats}."
                                    id="tw.fonts.custom2"
                                    values={{formats: ['ttf', 'otf', 'woff', 'woff2'].map(f => `.${f}`).join(', ')}}
                                />
                            </div>
                        </div>
                    </button>
                </div>

                <div className={localFontsStyles.fontsOuter}>
                    <p>{this.state.localFonts.length ? <FormattedMessage
                        defaultMessage="Installed fonts:"
                        id="tw.fonts.list"
                    /> : <FormattedMessage
                        defaultMessage="No fonts added yet."
                        id="tw.fonts.none"
                    />}</p>
                    {this.state.localFonts.length > 0 && (
                        <div className={localFontsStyles.fonts}>
                            {this.state.localFonts.map((font, i) => (
                                <ManageFont
                                    key={i}
                                    {...font}
                                    index={i}
                                    fontManager={fontManager}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </React.Fragment>
        );
    };

    render () {
        const selectedFont = this.getSelectedFontName();
        const recentFonts = [...this.props.theme.fonts.history].reverse();

        return (
            <div className={styles.fontsContainer}>
                <SelectedFontDisplay
                    selectedFont={selectedFont}
                    onReset={this.handleResetFonts}
                    onRemove={this.handleResetFonts}
                />

                <FontSection
                    icon={History}
                    title={(
                        <FormattedMessage
                            defaultMessage="Recently used"
                            id="tw.fonts.recentlyUsed"
                        />
                    )}
                >
                    {recentFonts.length > 0 ? (
                        <div className={styles.fontList}>
                            {recentFonts.map(font => (
                                <FontListItem
                                    key={font}
                                    family={font}
                                    onClick={this.handleHistoryFontClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.fontHint}>
                            <FormattedMessage
                                defaultMessage="No recent fonts"
                                id="tw.fonts.noRecent"
                            />
                        </div>
                    )}
                </FontSection>

                <FontSection
                    icon={Globe}
                    title={(
                        <FormattedMessage
                            defaultMessage="Google Fonts"
                            id="tw.fonts.googleFonts"
                        />
                    )}
                >
                    <div className={styles.fontInputContainer}>
                        <input
                            type="text"
                            className={styles.fontInput}
                            placeholder="Search Google Fonts..."
                            value={this.state.googleFontInput}
                            onChange={this.handleGoogleFontInputChange}
                            onKeyDown={this.handleGoogleInputKeyDown}
                        />
                    </div>
                    {this.renderGoogleFontsList()}
                </FontSection>

                <FontSection
                    icon={Monitor}
                    title={(
                        <FormattedMessage
                            defaultMessage="Local Fonts"
                            id="mw.fonts.localFonts"
                        />
                    )}
                >
                    <div className={styles.fontInputContainer}>
                        <input
                            type="text"
                            className={styles.fontInput}
                            placeholder="Enter font name..."
                            value={this.state.systemFontInput}
                            onChange={this.handleSystemFontInputChange}
                            onKeyDown={this.handleSystemInputKeyDown}
                        />
                        <button
                            type="button"
                            className={styles.addButton}
                            onClick={this.handleAddSystemFont}
                            disabled={!this.state.systemFontInput.trim()}
                        >
                            <Check
                                size={14}
                                className={styles.inlineIcon}
                            />
                            <FormattedMessage
                                defaultMessage="Use"
                                id="mw.fonts.useLocalFont"
                            />
                        </button>
                    </div>
                    {this.renderLocalFontsManager()}
                </FontSection>
            </div>
        );
    }
}

MWFontsWindow.propTypes = {
    onChangeTheme: PropTypes.func.isRequired,
    theme: PropTypes.instanceOf(Theme),
    vm: PropTypes.object
};

const mapStateToProps = state => ({
    theme: state.scratchGui.theme.theme,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        applyTheme(theme);
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(MWFontsWindow);
