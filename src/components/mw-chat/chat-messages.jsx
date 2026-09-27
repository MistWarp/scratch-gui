/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {defineMessages, intlShape} from 'react-intl';
import {
    ArrowDown,
    BadgeCheck,
    CornerUpRight,
    ExternalLink,
    Hash,
    MessageCircle,
    Pencil,
    Reply,
    Server,
    SmilePlus,
    Trash2,
    TriangleAlert,
    Webhook
} from 'lucide-react';

import {
    CHAT_INVITE,
    DISCORD_INVITE,
    channelName,
    directPeer,
    findMessage,
    isBridgedAccount,
    isRoturUser,
    messageAuthor,
    messageAuthorKey,
    messageAvatar,
    pingsMe,
    userAvatar,
    userColor,
    userDisplayName,
    userKey
} from '../../lib/originchats/connection.js';
import {messageEmbeds, serverEmbeds} from '../../lib/originchats/embeds.js';
import {firstLine, onlyEmoji, parse} from '../../lib/originchats/rich-text.js';
import {verifyMessage} from '../../lib/originchats/signing.js';
import {Attachment, ClientEmbed, LinkEmbed} from './chat-embeds.jsx';
import {CHAT_DRAG_MIME} from './chat-actions.js';
import {DirectAvatar} from './chat-direct.jsx';
import {ProfileLink, RichText, UserPicture, richContext} from './chat-rich-text.jsx';
import styles from './chat-pane.css';

const GROUP_WINDOW = 5 * 60;
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];

const messages = defineMessages({
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
    directIntroBody: {
        defaultMessage: 'This is the start of your direct messages with {name}.',
        description: 'Explanation above the oldest message in a direct message conversation',
        id: 'mw.chat.directIntroBody'
    },
    groupIntroBody: {
        defaultMessage: 'This is the start of the {name} group.',
        description: 'Explanation above the oldest message in a group direct message conversation',
        id: 'mw.chat.groupIntroBody'
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
    signed: {
        defaultMessage: 'Signed by the sender',
        description: 'Tooltip on the mark next to a chat message whose signature was verified',
        id: 'mw.chat.signed'
    },
    signatureInvalid: {
        defaultMessage: 'This message was changed after it was signed, or its signature does not match the sender.',
        description: 'Tooltip on the warning mark next to a chat message whose signature failed to verify',
        id: 'mw.chat.signatureInvalid'
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
    react: {
        defaultMessage: 'Add reaction',
        description: 'Button on a chat message that opens the quick reaction picker',
        id: 'mw.chat.react'
    },
    reactWith: {
        defaultMessage: 'React with {emoji}',
        description: 'Accessible label for one emoji in the quick reaction picker',
        id: 'mw.chat.reactWith'
    },
    reply: {
        defaultMessage: 'Reply',
        description: 'Button on a chat message that starts a reply to it',
        id: 'mw.chat.reply'
    },
    message: {
        defaultMessage: 'Send a direct message',
        description: 'Button on a chat message that opens a direct message with its author',
        id: 'mw.chat.message'
    },
    edit: {
        defaultMessage: 'Edit',
        description: 'Button on a chat message that edits it',
        id: 'mw.chat.edit'
    },
    delete: {
        defaultMessage: 'Delete',
        description: 'Button on a chat message that deletes it',
        id: 'mw.chat.delete'
    },
    confirmDelete: {
        defaultMessage: 'Click again to delete',
        description: 'Tooltip on the delete button after the first click, asking the user to confirm',
        id: 'mw.chat.confirmDelete'
    },
    reactedBy: {
        defaultMessage: '{names} reacted with {emoji}',
        description: 'Tooltip on a reaction under a chat message listing who reacted',
        id: 'mw.chat.reactedBy'
    },
    jumpLatest: {
        defaultMessage: 'Jump to latest',
        description: 'Button that scrolls the chat to the newest message',
        id: 'mw.chat.jumpLatest'
    },
    newMessages: {
        defaultMessage: '{count, plural, one {# new message} other {# new messages}}',
        description: 'Button that scrolls the chat to new messages that arrived while scrolled up',
        id: 'mw.chat.newMessages'
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

const isMine = (state, message) => Boolean(state.me && message && !message.webhook &&
    userKey(message.user) === userKey(state.me.username));

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

const SignedMark = ({intl, message, signingUrl}) => {
    const [result, setResult] = useState(null);
    useEffect(() => {
        let alive = true;
        setResult(null);
        if (!message.signature) return;
        verifyMessage(message, signingUrl).then(value => alive && setResult(value));
        return () => {
            alive = false;
        };
    }, [message.id, message.signature, message.content, signingUrl]);
    if (result === 'verified') {
        return (
            <span
                className={styles.mark}
                title={intl.formatMessage(messages.signed)}
            ><BadgeCheck size={12} /></span>
        );
    }
    if (result === 'invalid') {
        return (
            <span
                className={classNames(styles.mark, styles.markWarning)}
                title={intl.formatMessage(messages.signatureInvalid)}
            ><TriangleAlert size={12} /></span>
        );
    }
    return null;
};

SignedMark.propTypes = {
    intl: intlShape.isRequired,
    message: PropTypes.object.isRequired,
    signingUrl: PropTypes.string
};

const ReplyPreview = ({connection, intl, message, onJump, state}) => {
    const reference = typeof message.reply_to === 'object' ? message.reply_to : {id: message.reply_to};
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
    const avatarSrc = target ? messageAvatar(state, target, connection.serverUrl) :
        userAvatar(state, username, connection.serverUrl);
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

const EmojiLabel = ({emoji, intl, state}) => {
    if (!/^originChats:/i.test(emoji)) return emoji;
    return (
        <RichText
            tokens={parse(emoji, {emojis: state.emojis})}
            intl={intl}
            state={state}
            inline
        />
    );
};

EmojiLabel.propTypes = {
    emoji: PropTypes.string.isRequired,
    intl: intlShape.isRequired,
    state: PropTypes.object.isRequired
};

const Reactions = ({connection, intl, message, state}) => {
    const entries = Object.keys(message.reactions || {})
        .map(emoji => ({emoji, users: message.reactions[emoji] || []}))
        .filter(entry => entry.users.length);
    if (!entries.length) return null;
    const me = state.me && userKey(state.me.username);
    return (
        <div className={styles.reactions}>
            {entries.map(entry => {
                const mine = entry.users.some(name => userKey(name) === me);
                const names = entry.users.map(name => userDisplayName(state, name)).join(', ');
                return (
                    <button
                        key={entry.emoji}
                        type="button"
                        className={classNames(styles.reaction, {[styles.reactionMine]: mine})}
                        aria-pressed={mine}
                        title={intl.formatMessage(messages.reactedBy, {names, emoji: entry.emoji})}
                        onClick={() => connection.toggleReaction(state.active, message.id, entry.emoji)}
                    >
                        <span className={styles.reactionEmoji}>
                            <EmojiLabel
                                emoji={entry.emoji}
                                intl={intl}
                                state={state}
                            />
                        </span>
                        <span>{entry.users.length}</span>
                    </button>
                );
            })}
        </div>
    );
};

Reactions.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    message: PropTypes.object.isRequired,
    state: PropTypes.object.isRequired
};

const ActionButton = ({danger, icon: Icon, label, onClick, pressed}) => (
    <button
        type="button"
        className={classNames(styles.actionButton, {[styles.actionDanger]: danger})}
        title={label}
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
    >
        <Icon size={15} />
    </button>
);

ActionButton.propTypes = {
    danger: PropTypes.bool,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    pressed: PropTypes.bool
};

const MessageActions = ({canDirect, connection, intl, message, onDirect, onEdit, onReply, state}) => {
    const [picker, setPicker] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const mine = isMine(state, message);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!confirming) return;
        const timer = setTimeout(() => setConfirming(false), 3000);
        return () => clearTimeout(timer);
    }, [confirming]);

    useEffect(() => {
        if (!picker) return;
        const onPointer = event => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setPicker(false);
        };
        document.addEventListener('pointerdown', onPointer);
        return () => document.removeEventListener('pointerdown', onPointer);
    }, [picker]);

    return (
        <div
            ref={rootRef}
            className={classNames(styles.actions, {[styles.actionsOpen]: picker || confirming})}
        >
            {picker ? (
                <div
                    className={styles.picker}
                    role="menu"
                >
                    {QUICK_REACTIONS.map(emoji => (
                        <button
                            key={emoji}
                            type="button"
                            role="menuitem"
                            className={styles.pickerItem}
                            aria-label={intl.formatMessage(messages.reactWith, {emoji})}
                            onClick={() => {
                                connection.toggleReaction(state.active, message.id, emoji);
                                setPicker(false);
                            }}
                        >{emoji}</button>
                    ))}
                </div>
            ) : null}
            <ActionButton
                icon={SmilePlus}
                label={intl.formatMessage(messages.react)}
                pressed={picker}
                onClick={() => setPicker(value => !value)}
            />
            <ActionButton
                icon={Reply}
                label={intl.formatMessage(messages.reply)}
                onClick={() => onReply(message)}
            />
            {canDirect && !mine && isRoturUser(state, message.user) && !message.webhook && !message.alias ? (
                <ActionButton
                    icon={MessageCircle}
                    label={intl.formatMessage(messages.message)}
                    onClick={() => onDirect(message.user)}
                />
            ) : null}
            {mine ? (
                <ActionButton
                    icon={Pencil}
                    label={intl.formatMessage(messages.edit)}
                    onClick={() => onEdit(message)}
                />
            ) : null}
            {mine ? (
                <ActionButton
                    danger
                    icon={Trash2}
                    label={intl.formatMessage(confirming ? messages.confirmDelete : messages.delete)}
                    pressed={confirming}
                    onClick={() => {
                        if (!confirming) {
                            setConfirming(true);
                            return;
                        }
                        setConfirming(false);
                        connection.deleteMessage(state.active, message.id);
                    }}
                />
            ) : null}
        </div>
    );
};

MessageActions.propTypes = {
    canDirect: PropTypes.bool,
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    message: PropTypes.object.isRequired,
    onDirect: PropTypes.func,
    onEdit: PropTypes.func.isRequired,
    onReply: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

const MessageBody = ({connection, intl, message, state}) => {
    const tokens = useMemo(() => parse(message.content, richContext(state, message)), [
        message.content, message.pings, state.users, state.roles, state.emojis, state.channels
    ]);
    const clientEmbeds = useMemo(() => messageEmbeds(tokens), [tokens]);
    const fromServer = useMemo(() => serverEmbeds(message, clientEmbeds), [message.embeds, clientEmbeds]);
    const jumbo = onlyEmoji(tokens);
    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
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
            {attachments.length || clientEmbeds.length || fromServer.length ? (
                <div className={styles.embeds}>
                    {attachments.filter(item => item && typeof item === 'object').map(attachment => (
                        <Attachment
                            key={attachment.id || attachment.url}
                            attachment={attachment}
                            intl={intl}
                            serverUrl={connection.serverUrl}
                        />
                    ))}
                    {clientEmbeds.map(embed => (
                        <ClientEmbed
                            key={`${embed.type}:${embed.url}`}
                            embed={embed}
                            intl={intl}
                            state={state}
                        />
                    ))}
                    {fromServer.map((embed, index) => (
                        <LinkEmbed
                            key={embed.id || index}
                            embed={embed}
                            intl={intl}
                        />
                    ))}
                </div>
            ) : null}
        </React.Fragment>
    );
};

MessageBody.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    message: PropTypes.object.isRequired,
    state: PropTypes.object.isRequired
};

const MessageGroup = ({canDirect, connection, group, intl, onDirect, onEdit, onJump, onReply, state}) => {
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
                                src={messageAvatar(state, first, connection.serverUrl)}
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
                                <SignedMark
                                    intl={intl}
                                    message={first}
                                    signingUrl={state.signingUrl || connection.serverUrl}
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
                        <Reactions
                            connection={connection}
                            intl={intl}
                            message={message}
                            state={state}
                        />
                    </div>
                    <MessageActions
                        canDirect={canDirect}
                        connection={connection}
                        intl={intl}
                        message={message}
                        onDirect={onDirect}
                        onEdit={onEdit}
                        onReply={onReply}
                        state={state}
                    />
                </div>
            ))}
        </li>
    );
};

MessageGroup.propTypes = {
    canDirect: PropTypes.bool,
    connection: PropTypes.object.isRequired,
    group: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onDirect: PropTypes.func,
    onEdit: PropTypes.func.isRequired,
    onJump: PropTypes.func.isRequired,
    onReply: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

const Intro = ({channel, intl, state}) => {
    if (state.direct) {
        const peer = directPeer(channel);
        const name = channelName(channel);
        return (
            <li className={styles.intro}>
                {channel ? (
                    <DirectAvatar
                        channel={channel}
                        me={state.me && state.me.username}
                        size={40}
                    />
                ) : <span className={styles.introIcon}><MessageCircle size={18} /></span>}
                <p className={styles.introTitle}>{name}</p>
                <p className={styles.introBody}>
                    {intl.formatMessage(peer ? messages.directIntroBody : messages.groupIntroBody, {name})}
                </p>
            </li>
        );
    }
    return (
        <li className={styles.intro}>
            <span className={styles.introIcon}><Hash size={18} /></span>
            <p className={styles.introTitle}>{intl.formatMessage(messages.introTitle, {channel: channelName(channel)})}</p>
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
};

Intro.propTypes = {
    channel: PropTypes.object,
    intl: intlShape.isRequired,
    state: PropTypes.object.isRequired
};

const markInternalDrag = event => {
    if (event.dataTransfer && !event.dataTransfer.types.includes(CHAT_DRAG_MIME)) {
        event.dataTransfer.setData(CHAT_DRAG_MIME, '1');
    }
};

const MessageList = ({canDirect, connection, intl, onDirect, onEdit, onReply, state}) => {
    const listRef = useRef(null);
    const pinnedRef = useRef(true);
    const heightRef = useRef(0);
    const topRef = useRef(0);
    const seenRef = useRef(0);
    const [pinned, setPinned] = useState(true);
    const channel = state.active;
    const list = state.messages[channel];
    const history = state.history[channel] || {};
    const groups = useMemo(() => groupMessages(list || []), [list]);
    const count = (list || []).length;
    const lastId = count ? list[count - 1].id : null;
    const [unseen, setUnseen] = useState(0);

    useLayoutEffect(() => {
        const element = listRef.current;
        if (!element) return;
        if (pinnedRef.current) {
            element.scrollTop = element.scrollHeight;
        } else if (heightRef.current && element.scrollTop < 40) {
            element.scrollTop += element.scrollHeight - heightRef.current;
        }
        heightRef.current = element.scrollHeight;
        topRef.current = element.scrollTop;
    }, [groups, history.loaded]);

    useEffect(() => {
        if (pinnedRef.current) {
            seenRef.current = lastId;
            setUnseen(0);
        } else if (lastId && lastId !== seenRef.current) {
            setUnseen(value => value + 1);
            seenRef.current = lastId;
        }
    }, [lastId]);

    useEffect(() => {
        pinnedRef.current = true;
        setPinned(true);
        setUnseen(0);
    }, [channel]);

    useEffect(() => {
        const element = listRef.current;
        if (!element || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => {
            if (pinnedRef.current) element.scrollTop = element.scrollHeight;
            heightRef.current = element.scrollHeight;
            topRef.current = element.scrollTop;
        });
        Array.from(element.children).forEach(child => observer.observe(child));
        observer.observe(element);
        return () => observer.disconnect();
    }, [groups, history.loaded]);

    if (!history.loaded) {
        return <p className={classNames(styles.status, styles.fill)}>{intl.formatMessage(messages.loading)}</p>;
    }

    const onScroll = () => {
        const element = listRef.current;
        const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 60;
        const movedUp = element.scrollTop < topRef.current - 1;
        const next = atBottom || (pinnedRef.current && !movedUp);
        topRef.current = element.scrollTop;
        pinnedRef.current = next;
        heightRef.current = element.scrollHeight;
        if (next !== pinned) setPinned(next);
        if (next && unseen) setUnseen(0);
        if (element.scrollTop < 80) connection.loadOlder(channel);
    };

    const jump = id => {
        const element = listRef.current && listRef.current.querySelector(`[data-message-id="${id}"]`);
        if (!element) return;
        pinnedRef.current = false;
        setPinned(false);
        element.scrollIntoView({block: 'center'});
        element.classList.add(styles.flash);
        setTimeout(() => element.classList.remove(styles.flash), 1200);
    };

    const toLatest = () => {
        const element = listRef.current;
        if (!element) return;
        pinnedRef.current = true;
        setPinned(true);
        setUnseen(0);
        element.scrollTop = element.scrollHeight;
    };

    const current = state.channels.find(item => item.name === channel);

    return (
        <div className={styles.messagesWrap}>
            <ol
                className={styles.messages}
                ref={listRef}
                onScroll={onScroll}
                onDragStart={markInternalDrag}
                aria-live="polite"
            >
                {history.atStart ? (
                    <Intro
                        channel={current}
                        intl={intl}
                        state={state}
                    />
                ) : null}
                {history.loading ? <li className={styles.status}>{intl.formatMessage(messages.loadingOlder)}</li> : null}
                {groups.map(group => (
                    <MessageGroup
                        key={group.key}
                        canDirect={canDirect}
                        connection={connection}
                        group={group}
                        intl={intl}
                        onDirect={onDirect}
                        onEdit={onEdit}
                        onJump={jump}
                        onReply={onReply}
                        state={state}
                    />
                ))}
            </ol>
            {pinned ? null : (
                <button
                    type="button"
                    className={styles.jump}
                    onClick={toLatest}
                >
                    <ArrowDown size={14} />
                    {unseen ?
                        intl.formatMessage(messages.newMessages, {count: unseen}) :
                        intl.formatMessage(messages.jumpLatest)}
                </button>
            )}
        </div>
    );
};

MessageList.propTypes = {
    canDirect: PropTypes.bool,
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onDirect: PropTypes.func,
    onEdit: PropTypes.func.isRequired,
    onReply: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

export {MessageList, isMine};
