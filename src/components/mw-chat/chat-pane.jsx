/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {
    ArrowLeft,
    Blocks,
    Check,
    ChevronDown,
    Hash,
    LogIn,
    LogOut,
    MessageCircle,
    MessagesSquare,
    PanelRight,
    Paperclip,
    PictureInPicture2,
    Users,
    X
} from 'lucide-react';

import {
    channelName,
    groupMembers,
    isChatChannel,
    isGroupChannel,
    onlineUsers,
    userDisplayName
} from '../../lib/originchats/connection.js';
import {offerFiles} from '../../lib/originchats/chat-ui.js';
import {CHAT_DRAG_MIME} from './chat-actions.js';
import {CheckingCard, DeniedCard, InviteCard} from './chat-access.jsx';
import Composer from './chat-composer.jsx';
import {DirectAvatar, DirectList, GroupPanel} from './chat-direct.jsx';
import {ServerIcon} from './chat-embeds.jsx';
import {MessageList} from './chat-messages.jsx';
import styles from './chat-pane.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Chat',
        description: 'Title of the community chat pane in the editor',
        id: 'mw.chat.title'
    },
    spaces: {
        defaultMessage: 'Chat spaces',
        description: 'Accessible label for the strip that switches between the chat server and direct messages',
        id: 'mw.chat.spaces'
    },
    directTitle: {
        defaultMessage: 'Direct messages',
        description: 'Title of the direct messages view in the chat pane',
        id: 'mw.chat.directTitle'
    },
    back: {
        defaultMessage: 'Back to conversations',
        description: 'Button that returns from a direct message conversation to the list of conversations',
        id: 'mw.chat.back'
    },
    channel: {
        defaultMessage: 'Channel',
        description: 'Accessible label for the chat channel picker',
        id: 'mw.chat.channel'
    },
    online: {
        defaultMessage: '{count} online',
        description: 'Number of people currently connected to the chat server',
        id: 'mw.chat.online'
    },
    dock: {
        defaultMessage: 'Dock to the side',
        description: 'Button that docks the floating chat window to the side of the editor',
        id: 'mw.chat.dock'
    },
    popOut: {
        defaultMessage: 'Pop out into a window',
        description: 'Button that turns the docked chat pane into a floating window',
        id: 'mw.chat.popOut'
    },
    close: {
        defaultMessage: 'Close chat',
        description: 'Button that hides the chat pane',
        id: 'mw.chat.close'
    },
    leave: {
        defaultMessage: 'Leave chat',
        description: 'Button that disconnects from the chat server',
        id: 'mw.chat.leave'
    },
    signedOutTitle: {
        defaultMessage: 'Chat with other MistWarp creators while you build.',
        description: 'Heading shown in the chat pane when the user is not signed in',
        id: 'mw.chat.signedOutTitle'
    },
    signedOutBody: {
        defaultMessage: 'Sign in with Rotur to join the MistWarp chat server.',
        description: 'Explanation shown in the chat pane when the user is not signed in',
        id: 'mw.chat.signedOutBody'
    },
    signIn: {
        defaultMessage: 'Sign in',
        description: 'Button that opens the Rotur sign in window from the chat pane',
        id: 'mw.chat.signIn'
    },
    joining: {
        defaultMessage: 'Joining chat…',
        description: 'Shown while the editor connects to the chat server',
        id: 'mw.chat.joining'
    },
    directJoining: {
        defaultMessage: 'Loading your direct messages…',
        description: 'Shown while the editor connects to the direct message server',
        id: 'mw.chat.directJoining'
    },
    reconnecting: {
        defaultMessage: 'Reconnecting…',
        description: 'Shown while the editor reconnects to the chat server',
        id: 'mw.chat.reconnecting'
    },
    connectFailed: {
        defaultMessage: 'Could not connect to chat.',
        description: 'Shown when the chat server connection fails',
        id: 'mw.chat.connectFailed'
    },
    retry: {
        defaultMessage: 'Try again',
        description: 'Button that retries the chat connection',
        id: 'mw.chat.retry'
    },
    dropScript: {
        defaultMessage: 'Drop to share this script as an image',
        description: 'Overlay shown while dragging blocks from the code area over the chat pane',
        id: 'mw.chat.dropScript'
    },
    dropFiles: {
        defaultMessage: 'Drop to attach files',
        description: 'Overlay shown while dragging files over the chat pane',
        id: 'mw.chat.dropFiles'
    },
    members: {
        defaultMessage: '{count, plural, one {# member} other {# members}}',
        description: 'Button in a group conversation header that opens the member list',
        id: 'mw.chat.members'
    },
    unreadIn: {
        defaultMessage: '{name}, {count} unread',
        description: 'Accessible label for a chat space button that has unread messages',
        id: 'mw.chat.unreadIn'
    }
});

const HeaderButton = ({icon: Icon, label, onClick}) => (
    <button
        type="button"
        className={styles.headerButton}
        title={label}
        aria-label={label}
        onClick={onClick}
    >
        <Icon size={16} />
    </button>
);

HeaderButton.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
};

const ChannelMenu = ({active, channels, intl, onSelect, unread}) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const current = channels.find(channel => channel.name === active) || channels[0];
    const single = channels.length < 2;
    const others = channels.some(channel => channel.name !== active && unread[channel.name]);

    useEffect(() => {
        if (!open) return;
        const onPointer = event => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
        };
        const onKey = event => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div
            className={styles.channelMenu}
            ref={rootRef}
        >
            <button
                type="button"
                className={classNames(styles.channelButton, {[styles.channelStatic]: single})}
                aria-label={intl.formatMessage(messages.channel)}
                aria-haspopup={single ? null : 'listbox'}
                aria-expanded={single ? null : open}
                disabled={single}
                onClick={() => setOpen(value => !value)}
            >
                <Hash
                    size={15}
                    className={styles.hash}
                />
                <span className={styles.channelLabel}>{channelName(current)}</span>
                {single ? null : <ChevronDown size={14} />}
                {others ? <span className={styles.unreadDot} /> : null}
            </button>
            {open ? (
                <ul
                    className={styles.menu}
                    role="listbox"
                >
                    {channels.map(channel => (
                        <li key={channel.name}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={channel.name === active}
                                className={classNames(styles.menuItem, {
                                    [styles.menuItemActive]: channel.name === active,
                                    [styles.menuItemUnread]: Boolean(unread[channel.name])
                                })}
                                onClick={() => {
                                    onSelect(channel.name);
                                    setOpen(false);
                                }}
                            >
                                <Hash size={14} />
                                <span>{channelName(channel)}</span>
                                {channel.name === active ? <Check size={14} /> : null}
                                {channel.name !== active && unread[channel.name] ? (
                                    <span className={styles.countBadge}>{unread[channel.name]}</span>
                                ) : null}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
};

ChannelMenu.propTypes = {
    active: PropTypes.string,
    channels: PropTypes.arrayOf(PropTypes.object).isRequired,
    intl: intlShape.isRequired,
    onSelect: PropTypes.func.isRequired,
    unread: PropTypes.object.isRequired
};

const Presence = ({intl, state}) => {
    const users = onlineUsers(state);
    return (
        <span
            className={styles.online}
            title={users.map(user => userDisplayName(state, user.username)).join(', ')}
        >
            <span className={styles.dot} />
            <span className={styles.onlineLong}>{intl.formatMessage(messages.online, {count: users.length})}</span>
            <span
                className={styles.onlineShort}
                aria-hidden="true"
            >{users.length}</span>
        </span>
    );
};

Presence.propTypes = {
    intl: intlShape.isRequired,
    state: PropTypes.object.isRequired
};

const unreadTotal = state => Object.values(state.channelUnread || {}).reduce((sum, count) => sum + count, 0);

const SpaceButton = ({active, children, intl, label, onClick, unread}) => (
    <button
        type="button"
        className={classNames(styles.spaceButton, {[styles.spaceActive]: active})}
        aria-pressed={active}
        aria-label={unread ? intl.formatMessage(messages.unreadIn, {name: label, count: unread}) : label}
        title={label}
        onClick={onClick}
    >
        {children}
        {unread && !active ? <span className={styles.spaceBadge}>{unread > 99 ? '99+' : unread}</span> : null}
    </button>
);

SpaceButton.propTypes = {
    active: PropTypes.bool,
    children: PropTypes.node,
    intl: intlShape.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    unread: PropTypes.number
};

const SignedOut = ({intl, onSignIn}) => (
    <div className={classNames(styles.empty, styles.fill)}>
        <span className={styles.emptyIcon}><MessagesSquare size={22} /></span>
        <p className={styles.emptyTitle}>{intl.formatMessage(messages.signedOutTitle)}</p>
        <p className={styles.emptyBody}>{intl.formatMessage(messages.signedOutBody)}</p>
        <button
            type="button"
            className={styles.primary}
            onClick={onSignIn}
        >
            <LogIn size={16} />
            {intl.formatMessage(messages.signIn)}
        </button>
    </div>
);

SignedOut.propTypes = {
    intl: intlShape.isRequired,
    onSignIn: PropTypes.func.isRequired
};

const Failed = ({error, intl, onRetry}) => (
    <div className={classNames(styles.empty, styles.fill)}>
        <p className={styles.emptyTitle}>{error || intl.formatMessage(messages.connectFailed)}</p>
        <button
            type="button"
            className={styles.primary}
            onClick={onRetry}
        >{intl.formatMessage(messages.retry)}</button>
    </div>
);

Failed.propTypes = {
    error: PropTypes.string,
    intl: intlShape.isRequired,
    onRetry: PropTypes.func.isRequired
};

const Conversation = ({canDirect, connection, intl, onDirect, state}) => {
    const [target, setTarget] = useState(null);
    useEffect(() => setTarget(null), [state.active]);
    return (
        <React.Fragment>
            <MessageList
                canDirect={canDirect}
                connection={connection}
                intl={intl}
                onDirect={onDirect}
                onEdit={message => setTarget({mode: 'edit', message})}
                onReply={message => setTarget({mode: 'reply', message})}
                state={state}
            />
            <Composer
                connection={connection}
                intl={intl}
                onClearTarget={() => setTarget(null)}
                onEditLast={message => setTarget({mode: 'edit', message})}
                state={state}
                target={target}
            />
        </React.Fragment>
    );
};

Conversation.propTypes = {
    canDirect: PropTypes.bool,
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onDirect: PropTypes.func,
    state: PropTypes.object.isRequired
};

const acceptsFiles = event => {
    const types = Array.from((event.dataTransfer && event.dataTransfer.types) || []);
    return types.includes('Files') && !types.includes(CHAT_DRAG_MIME);
};

const ChatPane = ({
    blockDrag,
    canDock,
    direct,
    floating,
    info,
    intl,
    inviteCode,
    onClose,
    onDirect,
    onJoinServer,
    onLeave,
    onRetryServer,
    onSignIn,
    onSpace,
    onToggleMode,
    paneRef,
    server,
    space,
    username
}) => {
    const [fileDrag, setFileDrag] = useState(false);
    const [groupPanel, setGroupPanel] = useState(false);
    const dragDepth = useRef(0);
    const showingDirect = space === 'dms';
    const {connection, state} = showingDirect ? direct : server;
    const ready = state.status === 'ready';
    const chatting = ready && Boolean(state.active);
    const serverInfo = (info && info.server) || state.server || server.state.server || {};
    const serverName = serverInfo.name || intl.formatMessage(messages.title);
    const current = state.channels.find(channel => channel.name === state.active);
    const group = showingDirect && chatting && isGroupChannel(current);
    const me = state.me && state.me.username;

    useEffect(() => setGroupPanel(false), [state.active, space]);

    let body;
    if (state.status === 'signed_out') {
        body = (
            <SignedOut
                intl={intl}
                onSignIn={onSignIn}
            />
        );
    } else if (!showingDirect && state.status === 'denied' && state.denied) {
        body = (
            <DeniedCard
                denied={state.denied}
                info={info}
                intl={intl}
                onJoin={onJoinServer}
            />
        );
    } else if (state.status === 'error') {
        body = (
            <Failed
                error={state.error}
                intl={intl}
                onRetry={showingDirect ? () => connection.reconnect() : onRetryServer}
            />
        );
    } else if (!showingDirect && state.status === 'idle' && state.membership === 'guest') {
        body = (
            <InviteCard
                info={info}
                intl={intl}
                inviteCode={inviteCode}
                onJoin={onJoinServer}
                username={username}
            />
        );
    } else if (!showingDirect && state.status === 'idle') {
        body = <CheckingCard intl={intl} />;
    } else if (group && groupPanel) {
        body = (
            <GroupPanel
                channel={current}
                connection={connection}
                intl={intl}
                state={state}
                onClose={() => setGroupPanel(false)}
            />
        );
    } else if (chatting) {
        body = (
            <Conversation
                key={`${space}:${state.active}`}
                canDirect={!showingDirect}
                connection={connection}
                intl={intl}
                onDirect={onDirect}
                state={state}
            />
        );
    } else if (ready && showingDirect) {
        body = (
            <DirectList
                connection={connection}
                intl={intl}
                state={state}
            />
        );
    } else {
        let text = messages.joining;
        if (state.status === 'reconnecting') text = messages.reconnecting;
        else if (showingDirect) text = messages.directJoining;
        body = <p className={classNames(styles.status, styles.fill)}>{intl.formatMessage(text)}</p>;
    }

    let heading;
    if (showingDirect && chatting) {
        heading = (
            <div className={styles.directHeading}>
                <HeaderButton
                    icon={ArrowLeft}
                    label={intl.formatMessage(messages.back)}
                    onClick={() => connection.selectChannel(null)}
                />
                {current ? (
                    <DirectAvatar
                        channel={current}
                        me={me}
                        size={22}
                    />
                ) : null}
                <h2 className={styles.title}>{channelName(current)}</h2>
                {group ? (
                    <button
                        type="button"
                        className={classNames(styles.membersButton, {[styles.membersOpen]: groupPanel})}
                        aria-pressed={groupPanel}
                        aria-label={intl.formatMessage(messages.members, {count: groupMembers(current).length})}
                        title={intl.formatMessage(messages.members, {count: groupMembers(current).length})}
                        onClick={() => setGroupPanel(value => !value)}
                    >
                        <Users size={13} />
                        {groupMembers(current).length}
                    </button>
                ) : null}
            </div>
        );
    } else if (showingDirect) {
        heading = <h2 className={styles.title}>{intl.formatMessage(messages.directTitle)}</h2>;
    } else if (chatting) {
        heading = (
            <ChannelMenu
                active={state.active}
                channels={state.channels.filter(isChatChannel)}
                intl={intl}
                onSelect={name => connection.selectChannel(name)}
                unread={state.channelUnread}
            />
        );
    } else {
        heading = <h2 className={styles.title}>{serverName}</h2>;
    }

    const onDragEnter = event => {
        if (!acceptsFiles(event) || !chatting) return;
        dragDepth.current += 1;
        setFileDrag(true);
    };
    const onDragLeave = event => {
        if (!acceptsFiles(event)) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setFileDrag(false);
    };
    const onDragOver = event => {
        if (!acceptsFiles(event) || !chatting) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    };
    const onDrop = event => {
        dragDepth.current = 0;
        setFileDrag(false);
        if (!acceptsFiles(event) || !chatting) return;
        event.preventDefault();
        offerFiles(event.dataTransfer.files);
    };

    const overlay = (blockDrag && chatting) || fileDrag;

    return (
        <section
            ref={paneRef}
            className={classNames(styles.pane, {[styles.floating]: floating})}
            aria-label={intl.formatMessage(messages.title)}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <header className={styles.header}>
                <div
                    className={styles.spaces}
                    role="group"
                    aria-label={intl.formatMessage(messages.spaces)}
                >
                    <SpaceButton
                        active={!showingDirect}
                        intl={intl}
                        label={serverName}
                        unread={unreadTotal(server.state)}
                        onClick={() => onSpace('server')}
                    >
                        <ServerIcon
                            icon={serverInfo.icon}
                            name={serverName}
                            size={20}
                        />
                    </SpaceButton>
                    <SpaceButton
                        active={showingDirect}
                        intl={intl}
                        label={intl.formatMessage(messages.directTitle)}
                        unread={unreadTotal(direct.state)}
                        onClick={() => onSpace('dms')}
                    >
                        <MessageCircle size={16} />
                    </SpaceButton>
                </div>
                {heading}
                {chatting && !showingDirect ? (
                    <Presence
                        intl={intl}
                        state={state}
                    />
                ) : null}
                <div className={styles.headerActions}>
                    {ready && !showingDirect ? (
                        <HeaderButton
                            icon={LogOut}
                            label={intl.formatMessage(messages.leave)}
                            onClick={onLeave}
                        />
                    ) : null}
                    {canDock ? (
                        <HeaderButton
                            icon={floating ? PanelRight : PictureInPicture2}
                            label={intl.formatMessage(floating ? messages.dock : messages.popOut)}
                            onClick={onToggleMode}
                        />
                    ) : null}
                    {floating ? null : (
                        <HeaderButton
                            icon={X}
                            label={intl.formatMessage(messages.close)}
                            onClick={onClose}
                        />
                    )}
                </div>
            </header>
            <div className={styles.body}>{body}</div>
            {overlay ? (
                <div className={styles.dropOverlay}>
                    <span className={styles.dropIcon}>
                        {blockDrag ? <Blocks size={22} /> : <Paperclip size={22} />}
                    </span>
                    <p>{intl.formatMessage(blockDrag ? messages.dropScript : messages.dropFiles)}</p>
                </div>
            ) : null}
        </section>
    );
};

const connectionShape = PropTypes.shape({
    connection: PropTypes.object.isRequired,
    state: PropTypes.object.isRequired
});

ChatPane.propTypes = {
    blockDrag: PropTypes.bool,
    canDock: PropTypes.bool,
    direct: connectionShape.isRequired,
    floating: PropTypes.bool,
    info: PropTypes.object,
    intl: intlShape.isRequired,
    inviteCode: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onDirect: PropTypes.func,
    onJoinServer: PropTypes.func.isRequired,
    onLeave: PropTypes.func.isRequired,
    onRetryServer: PropTypes.func.isRequired,
    onSignIn: PropTypes.func.isRequired,
    onSpace: PropTypes.func.isRequired,
    onToggleMode: PropTypes.func.isRequired,
    paneRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    server: connectionShape.isRequired,
    space: PropTypes.oneOf(['server', 'dms']).isRequired,
    username: PropTypes.string.isRequired
};

export default injectIntl(ChatPane);
