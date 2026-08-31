import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import Modal from '../../containers/windowed-modal.jsx';
import SecurityModals from '../../lib/constants/security-manager.js';
import LoadExtensionModal from './load-extension.jsx';
import FetchModal from './fetch.jsx';
import OpenWindowModal from './open-window.jsx';
import RedirectModal from './redirect.jsx';
import RecordAudio from './record-audio.jsx';
import RecordVideo from './record-video.jsx';
import ReadClipboard from './read-clipboard.jsx';
import Notify from './notify.jsx';
import Geolocate from './geolocate.jsx';
import Embed from './embed.jsx';
import Download from './download.jsx';
import DelayedMountPropertyHOC from './delayed-mount-property-hoc.jsx';
import styles from './security-manager-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Extension Security',
        // eslint-disable-next-line max-len
        description: 'Title of modal thats asks the user for permission to let the project load an extension, fetch a resource, open a window, etc.',
        id: 'tw.securityManager.title'
    }
});

const noop = () => {};

const SecurityManagerModalComponent = props => (
    <Modal
        className={styles.modalContent}
        onRequestClose={props.enableButtons ? props.onDenied : noop}
        contentLabel={props.intl.formatMessage(messages.title)}
        id="securitymanagermodal"
    >
        <Box className={styles.body}>
            {props.type === SecurityModals.LoadExtension ? (
                <LoadExtensionModal {...props.data} />
            ) : props.type === SecurityModals.Fetch ? (
                <FetchModal {...props.data} />
            ) : props.type === SecurityModals.OpenWindow ? (
                <OpenWindowModal {...props.data} />
            ) : props.type === SecurityModals.Redirect ? (
                <RedirectModal {...props.data} />
            ) : props.type === SecurityModals.RecordAudio ? (
                <RecordAudio {...props.data} />
            ) : props.type === SecurityModals.RecordVideo ? (
                <RecordVideo {...props.data} />
            ) : props.type === SecurityModals.ReadClipboard ? (
                <ReadClipboard {...props.data} />
            ) : props.type === SecurityModals.Notify ? (
                <Notify {...props.data} />
            ) : props.type === SecurityModals.Geolocate ? (
                <Geolocate {...props.data} />
            ) : props.type === SecurityModals.Embed ? (
                <Embed {...props.data} />
            ) : props.type === SecurityModals.Download ? (
                <Download {...props.data} />
            ) : null}

            <Box className={styles.projectActions}>
                <div className={styles.projectActionsTitle}>
                    <FormattedMessage
                        defaultMessage="For future requests"
                        description="Heading above options which apply to all permission requests from a project"
                        id="mw.securityManager.futureRequests"
                    />
                </div>
                <div className={styles.projectActionsDescription}>
                    {props.showLoadAll ? (
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="Always deny this project's permission requests, or trust it for this session and allow them without asking. Only trust a project you made or checked."
                            description="Explanation of project-wide deny and trust options"
                            id="mw.securityManager.futureRequestsWithTrust"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Stop this project from asking for any more permissions."
                            description="Explanation of the project-wide deny option"
                            id="mw.securityManager.futureRequestsDeny"
                        />
                    )}
                </div>
                <Box className={styles.projectButtons}>
                    <button
                        type="button"
                        className={styles.blockButton}
                        onClick={props.onBlocked}
                        disabled={!props.enableButtons}
                    >
                        <FormattedMessage
                            defaultMessage="Always deny requests"
                            description="Button permanently denying future permission prompts from the current project"
                            id="mw.securityManager.blockProject"
                        />
                    </button>
                    {props.showLoadAll ? (
                        <button
                            type="button"
                            className={styles.loadAllButton}
                            onClick={props.onLoadAll}
                            disabled={!props.enableButtons}
                        >
                            <FormattedMessage
                                defaultMessage="Trust for this session"
                                // eslint-disable-next-line max-len
                                description="Button allowing all permission requests from a trusted project for this session"
                                id="mw.securityManager.ownerBypass"
                            />
                        </button>
                    ) : null}
                </Box>
            </Box>

            <Box className={styles.buttons}>
                <button
                    type="button"
                    className={styles.denyButton}
                    onClick={props.onDenied}
                    disabled={!props.enableButtons}
                >
                    {props.type === SecurityModals.LoadExtension ? (
                        <FormattedMessage
                            defaultMessage="Don't run"
                            description="Button refusing to run potentially dangerous project code"
                            id="mw.securityManager.dontRun"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Deny"
                            description="Button denying a project capability"
                            id="tw.securityManager.deny"
                        />
                    )}
                </button>
                <button
                    type="button"
                    className={styles.allowButton}
                    onClick={props.onAllowed}
                    disabled={!props.enableButtons}
                >
                    {props.type === SecurityModals.LoadExtension ? (
                        props.data.unsandboxed ? (
                            <FormattedMessage
                                defaultMessage="Run with full access"
                                description="Button allowing project code to run outside the sandbox"
                                id="mw.securityManager.runFullAccess"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Run extension"
                                description="Button allowing project code to run in a sandbox"
                                id="mw.securityManager.runSandboxed"
                            />
                        )
                    ) : (
                        <FormattedMessage
                            defaultMessage="Allow"
                            description="Button allowing a project capability"
                            id="tw.securityManager.allow"
                        />
                    )}
                </button>
            </Box>
        </Box>
    </Modal>
);

SecurityManagerModalComponent.propTypes = {
    intl: intlShape,
    type: PropTypes.oneOf(Object.values(SecurityModals)),
    enableButtons: PropTypes.bool,
    showLoadAll: PropTypes.bool,
    // Each modal may have different type of data
    // eslint-disable-next-line react/forbid-prop-types
    data: PropTypes.object.isRequired,
    onAllowed: PropTypes.func.isRequired,
    onBlocked: PropTypes.func.isRequired,
    onDenied: PropTypes.func.isRequired,
    onLoadAll: PropTypes.func.isRequired
};

// Prevent accidentally pressing buttons immediately when a prompt appears.

// grr no
const BUTTON_DELAY = 10;
export default DelayedMountPropertyHOC(injectIntl(SecurityManagerModalComponent), BUTTON_DELAY, {
    enableButtons: true
});
