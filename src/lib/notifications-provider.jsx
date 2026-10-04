import React from 'react';
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

export default NotificationsProvider;
