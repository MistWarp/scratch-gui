import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import {FormattedMessage} from 'react-intl';

import styles from './crash-message.css';
import reloadIcon from './reload.svg';

const CrashMessage = props => (
    <div className={styles.crashWrapper}>
        <Box className={styles.body}>
            <img
                className={styles.reloadIcon}
                src={reloadIcon}
                draggable={false}
            />
            <p className={styles.header}>
                <FormattedMessage
                    defaultMessage="Something went wrong."
                    description="Crash Message title"
                    id="gui.crashMessage.label"
                />
            </p>
            <p>
                {props.onDownloadProject ? (
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="The editor ran into a problem and stopped. Download your project first, then reload the page to keep working."
                        // eslint-disable-next-line max-len
                        description="Message to inform the user that the editor crashed, when the project can still be downloaded"
                        id="mw.crashMessage.descriptionWithDownload"
                    />
                ) : (
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="The editor ran into a problem and stopped. Reload the page to keep working. If recent changes are missing, look in File > Device backups."
                        // eslint-disable-next-line max-len
                        description="Message to inform the user that the editor crashed. File > Device backups is the menu path to local backups."
                        id="mw.crashMessage.description"
                    />
                )}
            </p>
            {props.errorMessage && (
                <p className={styles.errorMessage}>
                    {props.errorMessage}
                </p>
            )}
            {props.eventId && (
                <p>
                    <FormattedMessage
                        defaultMessage="Your error was logged with id {errorId}"
                        description="Message to inform the user that page has crashed."
                        id="gui.crashMessage.errorNumber"
                        values={{
                            errorId: props.eventId
                        }}
                    />
                </p>
            )}
            <div className={styles.actions}>
                {props.onDownloadProject && (
                    <button
                        type="button"
                        className={styles.downloadButton}
                        disabled={props.downloadState === 'saving'}
                        onClick={props.onDownloadProject}
                    >
                        <FormattedMessage
                            defaultMessage="Download project"
                            description="Button to save the project to the computer after the page crashes"
                            id="mw.crashMessage.downloadProject"
                        />
                    </button>
                )}
                <button
                    type="button"
                    className={styles.reloadButton}
                    onClick={props.onReload}
                >
                    <FormattedMessage
                        defaultMessage="Reload"
                        description="Button to reload the page when page crashes"
                        id="gui.crashMessage.reload"
                    />
                </button>
            </div>
            {props.downloadState === 'saved' && (
                <p className={styles.downloadStatus}>
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Your project was downloaded. After reloading, open it with File > Load from your computer."
                        description="Shown after the project is saved to the computer from the crash screen"
                        id="mw.crashMessage.downloadSaved"
                    />
                </p>
            )}
            {props.downloadState === 'failed' && (
                <p className={styles.downloadStatus}>
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="The project could not be downloaded. After reloading, look for a recent copy in File > Device backups."
                        description="Shown when saving the project from the crash screen fails"
                        id="mw.crashMessage.downloadFailed"
                    />
                </p>
            )}
        </Box>
    </div>
);

CrashMessage.propTypes = {
    downloadState: PropTypes.oneOf(['saving', 'saved', 'failed']),
    eventId: PropTypes.string,
    errorMessage: PropTypes.string,
    onDownloadProject: PropTypes.func,
    onReload: PropTypes.func.isRequired
};

export default CrashMessage;
