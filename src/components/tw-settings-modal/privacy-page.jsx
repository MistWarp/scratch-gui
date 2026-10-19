/* eslint-disable max-len */
import React from 'react';
import {FormattedMessage} from 'react-intl';

import Box from '../box/box.jsx';
import {BooleanSetting} from './setting.jsx';
import {PageHeader} from './theme-accent-panel.jsx';
import {analyticsEnabled, setAnalyticsEnabled} from '../../community/analytics.js';
import {isMinorAccount, subscribeMinorAccount} from '../../lib/minor-account.js';
import {ACCOUNT_ORIGIN, isSplitEditor} from '../../lib/account/origins.js';
import {
    readBlockedProjectPrompts,
    unblockProjectPrompts
} from '../../lib/project-prompt-blocking.js';

import styles from './settings-modal.css';

const blockedProjectName = (key, value) => {
    if (value && typeof value === 'object' && value.name) return String(value.name);
    if (key.startsWith('name:')) return key.slice('name:'.length);
    if (key.startsWith('id:')) return key.slice('id:'.length);
    return key;
};

class PrivacyPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            analytics: analyticsEnabled(),
            minor: isMinorAccount(),
            blocked: readBlockedProjectPrompts()
        };
        this.handleAnalyticsChange = this.handleAnalyticsChange.bind(this);
        this.handleMinorChange = this.handleMinorChange.bind(this);
    }

    componentDidMount () {
        this.unsubscribeMinor = subscribeMinorAccount(this.handleMinorChange);
    }

    componentWillUnmount () {
        if (this.unsubscribeMinor) this.unsubscribeMinor();
    }

    handleMinorChange (minor) {
        this.setState({analytics: analyticsEnabled(), minor});
    }

    handleAnalyticsChange (event) {
        setAnalyticsEnabled(event.target.checked);
        this.setState({analytics: analyticsEnabled()});
    }

    handleUnblock (key) {
        unblockProjectPrompts(key);
        this.setState({blocked: readBlockedProjectPrompts()});
    }

    render () {
        const blocked = Object.entries(this.state.blocked);
        return (
            <Box className={styles.body}>
                <PageHeader>
                    <FormattedMessage
                        defaultMessage="Blocked projects"
                        id="mw.settingsModal.blockedProjects"
                    />
                </PageHeader>
                <p className={styles.detail}>
                    <FormattedMessage
                        defaultMessage="Projects listed here were blocked from asking for permissions such as extensions, websites or the camera. Their requests are denied without a prompt."
                        id="mw.settingsModal.blockedProjectsHelp"
                    />
                </p>
                {blocked.length ? (
                    <div className={styles.menuBarSettings}>
                        {blocked.map(([key, value]) => (
                            <div
                                className={styles.menuBarSettingRow}
                                key={key}
                            >
                                <span>{blockedProjectName(key, value)}</span>
                                <button
                                    type="button"
                                    className={styles.button}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => this.handleUnblock(key)}
                                >
                                    <FormattedMessage
                                        defaultMessage="Allow prompts again"
                                        id="mw.settingsModal.unblockProject"
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.detail}>
                        <FormattedMessage
                            defaultMessage="No projects are blocked from asking for permission."
                            id="mw.settingsModal.noBlockedProjects"
                        />
                    </p>
                )}
                {isSplitEditor() ? (
                    <React.Fragment>
                        <p className={styles.detail}>
                            <FormattedMessage
                                defaultMessage="Projects you blocked from using your Rotur account are listed in your account {link}."
                                id="mw.settingsModal.accountPermissions"
                                values={{
                                    link: (
                                        <a
                                            href={`${ACCOUNT_ORIGIN}/settings?section=safety`}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            <FormattedMessage
                                                defaultMessage="Safety settings"
                                                id="mw.settingsModal.accountSafetyLink"
                                            />
                                        </a>
                                    )
                                }}
                            />
                        </p>
                        <p className={styles.detail}>
                            <FormattedMessage
                                defaultMessage="Your editing presence on Rotur, and which projects may show activity on your profile, are set in your account {link}."
                                id="mw.settingsModal.accountPresence"
                                values={{
                                    link: (
                                        <a
                                            href={`${ACCOUNT_ORIGIN}/settings?section=presence`}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            <FormattedMessage
                                                defaultMessage="Presence settings"
                                                id="mw.settingsModal.accountPresenceLink"
                                            />
                                        </a>
                                    )
                                }}
                            />
                        </p>
                    </React.Fragment>
                ) : null}
                <PageHeader>
                    <FormattedMessage
                        defaultMessage="Usage data"
                        id="mw.settingsModal.usageData"
                    />
                </PageHeader>
                <BooleanSetting
                    value={this.state.analytics}
                    disabled={this.state.minor}
                    onChange={this.handleAnalyticsChange}
                    label={<FormattedMessage
                        defaultMessage="Share anonymous product analytics"
                        id="mw.settingsModal.analytics"
                    />}
                    help={this.state.minor ? (
                        <FormattedMessage
                            defaultMessage="Anonymous analytics stay off for accounts under 18."
                            id="mw.settingsModal.analyticsMinor"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Records creation and return milestones for 31 days. MistWarp does not send usernames, project IDs, page URLs, IP addresses, or browser details."
                            id="mw.settingsModal.analyticsHelp"
                        />
                    )}
                />
            </Box>
        );
    }
}

export default PrivacyPage;
