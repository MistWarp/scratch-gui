import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {Bell, FolderOpen} from 'lucide-react';

import menuBarStyles from './menu-bar.css';
import openMistWarpPageWindow from '../../lib/mw/open-mw-page-window.js';

const openMyStuff = () => openMistWarpPageWindow({
    id: 'mw-mystuff-window',
    title: 'My Stuff',
    path: '/mystuff'
});

const openNotifications = () => openMistWarpPageWindow({
    id: 'mw-notifications-window',
    title: 'Notifications',
    path: '/notifications'
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
            <NavItem
                title="Notifications"
                icon={Bell}
                onClick={openNotifications}
            />
        </React.Fragment>
    );
};

MwEditorNav.propTypes = {
    username: PropTypes.string
};

export default connect(state => ({
    username: state.scratchGui.rotur.username
}))(MwEditorNav);
