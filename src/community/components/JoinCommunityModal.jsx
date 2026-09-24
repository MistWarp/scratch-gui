import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {ArrowUpRight, MessageCircle, Users} from 'lucide-react';
import {track} from '../analytics.js';
import {useCommunityIntl} from '../i18n.jsx';
import Modal from './ui/Modal.jsx';
import styles from './JoinCommunityModal.module.css';

const COMMUNITIES = [
    {
        key: 'originchats',
        name: 'OriginChats',
        href: 'https://chats.mistwarp.org/invite',
        recommended: true
    },
    {
        key: 'discord',
        name: 'Discord',
        href: 'https://discord.gg/neEMnJxYW8'
    }
];

const JoinCommunityModal = ({onClose}) => {
    const {text: communityText} = useCommunityIntl();
    const descriptions = {
        originchats: communityText("Chat with the community on MistWarp's own chat."),
        discord: communityText('Hang out with the community on our Discord server.')
    };
    return (
        <Modal
            icon={Users}
            title={communityText('Join our community')}
            onClose={onClose}
        >
            <p className={styles.lead}>{communityText('Where would you like to join?')}</p>
            <div className={styles.options}>
                {COMMUNITIES.map(community => (
                    <a
                        key={community.key}
                        className={classNames(styles.option, community.recommended && styles.recommended)}
                        href={community.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            track('community_join', {destination: community.key});
                            onClose();
                        }}
                    >
                        <span className={styles.optionIcon}><MessageCircle size={18} /></span>
                        <span className={styles.optionText}>
                            <span className={styles.optionTitle}>
                                <strong>{communityText('Join from {value1}', {value1: community.name})}</strong>
                                {community.recommended ? (
                                    <span className={styles.badge}>{communityText('Recommended')}</span>
                                ) : null}
                            </span>
                            <span>{descriptions[community.key]}</span>
                        </span>
                        <ArrowUpRight size={16} className={styles.optionArrow} />
                    </a>
                ))}
            </div>
        </Modal>
    );
};

JoinCommunityModal.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default JoinCommunityModal;
