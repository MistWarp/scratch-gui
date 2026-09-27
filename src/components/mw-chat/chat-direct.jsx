/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {defineMessages, intlShape} from 'react-intl';
import {MessageCircle, UserRoundPlus, Users} from 'lucide-react';

import {channelName, directPeer, isChatChannel} from '../../lib/originchats/connection.js';
import {UserPicture} from './chat-rich-text.jsx';
import styles from './chat-pane.css';

const messages = defineMessages({
    newLabel: {
        defaultMessage: 'Rotur username',
        description: 'Label for the field that starts a new direct message',
        id: 'mw.chat.direct.newLabel'
    },
    newButton: {
        defaultMessage: 'Message',
        description: 'Button that opens a direct message with the entered user',
        id: 'mw.chat.direct.newButton'
    },
    empty: {
        defaultMessage: 'No conversations yet. Enter a Rotur username above to start one.',
        description: 'Shown in the direct messages list when the user has no conversations',
        id: 'mw.chat.direct.empty'
    },
    members: {
        defaultMessage: '{count} members',
        description: 'Member count under a group conversation in the direct messages list',
        id: 'mw.chat.direct.members'
    },
    unread: {
        defaultMessage: '{count} unread',
        description: 'Accessible label for the unread count on a direct message conversation',
        id: 'mw.chat.direct.unread'
    },
    list: {
        defaultMessage: 'Conversations',
        description: 'Accessible label for the list of direct message conversations',
        id: 'mw.chat.direct.list'
    }
});

const formatWhen = seconds => {
    if (!seconds) return '';
    const date = new Date(seconds * 1000);
    const today = new Date();
    return date.toDateString() === today.toDateString() ?
        date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) :
        date.toLocaleDateString([], {month: 'short', day: 'numeric'});
};

const conversations = state => state.channels
    .filter(isChatChannel)
    .slice()
    .sort((a, b) => (Number(b.last_message) || 0) - (Number(a.last_message) || 0));

const DirectAvatar = ({channel, size}) => {
    const peer = directPeer(channel);
    if (peer) {
        return (
            <UserPicture
                rotur
                size={size}
                username={peer}
            />
        );
    }
    return (
        <span
            className={styles.groupAvatar}
            style={{width: size, height: size}}
        ><Users size={Math.round(size * 0.5)} /></span>
    );
};

DirectAvatar.propTypes = {
    channel: PropTypes.object.isRequired,
    size: PropTypes.number.isRequired
};

const DirectList = ({connection, intl, state}) => {
    const [name, setName] = useState('');
    const list = conversations(state);
    const label = intl.formatMessage(messages.newLabel);
    return (
        <div className={classNames(styles.directHome, styles.fill)}>
            <form
                className={styles.directNew}
                onSubmit={event => {
                    event.preventDefault();
                    if (connection.openDirect(name)) setName('');
                }}
            >
                <label className={styles.accessField}>
                    <UserRoundPlus size={15} />
                    <input
                        type="text"
                        value={name}
                        placeholder={label}
                        aria-label={label}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={event => {
                            setName(event.target.value);
                            connection.clearNotice();
                        }}
                        onKeyDown={event => event.stopPropagation()}
                    />
                </label>
                <button
                    type="submit"
                    className={styles.cardButton}
                    disabled={!name.trim()}
                >
                    <MessageCircle size={14} />
                    {intl.formatMessage(messages.newButton)}
                </button>
            </form>
            {state.notice && state.notice.text ? (
                <p
                    className={styles.notice}
                    role="alert"
                >{state.notice.text}</p>
            ) : null}
            {list.length ? (
                <ul
                    className={styles.directList}
                    aria-label={intl.formatMessage(messages.list)}
                >
                    {list.map(channel => {
                        const unread = state.channelUnread[channel.name] || 0;
                        const group = !directPeer(channel);
                        return (
                            <li key={channel.name}>
                                <button
                                    type="button"
                                    className={classNames(styles.directItem, {[styles.directUnread]: unread})}
                                    onClick={() => connection.selectChannel(channel.name)}
                                >
                                    <DirectAvatar
                                        channel={channel}
                                        size={32}
                                    />
                                    <span className={styles.directText}>
                                        <span className={styles.directName}>{channelName(channel)}</span>
                                        {group && Array.isArray(channel.members) ? (
                                            <span className={styles.cardMeta}>
                                                {intl.formatMessage(messages.members, {count: channel.members.length})}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className={styles.directWhen}>{formatWhen(channel.last_message)}</span>
                                    {unread ? (
                                        <span
                                            className={styles.countBadge}
                                            aria-label={intl.formatMessage(messages.unread, {count: unread})}
                                        >{unread > 99 ? '99+' : unread}</span>
                                    ) : null}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className={classNames(styles.status, styles.fill)}>{intl.formatMessage(messages.empty)}</p>
            )}
        </div>
    );
};

DirectList.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    state: PropTypes.object.isRequired
};

export {DirectAvatar, DirectList};
