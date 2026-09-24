/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {ExternalLink, LogIn, LogOut, MessagesSquare, PanelRight, PictureInPicture2, Send, X} from 'lucide-react';

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
const TOKEN = /(https?:\/\/[^\s<]+|@[A-Za-z0-9][A-Za-z0-9_-]{0,19})/g;
const ROTUR_NAME = /^@[A-Za-z0-9][A-Za-z0-9_-]{0,19}$/;

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
    start: {
        defaultMessage: 'This is the start of #{channel}.',
        description: 'Shown above the oldest message in a chat channel',
        id: 'mw.chat.start'
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
    },
    server: {
        defaultMessage: 'MistWarp chat runs on OriginChats at chats.mistwarp.org.',
        description: 'Footer of the chat pane naming the chat server',
        id: 'mw.chat.server'
    },
    discord: {
        defaultMessage: 'Prefer Discord? The chat is bridged, so you can join from there too.',
        description: 'Footer link in the chat pane to the bridged MistWarp Discord server',
        id: 'mw.chat.discord'
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
    groups.push({author, avatar, key: message.id, lastTime: time, messages: [message]});
    return groups;
}, []);

const MessageGroup = ({group, intl, member}) => {
    const first = group.messages[0];
    const fromDiscord = !member && Boolean(first.webhook || first.author_pfp);
    const avatar = (
        <Avatar
            username={group.avatar ? null : group.author}
            src={group.avatar}
            size={30}
        />
    );
    return (
        <li className={styles.group}>
            {member ? (
                <a
                    className={styles.avatar}
                    href={`/users/${encodeURIComponent(group.author)}`}
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={-1}
                >{avatar}</a>
            ) : (
                <span className={styles.avatar}>{avatar}</span>
            )}
            <div className={styles.groupBody}>
                <div className={styles.meta}>
                    {member ? (
                        <a
                            className={styles.author}
                            href={`/users/${encodeURIComponent(group.author)}`}
                            target="_blank"
                            rel="noreferrer"
                        >{group.author}</a>
                    ) : <span className={styles.author}>{group.author}</span>}
                    {fromDiscord ? (
                        <span className={styles.badge}>{intl.formatMessage(messages.discordBadge)}</span>
                    ) : null}
                    <time className={styles.time}>{formatTime(first.timestamp || 0)}</time>
                </div>
                {group.messages.map(message => (
                    <div
                        key={message.id}
                        className={styles.message}
                    >
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
                    </div>
                ))}
            </div>
        </li>
    );
};

MessageGroup.propTypes = {
    group: PropTypes.shape({
        author: PropTypes.string,
        avatar: PropTypes.string,
        messages: PropTypes.arrayOf(PropTypes.object)
    }).isRequired,
    intl: intlShape.isRequired,
    member: PropTypes.bool
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

    return (
        <ol
            className={styles.messages}
            ref={listRef}
            onScroll={onScroll}
            aria-live="polite"
        >
            {history.atStart ? <li className={styles.start}>{intl.formatMessage(messages.start, {channel})}</li> : null}
            {history.loading ? <li className={styles.start}>{intl.formatMessage(messages.loadingOlder)}</li> : null}
            {groups.map(group => {
                const first = group.messages[0];
                const member = !first.webhook && Boolean(state.users[String(first.user || '').toLowerCase()]);
                return (
                    <MessageGroup
                        key={group.key}
                        group={group}
                        intl={intl}
                        member={member}
                    />
                );
            })}
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
        input.style.height = `${Math.min(input.scrollHeight + 2, 140)}px`;
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
            <p
                className={styles.typing}
                aria-live="polite"
            >{typingText}</p>
            {state.notice ? (
                <p
                    className={styles.notice}
                    role="alert"
                >
                    {state.notice.kind === 'rate_limit' ? intl.formatMessage(messages.slowDown) : state.notice.text}
                </p>
            ) : null}
            <div className={styles.inputRow}>
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
                        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
                    }}
                />
                <button
                    type="submit"
                    className={styles.send}
                    disabled={!draft.trim()}
                    title={intl.formatMessage(messages.send)}
                    aria-label={intl.formatMessage(messages.send)}
                >
                    <Send size={16} />
                </button>
            </div>
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

const ChatPane = ({canDock, connection, floating, intl, onClose, onLeave, onSignIn, onToggleMode, state}) => {
    const channels = state.channels.filter(isChatChannel);
    const ready = state.status === 'ready' && Boolean(state.active);
    const online = onlineUsers(state).length;

    let body;
    if (state.status === 'signed_out') {
        body = (
            <div className={classNames(styles.empty, styles.fill)}>
                <MessagesSquare
                    size={28}
                    className={styles.emptyIcon}
                />
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

    return (
        <section
            className={classNames(styles.pane, {[styles.floating]: floating})}
            aria-label={intl.formatMessage(messages.title)}
        >
            <header className={styles.header}>
                {ready && channels.length > 1 ? (
                    <select
                        className={styles.channelSelect}
                        aria-label={intl.formatMessage(messages.channel)}
                        value={state.active}
                        onChange={event => connection.selectChannel(event.target.value)}
                    >
                        {channels.map(channel => (
                            <option
                                key={channel.name}
                                value={channel.name}
                            >{`# ${channelName(channel)}`}</option>
                        ))}
                    </select>
                ) : (
                    <h2 className={styles.title}>
                        <MessagesSquare size={16} />
                        {ready ? `# ${channelName(channels[0])}` : intl.formatMessage(messages.title)}
                    </h2>
                )}
                {ready ? (
                    <span className={styles.online}>
                        <span className={styles.dot} />
                        {intl.formatMessage(messages.online, {count: online})}
                    </span>
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
            {body}
            <footer className={styles.footer}>
                <a
                    href={CHAT_URL}
                    target="_blank"
                    rel="noreferrer"
                >{intl.formatMessage(messages.server)}</a>
                <a
                    href={DISCORD_INVITE}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.discord}
                >
                    {intl.formatMessage(messages.discord)}
                    <ExternalLink size={12} />
                </a>
            </footer>
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
