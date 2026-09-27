/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {defineMessages, intlShape} from 'react-intl';

import Avatar from '../mw-avatar/avatar.jsx';
import {isRoturUser} from '../../lib/originchats/connection.js';
import styles from './chat-pane.css';

const messages = defineMessages({
    spoiler: {
        defaultMessage: 'Reveal spoiler',
        description: 'Accessible label for hidden spoiler text in a chat message',
        id: 'mw.chat.spoiler'
    }
});

const profileHref = username => `/users/${encodeURIComponent(username)}`;

const richContext = (state, message) => ({
    users: state.users,
    roles: state.roles,
    emojis: state.emojis,
    channels: state.channels,
    pinged: (message && message.pings && message.pings.users) || []
});

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

export {ProfileLink, RichText, UserPicture, profileHref, richContext};
