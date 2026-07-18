import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import {LogOut, Settings, Trophy, User, Users} from 'lucide-react';

import MenuLabel from './tw-menu-label.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuSection} from '../menu/menu.jsx';
import MenuItemContainer from '../../containers/menu-item.jsx';
import Avatar from '../mw-avatar/avatar.jsx';
import ChevronDown from './ChevronDown.jsx';
import menuBarStyles from './menu-bar.css';
import accountNavStyles from './account-nav.css';
import {getRoturSessionApi} from '../../lib/rotur/session-api.js';
import {buildAuthUrl} from '../../lib/rotur/client.js';
import {
    openAccountMenu,
    closeAccountMenu,
    accountMenuOpen
} from '../../reducers/menus.js';
import {openRoturLoginModal} from '../../reducers/modals.js';

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

    const go = path => () => {
        props.onCloseMenu();
        window.location.href = path;
    };

    const doLogout = () => {
        if (props.onLogout) {
            props.onLogout();
            return;
        }
        const api = getRoturSessionApi();
        if (api && api.logout) api.logout();
    };

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
                <MenuItemContainer onClick={go(`/users/${encodeURIComponent(props.username)}`)}>
                    <User />
                    <FormattedMessage
                        defaultMessage="Profile"
                        description="Text to link to my user profile, in the account navigation menu"
                        id="gui.accountMenu.profile"
                    />
                </MenuItemContainer>
                {props.showEditorItems ? null : (
                    <MenuItemContainer onClick={go('/leaderboard')}>
                        <Trophy />
                        <FormattedMessage
                            defaultMessage="Leaderboard"
                            description="Text to link to the leaderboard, in the Rotur account navigation menu"
                            id="mw.rotur.accountMenu.leaderboard"
                        />
                    </MenuItemContainer>
                )}
                <MenuItemContainer onClick={go('/settings')}>
                    <Settings />
                    <FormattedMessage
                        defaultMessage="Settings"
                        description="Text to link to settings, in the Rotur account navigation menu"
                        id="mw.rotur.accountMenu.settings"
                    />
                </MenuItemContainer>
                <MenuSection>
                    <MenuItemContainer
                        onClick={() => {
                            const authUrl = buildAuthUrl();
                            props.onCloseMenu();
                            doLogout();
                            window.location.href = authUrl;
                        }}
                    >
                        <Users />
                        <FormattedMessage
                            defaultMessage="Switch account"
                            description="Account menu item that signs out and opens the Rotur auth page"
                            id="mw.rotur.accountMenu.switchAccount"
                        />
                    </MenuItemContainer>
                    <MenuItemContainer
                        onClick={() => {
                            props.onCloseMenu();
                            doLogout();
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
    onCloseMenu: () => dispatch(closeAccountMenu())
});

export {RoturAccount};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RoturAccount);
