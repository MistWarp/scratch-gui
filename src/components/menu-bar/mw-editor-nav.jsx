import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {BarChart3, FolderOpen} from 'lucide-react';

import menuBarStyles from './menu-bar.css';
import MwNotifications from './mw-notifications.jsx';
import MwFriendsButton from './mw-friends-button.jsx';
import {openProductsModal} from '../../reducers/modals.js';

const messages = defineMessages({
    analytics: {
        defaultMessage: 'Project analytics',
        description: 'Menu bar button that opens the project analytics and management window',
        id: 'mw.editorNav.analytics'
    },
    myStuff: {
        defaultMessage: 'My stuff',
        description: 'Menu bar link to the signed-in user\'s projects page',
        id: 'mw.editorNav.myStuff'
    }
});

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

const MwEditorNav = ({intl, username, projectId, onOpenAnalytics}) => {
    if (!username) {
        return null;
    }
    const hasSavedProject = Boolean(projectId && projectId !== '0' && projectId !== 0);
    return (
        <React.Fragment>
            {hasSavedProject && (
                <NavItem
                    icon={BarChart3}
                    title={intl.formatMessage(messages.analytics)}
                    onClick={onOpenAnalytics}
                />
            )}
            <NavItem
                title={intl.formatMessage(messages.myStuff)}
                icon={FolderOpen}
                href="/mystuff"
            />
            <MwFriendsButton />
            <MwNotifications />
        </React.Fragment>
    );
};

MwEditorNav.propTypes = {
    intl: intlShape.isRequired,
    onOpenAnalytics: PropTypes.func.isRequired,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    username: PropTypes.string
};

export default injectIntl(connect(
    state => ({
        username: state.scratchGui.rotur.username,
        projectId: state.scratchGui.projectState.projectId
    }),
    dispatch => ({
        onOpenAnalytics: () => dispatch(openProductsModal())
    })
)(MwEditorNav));
