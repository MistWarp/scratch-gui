import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import loaderStyles from '../loader/loader.css';
import styles from './collab-loader.css';
import topBlock from '../loader/top-block.svg';
import middleBlock from '../loader/middle-block.svg';
import bottomBlock from '../loader/bottom-block.svg';
import CollaborationService from '../../lib/collaboration/index.js';

const messages = defineMessages({
    waiting: {
        defaultMessage: 'Waiting for the host…',
        description: 'Live collaboration loading screen title before the host starts sending the project',
        id: 'mw.collabLoader.waiting'
    },
    downloading: {
        defaultMessage: "Downloading the host's project…",
        description: 'Live collaboration loading screen title while the project is downloaded from the host',
        id: 'mw.collabLoader.downloading'
    },
    loading: {
        defaultMessage: 'Opening the project…',
        description: 'Live collaboration loading screen title while the downloaded project is loaded',
        id: 'mw.collabLoader.loading'
    },
    retrying: {
        defaultMessage: 'The download was interrupted. Trying again…',
        description: 'Live collaboration loading screen title after a failed project download is retried',
        id: 'mw.collabLoader.retrying'
    },
    detail: {
        defaultMessage: 'Your own project was backed up first.',
        description: 'Live collaboration loading screen subtitle',
        id: 'mw.collabLoader.detail'
    },
    leave: {
        defaultMessage: 'Leave live session',
        description: 'Button on the live collaboration loading screen that stops joining',
        id: 'mw.collabLoader.leave'
    },
    progressLabel: {
        defaultMessage: 'Project download progress',
        description: 'Accessible label of the live collaboration download progress bar',
        id: 'mw.collabLoader.progressLabel'
    }
});

/**
 * Full-screen loader shown while a guest receives the host's project.
 * `message` is a stage key set by the collaboration container.
 * @param {object} props Props.
 * @returns {React.ReactElement|null} The loader.
 */
const CollabLoader = ({intl, isLoading, message, progress, onLeave}) => {
    if (!isLoading) return null;

    const title = messages[message] ? intl.formatMessage(messages[message]) :
        (message || intl.formatMessage(messages.waiting));
    const showProgress = message === 'downloading' || progress > 0;

    return (
        <div className={classNames(loaderStyles.background, loaderStyles.fullscreen)}>
            <div
                className={styles.container}
                role="status"
                aria-live="polite"
            >
                <div className={loaderStyles.blockAnimation}>
                    <img
                        className={loaderStyles.topBlock}
                        src={topBlock}
                        alt=""
                        draggable={false}
                    />
                    <img
                        className={loaderStyles.middleBlock}
                        src={middleBlock}
                        alt=""
                        draggable={false}
                    />
                    <img
                        className={loaderStyles.bottomBlock}
                        src={bottomBlock}
                        alt=""
                        draggable={false}
                    />
                </div>

                <div className={loaderStyles.title}>
                    {title}
                </div>

                <div className={loaderStyles.message}>
                    {intl.formatMessage(messages.detail)}
                </div>

                <div
                    className={loaderStyles.barOuter}
                    role="progressbar"
                    aria-label={intl.formatMessage(messages.progressLabel)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={showProgress ? progress : null}
                >
                    <div
                        className={loaderStyles.barInner}
                        style={{width: `${progress}%`}}
                    />
                </div>

                {/* Reserve the line so the layout does not jump when it appears. */}
                <div className={styles.progressText}>
                    {showProgress ? `${progress}%` : ' '}
                </div>

                <button
                    type="button"
                    className={styles.leaveButton}
                    onClick={onLeave}
                >
                    {intl.formatMessage(messages.leave)}
                </button>
            </div>
        </div>
    );
};

CollabLoader.propTypes = {
    intl: intlShape.isRequired,
    isLoading: PropTypes.bool,
    message: PropTypes.string,
    progress: PropTypes.number,
    onLeave: PropTypes.func
};

CollabLoader.defaultProps = {
    isLoading: false,
    message: null,
    progress: 0,
    // Disconnecting emits 'disconnected'; the collaboration container and
    // project session clean up from there, which also hides this loader.
    onLeave: () => CollaborationService.getInstance().disconnect()
};

const mapStateToProps = state => ({
    isLoading: state.scratchGui.collaboration.isCollabLoading,
    message: state.scratchGui.collaboration.collabLoadingMessage,
    progress: state.scratchGui.collaboration.hostLoadingProgress
});

export default injectIntl(connect(mapStateToProps)(CollabLoader));
