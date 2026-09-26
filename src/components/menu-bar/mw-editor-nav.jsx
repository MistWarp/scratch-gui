import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {BarChart3, FolderOpen, MessagesSquare} from 'lucide-react';

import menuBarStyles from './menu-bar.css';
import notificationStyles from './mw-notifications.css';
import MwNotifications from './mw-notifications.jsx';
import {getChatUi, subscribeChatUi, toggleChat} from '../../lib/originchats/chat-ui.js';
import {getChatConnection} from '../../lib/originchats/connection.js';
import {openProductsModal} from '../../reducers/modals.js';

const messages = defineMessages({
    analytics: {
        defaultMessage: 'Project analytics',
        description: 'Menu bar button that opens the project analytics and management window',
        id: 'mw.editorNav.analytics'
    },
    chat: {
        defaultMessage: 'Chat',
        description: 'Menu bar button that opens or closes the community chat pane',
        id: 'mw.editorNav.chat'
    },
    chatUnread: {
        defaultMessage: 'Chat ({count} new)',
        description: 'Menu bar chat button label when there are unread chat messages',
        id: 'mw.editorNav.chatUnread'
    },
    myStuff: {
        defaultMessage: 'My stuff',
        description: 'Menu bar link to the signed-in user\'s projects page',
        id: 'mw.editorNav.myStuff'
    }
});

export const NavItem = ({active, badge, title, icon: Icon, href, onClick, value}) => {
    const Element = href ? 'a' : 'button';
    return (
        <Element
            {...(href ? {href} : {type: 'button'})}
            className={classNames(
                menuBarStyles.menuBarItem,
                menuBarStyles.hoverable,
                menuBarStyles.navButton,
                {[menuBarStyles.active]: active}
            )}
            title={title}
            aria-label={title}
            aria-pressed={href ? null : active}
            value={value}
            onClick={onClick}
        >
            {badge ? (
                <span className={notificationStyles.bellWrap}>
                    <Icon size={18} />
                    <span className={notificationStyles.badge}>{badge > 9 ? '9+' : badge}</span>
                </span>
            ) : <Icon size={18} />}
        </Element>
    );
};

NavItem.propTypes = {
    active: PropTypes.bool,
    badge: PropTypes.number,
    href: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    onClick: PropTypes.func,
    title: PropTypes.string.isRequired,
    value: PropTypes.string
};

const useChatButton = () => {
    const [open, setOpen] = useState(() => getChatUi().open);
    const [unread, setUnread] = useState(() => getChatConnection().getState().unread);
    useEffect(() => {
        const offUi = subscribeChatUi(ui => setOpen(ui.open));
        const offChat = getChatConnection().subscribe(state => setUnread(state.unread));
        return () => {
            offUi();
            offChat();
        };
    }, []);
    return {open, unread};
};

const ChatNavItem = ({intl}) => {
    const {open, unread} = useChatButton();
    return (
        <NavItem
            icon={MessagesSquare}
            title={unread && !open ?
                intl.formatMessage(messages.chatUnread, {count: unread}) :
                intl.formatMessage(messages.chat)}
            active={open}
            badge={open ? 0 : unread}
            onClick={toggleChat}
        />
    );
};

ChatNavItem.propTypes = {
    intl: intlShape.isRequired
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
            <ChatNavItem intl={intl} />
            <NavItem
                title={intl.formatMessage(messages.myStuff)}
                icon={FolderOpen}
                href="/mystuff"
            />
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
