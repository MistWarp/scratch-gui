import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {Users} from 'lucide-react';

import menuBarStyles from './menu-bar.css';
import styles from './mw-friends-button.css';
import {getFriendsService} from '../../lib/rotur/friends.js';
import {openCollaborationModal} from '../../reducers/collaboration.js';

const messages = defineMessages({
    friends: {
        defaultMessage: 'Friends',
        description: 'Menu bar button that opens the friends section of the collaboration window',
        id: 'mw.friendsButton.title'
    },
    friendsOnline: {
        defaultMessage: 'Friends ({count} online)',
        description: 'Accessible label of the menu bar friends button when friends are online',
        id: 'mw.friendsButton.online'
    }
});

const MwFriendsButton = ({intl, username, onOpen}) => {
    const [online, setOnline] = React.useState(() => getFriendsService().getSnapshot().onlineCount || 0);

    React.useEffect(() => {
        const friends = getFriendsService();
        setOnline(friends.getSnapshot().onlineCount || 0);
        return friends.subscribe(snapshot => setOnline(snapshot.status === 'ready' ? snapshot.onlineCount : 0));
    }, []);

    if (!username) return null;

    const label = online > 0 ?
        intl.formatMessage(messages.friendsOnline, {count: online}) :
        intl.formatMessage(messages.friends);
    return (
        <button
            aria-label={label}
            className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable, menuBarStyles.navButton)}
            title={label}
            type="button"
            onClick={onOpen}
        >
            <span className={styles.wrap}>
                <Users size={18} />
                {online > 0 ? (
                    <span className={styles.badge}>{online > 9 ? '9+' : online}</span>
                ) : null}
            </span>
        </button>
    );
};

MwFriendsButton.propTypes = {
    intl: intlShape.isRequired,
    onOpen: PropTypes.func.isRequired,
    username: PropTypes.string
};

export default injectIntl(connect(
    state => ({username: state.scratchGui.rotur.username}),
    dispatch => ({onOpen: () => dispatch(openCollaborationModal())})
)(MwFriendsButton));
