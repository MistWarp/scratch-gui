/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {
    ArrowLeft,
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
    isRoturUser,
    onlineUsers,
    userAvatar,
    userDisplayName,
    userKey
} from '../../lib/originchats/connection.js';
import {offerFiles} from '../../lib/originchats/chat-ui.js';
import {CHAT_DRAG_MIME} from './chat-actions.js';
import {CheckingCard, DeniedCard, InviteCard} from './chat-access.jsx';
import Composer from './chat-composer.jsx';
import {DirectAvatar, DirectList, GroupPanel} from './chat-direct.jsx';
import {ServerIcon} from './chat-embeds.jsx';
import {DeleteDialog} from './chat-message-menu.jsx';
import {MessageList, MessagePreview} from './chat-messages.jsx';
import {ProfileLink, UserPicture} from './chat-rich-text.jsx';
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
        defaultMessage: '{count, plural, one {# person online} other {# people online}}',
        description: 'Label of the header button that shows how many people are online and opens the list of them',
        id: 'mw.chat.online'
    },
    onlineTitle: {
        defaultMessage: 'Online now',
        description: 'Heading of the panel that lists the people currently online in the chat server',
        id: 'mw.chat.onlineTitle'
    },
    onlineEmpty: {
        defaultMessage: 'Nobody else is online right now.',
        description: 'Shown in the online panel when no one else is connected to the chat server',
        id: 'mw.chat.onlineEmpty'
    },
    onlineYou: {
        defaultMessage: '{name} (you)',
        description: 'Name of the current user in the online panel',
        id: 'mw.chat.onlineYou'
    },
    onlineClose: {
        defaultMessage: 'Close the online list',
        description: 'Button that closes the panel listing who is online',
        id: 'mw.chat.onlineClose'
    },
    onlineMessage: {
        defaultMessage: 'Send {name} a direct message',
        description: 'Button next to a person in the online panel that opens a direct message with them',
        id: 'mw.chat.onlineMessage'
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

const OnlineButton = ({intl, onClick, open, state}) => {
    const count = onlineUsers(state).length;
    const label = intl.formatMessage(messages.online, {count});
    return (
        <button
            type="button"
            className={classNames(styles.membersButton, styles.onlineButton, {[styles.membersOpen]: open})}
            aria-pressed={open}
            aria-label={label}
            title={label}
            onClick={onClick}
        >
            <Users size={13} />
            {count}
        </button>
    );
};

OnlineButton.propTypes = {
    intl: intlShape.isRequired,
    onClick: PropTypes.func.isRequired,
    open: PropTypes.bool,
    state: PropTypes.object.isRequired
};

const OnlinePanel = ({connection, intl, onClose, onDirect, state}) => {
    const me = userKey(state.me && state.me.username);
    const users = onlineUsers(state).sort((a, b) => {
        if (userKey(a.username) === me) return -1;
        if (userKey(b.username) === me) return 1;
        return userDisplayName(state, a.username).localeCompare(userDisplayName(state, b.username));
    });
    const others = users.filter(user => userKey(user.username) !== me);
    return (
        <div className={classNames(styles.groupPanel, styles.fill)}>
            <div className={styles.groupPanelHead}>
                <span className={styles.onlineIcon}><Users size={16} /></span>
                <h3 className={styles.groupPanelTitle}>{intl.formatMessage(messages.onlineTitle)}</h3>
                <button
                    type="button"
                    className={styles.pendingRemove}
                    aria-label={intl.formatMessage(messages.onlineClose)}
                    title={intl.formatMessage(messages.onlineClose)}
                    onClick={onClose}
                >
                    <X size={12} />
                </button>
            </div>
            <ul className={styles.memberList}>
                {users.map(user => {
                    const name = userDisplayName(state, user.username);
                    const mine = userKey(user.username) === me;
                    const rotur = isRoturUser(state, user.username);
                    return (
                        <li
                            key={user.username}
                            className={styles.memberItem}
                        >
                            <span className={styles.onlineAvatar}>
                                <UserPicture
                                    rotur={rotur}
                                    size={28}
                                    src={userAvatar(state, user.username, connection.serverUrl)}
                                    username={user.username}
                                />
                                <span className={styles.onlineDot} />
                            </span>
                            <ProfileLink
                                className={styles.directName}
                                member={rotur}
                                name={user.username}
                                style={user.color ? {color: user.color} : null}
                            >{mine ? intl.formatMessage(messages.onlineYou, {name}) : name}</ProfileLink>
                            {onDirect && !mine && rotur ? (
                                <button
                                    type="button"
                                    className={styles.iconButton}
                                    title={intl.formatMessage(messages.onlineMessage, {name})}
                                    aria-label={intl.formatMessage(messages.onlineMessage, {name})}
                                    onClick={() => onDirect(user.username)}
                                >
                                    <MessageCircle size={15} />
                                </button>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
            {others.length ? null : <p className={styles.groupNote}>{intl.formatMessage(messages.onlineEmpty)}</p>}
        </div>
    );
};

OnlinePanel.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onClose: PropTypes.func.isRequired,
    onDirect: PropTypes.func,
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
    const [reply, setReply] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const composerRef = useRef(null);
    const listRef = useRef(null);
    const channel = state.active;
    const list = state.messages[channel];
    const replyGone = Boolean(reply) && Boolean(list) && !list.some(message => message.id === reply.message.id);

    useEffect(() => {
        setReply(null);
        setEditingId(null);
        setDeleting(null);
    }, [channel]);

    useEffect(() => {
        if (replyGone) setReply(null);
    }, [replyGone]);

    const focusComposer = () => composerRef.current && composerRef.current.focus();

    const onDelete = (message, immediate) => {
        if (immediate) {
            connection.deleteMessage(channel, message.id);
            return;
        }
        setDeleting(message);
    };

    return (
        <React.Fragment>
            <MessageList
                canDirect={canDirect}
                connection={connection}
                editingId={editingId}
                intl={intl}
                listApiRef={listRef}
                onDelete={onDelete}
                onDirect={onDirect}
                onEdit={message => setEditingId(message.id)}
                onEditDone={() => {
                    setEditingId(null);
                    focusComposer();
                }}
                onMention={message => composerRef.current && composerRef.current.insert(`@${message.user} `)}
                onReply={message => {
                    setReply({message, ping: true});
                    focusComposer();
                }}
                replyId={reply ? reply.message.id : null}
                state={state}
            />
            <Composer
                apiRef={composerRef}
                connection={connection}
                intl={intl}
                onClearReply={() => setReply(null)}
                onEditLast={message => setEditingId(message.id)}
                onJump={id => listRef.current && listRef.current.jump(id)}
                onTogglePing={() => setReply(value => value && {...value, ping: !value.ping})}
                reply={reply}
                state={state}
            />
            {deleting ? (
                <DeleteDialog
                    intl={intl}
                    onCancel={() => {
                        setDeleting(null);
                        focusComposer();
                    }}
                    onConfirm={() => {
                        connection.deleteMessage(channel, deleting.id);
                        setDeleting(null);
                        focusComposer();
                    }}
                >
                    <MessagePreview
                        connection={connection}
                        intl={intl}
                        message={deleting}
                        state={state}
                    />
                </DeleteDialog>
            ) : null}
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
    const [onlinePanel, setOnlinePanel] = useState(false);
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

    useEffect(() => {
        setGroupPanel(false);
        setOnlinePanel(false);
    }, [state.active, space]);

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
    } else if (chatting && !showingDirect && onlinePanel) {
        body = (
            <OnlinePanel
                connection={connection}
                intl={intl}
                onClose={() => setOnlinePanel(false)}
                onDirect={onDirect}
                state={state}
            />
        );
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
                    <OnlineButton
                        intl={intl}
                        open={onlinePanel}
                        state={state}
                        onClick={() => setOnlinePanel(value => !value)}
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
            {fileDrag ? (
                <div className={styles.dropOverlay}>
                    <span className={styles.dropIcon}><Paperclip size={22} /></span>
                    <p>{intl.formatMessage(messages.dropFiles)}</p>
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
