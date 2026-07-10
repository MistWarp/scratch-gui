import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import {UserRound, LogOut} from 'lucide-react';

import MenuLabel from './tw-menu-label.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuSection} from '../menu/menu.jsx';
import MenuItemContainer from '../../containers/menu-item.jsx';
import UserAvatar from './user-avatar.jsx';
import ChevronDown from './ChevronDown.jsx';
import menuBarStyles from './menu-bar.css';
import accountNavStyles from './account-nav.css';
import {getAvatarUrl} from '../../lib/rotur/client.js';
import {getRoturSessionApi} from '../../lib/rotur/session-api.js';
import {
    openAccountMenu,
    closeAccountMenu,
    accountMenuOpen
} from '../../reducers/menus.js';
import {openRoturLoginModal} from '../../reducers/modals.js';

/** Top-right Rotur account control — same MenuLabel pattern as File / Edit. */
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
            <UserAvatar
                className={accountNavStyles.avatar}
                imageUrl={getAvatarUrl(props.username)}
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
                <MenuItemContainer href="https://rotur.dev/me">
                    <UserRound />
                    <FormattedMessage
                        defaultMessage="Profile"
                        description="Text to link to my user profile, in the account navigation menu"
                        id="gui.accountMenu.profile"
                    />
                </MenuItemContainer>
                <MenuSection>
                    <MenuItemContainer
                        onClick={() => {
                            props.onCloseMenu();
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
    onOpenLogin: PropTypes.func.isRequired,
    onOpenMenu: PropTypes.func.isRequired,
    username: PropTypes.string
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

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RoturAccount);
