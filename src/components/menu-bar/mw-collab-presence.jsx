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
    waitingForHost: {
        id: 'mw.collabPresence.waitingForHost',
        defaultMessage: 'Waiting for host…',
        description: 'Menu bar collaboration status while the host has dropped out and may come back'
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
    },
    waitingToJoin: {
        id: 'mw.collabPresence.waitingToJoin',
        defaultMessage: '{count, plural, one {# person waiting to join} other {# people waiting to join}}',
        description: 'Menu bar badge tooltip: how many people are asking the host to join the live session'
    },
    labelWithWaiting: {
        id: 'mw.collabPresence.labelWithWaiting',
        defaultMessage: '{label}, {waiting}',
        description: 'Accessible label of the menu bar collaboration button while people wait to join. ' +
            '{label} is its usual label; {waiting} says how many people are waiting, e.g. "2 people waiting to join".'
    }
});

/**
 * How many people are waiting for this host to let them into the room.
 * Project sessions let people in through the collaborator list instead.
 * @returns {number} The count.
 */
const usePendingJoinRequestCount = () => {
    const [, refresh] = React.useReducer(count => count + 1, 0);
    React.useEffect(() => {
        const service = CollaborationService.getInstance();
        if (!service || typeof service.on !== 'function') return;
        // Approving and denying also update the user list, which re-renders this.
        const events = ['join-request-received', 'join-request-cancelled', 'users-updated'];
        events.forEach(event => service.on(event, refresh));
        return () => events.forEach(event => service.off(event, refresh));
    }, []);
    const service = CollaborationService.getInstance();
    if (!service || service.scope || typeof service.getPendingJoinRequests !== 'function') return 0;
    return service.getPendingJoinRequests().length;
};

const initialFor = username => (username || '?').replace(/^@/, '').charAt(0)
    .toUpperCase();

const CollabPresence = ({intl, isConnected, isReconnecting, reconnectReason, users, onOpen, projectPresence}) => {
    const waitingCount = usePendingJoinRequestCount();
    const waiting = isConnected && waitingCount > 0 ?
        intl.formatMessage(messages.waitingToJoin, {count: waitingCount}) : null;
    const withWaiting = label => (waiting ? intl.formatMessage(messages.labelWithWaiting, {label, waiting}) : label);
    const badge = waiting && (
        <span
            className={styles.requestBadge}
            title={waiting}
            aria-hidden="true"
        >{waitingCount}</span>
    );
    const phase = projectPresence?.phase;
    const reconnectMessage = reconnectReason === 'ROOM_NOT_FOUND' ? messages.waitingForHost : messages.reconnecting;
    let progress = null;
    if (phase === 'reconnecting') progress = intl.formatMessage(reconnectMessage);
    else if (['opening', 'joining', 'leaving'].includes(phase)) progress = intl.formatMessage(messages[phase]);
    // Room sessions report reconnects through the store, not projectPresence.
    if (!progress && isConnected && isReconnecting) progress = intl.formatMessage(reconnectMessage);
    if (progress || !isConnected || users.length < 2) {
        const editors = projectPresence?.editors || [];
        if (!progress && !isConnected && !editors.length && !projectPresence?.isPublic &&
            !projectPresence?.unavailable) return null;
        let label = progress;
        if (!label && isConnected) {
            // In a live session but nobody else is here yet.
            label = intl.formatMessage(messages.sessionOpen);
        } else if (!label) {
            label = projectPresence?.unavailable ? intl.formatMessage(messages.unavailable) :
                projectPresence?.isPublic ? intl.formatMessage(
                    projectPresence.hosting ? messages.sessionOpen : messages.sessionAvailable
                ) :
                    intl.formatMessage(messages.editorsOnBranch, {count: editors.length});
        }
        return (<button
            type="button"
            className={classNames(styles.presence, {[styles.busy]: Boolean(progress)})}
            onClick={onOpen}
            aria-label={waiting ? withWaiting(label) : null}
            title={editors.map(editor => editor.username).join(', ') || null}
        >{label}{badge}</button>);
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
            aria-label={withWaiting(intl.formatMessage(messages.showCollaborators))}
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
            {badge}
        </button>
    );
};

CollabPresence.propTypes = {
    intl: intlShape.isRequired,
    projectPresence: PropTypes.object,
    isConnected: PropTypes.bool,
    isReconnecting: PropTypes.bool,
    reconnectReason: PropTypes.string,
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
    isReconnecting: state.scratchGui.collaboration.isReconnecting,
    reconnectReason: state.scratchGui.collaboration.reconnectReason,
    users: state.scratchGui.collaboration.connectedUsers
});

const mapDispatchToProps = dispatch => ({
    onOpen: () => dispatch(openCollaborationModal())
});

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(CollabPresence));
