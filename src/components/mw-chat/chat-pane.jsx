/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {
    ArrowUp,
    Check,
    ChevronDown,
    ExternalLink,
    Hash,
    LogIn,
    LogOut,
    MessagesSquare,
    PanelRight,
    PictureInPicture2,
    SendHorizontal,
    X
} from 'lucide-react';

import Avatar from '../mw-avatar/avatar.jsx';
import {
    CHAT_URL,
    DISCORD_INVITE,
    activeTyping,
    channelName,
    isChatChannel,
    messageAuthor,
    messageAvatar,
    onlineUsers
} from '../../lib/originchats/connection.js';
import styles from './chat-pane.css';

const GROUP_WINDOW = 5 * 60;
const DIVIDER_WINDOW = 20 * 60;
const TOKEN = /(https?:\/\/[^\s<]+|@[A-Za-z0-9][A-Za-z0-9_-]{0,19})/g;
const ROTUR_NAME = /^@[A-Za-z0-9][A-Za-z0-9_-]{0,19}$/;
export const VARIANTS = ['quiet', 'cards', 'bubbles', 'compact'];

const messages = defineMessages({
    title: {
        defaultMessage: 'Chat',
        description: 'Title of the community chat pane in the editor',
        id: 'mw.chat.title'
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
    loading: {
        defaultMessage: 'Loading messages…',
        description: 'Shown while chat history loads',
        id: 'mw.chat.loading'
    },
    loadingOlder: {
        defaultMessage: 'Loading older messages…',
        description: 'Shown while older chat history loads',
        id: 'mw.chat.loadingOlder'
    },
    introTitle: {
        defaultMessage: 'Welcome to #{channel}',
        description: 'Heading above the oldest message in a chat channel',
        id: 'mw.chat.introTitle'
    },
    introBody: {
        // eslint-disable-next-line max-len
        defaultMessage: 'This is the start of the channel. MistWarp chat runs on OriginChats and is bridged to the MistWarp Discord, so people on either side see the same messages.',
        description: 'Explanation above the oldest message in a chat channel',
        id: 'mw.chat.introBody'
    },
    serverLink: {
        defaultMessage: 'chats.mistwarp.org',
        description: 'Link to the OriginChats server the MistWarp chat runs on',
        id: 'mw.chat.serverLink'
    },
    discordLink: {
        defaultMessage: 'Join on Discord',
        description: 'Link to the bridged MistWarp Discord server',
        id: 'mw.chat.discordLink'
    },
    discordBadge: {
        defaultMessage: 'Discord',
        description: 'Label next to a chat message that was sent from the bridged Discord server',
        id: 'mw.chat.discordBadge'
    },
    edited: {
        defaultMessage: '(edited)',
        description: 'Marker after a chat message that was edited',
        id: 'mw.chat.edited'
    },
    replyingTo: {
        defaultMessage: 'Replying to {user}: {preview}',
        description: 'Preview of the message a chat message replies to',
        id: 'mw.chat.replyingTo'
    },
    placeholder: {
        defaultMessage: 'Message #{channel}',
        description: 'Placeholder for the chat message box',
        id: 'mw.chat.placeholder'
    },
    send: {
        defaultMessage: 'Send message',
        description: 'Button that sends a chat message',
        id: 'mw.chat.send'
    },
    typingOne: {
        defaultMessage: '{user} is typing…',
        description: 'Typing indicator for one person in the chat',
        id: 'mw.chat.typingOne'
    },
    typingTwo: {
        defaultMessage: '{first} and {second} are typing…',
        description: 'Typing indicator for two people in the chat',
        id: 'mw.chat.typingTwo'
    },
    typingMany: {
        defaultMessage: 'Several people are typing…',
        description: 'Typing indicator for three or more people in the chat',
        id: 'mw.chat.typingMany'
    },
    slowDown: {
        defaultMessage: 'Slow down a little before sending another message.',
        description: 'Shown when the chat server rate limits the user',
        id: 'mw.chat.slowDown'
    }
});

const RichContent = ({text}) => String(text || '').split(TOKEN)
    .map((part, index) => {
        if (ROTUR_NAME.test(part)) {
            return (
                <a
                    key={index}
                    className={styles.mention}
                    href={`/users/${encodeURIComponent(part.slice(1))}`}
                    target="_blank"
                    rel="noreferrer"
                >{part}</a>
            );
        }
        if (/^https?:\/\//.test(part)) {
            const trailing = part.match(/[.,!?)]+$/);
            const url = trailing ? part.slice(0, -trailing[0].length) : part;
            return (
                <React.Fragment key={index}>
                    <a
                        className={styles.link}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                    >{url.replace(/^https?:\/\//, '')}</a>
                    {trailing ? trailing[0] : ''}
                </React.Fragment>
            );
        }
        return part;
    });

const formatTime = seconds => {
    const date = new Date(seconds * 1000);
    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();
    return sameDay ?
        date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) :
        date.toLocaleDateString([], {month: 'short', day: 'numeric'});
};

const formatClock = seconds => new Date(seconds * 1000)
    .toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false});

const formatDivider = seconds => {
    const date = new Date(seconds * 1000);
    const today = new Date();
    const time = date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
    if (date.toDateString() === today.toDateString()) return time;
    return `${date.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'})}, ${time}`;
};

const isOwn = (state, message) => Boolean(
    state.me && !message.webhook &&
    String(message.user || '').toLowerCase() === String(state.me.username || '').toLowerCase()
);

const groupMessages = list => list.reduce((groups, message) => {
    const last = groups[groups.length - 1];
    const author = messageAuthor(message);
    const avatar = messageAvatar(message);
    const time = message.timestamp || 0;
    const continues = last && last.author === author && last.avatar === avatar;
    if (continues && time - last.lastTime < GROUP_WINDOW && !message.reply_to) {
        last.messages.push(message);
        last.lastTime = time;
        return groups;
    }
    const previous = last ? last.lastTime : 0;
    groups.push({
        author,
        avatar,
        key: message.id,
        lastTime: time,
        firstTime: time,
        divider: !last || time - previous > DIVIDER_WINDOW,
        messages: [message]
    });
    return groups;
}, []);

const ProfileLink = ({className, member, name, children, tabIndex}) => (member ? (
    <a
        className={className}
        href={`/users/${encodeURIComponent(name)}`}
        target="_blank"
        rel="noreferrer"
        tabIndex={tabIndex}
    >{children}</a>
) : <span className={className}>{children}</span>);

ProfileLink.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    member: PropTypes.bool,
    name: PropTypes.string.isRequired,
    tabIndex: PropTypes.number
};

const MessageBody = ({intl, message}) => (
    <React.Fragment>
        {message.reply_to ? (
            <p className={styles.reply}>
                {intl.formatMessage(messages.replyingTo, {
                    user: message.reply_to.user,
                    preview: message.reply_to.preview || ''
                })}
            </p>
        ) : null}
        {message.content ? (
            <p className={styles.content}>
                <RichContent text={message.content} />
                {message.edited ? (
                    <span className={styles.edited}>{` ${intl.formatMessage(messages.edited)}`}</span>
                ) : null}
            </p>
        ) : null}
        {(message.attachments || []).map(attachment => (
            <a
                key={attachment.id || attachment.url}
                className={styles.link}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
            >{attachment.name || attachment.url}</a>
        ))}
    </React.Fragment>
);

MessageBody.propTypes = {
    intl: intlShape.isRequired,
    message: PropTypes.object.isRequired
};

const DiscordBadge = ({intl}) => (
    <span className={styles.badge}>{intl.formatMessage(messages.discordBadge)}</span>
);

DiscordBadge.propTypes = {intl: intlShape.isRequired};

const RowsGroup = ({group, intl, member, size}) => {
    const first = group.messages[0];
    const fromDiscord = !member && Boolean(first.webhook || first.author_pfp);
    return (
        <li className={styles.group}>
            {group.messages.map((message, index) => (
                <div
                    key={message.id}
                    className={classNames(styles.row, {[styles.rowFirst]: index === 0})}
                >
                    {index === 0 ? (
                        <ProfileLink
                            className={styles.avatar}
                            member={member}
                            name={group.author}
                            tabIndex={-1}
                        >
                            <Avatar
                                username={group.avatar ? null : group.author}
                                src={group.avatar}
                                size={size}
                            />
                        </ProfileLink>
                    ) : (
                        <time className={styles.gutterTime}>{formatClock(message.timestamp || 0)}</time>
                    )}
                    <div className={styles.rowBody}>
                        {index === 0 ? (
                            <div className={styles.meta}>
                                <ProfileLink
                                    className={styles.author}
                                    member={member}
                                    name={group.author}
                                >{group.author}</ProfileLink>
                                {fromDiscord ? <DiscordBadge intl={intl} /> : null}
                                <time className={styles.time}>{formatTime(first.timestamp || 0)}</time>
                            </div>
                        ) : null}
                        <MessageBody
                            intl={intl}
                            message={message}
                        />
                    </div>
                </div>
            ))}
        </li>
    );
};

RowsGroup.propTypes = {
    group: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    member: PropTypes.bool,
    size: PropTypes.number.isRequired
};

const BubbleGroup = ({group, intl, member, own}) => {
    const first = group.messages[0];
    const fromDiscord = !member && Boolean(first.webhook || first.author_pfp);
    return (
        <li className={classNames(styles.group, styles.bubbleGroup, {[styles.own]: own})}>
            {own ? null : (
                <ProfileLink
                    className={styles.avatar}
                    member={member}
                    name={group.author}
                    tabIndex={-1}
                >
                    <Avatar
                        username={group.avatar ? null : group.author}
                        src={group.avatar}
                        size={26}
                    />
                </ProfileLink>
            )}
            <div className={styles.bubbleColumn}>
                {own ? null : (
                    <div className={styles.meta}>
                        <ProfileLink
                            className={styles.author}
                            member={member}
                            name={group.author}
                        >{group.author}</ProfileLink>
                        {fromDiscord ? <DiscordBadge intl={intl} /> : null}
                    </div>
                )}
                {group.messages.map(message => (
                    <div
                        key={message.id}
                        className={styles.bubble}
                        title={formatTime(message.timestamp || 0)}
                    >
                        <MessageBody
                            intl={intl}
                            message={message}
                        />
                    </div>
                ))}
            </div>
        </li>
    );
};

BubbleGroup.propTypes = {
    group: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    member: PropTypes.bool,
    own: PropTypes.bool
};

const CompactGroup = ({group, intl, member}) => {
    const first = group.messages[0];
    const fromDiscord = !member && Boolean(first.webhook || first.author_pfp);
    return (
        <li className={styles.group}>
            {group.messages.map(message => (
                <div
                    key={message.id}
                    className={styles.line}
                >
                    <time className={styles.lineTime}>{formatClock(message.timestamp || 0)}</time>
                    <div className={styles.lineBody}>
                        <span className={styles.meta}>
                            <ProfileLink
                                className={styles.author}
                                member={member}
                                name={group.author}
                            >{group.author}</ProfileLink>
                            {fromDiscord ? <DiscordBadge intl={intl} /> : null}
                        </span>
                        <MessageBody
                            intl={intl}
                            message={message}
                        />
                    </div>
                </div>
            ))}
        </li>
    );
};

CompactGroup.propTypes = {
    group: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    member: PropTypes.bool
};

const Intro = ({channel, intl}) => (
    <li className={styles.intro}>
        <span className={styles.introIcon}><Hash size={18} /></span>
        <p className={styles.introTitle}>{intl.formatMessage(messages.introTitle, {channel})}</p>
        <p className={styles.introBody}>{intl.formatMessage(messages.introBody)}</p>
        <div className={styles.chips}>
            <a
                className={styles.chip}
                href={CHAT_URL}
                target="_blank"
                rel="noreferrer"
            >
                {intl.formatMessage(messages.serverLink)}
                <ExternalLink size={11} />
            </a>
            <a
                className={styles.chip}
                href={DISCORD_INVITE}
                target="_blank"
                rel="noreferrer"
            >
                {intl.formatMessage(messages.discordLink)}
                <ExternalLink size={11} />
            </a>
        </div>
    </li>
);

Intro.propTypes = {
    channel: PropTypes.string.isRequired,
    intl: intlShape.isRequired
};

const MessageList = ({connection, intl, state, variant}) => {
    const listRef = useRef(null);
    const pinnedRef = useRef(true);
    const heightRef = useRef(0);
    const channel = state.active;
    const list = state.messages[channel];
    const history = state.history[channel] || {};
    const groups = useMemo(() => groupMessages(list || []), [list]);

    useLayoutEffect(() => {
        const element = listRef.current;
        if (!element) return;
        if (pinnedRef.current) {
            element.scrollTop = element.scrollHeight;
        } else if (heightRef.current && element.scrollTop < 40) {
            element.scrollTop += element.scrollHeight - heightRef.current;
        }
        heightRef.current = element.scrollHeight;
    }, [groups, history.loaded]);

    useEffect(() => {
        pinnedRef.current = true;
    }, [channel]);

    if (!history.loaded) {
        return <p className={classNames(styles.status, styles.fill)}>{intl.formatMessage(messages.loading)}</p>;
    }

    const onScroll = () => {
        const element = listRef.current;
        pinnedRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 60;
        heightRef.current = element.scrollHeight;
        if (element.scrollTop < 80) connection.loadOlder(channel);
    };

    return (
        <ol
            className={styles.messages}
            ref={listRef}
            onScroll={onScroll}
            aria-live="polite"
        >
            {history.atStart ? (
                <Intro
                    channel={channel}
                    intl={intl}
                />
            ) : null}
            {history.loading ? <li className={styles.status}>{intl.formatMessage(messages.loadingOlder)}</li> : null}
            {groups.map(group => {
                const first = group.messages[0];
                const member = !first.webhook && Boolean(state.users[String(first.user || '').toLowerCase()]);
                const divider = variant === 'bubbles' && group.divider ? (
                    <li
                        key={`${group.key}-divider`}
                        className={styles.divider}
                    >{formatDivider(group.firstTime)}</li>
                ) : null;
                let item;
                if (variant === 'bubbles') {
                    item = (
                        <BubbleGroup
                            key={group.key}
                            group={group}
                            intl={intl}
                            member={member}
                            own={isOwn(state, first)}
                        />
                    );
                } else if (variant === 'compact') {
                    item = (
                        <CompactGroup
                            key={group.key}
                            group={group}
                            intl={intl}
                            member={member}
                        />
                    );
                } else {
                    item = (
                        <RowsGroup
                            key={group.key}
                            group={group}
                            intl={intl}
                            member={member}
                            size={variant === 'cards' ? 28 : 32}
                        />
                    );
                }
                return (
                    <React.Fragment key={group.key}>
                        {divider}
                        {item}
                    </React.Fragment>
                );
            })}
        </ol>
    );
};

MessageList.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    state: PropTypes.object.isRequired,
    variant: PropTypes.string.isRequired
};

const Composer = ({connection, intl, state, variant}) => {
    const [draft, setDraft] = useState('');
    const [, setTick] = useState(0);
    const inputRef = useRef(null);
    const channel = state.channels.find(item => item.name === state.active);
    const label = intl.formatMessage(messages.placeholder, {channel: channelName(channel)});
    const typing = activeTyping(state, state.active);

    useEffect(() => {
        if (!typing.length) return;
        const timer = setTimeout(() => setTick(tick => tick + 1), 1000);
        return () => clearTimeout(timer);
    });

    useLayoutEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
    }, [draft]);

    const submit = event => {
        event.preventDefault();
        if (connection.sendMessage(state.active, draft)) setDraft('');
    };

    let typingText = '';
    if (typing.length === 1) {
        typingText = intl.formatMessage(messages.typingOne, {user: typing[0]});
    } else if (typing.length === 2) {
        typingText = intl.formatMessage(messages.typingTwo, {first: typing[0], second: typing[1]});
    } else if (typing.length > 2) {
        typingText = intl.formatMessage(messages.typingMany);
    }

    const SendIcon = variant === 'bubbles' ? ArrowUp : SendHorizontal;
    const sendButton = (
        <button
            type="submit"
            className={styles.send}
            disabled={!draft.trim()}
            title={intl.formatMessage(messages.send)}
            aria-label={intl.formatMessage(messages.send)}
        >
            <SendIcon size={variant === 'bubbles' ? 18 : 16} />
        </button>
    );

    return (
        <form
            className={styles.composer}
            onSubmit={submit}
        >
            {state.notice ? (
                <p
                    className={styles.notice}
                    role="alert"
                >
                    {state.notice.kind === 'rate_limit' ? intl.formatMessage(messages.slowDown) : state.notice.text}
                </p>
            ) : null}
            <div className={styles.inputRow}>
                <div className={styles.field}>
                    <textarea
                        ref={inputRef}
                        className={styles.input}
                        rows={1}
                        value={draft}
                        maxLength={Number(state.limits.post_content) || 2000}
                        placeholder={label}
                        aria-label={label}
                        onChange={event => {
                            setDraft(event.target.value);
                            connection.clearNotice();
                            if (event.target.value.trim()) connection.sendTyping(state.active);
                        }}
                        onKeyDown={event => {
                            event.stopPropagation();
                            const plain = !event.shiftKey && !event.nativeEvent.isComposing;
                            if (event.key === 'Enter' && plain) submit(event);
                        }}
                    />
                    {variant === 'bubbles' ? null : sendButton}
                </div>
                {variant === 'bubbles' ? sendButton : null}
            </div>
            <p
                className={styles.typing}
                aria-live="polite"
            >{typingText}</p>
        </form>
    );
};

Composer.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    state: PropTypes.object.isRequired,
    variant: PropTypes.string.isRequired
};

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

const ChannelMenu = ({active, channels, intl, onSelect}) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const current = channels.find(channel => channel.name === active) || channels[0];
    const single = channels.length < 2;

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
                                    [styles.menuItemActive]: channel.name === active
                                })}
                                onClick={() => {
                                    onSelect(channel.name);
                                    setOpen(false);
                                }}
                            >
                                <Hash size={14} />
                                <span>{channelName(channel)}</span>
                                {channel.name === active ? <Check size={14} /> : null}
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
    onSelect: PropTypes.func.isRequired
};

const ChannelTabs = ({active, channels, intl, onSelect}) => (
    <div
        className={styles.tabs}
        role="tablist"
        aria-label={intl.formatMessage(messages.channel)}
    >
        {channels.map(channel => (
            <button
                key={channel.name}
                type="button"
                role="tab"
                aria-selected={channel.name === active}
                className={classNames(styles.tab, {[styles.tabActive]: channel.name === active})}
                onClick={() => onSelect(channel.name)}
            >{channelName(channel)}</button>
        ))}
    </div>
);

ChannelTabs.propTypes = {
    active: PropTypes.string,
    channels: PropTypes.arrayOf(PropTypes.object).isRequired,
    intl: intlShape.isRequired,
    onSelect: PropTypes.func.isRequired
};

const Presence = ({intl, state, stack}) => {
    const users = onlineUsers(state);
    const label = intl.formatMessage(messages.online, {count: users.length});
    if (!stack) {
        return (
            <span
                className={styles.online}
                title={users.map(user => user.username).join(', ')}
            >
                <span className={styles.dot} />
                {label}
            </span>
        );
    }
    const shown = users.slice(0, 3);
    return (
        <span
            className={styles.stack}
            title={users.map(user => user.username).join(', ')}
            aria-label={label}
        >
            {shown.map(user => (
                <Avatar
                    key={user.username}
                    className={styles.stackAvatar}
                    username={user.username}
                    size={20}
                />
            ))}
            <span className={styles.stackCount}>{users.length}</span>
        </span>
    );
};

Presence.propTypes = {
    intl: intlShape.isRequired,
    stack: PropTypes.bool,
    state: PropTypes.object.isRequired
};

const ChatPane = ({
    canDock, connection, floating, intl, onClose, onLeave, onSignIn, onToggleMode, state, variant
}) => {
    const channels = state.channels.filter(isChatChannel);
    const ready = state.status === 'ready' && Boolean(state.active);

    let body;
    if (state.status === 'signed_out') {
        body = (
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
    } else if (state.status === 'error') {
        body = (
            <div className={classNames(styles.empty, styles.fill)}>
                <p className={styles.emptyTitle}>{state.error || intl.formatMessage(messages.connectFailed)}</p>
                <button
                    type="button"
                    className={styles.primary}
                    onClick={() => connection.reconnect()}
                >{intl.formatMessage(messages.retry)}</button>
            </div>
        );
    } else if (ready) {
        body = (
            <React.Fragment>
                <MessageList
                    connection={connection}
                    intl={intl}
                    state={state}
                    variant={variant}
                />
                <Composer
                    connection={connection}
                    intl={intl}
                    state={state}
                    variant={variant}
                />
            </React.Fragment>
        );
    } else {
        body = (
            <p className={classNames(styles.status, styles.fill)}>
                {intl.formatMessage(state.status === 'reconnecting' ? messages.reconnecting : messages.joining)}
            </p>
        );
    }

    const tabs = variant === 'cards';
    let heading;
    if (ready && !tabs) {
        heading = (
            <ChannelMenu
                active={state.active}
                channels={channels}
                intl={intl}
                onSelect={name => connection.selectChannel(name)}
            />
        );
    } else {
        heading = (
            <h2 className={styles.title}>
                <MessagesSquare size={16} />
                {intl.formatMessage(messages.title)}
            </h2>
        );
    }

    return (
        <section
            className={classNames(styles.pane, styles[variant], {[styles.floating]: floating})}
            aria-label={intl.formatMessage(messages.title)}
        >
            <header className={styles.header}>
                {heading}
                {ready ? (
                    <Presence
                        intl={intl}
                        state={state}
                        stack={variant === 'bubbles'}
                    />
                ) : null}
                <div className={styles.headerActions}>
                    {ready ? (
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
            {ready && tabs && channels.length > 1 ? (
                <ChannelTabs
                    active={state.active}
                    channels={channels}
                    intl={intl}
                    onSelect={name => connection.selectChannel(name)}
                />
            ) : null}
            <div className={styles.body}>{body}</div>
        </section>
    );
};

ChatPane.propTypes = {
    canDock: PropTypes.bool,
    connection: PropTypes.object.isRequired,
    floating: PropTypes.bool,
    intl: intlShape.isRequired,
    onClose: PropTypes.func.isRequired,
    onLeave: PropTypes.func.isRequired,
    onSignIn: PropTypes.func.isRequired,
    onToggleMode: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired,
    variant: PropTypes.oneOf(VARIANTS)
};

ChatPane.defaultProps = {
    variant: 'quiet'
};

export default injectIntl(ChatPane);
