import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import {Bell, FolderOpen, GitBranch, Info, LogOut, Settings, User} from 'lucide-react';

import MenuLabel from './tw-menu-label.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuSection} from '../menu/menu.jsx';
import MenuItemContainer from '../../containers/menu-item.jsx';
import Avatar from '../mw-avatar/avatar.jsx';
import ChevronDown from './ChevronDown.jsx';
import menuBarStyles from './menu-bar.css';
import accountNavStyles from './account-nav.css';
import {getRoturSessionApi} from '../../lib/rotur/session-api.js';
import {
    openAccountMenu,
    closeAccountMenu,
    accountMenuOpen
} from '../../reducers/menus.js';
import {openRoturLoginModal, openGitModal} from '../../reducers/modals.js';
import {setGitModalInitialView} from '../../lib/git/modal-view.js';

const RoturAccount = props => {
    if (!props.username) {
        return (
            <div
                className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
                onClick={props.onOpenLogin}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        props.onOpenLogin();
                    }
                }}
            >
                <FormattedMessage
                    defaultMessage="Login"
                    description="Menu bar item to open Rotur login when signed out"
                    id="mw.rotur.menuBar.login"
                />
            </div>
        );
    }

    return (
        <MenuLabel
            open={props.menuOpen}
            onOpen={props.onOpenMenu}
            onClose={props.onCloseMenu}
        >
            <Avatar
                className={accountNavStyles.avatar}
                username={props.username}
                size={32}
            />
            <span className={accountNavStyles.profileName}>
                {props.username}
            </span>
            <ChevronDown size={8} />
            <MenuBarMenu
                className={menuBarStyles.menuBarMenu}
                open={props.menuOpen}
                place={props.isRtl ? 'right' : 'left'}
            >
                <MenuItemContainer href={`/users/${encodeURIComponent(props.username)}`}>
                    <User />
                    <FormattedMessage
                        defaultMessage="Profile"
                        description="Text to link to my user profile, in the account navigation menu"
                        id="gui.accountMenu.profile"
                    />
                </MenuItemContainer>
                <MenuItemContainer href="/mystuff">
                    <FolderOpen />
                    <FormattedMessage
                        defaultMessage="My stuff"
                        description="Text to link to my projects, in the Rotur account navigation menu"
                        id="mw.rotur.accountMenu.myStuff"
                    />
                </MenuItemContainer>
                <MenuItemContainer href="/notifications">
                    <Bell />
                    <FormattedMessage
                        defaultMessage="Notifications"
                        description="Text to link to notifications, in the Rotur account navigation menu"
                        id="mw.rotur.accountMenu.notifications"
                    />
                </MenuItemContainer>
                <MenuItemContainer href="/settings">
                    <Settings />
                    <FormattedMessage
                        defaultMessage="Settings"
                        description="Text to link to settings, in the Rotur account navigation menu"
                        id="mw.rotur.accountMenu.settings"
                    />
                </MenuItemContainer>
                {props.showEditorItems ? (
                    <MenuItemContainer
                        onClick={() => {
                            props.onCloseMenu();
                            props.onOpenRoturRepos();
                        }}
                    >
                        <GitBranch />
                        <FormattedMessage
                            defaultMessage="Your repos"
                            description="Account menu item opening the Rotur Git repo manager"
                            id="mw.rotur.accountMenu.repos"
                        />
                    </MenuItemContainer>
                ) : null}
                {props.showEditorItems ? (
                    <MenuItemContainer
                        onClick={() => {
                            props.onCloseMenu();
                            props.onOpenRoturInfo();
                        }}
                    >
                        <Info />
                        <FormattedMessage
                            defaultMessage="What Rotur unlocks"
                            description="Account menu item opening the Rotur features window"
                            id="mw.rotur.accountMenu.info"
                        />
                    </MenuItemContainer>
                ) : null}
                <MenuSection>
                    <MenuItemContainer
                        onClick={() => {
                            props.onCloseMenu();
                            if (props.onLogout) {
                                props.onLogout();
                                return;
                            }
                            const api = getRoturSessionApi();
                            if (api && api.logout) api.logout();
                        }}
                    >
                        <LogOut />
                        <FormattedMessage
                            defaultMessage="Sign out"
                            description="Text to link to sign out, in the account navigation menu"
                            id="gui.accountMenu.signOut"
                        />
                    </MenuItemContainer>
                </MenuSection>
            </MenuBarMenu>
        </MenuLabel>
    );
};

RoturAccount.propTypes = {
    isRtl: PropTypes.bool,
    menuOpen: PropTypes.bool,
    onCloseMenu: PropTypes.func.isRequired,
    onLogout: PropTypes.func,
    onOpenLogin: PropTypes.func.isRequired,
    onOpenMenu: PropTypes.func.isRequired,
    onOpenRoturRepos: PropTypes.func,
    onOpenRoturInfo: PropTypes.func,
    showEditorItems: PropTypes.bool,
    username: PropTypes.string
};

RoturAccount.defaultProps = {
    showEditorItems: true
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    menuOpen: accountMenuOpen(state),
    username: state.scratchGui.rotur.username
});

const mapDispatchToProps = dispatch => ({
    onOpenLogin: () => dispatch(openRoturLoginModal()),
    onOpenMenu: () => dispatch(openAccountMenu()),
    onCloseMenu: () => dispatch(closeAccountMenu()),
    onOpenRoturRepos: () => {
        setGitModalInitialView('rotur');
        dispatch(openGitModal());
    },
    onOpenRoturInfo: () => dispatch(openRoturLoginModal())
});

export {RoturAccount};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RoturAccount);
