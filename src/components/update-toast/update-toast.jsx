import React from 'react';
import {FormattedMessage} from 'react-intl';
import Box from '../box/box.jsx';
import {
    BUILD_ID,
    fetchDeployedVersion,
    isUpdateAvailable,
    shortId
} from '../../lib/build-version.js';
import styles from './update-toast.css';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

class UpdateToast extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            deployedId: null
        };
        this.checkForUpdate = this.checkForUpdate.bind(this);
        this.handleReload = this.handleReload.bind(this);
    }
    componentDidMount () {
        // Local dev builds have no deploy to compare against.
        if (!BUILD_ID || BUILD_ID === 'dev') return;
        this.checkForUpdate();
        this.interval = setInterval(this.checkForUpdate, CHECK_INTERVAL_MS);
        document.addEventListener('visibilitychange', this.checkForUpdate);
    }
    componentWillUnmount () {
        clearInterval(this.interval);
        document.removeEventListener('visibilitychange', this.checkForUpdate);
    }
    async checkForUpdate () {
        if (document.visibilityState === 'hidden' || this.state.deployedId) return;
        try {
            const deployed = await fetchDeployedVersion();
            if (isUpdateAvailable(deployed)) {
                this.setState({deployedId: deployed.id});
                clearInterval(this.interval);
            }
        } catch (e) {
            // version.json missing or unreachable: stay silent, retry next interval.
        }
    }
    async handleReload () {
        const root = process.env.ROOT || '/';
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration(root);
                if (registration) await registration.unregister();
            }
            if ('caches' in window) {
                const cacheNames = await window.caches.keys();
                await Promise.all(cacheNames
                    .filter(name => name.startsWith('mistwarp-cache-') || name.startsWith('mistwarp-runtime'))
                    .map(name => window.caches.delete(name)));
            }
        } catch (e) {
            // A cache cleanup failure should not prevent the update attempt.
        }
        const url = new URL(window.location.href);
        url.searchParams.set('mw-update', this.state.deployedId);
        window.location.replace(url.toString());
    }
    render () {
        if (!this.state.deployedId) return null;
        return (
            <Box className={styles.updateToast}>
                <div className={styles.message}>
                    <FormattedMessage
                        defaultMessage="A new version of MistWarp is available ({oldId} → {newId}). Reload to update."
                        description="Toast shown when a newer deploy is detected"
                        id="mw.updateToast.available"
                        values={{
                            oldId: (
                                <span className={styles.version}>{shortId(BUILD_ID)}</span>
                            ),
                            newId: (
                                <span className={styles.version}>{shortId(this.state.deployedId)}</span>
                            )
                        }}
                    />
                </div>
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

export default UpdateToast;
