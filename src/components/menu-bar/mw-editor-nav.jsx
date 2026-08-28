import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {FolderOpen} from 'lucide-react';

import menuBarStyles from './menu-bar.css';
import MwNotifications from './mw-notifications.jsx';

export const NavItem = ({title, icon: Icon, href, onClick, value}) => {
    const Element = href ? 'a' : 'button';
    return (
        <Element
            {...(href ? {href} : {type: 'button'})}
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
        </Element>
    );
};

NavItem.propTypes = {
    href: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    onClick: PropTypes.func,
    title: PropTypes.string.isRequired,
    value: PropTypes.string
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
                href="/mystuff"
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
