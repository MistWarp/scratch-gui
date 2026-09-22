import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {Check, ChevronDown, ChevronRight, Hand, Loader2, LogIn, Send, UserPlus, Users, X} from 'lucide-react';

import Avatar from '../mw-avatar/avatar.jsx';
import Button from '../button/button.jsx';
import ValueButton from './value-button.jsx';
import styles from './friends-panel.css';

const messages = defineMessages({
    addPlaceholder: {
        defaultMessage: 'Rotur username',
        description: 'Placeholder of the field used to send a Rotur friend request',
        id: 'mw.friends.addPlaceholder'
    },
    addLabel: {
        defaultMessage: 'Add a friend by username',
        description: 'Accessible label of the field used to send a Rotur friend request',
        id: 'mw.friends.addLabel'
    },
    visibleLabel: {
        defaultMessage: 'Let friends see when I am here and invite me',
        description: 'Switch that controls whether friends can see you online in the editor and invite you',
        id: 'mw.friends.visibleLabel'
    },
    online: {
        defaultMessage: 'Online',
        description: 'Presence label for a friend who is online in the editor',
        id: 'mw.friends.online'
    },
    idle: {
        defaultMessage: 'Away',
        description: 'Presence label for a friend who is idle in the editor',
        id: 'mw.friends.idle'
    },
    dnd: {
        defaultMessage: 'Do not disturb',
        description: 'Presence label for a friend who does not want to be disturbed',
        id: 'mw.friends.dnd'
    }
});

const PRESENCE_DOTS = {
    online: styles.dotOnline,
    idle: styles.dotIdle,
    dnd: styles.dotDnd
};

const PRESENCE_MESSAGES = {
    online: messages.online,
    idle: messages.idle,
    dnd: messages.dnd
};

const InviteButton = ({friend, invite, ask, canInvite, canAsk, inSession, onInvite, onAsk}) => {
    const status = invite && invite.status;
    if (inSession) {
        return (
            <span className={classNames(styles.state, styles.stateGood)}>
                <Check
                    aria-hidden="true"
                    size={14}
                />
                <FormattedMessage
                    defaultMessage="In this session"
                    description="Shown next to a friend who is already in your live editing session"
                    id="mw.friends.inSession"
                />
            </span>
        );
    }
    if (status === 'sending' || status === 'sent') {
        return (
            <span className={styles.state}>
                <Loader2
                    aria-hidden="true"
                    className={styles.spin}
                    size={14}
                />
                <FormattedMessage
                    defaultMessage="Invited"
                    description="Shown next to a friend after sending them a collaboration invite"
                    id="mw.friends.invited"
                />
            </span>
        );
    }
    if (status === 'accepted') {
        return (
            <span className={classNames(styles.state, styles.stateGood)}>
                <Check
                    aria-hidden="true"
                    size={14}
                />
                <FormattedMessage
                    defaultMessage="Joining"
                    description="Shown next to a friend who accepted a collaboration invite"
                    id="mw.friends.joining"
                />
            </span>
        );
    }
    if (ask && ask.status === 'sent') {
        return (
            <span className={styles.state}>
                <Loader2
                    aria-hidden="true"
                    className={styles.spin}
                    size={14}
                />
                <FormattedMessage
                    defaultMessage="Asked"
                    description="Shown next to a friend after asking to join them"
                    id="mw.friends.asked"
                />
            </span>
        );
    }
    return (
        <span className={styles.actions}>
            {canAsk ? (
                <ValueButton
                    iconElem={Hand}
                    size="small"
                    value={friend.username}
                    variant="secondary"
                    onPress={onAsk}
                >
                    <FormattedMessage
                        defaultMessage="Ask to join"
                        description="Button that asks an online friend to invite you to their editing session"
                        id="mw.friends.ask"
                    />
                </ValueButton>
            ) : null}
            <ValueButton
                disabled={!canInvite}
                iconElem={Send}
                size="small"
                value={friend.username}
                variant="primary"
                onPress={onInvite}
            >
                <FormattedMessage
                    defaultMessage="Invite"
                    description="Button that invites an online friend to edit this project together"
                    id="mw.friends.invite"
                />
            </ValueButton>
        </span>
    );
};

InviteButton.propTypes = {
    ask: PropTypes.shape({status: PropTypes.string}),
    canAsk: PropTypes.bool,
    canInvite: PropTypes.bool,
    friend: PropTypes.shape({username: PropTypes.string.isRequired}).isRequired,
    inSession: PropTypes.bool,
    invite: PropTypes.shape({status: PropTypes.string}),
    onAsk: PropTypes.func.isRequired,
    onInvite: PropTypes.func.isRequired
};

const inviteNote = (invite, ask) => {
    if (invite && invite.status === 'declined') {
        return (
            <FormattedMessage
                defaultMessage="Declined your invite."
                description="Note under a friend who declined a collaboration invite"
                id="mw.friends.declined"
            />
        );
    }
    if (invite && invite.status === 'unreachable') {
        return (
            <FormattedMessage
                defaultMessage="The invite did not arrive. They may have just left."
                description="Note under a friend when a collaboration invite could not be delivered"
                id="mw.friends.unreachable"
            />
        );
    }
    if (invite && invite.status === 'expired') {
        return (
            <FormattedMessage
                defaultMessage="No answer yet. You can invite them again."
                description="Note under a friend when a collaboration invite expired without an answer"
                id="mw.friends.expired"
            />
        );
    }
    if (ask && ask.status === 'declined') {
        return (
            <FormattedMessage
                defaultMessage="Not right now."
                description="Note under a friend who declined a request to join them"
                id="mw.friends.askDeclined"
            />
        );
    }
    return null;
};

class FriendsPanel extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            showOffline: false,
            addName: '',
            addBusy: false,
            addResult: null
        };
        this.handleAddChange = this.handleAddChange.bind(this);
        this.handleAddSubmit = this.handleAddSubmit.bind(this);
        this.handleToggleOffline = this.handleToggleOffline.bind(this);
        this.handleToggleVisible = this.handleToggleVisible.bind(this);
    }

    handleAddChange (event) {
        this.setState({addName: event.target.value, addResult: null});
    }

    async handleAddSubmit (event) {
        event.preventDefault();
        const name = this.state.addName.trim().replace(/^@/, '');
        if (!name || this.state.addBusy) return;
        this.setState({addBusy: true, addResult: null});
        try {
            await this.props.onAddFriend(name);
            this.setState({addBusy: false, addName: '', addResult: {ok: true, name}});
        } catch (error) {
            this.setState({addBusy: false, addResult: {ok: false, message: error.message}});
        }
    }

    handleToggleOffline () {
        this.setState(state => ({showOffline: !state.showOffline}));
    }

    handleToggleVisible () {
        this.props.onSetVisible(!this.props.snapshot.visible);
    }

    renderHeading (count) {
        return (
            <h3 className={styles.heading}>
                <Users
                    aria-hidden="true"
                    size={18}
                />
                <FormattedMessage
                    defaultMessage="Friends"
                    description="Heading of the friends section in the collaboration window"
                    id="mw.friends.heading"
                />
                {typeof count === 'number' && count > 0 ? (
                    <span className={styles.count}>
                        <FormattedMessage
                            defaultMessage="{count} online"
                            description="Number of friends online in the editor"
                            id="mw.friends.onlineCount"
                            values={{count}}
                        />
                    </span>
                ) : null}
            </h3>
        );
    }

    renderGate () {
        const {snapshot} = this.props;
        if (snapshot.status === 'signed-out') {
            return (
                <div className={styles.gate}>
                    <p className={styles.gateText}>
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="Sign in with Rotur to see which friends are online and invite them to edit with you."
                            description="Shown in the friends section when signed out"
                            id="mw.friends.signedOut"
                        />
                    </p>
                    <Button
                        iconElem={LogIn}
                        variant="primary"
                        onClick={this.props.onSignIn}
                    >
                        <FormattedMessage
                            defaultMessage="Sign in"
                            description="Button in the friends section that opens Rotur sign-in"
                            id="mw.friends.signIn"
                        />
                    </Button>
                </div>
            );
        }
        if (snapshot.status === 'needs-consent' || snapshot.status === 'connecting') {
            const connecting = snapshot.status === 'connecting';
            return (
                <div className={styles.gate}>
                    <p className={styles.gateText}>
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="Let MistWarp read your Rotur friends list to show who is online and send them invites. Rotur asks you to confirm once."
                            description="Explains why MistWarp needs permission to read the Rotur friends list"
                            id="mw.friends.consent"
                        />
                    </p>
                    {snapshot.error ? <p className={styles.error}>{snapshot.error}</p> : null}
                    <Button
                        disabled={connecting}
                        iconElem={connecting ? null : Users}
                        variant="primary"
                        onClick={this.props.onConnect}
                    >
                        {connecting ? (
                            <FormattedMessage
                                defaultMessage="Waiting for Rotur..."
                                description="Button label while Rotur confirms access to the friends list"
                                id="mw.friends.connecting"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Show my friends"
                                description="Button that asks Rotur for access to the friends list"
                                id="mw.friends.connect"
                            />
                        )}
                    </Button>
                </div>
            );
        }
        if (snapshot.status === 'checking') {
            return (
                <p className={styles.muted}>
                    <Loader2
                        aria-hidden="true"
                        className={styles.spin}
                        size={14}
                    />
                    <FormattedMessage
                        defaultMessage="Loading friends..."
                        description="Shown while the friends list loads"
                        id="mw.friends.loading"
                    />
                </p>
            );
        }
        if (snapshot.status === 'error') {
            return (
                <div className={styles.gate}>
                    <p className={styles.error}>{snapshot.error}</p>
                    <Button
                        variant="secondary"
                        onClick={this.props.onRetry}
                    >
                        <FormattedMessage
                            defaultMessage="Try again"
                            description="Retry button when the friends list fails to load"
                            id="mw.friends.retry"
                        />
                    </Button>
                </div>
            );
        }
        return null;
    }

    renderFriend (friend) {
        const {intl, invites, asks, canInvite, canAsk} = this.props;
        const key = friend.username.toLowerCase();
        const invite = invites[key];
        const ask = asks[key];
        const note = inviteNote(invite, ask);
        const presence = PRESENCE_MESSAGES[friend.presence] || messages.online;
        const collaborating = Boolean(friend.activity && friend.activity.collaborating);
        return (
            <li
                className={styles.friend}
                key={friend.username}
            >
                <span className={styles.avatarWrap}>
                    <Avatar
                        size={32}
                        username={friend.username}
                    />
                    <span
                        className={classNames(styles.dot, PRESENCE_DOTS[friend.presence] || styles.dotOnline)}
                        title={intl.formatMessage(presence)}
                    />
                </span>
                <span className={styles.friendText}>
                    <span className={styles.friendName}>
                        {friend.username}
                        {collaborating ? (
                            <span className={styles.live}>
                                <FormattedMessage
                                    defaultMessage="Live"
                                    description="Label next to a friend who is in a live editing session"
                                    id="mw.friends.live"
                                />
                            </span>
                        ) : null}
                    </span>
                    <span className={styles.friendStatus}>
                        {note || (friend.activity && friend.activity.status) || intl.formatMessage(presence)}
                    </span>
                </span>
                <InviteButton
                    ask={ask}
                    canAsk={canAsk && collaborating}
                    canInvite={canInvite}
                    friend={friend}
                    inSession={this.props.sessionMembers.includes(key)}
                    invite={invite}
                    onAsk={this.props.onAsk}
                    onInvite={this.props.onInvite}
                />
            </li>
        );
    }

    renderRequests () {
        const {requests} = this.props.snapshot;
        if (!requests.length) return null;
        return (
            <ul className={styles.list}>
                {requests.map(name => (
                    <li
                        className={styles.friend}
                        key={name}
                    >
                        <Avatar
                            size={32}
                            username={name}
                        />
                        <span className={styles.friendText}>
                            <span className={styles.friendName}>{name}</span>
                            <span className={styles.friendStatus}>
                                <FormattedMessage
                                    defaultMessage="Wants to be your friend"
                                    description="Shown under a pending Rotur friend request"
                                    id="mw.friends.requestNote"
                                />
                            </span>
                        </span>
                        <span className={styles.actions}>
                            <ValueButton
                                iconElem={X}
                                size="small"
                                value={name}
                                variant="secondary"
                                onPress={this.props.onDeclineRequest}
                            >
                                <FormattedMessage
                                    defaultMessage="Decline"
                                    description="Button that declines a Rotur friend request"
                                    id="mw.friends.declineRequest"
                                />
                            </ValueButton>
                            <ValueButton
                                iconElem={Check}
                                size="small"
                                value={name}
                                variant="primary"
                                onPress={this.props.onAcceptRequest}
                            >
                                <FormattedMessage
                                    defaultMessage="Accept"
                                    description="Button that accepts a Rotur friend request"
                                    id="mw.friends.acceptRequest"
                                />
                            </ValueButton>
                        </span>
                    </li>
                ))}
            </ul>
        );
    }

    renderAddFriend () {
        const {addName, addBusy, addResult} = this.state;
        const {intl} = this.props;
        return (
            <form
                className={styles.addForm}
                onSubmit={this.handleAddSubmit}
            >
                <input
                    aria-label={intl.formatMessage(messages.addLabel)}
                    className={styles.addInput}
                    placeholder={intl.formatMessage(messages.addPlaceholder)}
                    value={addName}
                    onChange={this.handleAddChange}
                />
                <Button
                    disabled={addBusy || !addName.trim()}
                    iconElem={UserPlus}
                    size="small"
                    type="submit"
                    variant="secondary"
                >
                    <FormattedMessage
                        defaultMessage="Add friend"
                        description="Button that sends a Rotur friend request"
                        id="mw.friends.add"
                    />
                </Button>
                {addResult ? (
                    <p className={addResult.ok ? styles.addOk : styles.error}>
                        {addResult.ok ? (
                            <FormattedMessage
                                defaultMessage="Friend request sent to {name}."
                                description="Confirmation after sending a Rotur friend request"
                                id="mw.friends.addSent"
                                values={{name: addResult.name}}
                            />
                        ) : addResult.message}
                    </p>
                ) : null}
            </form>
        );
    }

    render () {
        const {snapshot, blockedReason, intl} = this.props;
        const ready = snapshot.status === 'ready';
        const online = snapshot.friends.filter(friend => friend.online);
        const offline = snapshot.friends.filter(friend => !friend.online);
        return (
            <section className={styles.panel}>
                {this.renderHeading(ready ? snapshot.onlineCount : null)}
                {ready ? (
                    <React.Fragment>
                        {this.renderRequests()}
                        {blockedReason ? <p className={styles.muted}>{blockedReason}</p> : null}
                        {online.length ? (
                            <ul className={styles.list}>
                                {online.map(friend => this.renderFriend(friend))}
                            </ul>
                        ) : (
                            <p className={styles.muted}>
                                {snapshot.friends.length ? (
                                    <FormattedMessage
                                        defaultMessage="None of your friends are in the editor right now."
                                        description="Shown when no friends are online in the editor"
                                        id="mw.friends.noneOnline"
                                    />
                                ) : (
                                    <FormattedMessage
                                        // eslint-disable-next-line max-len
                                        defaultMessage="Add friends on Rotur to see them here and invite them to your projects."
                                        description="Shown when the user has no Rotur friends yet"
                                        id="mw.friends.none"
                                    />
                                )}
                            </p>
                        )}
                        {offline.length ? (
                            <button
                                aria-expanded={this.state.showOffline}
                                className={styles.offlineToggle}
                                type="button"
                                onClick={this.handleToggleOffline}
                            >
                                {this.state.showOffline ?
                                    <ChevronDown size={14} /> :
                                    <ChevronRight size={14} />}
                                <FormattedMessage
                                    defaultMessage="{count} offline"
                                    description="Toggle that shows friends who are not in the editor"
                                    id="mw.friends.offlineCount"
                                    values={{count: offline.length}}
                                />
                            </button>
                        ) : null}
                        {this.state.showOffline && offline.length ? (
                            <ul className={classNames(styles.list, styles.offlineList)}>
                                {offline.map(friend => (
                                    <li
                                        className={styles.friend}
                                        key={friend.username}
                                    >
                                        <Avatar
                                            size={24}
                                            username={friend.username}
                                        />
                                        <span className={styles.friendName}>{friend.username}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                        {this.renderAddFriend()}
                        <button
                            aria-checked={snapshot.visible}
                            className={styles.visibleRow}
                            role="switch"
                            type="button"
                            onClick={this.handleToggleVisible}
                        >
                            <span>{intl.formatMessage(messages.visibleLabel)}</span>
                            <span className={classNames(styles.switch, {[styles.switchOn]: snapshot.visible})} />
                        </button>
                    </React.Fragment>
                ) : this.renderGate()}
            </section>
        );
    }
}

FriendsPanel.propTypes = {
    asks: PropTypes.objectOf(PropTypes.shape({status: PropTypes.string})).isRequired,
    blockedReason: PropTypes.node,
    canAsk: PropTypes.bool,
    canInvite: PropTypes.bool,
    intl: intlShape.isRequired,
    invites: PropTypes.objectOf(PropTypes.shape({status: PropTypes.string})).isRequired,
    sessionMembers: PropTypes.arrayOf(PropTypes.string).isRequired,
    snapshot: PropTypes.shape({
        status: PropTypes.string.isRequired,
        error: PropTypes.string,
        visible: PropTypes.bool,
        onlineCount: PropTypes.number,
        friends: PropTypes.arrayOf(PropTypes.shape({
            username: PropTypes.string.isRequired,
            online: PropTypes.bool,
            presence: PropTypes.string,
            activity: PropTypes.shape({status: PropTypes.string, collaborating: PropTypes.bool})
        })).isRequired,
        requests: PropTypes.arrayOf(PropTypes.string).isRequired
    }).isRequired,
    onAcceptRequest: PropTypes.func.isRequired,
    onAddFriend: PropTypes.func.isRequired,
    onAsk: PropTypes.func.isRequired,
    onConnect: PropTypes.func.isRequired,
    onDeclineRequest: PropTypes.func.isRequired,
    onInvite: PropTypes.func.isRequired,
    onRetry: PropTypes.func.isRequired,
    onSetVisible: PropTypes.func.isRequired,
    onSignIn: PropTypes.func.isRequired
};

export default injectIntl(FriendsPanel);
