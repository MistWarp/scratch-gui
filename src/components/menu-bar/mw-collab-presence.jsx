import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import {openCollaborationModal} from '../../reducers/collaboration';
import {avatarForCollabUser} from '../../lib/collaboration/avatar.js';
import CollaborationService from '../../lib/collaboration/index.js';

import styles from './mw-collab-presence.css';

const MAX_FACES = 4;

const messages = defineMessages({
    opening: {
        id: 'mw.collabPresence.opening',
        defaultMessage: 'Opening session…',
        description: 'Menu bar collaboration status while a live session is being opened'
    },
    joining: {
        id: 'mw.collabPresence.joining',
        defaultMessage: 'Joining session…',
        description: 'Menu bar collaboration status while joining a live session'
    },
    reconnecting: {
        id: 'mw.collabPresence.reconnecting',
        defaultMessage: 'Reconnecting…',
        description: 'Menu bar collaboration status while reconnecting to a live session'
    },
    leaving: {
        id: 'mw.collabPresence.leaving',
        defaultMessage: 'Leaving session…',
        description: 'Menu bar collaboration status while leaving a live session'
    },
    unavailable: {
        id: 'mw.collabPresence.unavailable',
        defaultMessage: 'Online status unavailable',
        description: 'Menu bar collaboration status when presence could not be loaded'
    },
    sessionOpen: {
        id: 'mw.collabPresence.sessionOpen',
        defaultMessage: 'Session open',
        description: 'Menu bar collaboration status when you are hosting a public live session'
    },
    sessionAvailable: {
        id: 'mw.collabPresence.sessionAvailable',
        defaultMessage: 'Live session available',
        description: 'Menu bar collaboration status when someone else hosts a live session you can join'
    },
    editorsOnBranch: {
        id: 'mw.collabPresence.editorsOnBranch',
        defaultMessage: '{count} on this branch',
        description: 'Menu bar collaboration status. {count} is how many people have this project branch open.'
    },
    showCollaborators: {
        id: 'mw.collabPresence.showCollaborators',
        defaultMessage: 'Show current collaborators',
        description: 'Accessible label for the collaborator avatars button in the menu bar'
    }
});

const initialFor = username => (username || '?').replace(/^@/, '').charAt(0)
    .toUpperCase();

const CollabPresence = ({intl, isConnected, users, onOpen, projectPresence}) => {
    const phase = projectPresence?.phase;
    const progress = ['opening', 'joining', 'reconnecting', 'leaving'].includes(phase) ?
        intl.formatMessage(messages[phase]) : null;
    if (progress || !isConnected || users.length < 2) {
        const editors = projectPresence?.editors || [];
        if (!progress && !editors.length && !projectPresence?.isPublic && !projectPresence?.unavailable) return null;
        return (<button
            type="button"
            className={styles.presence}
            onClick={onOpen}
            title={editors.map(editor => editor.username).join(', ')}
        >{progress || (projectPresence?.unavailable ? intl.formatMessage(messages.unavailable) :
                projectPresence?.isPublic ? intl.formatMessage(
                    projectPresence.hosting ? messages.sessionOpen : messages.sessionAvailable
                ) :
                    intl.formatMessage(messages.editorsOnBranch, {count: editors.length}))}</button>);
    }

    const currentUserId = CollaborationService.getInstance().getCurrentUserId();
    const me = users.find(user => user.id === currentUserId);
    const ordered = me ? [me, ...users.filter(user => user !== me)] : users;
    const faces = ordered.slice(0, MAX_FACES);
    const overflow = ordered.length - faces.length;

    return (
        <button
            type="button"
            className={styles.presence}
            onClick={onOpen}
            aria-label={intl.formatMessage(messages.showCollaborators)}
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
    intl: intlShape.isRequired,
    projectPresence: PropTypes.object,
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
    projectPresence: state.scratchGui.collaboration.projectPresence,
    isConnected: state.scratchGui.collaboration.isConnected,
    users: state.scratchGui.collaboration.connectedUsers
});

const mapDispatchToProps = dispatch => ({
    onOpen: () => dispatch(openCollaborationModal())
});

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(CollabPresence));
