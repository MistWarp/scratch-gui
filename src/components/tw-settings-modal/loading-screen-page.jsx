import PropTypes from 'prop-types';
import React, {useCallback, useState} from 'react';
import {FormattedMessage} from 'react-intl';

import Box from '../box/box.jsx';
import {BooleanSetting} from './settings-content.jsx';
import {
    getLoaderSettings,
    resetLoaderSettings,
    setLoaderSettings
} from '../../lib/mw/loader-settings';

import styles from './settings-modal.css';

const TOGGLES = [
    {
        key: 'showAnimation',
        label: (
            <FormattedMessage
                defaultMessage="Block animation"
                description="Loading screen setting"
                id="mw.settings.loader.animation"
            />
        ),
        help: (
            <FormattedMessage
                defaultMessage="The stack of blocks that assembles itself while the project loads."
                description="Loading screen setting help"
                id="mw.settings.loader.animationHelp"
            />
        )
    },
    {
        key: 'showTitle',
        label: (
            <FormattedMessage
                defaultMessage="Title"
                description="Loading screen setting"
                id="mw.settings.loader.title"
            />
        ),
        help: (
            <FormattedMessage
                defaultMessage="The large heading, which reads Loading Project or Creating Project."
                description="Loading screen setting help"
                id="mw.settings.loader.titleHelp"
            />
        )
    },
    {
        key: 'showStatus',
        label: (
            <FormattedMessage
                defaultMessage="Stage message"
                description="Loading screen setting"
                id="mw.settings.loader.status"
            />
        ),
        help: (
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="The line describing what is happening right now, such as unzipping the project or building blocks, along with its icon."
                description="Loading screen setting help"
                id="mw.settings.loader.statusHelp"
            />
        )
    },
    {
        key: 'showProgress',
        label: (
            <FormattedMessage
                defaultMessage="Progress bar"
                description="Loading screen setting"
                id="mw.settings.loader.progress"
            />
        ),
        help: (
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="The bar that fills up as the project loads. Turning it off does not change how fast the project loads."
                description="Loading screen setting help"
                id="mw.settings.loader.progressHelp"
            />
        )
    },
    {
        key: 'showDetail',
        label: (
            <FormattedMessage
                defaultMessage="Details"
                description="Loading screen setting"
                id="mw.settings.loader.detail"
            />
        ),
        help: (
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="The smaller line under the bar, such as how much of the project has been downloaded so far."
                description="Loading screen setting help"
                id="mw.settings.loader.detailHelp"
            />
        )
    },
    {
        key: 'showQuotes',
        label: (
            <FormattedMessage
                defaultMessage="Quotes"
                description="Loading screen setting"
                id="mw.settings.loader.quotes"
            />
        ),
        help: (
            <FormattedMessage
                defaultMessage="The quote at the bottom of the loading screen, which changes every few seconds."
                description="Loading screen setting help"
                id="mw.settings.loader.quotesHelp"
            />
        )
    }
];

const LoaderToggle = ({help, label, settingKey, value, onToggle}) => {
    const handleChange = useCallback(() => onToggle(settingKey), [onToggle, settingKey]);
    return (
        <BooleanSetting
            help={help}
            label={label}
            value={value}
            onChange={handleChange}
        />
    );
};

LoaderToggle.propTypes = {
    help: PropTypes.node,
    label: PropTypes.node,
    settingKey: PropTypes.string.isRequired,
    value: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired
};

const LoadingScreenPage = () => {
    const [settings, setSettings] = useState(getLoaderSettings);

    const handleToggle = useCallback(key => {
        setSettings(setLoaderSettings({[key]: !getLoaderSettings()[key]}));
    }, []);

    const handleQuotesChange = useCallback(event => {
        setSettings(setLoaderSettings({
            customQuotes: event.target.value.split('\n')
                .map(line => line.trim())
                .filter(Boolean)
        }));
    }, []);

    const handleReset = useCallback(() => setSettings(resetLoaderSettings()), []);

    return (
        <Box className={styles.body}>
            <div className={styles.header}>
                <FormattedMessage
                    defaultMessage="Loading Screen"
                    description="Loading screen settings sub-menu"
                    id="mw.settings.loadingScreen"
                />
                <div className={styles.divider} />
            </div>

            {TOGGLES.map(toggle => (
                <LoaderToggle
                    help={toggle.help}
                    key={toggle.key}
                    label={toggle.label}
                    settingKey={toggle.key}
                    value={settings[toggle.key]}
                    onToggle={handleToggle}
                />
            ))}

            <div className={styles.setting}>
                <div className={styles.detail}>
                    <FormattedMessage
                        defaultMessage="Custom quotes, one per line. Leave this empty to use the built-in quotes."
                        description="Help text for the custom loading screen quotes"
                        id="mw.settings.loader.customQuotesHelp"
                    />
                </div>
                <textarea
                    disabled={!settings.showQuotes}
                    rows={8}
                    value={settings.customQuotes.join('\n')}
                    onChange={handleQuotesChange}
                />
                <button
                    className={styles.button}
                    type="button"
                    onClick={handleReset}
                >
                    <FormattedMessage
                        defaultMessage="Reset to defaults"
                        description="Button that restores the default loading screen settings"
                        id="mw.settings.loader.reset"
                    />
                </button>
            </div>
        </Box>
    );
};

export default LoadingScreenPage;
