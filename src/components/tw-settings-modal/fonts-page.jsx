import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import Box from '../box/box.jsx';
import {Theme} from '../../lib/themes/index.js';
import {PageHeader} from './theme-accent-panel.jsx';
import {themeDispatchToProps} from './theme-connect.js';
import {loadGoogleFont, isGoogleFont} from '../../lib/themes/google-fonts.js';
import openMWFontsWindow from '../../lib/mw/open-mw-fonts-window.js';

import styles from './settings-modal.css';

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
                        type="button"
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
                                <button
                                    key={font}
                                    type="button"
                                    className={styles.fontRow}
                                    data-family={font}
                                    style={{fontFamily: font, cursor: 'pointer'}}
                                    title={font}
                                    onClick={this.handleRecentFontClick}
                                >
                                    {font}
                                </button>
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
