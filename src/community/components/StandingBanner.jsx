import React from 'react';
import {Link} from 'react-router-dom';
import {ShieldAlert} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import styles from './StandingBanner.module.css';

const MESSAGES = {
    warning: 'Your account has a warning. Please review the community guidelines.',
    suspended: 'Your account is suspended. You cannot share projects or comment right now.'
};

const StandingBanner = () => {
    const {user} = useUser();
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
            <Link
                to="/notifications"
                className={styles.link}
            >See details</Link>
        </div>
    );
};

export default StandingBanner;
