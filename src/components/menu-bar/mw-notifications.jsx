import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {Bell} from 'lucide-react';

import MenuLabel from './tw-menu-label.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import menuBarStyles from './menu-bar.css';
import styles from './mw-notifications.css';
import CommunityScope from '../../lib/mw/community-scope.jsx';
import NotificationsPage from '../../community/pages/Notifications.jsx';
import api from '../../community/api.js';

const MwNotifications = ({isRtl, username}) => {
    const [open, setOpen] = React.useState(false);
    const [unread, setUnread] = React.useState(0);

    const openMenu = React.useCallback(() => setOpen(true), []);
    const closeMenu = React.useCallback(() => setOpen(false), []);

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

    return (
        <MenuLabel
            open={open}
            onOpen={openMenu}
            onClose={closeMenu}
        >
            <span className={styles.bellWrap}>
                <Bell size={18} />
                {unread > 0 ? (
                    <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>
                ) : null}
            </span>
            <MenuBarMenu
                className={menuBarStyles.menuBarMenu}
                open={open}
                place={isRtl ? 'right' : 'left'}
            >
                <div className={styles.popout}>
                    {open ? (
                        <CommunityScope
                            initialPath="/notifications"
                            linksInNewTab
                        >
                            <NotificationsPage />
                        </CommunityScope>
                    ) : null}
                </div>
            </MenuBarMenu>
        </MenuLabel>
    );
};

MwNotifications.propTypes = {
    isRtl: PropTypes.bool,
    username: PropTypes.string
};

export default connect(state => ({
    isRtl: state.locales.isRtl,
    username: state.scratchGui.rotur.username
}))(MwNotifications);
