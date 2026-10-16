/* eslint-disable max-len */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {getCommunityLocale} from '../locale.js';
import styles from './PlayerChat.module.css';

export const PLAYER_CONTACT_TERMS_VERSION = 1;

export const formatServiceNames = (services, communityText) => {
    const names = [...new Set((services || []).map(service => service.name || communityText('a custom extension')))];
    if (!names.length) return '';
    try {
        return new Intl.ListFormat(getCommunityLocale(), {type: 'conjunction'}).format(names);
    } catch (e) {
        return names.join(', ');
    }
};

export const ChatContact = ({contact}) => {
    const value = (contact || '').trim();
    if (/^https:\/\/\S+$/i.test(value)) {
        return <a href={value} target="_blank" rel="noreferrer nofollow ugc">{value}</a>;
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return <a href={`mailto:${value}`}>{value}</a>;
    }
    return <span>{value}</span>;
};

ChatContact.propTypes = {
    contact: PropTypes.string
};

export const PlayerChatRules = ({className}) => {
    const {text: communityText} = useCommunityText();
    return (
        <ul className={classNames(styles.rules, className)}>
            <li>{communityText('Filter or block messages that break the community rules, such as harassment, hate, sexual content and spam.')}</li>
            <li>{communityText('Let players report and block each other inside the project, and act on reports about your chat within 48 hours.')}</li>
            <li>{communityText('Keep chat in rooms other players can see, and never pair strangers up in private conversations.')}</li>
            <li>{communityText('Don\'t ask players for personal information such as real names, ages, addresses or photos, and don\'t send them to other apps to keep talking.')}</li>
            <li>{communityText('Send anything that suggests a child is at risk, or a threat to someone\'s life, to MistWarp straight away with Report chat on the project page. Don\'t investigate it yourself.')}</li>
            <li>{communityText('Keep your chat contact working and answer MistWarp moderators when they ask about your chat.')}</li>
            <li>{communityText('MistWarp can hide the project or limit your account if its chat causes harm or these rules aren\'t followed.')}</li>
        </ul>
    );
};

PlayerChatRules.propTypes = {
    className: PropTypes.string
};
