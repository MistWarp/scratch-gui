import React from 'react';
import PropTypes from 'prop-types';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import Box from '../box/box.jsx';
import {
    BUILD_ID,
    fetchDeployedVersion,
    isUpdateAvailable,
    shortId
} from '../../lib/build-version.js';
import {prepareUpdate, switchToUpdate} from '../../lib/offline-worker.js';
import styles from './update-toast.css';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

const messages = defineMessages({
    versions: {
        defaultMessage: 'Version {oldId} → {newId}',
        description: 'Tooltip on the update notice naming the current and new build versions',
        id: 'mw.updateToast.versions'
    }
});

class UpdateToast extends React.Component {
    constructor (props, context) {
        super(props, context);
        this.state = {
            deployedId: null,
            dismissed: false,
            projectChanged: this.readProjectChanged()
        };
        this.checkForUpdate = this.checkForUpdate.bind(this);
        this.handleDismiss = this.handleDismiss.bind(this);
        this.handleReload = this.handleReload.bind(this);
        this.handleStoreChange = this.handleStoreChange.bind(this);
    }
    componentDidMount () {
        // Local dev builds have no deploy to compare against.
        if (!BUILD_ID || BUILD_ID === 'dev') return;
        this.checkForUpdate();
        this.interval = setInterval(this.checkForUpdate, CHECK_INTERVAL_MS);
        document.addEventListener('visibilitychange', this.checkForUpdate);
        // The editor has a redux store; the community site may not.
        const store = this.context && this.context.store;
        if (store && typeof store.subscribe === 'function') {
            this.unsubscribe = store.subscribe(this.handleStoreChange);
        }
    }
    componentWillUnmount () {
        clearInterval(this.interval);
        document.removeEventListener('visibilitychange', this.checkForUpdate);
        if (this.unsubscribe) this.unsubscribe();
    }
    readProjectChanged () {
        const store = this.context && this.context.store;
        if (!store || typeof store.getState !== 'function') return false;
        const state = store.getState();
        return Boolean(state && state.scratchGui && state.scratchGui.projectChanged);
    }
    handleStoreChange () {
        const projectChanged = this.readProjectChanged();
        if (projectChanged !== this.state.projectChanged) this.setState({projectChanged});
    }
    async checkForUpdate () {
        if (document.visibilityState === 'hidden' || this.state.deployedId) return;
        try {
            const deployed = await fetchDeployedVersion();
            if (isUpdateAvailable(deployed)) {
                await prepareUpdate();
                this.setState({deployedId: deployed.id});
                clearInterval(this.interval);
            }
        } catch (e) {
            // version.json missing or unreachable: stay silent, retry next interval.
        }
    }
    handleDismiss () {
        this.setState({dismissed: true});
    }
    async handleReload () {
        await switchToUpdate();
        window.location.reload();
    }
    render () {
        if (!this.state.deployedId || this.state.dismissed) return null;
        return (
            <Box
                className={styles.updateToast}
                role="status"
            >
                <div
                    className={styles.message}
                    title={this.props.intl.formatMessage(messages.versions, {
                        oldId: shortId(BUILD_ID),
                        newId: shortId(this.state.deployedId)
                    })}
                >
                    {this.state.projectChanged ? (
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="A new version of MistWarp is available. You have unsaved changes, so save your project before reloading."
                            // eslint-disable-next-line max-len
                            description="Toast shown when a newer deploy is detected and the project has unsaved changes"
                            id="mw.updateToast.availableUnsaved"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="A new version of MistWarp is available. Reload to update."
                            description="Toast shown when a newer deploy is detected"
                            id="mw.updateToast.availableNoVersion"
                        />
                    )}
                </div>
                <button
                    type="button"
                    className={styles.laterButton}
                    onClick={this.handleDismiss}
                >
                    <FormattedMessage
                        defaultMessage="Later"
                        description="Button that hides the update notice without reloading"
                        id="mw.updateToast.later"
                    />
                </button>
                <button
                    type="button"
                    className={styles.reloadButton}
                    onClick={this.handleReload}
                >
                    <FormattedMessage
                        defaultMessage="Reload"
                        description="Button to reload the page and get the latest version"
                        id="mw.updateToast.reload"
                    />
                </button>
            </Box>
        );
    }
}

UpdateToast.propTypes = {
    intl: intlShape
};

// react-redux 5 passes the store through legacy context. It is optional so
// the toast also works outside the editor.
UpdateToast.contextTypes = {
    store: PropTypes.object
};

export {UpdateToast};
export default injectIntl(UpdateToast);
