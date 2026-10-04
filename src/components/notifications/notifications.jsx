import React from 'react';
import PropTypes from 'prop-types';
import Notification from '../../lib/notification-system.jsx';

const Notifications = ({notifications, onDismiss}) => (
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
                actions={notif.options && notif.options.actions}
                message={notif.message}
                type={notif.type}
                duration={notif.duration}
                onDismiss={onDismiss}
            />
        ))}
    </div>
);

Notifications.propTypes = {
    notifications: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
        type: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired,
        duration: PropTypes.number.isRequired,
        options: PropTypes.shape({
            actions: PropTypes.arrayOf(PropTypes.shape({
                label: PropTypes.string.isRequired,
                onClick: PropTypes.func.isRequired
            }))
        })
    })).isRequired,
    onDismiss: PropTypes.func.isRequired
};

export default Notifications;
