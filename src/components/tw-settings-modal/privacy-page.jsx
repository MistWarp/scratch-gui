/* eslint-disable max-len */
import React from 'react';
import {FormattedMessage} from 'react-intl';

import Box from '../box/box.jsx';
import {PageHeader} from './theme-accent-panel.jsx';
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
            blocked: readBlockedProjectPrompts()
        };
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
            </Box>
        );
    }
}

export default PrivacyPage;
