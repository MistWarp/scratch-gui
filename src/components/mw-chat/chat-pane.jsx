/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {
    Check,
    ChevronDown,
    CornerUpRight,
    ExternalLink,
    Hash,
    LogIn,
    LogOut,
    MessagesSquare,
    PanelRight,
    PictureInPicture2,
    SendHorizontal,
    Server,
    Webhook,
    X
} from 'lucide-react';

import Avatar from '../mw-avatar/avatar.jsx';
import {
    CHAT_INVITE,
    DISCORD_INVITE,
    activeTyping,
    channelName,
    findMessage,
    isBridgedAccount,
    isChatChannel,
    isRoturUser,
    messageAuthor,
    messageAuthorKey,
    messageAvatar,
    onlineUsers,
    pingsMe,
    userAvatar,
    userColor,
    userDisplayName
} from '../../lib/originchats/connection.js';
import {firstLine, onlyEmoji, parse} from '../../lib/originchats/rich-text.js';
import styles from './chat-pane.css';

const GROUP_WINDOW = 5 * 60;

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
        defaultMessage: 'Join in OriginChats',
        description: 'Link that opens the invite to the MistWarp server in an OriginChats client',
        id: 'mw.chat.serverLink'
    },
    discordLink: {
        defaultMessage: 'Join on Discord',
        description: 'Link to the bridged MistWarp Discord server',
        id: 'mw.chat.discordLink'
    },
    bridged: {
        defaultMessage: 'Bridged from Discord',
        description: 'Tooltip on the mark next to a chat message that was sent from the bridged Discord server',
        id: 'mw.chat.bridged'
    },
    webhook: {
        defaultMessage: 'Posted by a webhook',
        description: 'Tooltip on the mark next to a chat message that was posted by a webhook',
        id: 'mw.chat.webhook'
    },
    edited: {
        defaultMessage: '(edited)',
        description: 'Marker after a chat message that was edited',
        id: 'mw.chat.edited'
    },
    replyTo: {
        defaultMessage: 'Jump to the message this replies to',
        description: 'Accessible label for the reply preview above a chat message',
        id: 'mw.chat.replyTo'
    },
    unknownUser: {
        defaultMessage: 'Unknown user',
        description: 'Shown in a reply preview when the original author is not known',
        id: 'mw.chat.unknownUser'
    },
    noContent: {
        defaultMessage: 'No content',
        description: 'Shown in a reply preview when the original message has no text',
        id: 'mw.chat.noContent'
    },
    attachment: {
        defaultMessage: 'Attachment',
        description: 'Shown in a reply preview when the original message only has an attachment',
        id: 'mw.chat.attachment'
    },
    spoiler: {
        defaultMessage: 'Reveal spoiler',
        description: 'Accessible label for hidden spoiler text in a chat message',
        id: 'mw.chat.spoiler'
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

const groupMessages = list => list.reduce((groups, message) => {
    const last = groups[groups.length - 1];
    const authorKey = messageAuthorKey(message);
    const time = message.timestamp || 0;
    const continues = last && last.authorKey === authorKey;
    if (continues && time - last.lastTime < GROUP_WINDOW && !message.reply_to) {
        last.messages.push(message);
        last.lastTime = time;
        return groups;
    }
    groups.push({authorKey, key: message.id, lastTime: time, messages: [message]});
    return groups;
}, []);

const richContext = (state, message) => ({
    users: state.users,
    roles: state.roles,
    emojis: state.emojis,
    channels: state.channels,
    pinged: (message && message.pings && message.pings.users) || []
});

const profileHref = username => `/users/${encodeURIComponent(username)}`;

const Spoiler = ({children, intl}) => {
    const [shown, setShown] = useState(false);
    return (
        <span
            className={classNames(styles.spoiler, {[styles.spoilerShown]: shown})}
            role={shown ? null : 'button'}
            tabIndex={shown ? null : 0}
            aria-label={shown ? null : intl.formatMessage(messages.spoiler)}
            onClick={() => setShown(true)}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') setShown(true);
            }}
        >{children}</span>
    );
};

Spoiler.propTypes = {
    children: PropTypes.node,
    intl: intlShape.isRequired
};

const RichText = ({tokens, intl, state, onChannel, inline}) => tokens.map((token, index) => {
    switch (token.type) {
    case 'text':
        return token.text;
    case 'break':
        return inline ? ' ' : <br key={index} />;
    case 'link':
        return (
            <a
                key={index}
                className={styles.link}
                href={token.url}
                target="_blank"
                rel="noreferrer"
            >{token.text.replace(/^https?:\/\//, '')}</a>
        );
    case 'emoji':
        return (
            <img
                key={index}
                className={styles.emoji}
                src={token.src}
                alt={`:${token.name}:`}
                title={`:${token.name}:`}
                loading="lazy"
                draggable={false}
            />
        );
    case 'sticker':
        return inline ? `:${token.id}:` : (
            <img
                key={index}
                className={styles.sticker}
                src={token.src}
                alt=""
                loading="lazy"
                draggable={false}
            />
        );
    case 'mention': {
        const label = `@${token.display}`;
        if (!token.known || !isRoturUser(state, token.username)) {
            return (
                <span
                    key={index}
                    className={classNames(styles.mention, {[styles.mentionUnknown]: !token.known})}
                >{label}</span>
            );
        }
        return (
            <a
                key={index}
                className={styles.mention}
                href={profileHref(token.username)}
                target="_blank"
                rel="noreferrer"
            >{label}</a>
        );
    }
    case 'roleMention':
        return (
            <span
                key={index}
                className={classNames(styles.mention, styles.roleMention)}
                style={token.color ? {'--mention-color': token.color} : null}
            >{`@${token.name}`}</span>
        );
    case 'channel':
        return (
            <button
                key={index}
                type="button"
                className={classNames(styles.mention, styles.channelMention)}
                onClick={() => onChannel && onChannel(token.channel)}
            >{`#${token.name}`}</button>
        );
    case 'inlineCode':
        return (
            <code
                key={index}
                className={styles.code}
            >{token.code}</code>
        );
    case 'codeBlock':
        return inline ? (
            <code
                key={index}
                className={styles.code}
            >{token.code}</code>
        ) : (
            <pre
                key={index}
                className={styles.codeBlock}
            ><code>{token.code}</code></pre>
        );
    case 'format': {
        const children = (
            <RichText
                tokens={token.children}
                intl={intl}
                state={state}
                onChannel={onChannel}
                inline={inline}
            />
        );
        if (token.style === 'spoiler') {
            return (
                <Spoiler
                    key={index}
                    intl={intl}
                >{children}</Spoiler>
            );
        }
        return (
            <span
                key={index}
                className={styles[token.style]}
            >{children}</span>
        );
    }
    default:
        return null;
    }
});

RichText.propTypes = {
    inline: PropTypes.bool,
    intl: intlShape.isRequired,
    onChannel: PropTypes.func,
    state: PropTypes.object.isRequired,
    tokens: PropTypes.arrayOf(PropTypes.object).isRequired
};

const ProfileLink = ({className, member, name, children, tabIndex, style}) => (member ? (
    <a
        className={className}
        href={profileHref(name)}
        target="_blank"
        rel="noreferrer"
        tabIndex={tabIndex}
        style={style}
    >{children}</a>
) : (
    <span
        className={className}
        style={style}
    >{children}</span>
));

ProfileLink.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    member: PropTypes.bool,
    name: PropTypes.string.isRequired,
    style: PropTypes.object,
    tabIndex: PropTypes.number
};

const UserPicture = ({rotur, size, src, username}) => (
    <Avatar
        username={rotur || !src ? username : null}
        src={src || null}
        size={size}
    />
);

UserPicture.propTypes = {
    rotur: PropTypes.bool,
    size: PropTypes.number.isRequired,
    src: PropTypes.string,
    username: PropTypes.string
};

const SourceMark = ({intl, message}) => {
    if (message.webhook) {
        return (
            <span
                className={styles.mark}
                title={intl.formatMessage(messages.webhook)}
            ><Webhook size={12} /></span>
        );
    }
    if (isBridgedAccount(message.user)) {
        return (
            <span
                className={styles.mark}
                title={intl.formatMessage(messages.bridged)}
            ><Server size={12} /></span>
        );
    }
    return null;
};

SourceMark.propTypes = {
    intl: intlShape.isRequired,
    message: PropTypes.object.isRequired
};

const ReplyPreview = ({connection, intl, message, onJump, state}) => {
    const reference = message.reply_to;
    const channel = state.active;
    const target = findMessage(state, channel, reference.id);
    useEffect(() => {
        if (!target && reference.id) connection.fetchMessage(channel, reference.id);
    }, [connection, channel, reference.id, target]);

    const username = (target && target.user) || reference.user || '';
    let name = intl.formatMessage(messages.unknownUser);
    if (target) name = messageAuthor(state, target);
    else if (username) name = userDisplayName(state, username);

    const text = target ? firstLine(target.content) : (reference.preview || '');
    const hasAttachments = Boolean(target && Array.isArray(target.attachments) && target.attachments.length);
    const tokens = parse(text, richContext(state, target));
    const avatarSrc = target ? messageAvatar(state, target) : userAvatar(state, username);
    const rotur = Boolean(username) && !(target && (target.webhook || target.alias)) && isRoturUser(state, username);
    let fallback = messages.noContent;
    if (hasAttachments) fallback = messages.attachment;

    return (
        <button
            type="button"
            className={styles.reply}
            title={intl.formatMessage(messages.replyTo)}
            disabled={!target}
            onClick={() => target && onJump(target.id)}
        >
            <CornerUpRight
                size={14}
                className={styles.replyIcon}
            />
            {username ? (
                <UserPicture
                    rotur={rotur}
                    size={16}
                    src={avatarSrc}
                    username={username}
                />
            ) : null}
            <span className={styles.replyName}>{name}</span>
            <span className={styles.replyText}>
                {tokens.length ? (
                    <RichText
                        tokens={tokens}
                        intl={intl}
                        state={state}
                        inline
                    />
                ) : intl.formatMessage(fallback)}
            </span>
        </button>
    );
};

ReplyPreview.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    message: PropTypes.object.isRequired,
    onJump: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

const MessageBody = ({connection, intl, message, state}) => {
    const tokens = useMemo(() => parse(message.content, richContext(state, message)), [
        message.content, message.pings, state.users, state.roles, state.emojis, state.channels
    ]);
    const jumbo = onlyEmoji(tokens);
    return (
        <React.Fragment>
            {tokens.length ? (
                <p className={classNames(styles.content, {[styles.jumbo]: jumbo})}>
                    <RichText
                        tokens={tokens}
                        intl={intl}
                        state={state}
                        onChannel={name => connection.selectChannel(name)}
                    />
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
};

MessageBody.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    message: PropTypes.object.isRequired,
    state: PropTypes.object.isRequired
};

const MessageGroup = ({connection, group, intl, onJump, state}) => {
    const first = group.messages[0];
    const person = !first.webhook && !first.alias;
    const member = person && isRoturUser(state, first.user);
    const color = person ? userColor(state, first.user) : null;
    return (
        <li className={styles.group}>
            {group.messages.map((message, index) => (
                <div
                    key={message.id}
                    data-message-id={message.id}
                    className={classNames(styles.row, {
                        [styles.rowFirst]: index === 0,
                        [styles.pinged]: Boolean(pingsMe(state, message))
                    })}
                >
                    {message.reply_to ? (
                        <div className={styles.replyRow}>
                            <ReplyPreview
                                connection={connection}
                                intl={intl}
                                message={message}
                                onJump={onJump}
                                state={state}
                            />
                        </div>
                    ) : null}
                    {index === 0 ? (
                        <ProfileLink
                            className={styles.avatar}
                            member={member}
                            name={first.user || ''}
                            tabIndex={-1}
                        >
                            <UserPicture
                                rotur={member}
                                size={28}
                                src={messageAvatar(state, first)}
                                username={first.user}
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
                                    name={first.user || ''}
                                    style={color ? {color} : null}
                                >{messageAuthor(state, first)}</ProfileLink>
                                <SourceMark
                                    intl={intl}
                                    message={first}
                                />
                                <time className={styles.time}>{formatTime(first.timestamp || 0)}</time>
                            </div>
                        ) : null}
                        <MessageBody
                            connection={connection}
                            intl={intl}
                            message={message}
                            state={state}
                        />
                    </div>
                </div>
            ))}
        </li>
    );
};

MessageGroup.propTypes = {
    connection: PropTypes.object.isRequired,
    group: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onJump: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

const Intro = ({channel, intl}) => (
    <li className={styles.intro}>
        <span className={styles.introIcon}><Hash size={18} /></span>
        <p className={styles.introTitle}>{intl.formatMessage(messages.introTitle, {channel})}</p>
        <p className={styles.introBody}>{intl.formatMessage(messages.introBody)}</p>
        <div className={styles.chips}>
            <a
                className={styles.chip}
                href={CHAT_INVITE}
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

const MessageList = ({connection, intl, state}) => {
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

    const jump = id => {
        const element = listRef.current && listRef.current.querySelector(`[data-message-id="${id}"]`);
        if (!element) return;
        pinnedRef.current = false;
        element.scrollIntoView({block: 'center'});
        element.classList.add(styles.flash);
        setTimeout(() => element.classList.remove(styles.flash), 1200);
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
                    channel={channelName(state.channels.find(item => item.name === channel))}
                    intl={intl}
                />
            ) : null}
            {history.loading ? <li className={styles.status}>{intl.formatMessage(messages.loadingOlder)}</li> : null}
            {groups.map(group => (
                <MessageGroup
                    key={group.key}
                    connection={connection}
                    group={group}
                    intl={intl}
                    onJump={jump}
                    state={state}
                />
            ))}
        </ol>
    );
};

MessageList.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    state: PropTypes.object.isRequired
};

const Composer = ({connection, intl, state}) => {
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
                    <button
                        type="submit"
                        className={styles.send}
                        disabled={!draft.trim()}
                        title={intl.formatMessage(messages.send)}
                        aria-label={intl.formatMessage(messages.send)}
                    >
                        <SendHorizontal size={16} />
                    </button>
                </div>
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
    state: PropTypes.object.isRequired
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

const Presence = ({intl, state}) => {
    const users = onlineUsers(state);
    return (
        <span
            className={styles.online}
            title={users.map(user => userDisplayName(state, user.username)).join(', ')}
        >
            <span className={styles.dot} />
            {intl.formatMessage(messages.online, {count: users.length})}
        </span>
    );
};

Presence.propTypes = {
    intl: intlShape.isRequired,
    state: PropTypes.object.isRequired
};

const ChatPane = ({canDock, connection, floating, intl, onClose, onLeave, onSignIn, onToggleMode, state}) => {
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
                />
                <Composer
                    connection={connection}
                    intl={intl}
                    state={state}
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

    let heading;
    if (ready) {
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
            className={classNames(styles.pane, {[styles.floating]: floating})}
            aria-label={intl.formatMessage(messages.title)}
        >
            <header className={styles.header}>
                {heading}
                {ready ? (
                    <Presence
                        intl={intl}
                        state={state}
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
    state: PropTypes.object.isRequired
};

export default injectIntl(ChatPane);
