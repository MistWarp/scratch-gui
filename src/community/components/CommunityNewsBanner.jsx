import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {ArrowRight, Megaphone, X} from 'lucide-react';
import styles from './CommunityNewsBanner.module.css';

const DISMISS_KEY = 'mw:community-server-banner-dismissed';

const wasDismissed = () => {
    try {
        return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch (e) {
        return false;
    }
};

const CommunityNewsBanner = ({onJoin}) => {
    const {text: communityText} = useCommunityText();
    const [dismissed, setDismissed] = useState(wasDismissed);
    if (dismissed) {
        return null;
    }
    const dismiss = () => {
        setDismissed(true);
        try {
            localStorage.setItem(DISMISS_KEY, 'true');
        } catch (e) {
            return;
        }
    };
    return (
        <aside className={styles.banner}>
            <span className={styles.label}>
                <Megaphone size={14} />
                {communityText('New')}
            </span>
            <p className={styles.text}>
                {communityText('MistWarp now has a community server, bridged between OriginChats and Discord.')}
            </p>
            <button
                type="button"
                className={styles.join}
                onClick={onJoin}
            >
                {communityText('Join our community')}
                <ArrowRight size={14} />
            </button>
            <button
                type="button"
                className={styles.dismiss}
                aria-label={communityText('Dismiss')}
                onClick={dismiss}
            >
                <X size={15} />
            </button>
        </aside>
    );
};

CommunityNewsBanner.propTypes = {
    onJoin: PropTypes.func.isRequired
};

export default CommunityNewsBanner;
