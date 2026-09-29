import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {Bell} from 'lucide-react';

import menuBarStyles from './menu-bar.css';
import styles from './mw-notifications.css';
import {fetchNotifications} from '../../lib/rotur/client.js';

const messages = defineMessages({
    notifications: {
        id: 'mw.notifications.label',
        defaultMessage: 'Notifications',
        description: 'Label of the notifications bell in the menu bar'
    },
    unread: {
        id: 'mw.notifications.unreadLabel',
        defaultMessage: 'Notifications ({count} unread)',
        description: 'Accessible label of the notifications bell when there are unread notifications'
    }
});

const MwNotifications = ({intl, username}) => {
    const [unread, setUnread] = React.useState(0);

    React.useEffect(() => {
        if (!username) {
            setUnread(0);
            return () => {};
        }
        let stale = false;
        fetchNotifications()
            .then(items => {
                if (!stale) {
                    setUnread(items.filter(n => !n.read).length);
                }
            })
            .catch(() => {});
        const onPush = () => setUnread(u => (u > 0 ? u + 1 : 1));
        const onRead = () => setUnread(0);
        const onRemoved = event => {
            if (event.detail && event.detail.read) {
                return;
            }
            setUnread(u => (u > 0 ? u - 1 : 0));
        };
        window.addEventListener('mw:notifications-read', onRead);
        window.addEventListener('mw:notifications-push', onPush);
        window.addEventListener('mw:notifications-removed', onRemoved);
        return () => {
            stale = true;
            window.removeEventListener('mw:notifications-read', onRead);
            window.removeEventListener('mw:notifications-push', onPush);
            window.removeEventListener('mw:notifications-removed', onRemoved);
        };
    }, [username]);

    if (!username) {
        return null;
    }

    return (
        <a
            className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable, styles.bellLink)}
            href="/notifications"
            title={intl.formatMessage(messages.notifications)}
            aria-label={unread > 0 ?
                intl.formatMessage(messages.unread, {count: unread}) :
                intl.formatMessage(messages.notifications)}
        >
            <span className={styles.bellWrap}>
                <Bell size={18} />
                {unread > 0 ? (
                    <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>
                ) : null}
            </span>
        </a>
    );
};

MwNotifications.propTypes = {
    intl: intlShape.isRequired,
    username: PropTypes.string
};

export default injectIntl(connect(state => ({
    username: state.scratchGui.rotur.username
}))(MwNotifications));
