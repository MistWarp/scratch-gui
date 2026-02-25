import React from 'react';
import PropTypes from 'prop-types';
import Notification from '../../lib/notification-system.jsx';

Notifications.propTypes = {
    notifications: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        message: PropTypes.string.isRequired,
        type: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired,
        duration: PropTypes.number.isRequired
    })).isRequired,
    onDismiss: PropTypes.func.isRequired
};

function Notifications ({notifications, onDismiss}) {
    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: '9000',
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '10px',
                pointerEvents: 'none'
            }}
        >
            {notifications.map(notif => (
                <Notification
                    key={notif.id}
                    id={notif.id}
                    message={notif.message}
                    type={notif.type}
                    duration={notif.duration}
                    onDismiss={onDismiss}
                />
            ))}
        </div>
    );
}

export default Notifications;
