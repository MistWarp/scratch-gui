import {FormattedMessage} from 'react-intl';
import React from 'react';

import Box from '../box/box.jsx';
import {
    readBlockedProjectPrompts,
    unblockProjectPrompts
} from '../../lib/project-prompt-blocking.js';
import styles from './settings-modal.module.css';

const projectName = (key, value) => {
    if (value && typeof value === 'object' && value.name) return String(value.name);
    if (key.startsWith('name:')) return key.slice('name:'.length);
    if (key.startsWith('id:')) return key.slice('id:'.length);
    return key;
};

class PermissionsPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {blockedProjects: readBlockedProjectPrompts()};
        this.handleUnblock = this.handleUnblock.bind(this);
    }

    handleUnblock (key) {
        const projectKey = typeof key === 'string' ? key : key.currentTarget.dataset.projectKey;
        unblockProjectPrompts(projectKey);
        this.setState({blockedProjects: readBlockedProjectPrompts()});
    }

    render () {
        const blockedProjects = Object.entries(this.state.blockedProjects);
        return (
            <Box className={styles.pageContent}>
                <h2 className={styles.permissionsTitle}>
                    <FormattedMessage
                        defaultMessage="Project permissions"
                        id="mw.settings.permissions.title"
                    />
                </h2>
                <p className={styles.permissionsIntro}>
                    <FormattedMessage
                        defaultMessage={
                            'Projects listed here cannot show security prompts. ' +
                            'Allow prompts again if you blocked one by mistake.'
                        }
                        id="mw.settings.permissions.intro"
                    />
                </p>
                {blockedProjects.length ? (
                    <div className={styles.permissionsList}>
                        {blockedProjects.map(([key, value]) => (
                            <div
                                className={styles.permissionProject}
                                key={key}
                            >
                                <span className={styles.permissionProjectName}>{projectName(key, value)}</span>
                                <button
                                    type="button"
                                    className={styles.ctButtonSecondary}
                                    data-project-key={key}
                                    onClick={this.handleUnblock}
                                >
                                    <FormattedMessage
                                        defaultMessage="Allow prompts again"
                                        id="mw.settings.permissions.allowAgain"
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.permissionsEmpty}>
                        <FormattedMessage
                            defaultMessage="No projects are blocked from asking for permission."
                            id="mw.settings.permissions.empty"
                        />
                    </div>
                )}
            </Box>
        );
    }
}

export {PermissionsPage, projectName};
export default PermissionsPage;
