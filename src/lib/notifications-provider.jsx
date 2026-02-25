import React from 'react';
import PropTypes from 'prop-types';
import Notifications from '../components/notifications/notifications.jsx';
import notificationManager from '../lib/notification-manager.js';

class NotificationsProvider extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            notifications: []
        };
        this.unsubscribe = null;
    }

    componentDidMount () {
        this.unsubscribe = notificationManager.subscribe(notifications => {
            this.setState({notifications});
        });
    }

    componentWillUnmount () {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    handleDismiss = id => {
        notificationManager.dismiss(id);
    };

    render () {
        return (
            <Notifications
                notifications={this.state.notifications}
                onDismiss={this.handleDismiss}
            />
        );
    }
}

NotificationsProvider.propTypes = {
    children: PropTypes.node
};

export default NotificationsProvider;
