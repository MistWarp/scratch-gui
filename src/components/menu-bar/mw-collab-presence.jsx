import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';

import {openCollaborationModal} from '../../reducers/collaboration';
import {avatarForCollabUser} from '../../lib/collaboration/avatar.js';
import CollaborationService from '../../lib/collaboration/index.js';

import styles from './mw-collab-presence.css';

const MAX_FACES = 4;

const initialFor = username => (username || '?').replace(/^@/, '').charAt(0)
    .toUpperCase();

const CollabPresence = ({isConnected, users, onOpen}) => {
    if (!isConnected || users.length < 2) return null;

    const currentUserId = CollaborationService.getInstance().getCurrentUserId();
    const me = users.find(user => user.id === currentUserId);
    const ordered = me ? [me, ...users.filter(user => user !== me)] : users;
    const faces = ordered.slice(0, MAX_FACES);
    const overflow = ordered.length - faces.length;

    return (
        <button
            className={styles.presence}
            onClick={onOpen}
            title={ordered.map(user => user.username).join(', ')}
        >
            <span className={styles.faces}>
                {faces.map(user => {
                    const avatarUrl = avatarForCollabUser(user);
                    return avatarUrl ? (
                        <img
                            key={user.id}
                            className={styles.face}
                            src={avatarUrl}
                            alt={user.username}
                            draggable={false}
                        />
                    ) : (
                        <span
                            key={user.id}
                            className={classNames(styles.face, styles.initial)}
                        >
                            {initialFor(user.username)}
                        </span>
                    );
                })}
                {overflow > 0 && (
                    <span className={classNames(styles.face, styles.initial)}>
                        {`+${overflow}`}
                    </span>
                )}
            </span>
        </button>
    );
};

CollabPresence.propTypes = {
    isConnected: PropTypes.bool,
    users: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        username: PropTypes.string,
        handle: PropTypes.string,
        isHost: PropTypes.bool
    })),
    onOpen: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    isConnected: state.scratchGui.collaboration.isConnected,
    users: state.scratchGui.collaboration.connectedUsers
});

const mapDispatchToProps = dispatch => ({
    onOpen: () => dispatch(openCollaborationModal())
});

export default connect(mapStateToProps, mapDispatchToProps)(CollabPresence);
