import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {FolderOpen} from 'lucide-react';

import menuBarStyles from './menu-bar.css';
import MwNotifications from './mw-notifications.jsx';
import MyStuffPage from '../../community/pages/MyStuff.jsx';
import openMistWarpCommunityWindow from '../../lib/mw/open-mw-community-window.jsx';

const openMyStuff = () => openMistWarpCommunityWindow({
    id: 'mw-mystuff-window',
    title: 'My Stuff',
    initialPath: '/mystuff',
    element: <MyStuffPage />
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
    return (
        <React.Fragment>
            <NavItem
                title="My Stuff"
                icon={FolderOpen}
                onClick={openMyStuff}
            />
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
