import React from 'react';
import PropTypes from 'prop-types';
import RichText from './RichText.jsx';
import styles from './UserStatus.module.css';

const EMPTY_STATUS = /[\s\u2800\u3164\uFFA0]/g;
const PRESENCE_LABELS = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do not disturb',
    offline: 'Offline'
};

export const userPresence = status => {
    const supplied = status && typeof status.presence === 'string' ? status.presence.toLowerCase() : '';
    const presence = Object.prototype.hasOwnProperty.call(PRESENCE_LABELS, supplied) ? supplied : 'offline';
    const custom = status && typeof status.status === 'string' ? status.status : '';
    return {
        presence,
        presenceLabel: PRESENCE_LABELS[presence],
        text: custom.replace(EMPTY_STATUS, '').length ? custom : PRESENCE_LABELS[presence]
    };
};

const UserStatus = ({status, className = ''}) => {
    if (!status) return null;
    const details = userPresence(status);
    return (
        <span className={`${styles.status} ${className}`.trim()}>
            <span
                className={`${styles.dot} ${styles[details.presence]}`}
                role="img"
                aria-label={details.presenceLabel}
            />
            <span className={styles.text}><RichText text={details.text} /></span>
        </span>
    );
};

UserStatus.propTypes = {
    status: PropTypes.shape({
        presence: PropTypes.string,
        status: PropTypes.string
    }),
    className: PropTypes.string
};

export default UserStatus;
