import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useState} from 'react';
import {Megaphone, X} from 'lucide-react';
import {track} from '../analytics.js';
import JoinCommunityModal from './JoinCommunityModal.jsx';
import styles from './AnnouncementBanner.module.css';

const DISMISS_KEY = 'mw:community-server-banner-dismissed';

const wasDismissed = () => {
    try {
        return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch (e) {
        return false;
    }
};

const AnnouncementBanner = () => {
    const {text: communityText} = useCommunityText();
    const [dismissed, setDismissed] = useState(wasDismissed);
    const [joinOpen, setJoinOpen] = useState(false);
    const dismiss = () => {
        setDismissed(true);
        try {
            localStorage.setItem(DISMISS_KEY, 'true');
        } catch (e) {
            return;
        }
    };
    const openJoin = () => {
        track('community_join_open');
        setJoinOpen(true);
    };
    return (
        <>
            {dismissed ? null : (
                <div className={styles.banner}>
                    <Megaphone
                        size={15}
                        className={styles.icon}
                    />
                    <span>
                        {communityText(
                            'MistWarp now has a community server, bridged between OriginChats and Discord.'
                        )}{' '}
                        <button
                            type="button"
                            className={styles.link}
                            onClick={openJoin}
                        >
                            {communityText('Join our community')}
                        </button>
                    </span>
                    <button
                        type="button"
                        className={styles.dismiss}
                        aria-label={communityText('Dismiss')}
                        onClick={dismiss}
                    >
                        <X size={15} />
                    </button>
                </div>
            )}
            {joinOpen ? <JoinCommunityModal onClose={() => setJoinOpen(false)} /> : null}
        </>
    );
};

export default AnnouncementBanner;
