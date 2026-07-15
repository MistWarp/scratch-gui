import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import {Theme, GUI_MAP, ACCENT_MAP} from '../../lib/themes/index.js';
import {ACCENT_GROUPS} from '../../lib/themes/accents.js';
import styles from './settings-modal.css';

const ACCENT_MESSAGES = {};
for (const key of Object.keys(ACCENT_MAP)) {
    ACCENT_MESSAGES[key] = {
        id: ACCENT_MAP[key].id,
        defaultMessage: ACCENT_MAP[key].defaultMessage,
        description: ACCENT_MAP[key].description
    };
}

const PageHeader = ({children}) => (
    <div className={styles.header}>
        {children}
        <div className={styles.divider} />
    </div>
);
PageHeader.propTypes = {
    children: PropTypes.node
};

const GuiThemeIcon = ({id}) => (
    <svg
        className={styles.themeCardIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{__html: GUI_MAP[id].icon}}
    />
);
GuiThemeIcon.propTypes = {
    id: PropTypes.string
};

const ThemeAccentPanel = ({theme, onChangeTheme}) => (
    <React.Fragment>
        <div className={styles.stylePicker}>
            {Object.entries(Theme.defaults).map(([themeId, t]) => (
                <button
                    key={themeId}
                    type="button"
                    className={classNames(styles.styleOption, {
                        [styles.styleOptionSelected]: theme.gui === themeId
                    })}
                    // eslint-disable-next-line react/jsx-no-bind
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
                            // eslint-disable-next-line react/jsx-no-bind
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
    </React.Fragment>
);
ThemeAccentPanel.propTypes = {
    theme: PropTypes.instanceOf(Theme),
    onChangeTheme: PropTypes.func
};

export {ThemeAccentPanel, PageHeader, GuiThemeIcon, ACCENT_MESSAGES};
export default ThemeAccentPanel;
