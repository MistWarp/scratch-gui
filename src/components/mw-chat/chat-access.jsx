/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {defineMessages, intlShape} from 'react-intl';
import {ExternalLink, Lock, LogIn, Ticket} from 'lucide-react';

import {CHAT_INVITE, DISCORD_INVITE} from '../../lib/originchats/connection.js';
import {formatCount} from './chat-actions.js';
import {ServerIcon} from './chat-embeds.jsx';
import styles from './chat-pane.css';

const messages = defineMessages({
    inviteTitle: {
        defaultMessage: 'You are invited to join {server}',
        description: 'Heading of the chat invite card shown before the user has joined the chat server',
        id: 'mw.chat.inviteTitle'
    },
    inviteBody: {
        // eslint-disable-next-line max-len
        defaultMessage: 'You are not a member of this server yet, so the editor has not connected to it. Joining adds your Rotur account {username} to its member list.',
        description: 'Explanation on the chat invite card shown before the user has joined the chat server',
        id: 'mw.chat.inviteBody'
    },
    inviteJoin: {
        defaultMessage: 'Join {server}',
        description: 'Button on the chat invite card that joins the chat server',
        id: 'mw.chat.inviteJoin'
    },
    inviteOnline: {
        defaultMessage: '{count} online',
        description: 'Online count on the chat invite card',
        id: 'mw.chat.inviteOnline'
    },
    inviteMembers: {
        defaultMessage: '{count} members',
        description: 'Member count on the chat invite card',
        id: 'mw.chat.inviteMembers'
    },
    inviteCode: {
        defaultMessage: 'Joining with invite code {code}.',
        description: 'Shown on the chat invite card when an invite link supplied a code',
        id: 'mw.chat.inviteCode'
    },
    openOriginChats: {
        defaultMessage: 'Open in OriginChats',
        description: 'Link that opens the MistWarp chat server in the OriginChats web client',
        id: 'mw.chat.openOriginChats'
    },
    discordLink: {
        defaultMessage: 'Join on Discord',
        description: 'Link to the bridged MistWarp Discord server',
        id: 'mw.chat.discordLink'
    },
    checking: {
        defaultMessage: 'Checking your membership…',
        description: 'Shown while the editor checks whether the user has joined the chat server',
        id: 'mw.chat.checking'
    },
    deniedInviteRequired: {
        defaultMessage: 'This server only lets people join with an invite code.',
        description: 'Shown when the chat server needs an invite code to join',
        id: 'mw.chat.deniedInviteRequired'
    },
    deniedInviteInvalid: {
        defaultMessage: 'That invite code is not valid.',
        description: 'Shown when the invite code for the chat server is wrong',
        id: 'mw.chat.deniedInviteInvalid'
    },
    deniedInviteExpired: {
        defaultMessage: 'That invite code has expired.',
        description: 'Shown when the invite code for the chat server has expired',
        id: 'mw.chat.deniedInviteExpired'
    },
    deniedPasswordRequired: {
        defaultMessage: 'This server needs a password to join.',
        description: 'Shown when the chat server needs a password',
        id: 'mw.chat.deniedPasswordRequired'
    },
    deniedPasswordIncorrect: {
        defaultMessage: 'That password is not correct.',
        description: 'Shown when the chat server password is wrong',
        id: 'mw.chat.deniedPasswordIncorrect'
    },
    deniedApplication: {
        defaultMessage: 'This server reviews new members. Apply to join in OriginChats.',
        description: 'Shown when the chat server needs an application to join',
        id: 'mw.chat.deniedApplication'
    },
    deniedApplicationPending: {
        defaultMessage: 'Your application to join is waiting for review.',
        description: 'Shown when the user already applied to join the chat server',
        id: 'mw.chat.deniedApplicationPending'
    },
    deniedWhitelist: {
        defaultMessage: 'Only approved members can join this server.',
        description: 'Shown when the chat server only accepts approved members',
        id: 'mw.chat.deniedWhitelist'
    },
    deniedBanned: {
        defaultMessage: 'You have been banned from this server.',
        description: 'Shown when the user is banned from the chat server',
        id: 'mw.chat.deniedBanned'
    },
    codeLabel: {
        defaultMessage: 'Invite code',
        description: 'Label for the invite code field when joining a chat server',
        id: 'mw.chat.codeLabel'
    },
    passwordLabel: {
        defaultMessage: 'Server password',
        description: 'Label for the password field when joining a chat server',
        id: 'mw.chat.passwordLabel'
    },
    tryJoin: {
        defaultMessage: 'Join',
        description: 'Button that retries joining the chat server with an invite code or password',
        id: 'mw.chat.tryJoin'
    }
});

const ServerStats = ({info, intl}) => {
    const stats = (info && info.stats) || {};
    const online = stats.online_users || stats.connected_users;
    if (!online && !stats.total_users) return null;
    return (
        <p className={styles.cardMeta}>
            {online ? (
                <span className={styles.cardStat}>
                    <span className={styles.dot} />
                    {intl.formatMessage(messages.inviteOnline, {count: formatCount(online)})}
                </span>
            ) : null}
            {stats.total_users ? (
                <span className={styles.cardStat}>
                    {intl.formatMessage(messages.inviteMembers, {count: formatCount(stats.total_users)})}
                </span>
            ) : null}
        </p>
    );
};

ServerStats.propTypes = {
    info: PropTypes.object,
    intl: intlShape.isRequired
};

const InviteCard = ({info, intl, inviteCode, onJoin, username}) => {
    const server = (info && info.server) || {};
    const name = server.name || 'MistWarp';
    return (
        <div className={classNames(styles.invite, styles.fill)}>
            {server.banner ? (
                <img
                    className={styles.inviteBanner}
                    src={server.banner}
                    alt=""
                    draggable={false}
                />
            ) : null}
            <ServerIcon
                icon={server.icon}
                name={name}
                size={56}
            />
            <h3 className={styles.inviteTitle}>{intl.formatMessage(messages.inviteTitle, {server: name})}</h3>
            {server.description ? <p className={styles.inviteDescription}>{server.description}</p> : null}
            <ServerStats
                info={info}
                intl={intl}
            />
            <p className={styles.inviteBody}>{intl.formatMessage(messages.inviteBody, {username})}</p>
            {inviteCode ? (
                <p className={styles.inviteBody}>{intl.formatMessage(messages.inviteCode, {code: inviteCode})}</p>
            ) : null}
            <button
                type="button"
                className={styles.primary}
                onClick={() => onJoin(inviteCode ? {invite: inviteCode} : {})}
            >
                <LogIn size={16} />
                {intl.formatMessage(messages.inviteJoin, {server: name})}
            </button>
            <div className={styles.chips}>
                <a
                    className={styles.chip}
                    href={CHAT_INVITE}
                    target="_blank"
                    rel="noreferrer"
                >
                    {intl.formatMessage(messages.openOriginChats)}
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
        </div>
    );
};

InviteCard.propTypes = {
    info: PropTypes.object,
    intl: intlShape.isRequired,
    inviteCode: PropTypes.string,
    onJoin: PropTypes.func.isRequired,
    username: PropTypes.string.isRequired
};

const DENIED_TEXT = {
    banned: messages.deniedBanned,
    invite_required: messages.deniedInviteRequired,
    invite_invalid: messages.deniedInviteInvalid,
    invite_expired: messages.deniedInviteExpired,
    password_required: messages.deniedPasswordRequired,
    password_incorrect: messages.deniedPasswordIncorrect,
    application_required: messages.deniedApplication,
    application_pending: messages.deniedApplicationPending,
    not_whitelisted: messages.deniedWhitelist
};

const DeniedCard = ({denied, info, intl, onJoin}) => {
    const [value, setValue] = useState('');
    const reason = denied.reason;
    const asksCode = reason.startsWith('invite_');
    const asksPassword = reason.startsWith('password_');
    const server = (info && info.server) || {};
    const text = DENIED_TEXT[reason] ? intl.formatMessage(DENIED_TEXT[reason]) : denied.text;
    const fieldLabel = intl.formatMessage(asksCode ? messages.codeLabel : messages.passwordLabel);
    return (
        <div className={classNames(styles.invite, styles.fill)}>
            <ServerIcon
                icon={server.icon}
                name={server.name}
                size={48}
            />
            <p className={styles.inviteTitle}>{text}</p>
            {asksCode || asksPassword ? (
                <form
                    className={styles.accessForm}
                    onSubmit={event => {
                        event.preventDefault();
                        if (!value.trim()) return;
                        onJoin(asksCode ? {invite: value.trim()} : {password: value});
                    }}
                >
                    <label className={styles.accessField}>
                        {asksCode ? <Ticket size={15} /> : <Lock size={15} />}
                        <input
                            type={asksPassword ? 'password' : 'text'}
                            value={value}
                            placeholder={fieldLabel}
                            aria-label={fieldLabel}
                            autoComplete="off"
                            onChange={event => setValue(event.target.value)}
                            onKeyDown={event => event.stopPropagation()}
                        />
                    </label>
                    <button
                        type="submit"
                        className={styles.primary}
                        disabled={!value.trim()}
                    >
                        <LogIn size={16} />
                        {intl.formatMessage(messages.tryJoin)}
                    </button>
                </form>
            ) : null}
            {reason === 'application_required' ? (
                <a
                    className={styles.chip}
                    href={CHAT_INVITE}
                    target="_blank"
                    rel="noreferrer"
                >
                    {intl.formatMessage(messages.openOriginChats)}
                    <ExternalLink size={11} />
                </a>
            ) : null}
        </div>
    );
};

DeniedCard.propTypes = {
    denied: PropTypes.shape({
        reason: PropTypes.string.isRequired,
        text: PropTypes.string
    }).isRequired,
    info: PropTypes.object,
    intl: intlShape.isRequired,
    onJoin: PropTypes.func.isRequired
};

const CheckingCard = ({intl}) => (
    <p className={classNames(styles.status, styles.fill)}>{intl.formatMessage(messages.checking)}</p>
);

CheckingCard.propTypes = {
    intl: intlShape.isRequired
};

export {CheckingCard, DeniedCard, InviteCard};
