import React from 'react';
import {FormattedMessage} from 'react-intl';
import {BUILD_ID, BUILD_TIME, shortId} from '../../lib/build-version.js';
import styles from './settings-modal.css';

const BuildVersionFooter = () => {
    const commitUrl = BUILD_ID && BUILD_ID !== 'dev' ?
        `https://github.com/MistWarp/scratch-gui/commit/${BUILD_ID}` : null;
    return (
        <p className={styles.detail}>
            <FormattedMessage
                defaultMessage="Running version {version}."
                description="Shows the currently deployed version in settings"
                id="mw.settings.runningVersion"
                values={{
                    version: commitUrl ? (
                        <a
                            href={commitUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={BUILD_TIME || BUILD_ID}
                        >
                            {shortId(BUILD_ID)}
                        </a>
                    ) : shortId(BUILD_ID)
                }}
            />
        </p>
    );
};

export default BuildVersionFooter;
