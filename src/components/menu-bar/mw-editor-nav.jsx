import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {BarChart3, FolderOpen} from 'lucide-react';

import menuBarStyles from './menu-bar.module.css';
import MwNotifications from './mw-notifications.jsx';
import {openProductsModal} from '../../reducers/modals.js';

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

const MwEditorNav = ({username, projectId, onOpenAnalytics}) => {
    if (!username) {
        return null;
    }
    const hasSavedProject = Boolean(projectId && projectId !== '0' && projectId !== 0);
    return (
        <React.Fragment>
            {hasSavedProject && (
                <NavItem
                    icon={BarChart3}
                    title="Project Analytics & Management"
                    onClick={onOpenAnalytics}
                />
            )}
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
    onOpenAnalytics: PropTypes.func.isRequired,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    username: PropTypes.string
};

export default connect(
    state => ({
        username: state.scratchGui.rotur.username,
        projectId: state.scratchGui.projectState.projectId
    }),
    dispatch => ({
        onOpenAnalytics: () => dispatch(openProductsModal())
    })
)(MwEditorNav);
