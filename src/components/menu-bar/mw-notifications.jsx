import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {Bell} from 'lucide-react';

import menuBarStyles from './menu-bar.css';
import styles from './mw-notifications.css';
import openMistWarpCommunityWindow from '../../lib/mw/open-mw-community-window.jsx';
import NotificationsPage from '../../community/pages/Notifications.jsx';
import api from '../../community/api.js';

const openNotifications = () => openMistWarpCommunityWindow({
    id: 'mw-notifications-window',
    title: 'Notifications',
    initialPath: '/notifications',
    element: <NotificationsPage hideHeading />,
    width: 460,
    height: 640
});

const MwNotifications = ({username}) => {
    const [unread, setUnread] = React.useState(0);

    React.useEffect(() => {
        if (!username) {
            setUnread(0);
            return () => {};
        }
        let stale = false;
        api.notifications()
            .then(data => {
                if (!stale) {
                    setUnread((data.notifications || []).filter(n => !n.read).length);
                }
            })
            .catch(() => {});
        const onRead = () => setUnread(0);
        window.addEventListener('mw:notifications-read', onRead);
        return () => {
            stale = true;
            window.removeEventListener('mw:notifications-read', onRead);
        };
    }, [username]);

    if (!username) {
        return null;
    }

    const handleKeyDown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openNotifications();
        }
    };

    return (
        <div
            className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
            title="Notifications"
            aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
            role="button"
            tabIndex={0}
            onClick={openNotifications}
            onKeyDown={handleKeyDown}
        >
            <span className={styles.bellWrap}>
                <Bell size={18} />
                {unread > 0 ? (
                    <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>
                ) : null}
            </span>
        </div>
    );
};

MwNotifications.propTypes = {
    username: PropTypes.string
};

export default connect(state => ({
    username: state.scratchGui.rotur.username
}))(MwNotifications);
