import React from 'react';
import {Link} from 'react-router-dom';
import {ShieldAlert, ExternalLink} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import styles from './StandingBanner.module.css';

const MESSAGES = {
    warning: 'Your account has a warning. Please review the community guidelines.',
    suspended: 'Your account is suspended. You cannot share projects or comment right now.'
};

const StandingBanner = () => {
    const {user, banMessage, dismissBan, signInError, dismissSignInError} = useUser();
    if (banMessage) {
        return (
            <div className={styles.banner}>
                <ShieldAlert
                    className={styles.icon}
                    size={16}
                />
                <span className={styles.text}>{banMessage}</span>
                <a
                    href="https://rotur.dev/me"
                    target="_blank"
                    rel="noreferrer"
                    className={styles.link}
                    style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}
                >
                    View on rotur.dev <ExternalLink size={12} />
                </a>
                <button
                    type="button"
                    className={styles.link}
                    onClick={dismissBan}
                >Dismiss</button>
            </div>
        );
    }
    if (signInError) {
        return (
            <div className={styles.banner}>
                <ShieldAlert className={styles.icon} size={16} />
                <span className={styles.text}>{signInError}</span>
                <a
                    href="https://rotur.dev/me"
                    target="_blank"
                    rel="noreferrer"
                    className={styles.link}
                    style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}
                >
                    View on rotur.dev <ExternalLink size={12} />
                </a>
                <button type="button" className={styles.link} onClick={dismissSignInError}>Dismiss</button>
            </div>
        );
    }
    if (!user || !user.standing || user.standing === 'good') {
        return null;
    }
    const message = MESSAGES[user.standing];
    if (!message) {
        return null;
    }
    return (
        <div className={styles.banner}>
            <ShieldAlert
                className={styles.icon}
                size={16}
            />
            <span className={styles.text}>{message}</span>
            <a
                href="https://rotur.dev/me"
                target="_blank"
                rel="noreferrer"
                className={styles.link}
                style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}
            >
                View on rotur.dev <ExternalLink size={12} />
            </a>
            <Link
                to="/notifications"
                className={styles.link}
            >See details</Link>
        </div>
    );
};

export default StandingBanner;
