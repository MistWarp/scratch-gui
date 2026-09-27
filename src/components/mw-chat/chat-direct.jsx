/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {defineMessages, intlShape} from 'react-intl';
import {Crown, LogOut, MessageCircle, Pencil, Trash2, UserMinus, UserRoundPlus, Users, X} from 'lucide-react';

import {
    channelName,
    directPeer,
    groupMembers,
    isChatChannel,
    isGroupChannel,
    userKey
} from '../../lib/originchats/connection.js';
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
    },
    newGroup: {
        defaultMessage: 'New group',
        description: 'Button that opens the form for creating a group conversation',
        id: 'mw.chat.direct.newGroup'
    },
    groupName: {
        defaultMessage: 'Group name',
        description: 'Label for the group name field',
        id: 'mw.chat.direct.groupName'
    },
    groupMembersField: {
        defaultMessage: 'Members, separated by commas',
        description: 'Label for the field listing the Rotur usernames to add to a new group',
        id: 'mw.chat.direct.groupMembersField'
    },
    createGroup: {
        defaultMessage: 'Create group',
        description: 'Button that creates a group conversation',
        id: 'mw.chat.direct.createGroup'
    },
    cancel: {
        defaultMessage: 'Cancel',
        description: 'Button that closes the new group form',
        id: 'mw.chat.direct.cancel'
    },
    groupTitle: {
        defaultMessage: 'Group members',
        description: 'Heading of the panel that lists the members of a group conversation',
        id: 'mw.chat.direct.groupTitle'
    },
    owner: {
        defaultMessage: 'Owner',
        description: 'Label next to the creator of a group conversation',
        id: 'mw.chat.direct.owner'
    },
    you: {
        defaultMessage: '{name} (you)',
        description: 'Member list entry for the current user in a group conversation',
        id: 'mw.chat.direct.you'
    },
    remove: {
        defaultMessage: 'Remove {name} from the group',
        description: 'Button that removes a member from a group conversation',
        id: 'mw.chat.direct.remove'
    },
    addMember: {
        defaultMessage: 'Add',
        description: 'Button that adds a member to a group conversation',
        id: 'mw.chat.direct.addMember'
    },
    rename: {
        defaultMessage: 'Rename',
        description: 'Button that saves a new name for a group conversation',
        id: 'mw.chat.direct.rename'
    },
    leave: {
        defaultMessage: 'Leave group',
        description: 'Button that leaves a group conversation',
        id: 'mw.chat.direct.leave'
    },
    delete: {
        defaultMessage: 'Delete group',
        description: 'Button that deletes a group conversation for everyone',
        id: 'mw.chat.direct.delete'
    },
    confirmLeave: {
        defaultMessage: 'Click again to leave',
        description: 'Leave group button label after the first click, asking the user to confirm',
        id: 'mw.chat.direct.confirmLeave'
    },
    confirmDelete: {
        defaultMessage: 'Click again to delete for everyone',
        description: 'Delete group button label after the first click, asking the user to confirm',
        id: 'mw.chat.direct.confirmDelete'
    },
    ownerOnly: {
        defaultMessage: 'Only the group owner can rename the group or change who is in it.',
        description: 'Note in the group members panel for members who are not the owner',
        id: 'mw.chat.direct.ownerOnly'
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

const DirectAvatar = ({channel, me, size}) => {
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
    const others = groupMembers(channel).filter(member => userKey(member) !== userKey(me));
    if (others.length >= 2) {
        const small = Math.round(size * 0.68);
        return (
            <span
                className={styles.groupStack}
                style={{width: size, height: size}}
            >
                <UserPicture
                    rotur
                    size={small}
                    username={others[0]}
                />
                <UserPicture
                    rotur
                    size={small}
                    username={others[1]}
                />
            </span>
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
    me: PropTypes.string,
    size: PropTypes.number.isRequired
};

const splitNames = text => String(text || '')
    .split(/[\s,]+/)
    .map(name => name.replace(/^@/, ''))
    .filter(Boolean);

const NewGroupForm = ({connection, intl, onDone}) => {
    const [name, setName] = useState('');
    const [members, setMembers] = useState('');
    const list = splitNames(members);
    const nameLabel = intl.formatMessage(messages.groupName);
    const membersLabel = intl.formatMessage(messages.groupMembersField);
    return (
        <form
            className={styles.groupForm}
            onSubmit={event => {
                event.preventDefault();
                if (connection.createGroup(name, list)) onDone();
            }}
        >
            <label className={styles.accessField}>
                <Users size={15} />
                <input
                    type="text"
                    value={name}
                    maxLength={100}
                    placeholder={nameLabel}
                    aria-label={nameLabel}
                    autoComplete="off"
                    onChange={event => setName(event.target.value)}
                    onKeyDown={event => event.stopPropagation()}
                />
            </label>
            <label className={styles.accessField}>
                <UserRoundPlus size={15} />
                <input
                    type="text"
                    value={members}
                    placeholder={membersLabel}
                    aria-label={membersLabel}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={event => {
                        setMembers(event.target.value);
                        connection.clearNotice();
                    }}
                    onKeyDown={event => event.stopPropagation()}
                />
            </label>
            <div className={styles.groupFormActions}>
                <button
                    type="button"
                    className={styles.textButton}
                    onClick={onDone}
                >{intl.formatMessage(messages.cancel)}</button>
                <button
                    type="submit"
                    className={styles.cardButton}
                    disabled={!name.trim() || !list.length}
                >
                    <Users size={14} />
                    {intl.formatMessage(messages.createGroup)}
                </button>
            </div>
        </form>
    );
};

NewGroupForm.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onDone: PropTypes.func.isRequired
};

const useConfirm = () => {
    const [armed, setArmed] = useState(false);
    useEffect(() => {
        if (!armed) return;
        const timer = setTimeout(() => setArmed(false), 3000);
        return () => clearTimeout(timer);
    }, [armed]);
    return [armed, setArmed];
};

const GroupPanel = ({channel, connection, intl, onClose, state}) => {
    const me = state.me && state.me.username;
    const owner = channel.owner || '';
    const isOwner = userKey(owner) === userKey(me);
    const members = groupMembers(channel)
        .slice()
        .sort((a, b) => {
            if (userKey(a) === userKey(owner)) return -1;
            if (userKey(b) === userKey(owner)) return 1;
            return userKey(a).localeCompare(userKey(b));
        });
    const [title, setTitle] = useState(channelName(channel));
    const [adding, setAdding] = useState('');
    const [leaving, setLeaving] = useConfirm();
    const [deleting, setDeleting] = useConfirm();
    const nameLabel = intl.formatMessage(messages.groupName);
    const addLabel = intl.formatMessage(messages.newLabel);

    useEffect(() => setTitle(channelName(channel)), [channel.display_name]);

    return (
        <div className={classNames(styles.groupPanel, styles.fill)}>
            <div className={styles.groupPanelHead}>
                <DirectAvatar
                    channel={channel}
                    me={me}
                    size={40}
                />
                <h3 className={styles.groupPanelTitle}>{intl.formatMessage(messages.groupTitle)}</h3>
                <button
                    type="button"
                    className={styles.pendingRemove}
                    aria-label={intl.formatMessage(messages.cancel)}
                    title={intl.formatMessage(messages.cancel)}
                    onClick={onClose}
                >
                    <X size={12} />
                </button>
            </div>
            {isOwner ? (
                <form
                    className={styles.directNew}
                    onSubmit={event => {
                        event.preventDefault();
                        if (title.trim() && title.trim() !== channelName(channel)) {
                            connection.renameGroup(channel.name, title);
                        }
                    }}
                >
                    <label className={styles.accessField}>
                        <Pencil size={15} />
                        <input
                            type="text"
                            value={title}
                            maxLength={100}
                            placeholder={nameLabel}
                            aria-label={nameLabel}
                            autoComplete="off"
                            onChange={event => setTitle(event.target.value)}
                            onKeyDown={event => event.stopPropagation()}
                        />
                    </label>
                    <button
                        type="submit"
                        className={styles.cardButton}
                        disabled={!title.trim() || title.trim() === channelName(channel)}
                    >{intl.formatMessage(messages.rename)}</button>
                </form>
            ) : (
                <p className={styles.groupNote}>{intl.formatMessage(messages.ownerOnly)}</p>
            )}
            {state.notice && state.notice.text ? (
                <p
                    className={styles.notice}
                    role="alert"
                >{state.notice.text}</p>
            ) : null}
            <ul className={styles.memberList}>
                {members.map(member => {
                    const mine = userKey(member) === userKey(me);
                    const isGroupOwner = userKey(member) === userKey(owner);
                    return (
                        <li
                            key={member}
                            className={styles.memberItem}
                        >
                            <UserPicture
                                rotur
                                size={28}
                                username={member}
                            />
                            <span className={styles.directName}>
                                {mine ? intl.formatMessage(messages.you, {name: member}) : member}
                            </span>
                            {isGroupOwner ? (
                                <span className={styles.ownerBadge}>
                                    <Crown size={12} />
                                    {intl.formatMessage(messages.owner)}
                                </span>
                            ) : null}
                            {isOwner && !mine && !isGroupOwner ? (
                                <button
                                    type="button"
                                    className={styles.iconButton}
                                    title={intl.formatMessage(messages.remove, {name: member})}
                                    aria-label={intl.formatMessage(messages.remove, {name: member})}
                                    onClick={() => connection.removeGroupMember(channel.name, member)}
                                >
                                    <UserMinus size={15} />
                                </button>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
            {isOwner ? (
                <form
                    className={styles.directNew}
                    onSubmit={event => {
                        event.preventDefault();
                        if (connection.addGroupMember(channel.name, adding)) setAdding('');
                    }}
                >
                    <label className={styles.accessField}>
                        <UserRoundPlus size={15} />
                        <input
                            type="text"
                            value={adding}
                            placeholder={addLabel}
                            aria-label={addLabel}
                            autoComplete="off"
                            spellCheck={false}
                            onChange={event => {
                                setAdding(event.target.value);
                                connection.clearNotice();
                            }}
                            onKeyDown={event => event.stopPropagation()}
                        />
                    </label>
                    <button
                        type="submit"
                        className={styles.cardButton}
                        disabled={!adding.trim()}
                    >
                        <UserRoundPlus size={14} />
                        {intl.formatMessage(messages.addMember)}
                    </button>
                </form>
            ) : null}
            <div className={styles.groupDanger}>
                <button
                    type="button"
                    className={classNames(styles.dangerButton, {[styles.dangerArmed]: leaving})}
                    onClick={() => {
                        if (!leaving) {
                            setLeaving(true);
                            return;
                        }
                        connection.leaveConversation(channel.name);
                        onClose();
                    }}
                >
                    <LogOut size={14} />
                    {intl.formatMessage(leaving ? messages.confirmLeave : messages.leave)}
                </button>
                {isOwner ? (
                    <button
                        type="button"
                        className={classNames(styles.dangerButton, {[styles.dangerArmed]: deleting})}
                        onClick={() => {
                            if (!deleting) {
                                setDeleting(true);
                                return;
                            }
                            connection.deleteGroup(channel.name);
                            onClose();
                        }}
                    >
                        <Trash2 size={14} />
                        {intl.formatMessage(deleting ? messages.confirmDelete : messages.delete)}
                    </button>
                ) : null}
            </div>
        </div>
    );
};

GroupPanel.propTypes = {
    channel: PropTypes.object.isRequired,
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onClose: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

const DirectList = ({connection, intl, state}) => {
    const [name, setName] = useState('');
    const [grouping, setGrouping] = useState(false);
    const me = state.me && state.me.username;
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
                <button
                    type="button"
                    className={classNames(styles.iconButton, styles.newGroupButton)}
                    title={intl.formatMessage(messages.newGroup)}
                    aria-label={intl.formatMessage(messages.newGroup)}
                    aria-expanded={grouping}
                    onClick={() => setGrouping(value => !value)}
                >
                    <Users size={16} />
                </button>
            </form>
            {grouping ? (
                <NewGroupForm
                    connection={connection}
                    intl={intl}
                    onDone={() => setGrouping(false)}
                />
            ) : null}
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
                        const group = isGroupChannel(channel);
                        return (
                            <li key={channel.name}>
                                <button
                                    type="button"
                                    className={classNames(styles.directItem, {[styles.directUnread]: unread})}
                                    onClick={() => connection.selectChannel(channel.name)}
                                >
                                    <DirectAvatar
                                        channel={channel}
                                        me={me}
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

export {DirectAvatar, DirectList, GroupPanel};
