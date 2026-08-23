import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {FolderOpen, MessageSquare} from 'lucide-react';

import menuBarStyles from './menu-bar.css';
import MwNotifications from './mw-notifications.jsx';
import MyStuffPage from '../../community/pages/MyStuff.jsx';
import openMistWarpCommunityWindow from '../../lib/mw/open-mw-community-window.jsx';
import MwProjectActivity from './mw-project-activity.jsx';
import {getRememberedPlatformProject} from '../../lib/community/publish.js';

const openMyStuff = () => openMistWarpCommunityWindow({
    id: 'mw-mystuff-window',
    title: 'My Stuff',
    initialPath: '/mystuff',
    element: <MyStuffPage />
});

const openProjectActivity = projectId => openMistWarpCommunityWindow({
    id: `mw-project-activity-${projectId}`,
    title: 'Project activity',
    initialPath: `/project/${projectId}`,
    element: <MwProjectActivity projectId={projectId} />,
    width: 820,
    height: 560
});

export const NavItem = ({title, icon: Icon, onClick, value}) => (
    <button
        type="button"
        className={classNames(
            menuBarStyles.menuBarItem,
            menuBarStyles.hoverable,
            menuBarStyles.navButton
        )}
        title={title}
        aria-label={title}
        value={value}
        onClick={onClick}
    >
        <Icon size={18} />
    </button>
);

NavItem.propTypes = {
    icon: PropTypes.elementType.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.string
};

const handleOpenProjectActivity = event => openProjectActivity(event.currentTarget.value);

const MwEditorNav = ({username}) => {
    if (!username) {
        return null;
    }
    const projectId = getRememberedPlatformProject();
    return (
        <React.Fragment>
            <NavItem
                title="My Stuff"
                icon={FolderOpen}
                onClick={openMyStuff}
            />
            {projectId ? (
                <NavItem
                    title="Project comments and pull requests"
                    icon={MessageSquare}
                    value={projectId}
                    onClick={handleOpenProjectActivity}
                />
            ) : null}
            <MwNotifications />
        </React.Fragment>
    );
};

MwEditorNav.propTypes = {
    username: PropTypes.string
};

export default connect(state => ({
    username: state.scratchGui.rotur.username
}))(MwEditorNav);
