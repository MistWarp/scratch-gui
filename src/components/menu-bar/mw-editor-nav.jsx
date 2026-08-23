/* eslint-disable react/jsx-no-bind */
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

const NavItem = ({title, icon: Icon, onClick}) => {
    const handleKeyDown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };
    return (
        <div
            className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
            title={title}
            aria-label={title}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
        >
            <Icon size={18} />
        </div>
    );
};

NavItem.propTypes = {
    icon: PropTypes.elementType.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired
};

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
                    onClick={() => openProjectActivity(projectId)}
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
