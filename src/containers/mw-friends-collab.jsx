import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import FriendsPanel from '../components/mw-friends-panel/friends-panel.jsx';
import InviteCards from '../components/mw-friends-panel/invite-cards.jsx';
import NotificationSystem from '../lib/notification-manager.js';
import {getFriendsService} from '../lib/rotur/friends.js';
import {
    ASK,
    ASK_REPLY,
    HANDLED,
    INVITE,
    INVITE_CANCEL,
    INVITE_REPLY,
    INVITE_TTL,
    makeAsk,
    makeCancel,
    makeHandled,
    makeInvite,
    makeReply,
    randomHex,
    readAsk,
    readInvite,
    readReply
} from '../lib/collaboration/friend-invites.js';
import {openRoturLoginModal, openSimpleDialog} from '../reducers/modals.js';
import {setProjectUnchanged} from '../reducers/project-changed.js';
import smartSave from '../lib/mw/smart-save.js';

const NOTE_LIFETIME = 30 * 1000;
const MAX_INCOMING = 4;

const messages = defineMessages({
    guestBlocked: {
        defaultMessage: 'Only the host can invite people to this session.',
        description: 'Shown in the friends section when a guest in a live session tries to invite friends',
        id: 'mw.friends.guestBlocked'
    },
    inviteFailed: {
        defaultMessage: 'Could not start a live session for your invite.',
        description: 'Toast when a live session could not be started for a friend invite',
        id: 'mw.friends.inviteFailed'
    },
    joinFailed: {
        defaultMessage: 'Could not join {name}. The session may have ended.',
        description: 'Toast when joining a friend from an invite fails',
        id: 'mw.friends.joinFailed'
    },
    joined: {
        defaultMessage: '{name} joined your session.',
        description: 'Toast when a friend accepts your collaboration invite',
        id: 'mw.friends.joinedToast'
    },
    declinedToast: {
        defaultMessage: '{name} declined your invite.',
        description: 'Toast when a friend declines your collaboration invite',
        id: 'mw.friends.declinedToast'
    },
    joinTitle: {
        defaultMessage: 'Join {name}?',
        description: 'Title of the dialog shown before joining a friend from an invite',
        id: 'mw.friends.joinTitle'
    },
    joinReplaces: {
        defaultMessage: 'Your editor switches to the project {name} is working on while you edit together.',
        description: 'Dialog text explaining that joining a friend replaces the project in your editor',
        id: 'mw.friends.joinReplaces'
    },
    joinLeaves: {
        defaultMessage: 'You will leave your current live session.',
        description: 'Dialog text shown when joining a friend while already in a live session',
        id: 'mw.friends.joinLeaves'
    },
    joinEndsHosting: {
        defaultMessage: 'You are hosting a live session, and everyone in it will be disconnected.',
        description: 'Dialog text shown when joining a friend while hosting a live session with other people',
        id: 'mw.friends.joinEndsHosting'
    },
    joinUnsaved: {
        defaultMessage: 'You have unsaved changes. Save them first so you can come back to your project.',
        description: 'Dialog text shown when joining a friend with unsaved changes',
        id: 'mw.friends.joinUnsaved'
    },
    joinBackup: {
        defaultMessage: 'MistWarp also keeps a backup on this device before your project is replaced.',
        description: 'Dialog text explaining the automatic device backup taken before joining',
        id: 'mw.friends.joinBackup'
    },
    joinButton: {
        defaultMessage: 'Join',
        description: 'Button in the join dialog that joins a friend without saving because nothing changed',
        id: 'mw.friends.joinButton'
    },
    saveAndJoin: {
        defaultMessage: 'Save and join',
        description: 'Button in the join dialog that saves the current project, then joins the friend',
        id: 'mw.friends.saveAndJoin'
    },
    joinWithoutSaving: {
        defaultMessage: 'Join without saving',
        description: 'Button in the join dialog that joins the friend without saving the current project',
        id: 'mw.friends.joinWithoutSaving'
    },
    finishSaving: {
        defaultMessage: 'Finish saving your project, then choose Join again.',
        description: 'Toast when saving before joining a friend needs the save window first',
        id: 'mw.friends.finishSaving'
    },
    saveFailed: {
        defaultMessage: 'Your project could not be saved, so you have not joined yet.',
        description: 'Toast when saving before joining a friend fails',
        id: 'mw.friends.saveFailed'
    },
    friendRequestFailed: {
        defaultMessage: 'Rotur could not update that friend request.',
        description: 'Toast when accepting or declining a Rotur friend request fails',
        id: 'mw.friends.requestFailed'
    }
});

const keyOf = name => String(name || '').toLowerCase();

class FriendsCollab extends React.Component {
    constructor (props) {
        super(props);
        this.friends = getFriendsService();
        this.state = {
            snapshot: this.friends.getSnapshot(),
            invites: {},
            asks: {},
            incomingInvites: [],
            incomingAsks: [],
            busyId: null
        };
        this.outgoing = new Map();
        this.handleSnapshot = this.handleSnapshot.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleSelfMessage = this.handleSelfMessage.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
        this.handleTick = this.handleTick.bind(this);
        this.handleInvite = this.handleInvite.bind(this);
        this.handleAsk = this.handleAsk.bind(this);
        this.handleConnect = this.handleConnect.bind(this);
        this.handleRetry = this.handleRetry.bind(this);
        this.handleSetVisible = this.handleSetVisible.bind(this);
        this.handleAddFriend = this.handleAddFriend.bind(this);
        this.handleAcceptRequest = this.handleAcceptRequest.bind(this);
        this.handleDeclineRequest = this.handleDeclineRequest.bind(this);
        this.handleAcceptInvite = this.handleAcceptInvite.bind(this);
        this.handleDeclineInvite = this.handleDeclineInvite.bind(this);
        this.handleAcceptAsk = this.handleAcceptAsk.bind(this);
        this.handleDeclineAsk = this.handleDeclineAsk.bind(this);
        this.isFriend = this.isFriend.bind(this);
    }

    componentDidMount () {
        this.unsubscribe = this.friends.subscribe(this.handleSnapshot);
        this.friends.on('message', this.handleMessage);
        this.friends.on('self-message', this.handleSelfMessage);
        this.props.service.on('disconnected', this.handleDisconnected);
        this.timer = setInterval(this.handleTick, 5000);
        this.friends.start(this.props.roturHandle);
    }

    componentDidUpdate (prevProps) {
        if (prevProps.roturHandle !== this.props.roturHandle) {
            this.friends.start(this.props.roturHandle);
            this.outgoing.clear();
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({invites: {}, asks: {}, incomingInvites: [], incomingAsks: []});
        }
    }

    componentWillUnmount () {
        this.unsubscribe();
        this.friends.off('message', this.handleMessage);
        this.friends.off('self-message', this.handleSelfMessage);
        this.props.service.off('disconnected', this.handleDisconnected);
        clearInterval(this.timer);
    }

    handleSnapshot (snapshot) {
        this.setState({snapshot});
    }

    setInvite (name, invite) {
        this.setState(state => {
            const invites = {...state.invites};
            if (invite) invites[keyOf(name)] = invite;
            else delete invites[keyOf(name)];
            return {invites};
        });
    }

    setAsk (name, ask) {
        this.setState(state => {
            const asks = {...state.asks};
            if (ask) asks[keyOf(name)] = ask;
            else delete asks[keyOf(name)];
            return {asks};
        });
    }

    handleTick () {
        const now = Date.now();
        for (const [id, entry] of this.outgoing) {
            if (entry.status === 'sent' && now - entry.at > INVITE_TTL) {
                this.props.service.revokeInviteKey(entry.key);
                this.outgoing.delete(id);
                this.setInvite(entry.username, {status: 'expired', at: now});
            }
        }
        this.setState(state => {
            const invites = {};
            for (const [name, invite] of Object.entries(state.invites)) {
                if (['sending', 'sent'].includes(invite.status) || now - invite.at < NOTE_LIFETIME) {
                    invites[name] = invite;
                }
            }
            const asks = {};
            for (const [name, ask] of Object.entries(state.asks)) {
                if (now - ask.at < (ask.status === 'sent' ? INVITE_TTL : NOTE_LIFETIME)) asks[name] = ask;
            }
            return {
                invites,
                asks,
                incomingInvites: state.incomingInvites.filter(item => now - item.at < INVITE_TTL),
                incomingAsks: state.incomingAsks.filter(item => now - item.at < INVITE_TTL)
            };
        });
    }

    handleDisconnected () {
        for (const [id, entry] of this.outgoing) {
            if (entry.status === 'sent') this.friends.send(entry.username, makeCancel(id));
        }
        this.outgoing.clear();
        this.setState({invites: {}});
    }

    removeIncoming (id) {
        this.setState(state => ({
            incomingInvites: state.incomingInvites.filter(item => item.id !== id),
            incomingAsks: state.incomingAsks.filter(item => item.id !== id)
        }));
    }

    handleSelfMessage (message) {
        if (message.t === HANDLED && typeof message.id === 'string') this.removeIncoming(message.id);
    }

    handleMessage ({from, message}) {
        const now = Date.now();
        if (message.t === INVITE) {
            const invite = readInvite(message);
            if (!invite) return;
            this.setAsk(from, null);
            this.setState(state => ({
                incomingInvites: [
                    ...state.incomingInvites.filter(item => keyOf(item.from) !== keyOf(from)),
                    {...invite, from, at: now}
                ].slice(-MAX_INCOMING)
            }));
        } else if (message.t === ASK) {
            const ask = readAsk(message);
            if (!ask) return;
            if (this.props.service.isConnected && !this.props.service.isHost) {
                this.friends.send(from, makeReply(ASK_REPLY, ask.id, 'declined'));
                return;
            }
            this.setState(state => ({
                incomingAsks: [
                    ...state.incomingAsks.filter(item => keyOf(item.from) !== keyOf(from)),
                    {...ask, from, at: now}
                ].slice(-MAX_INCOMING)
            }));
        } else if (message.t === INVITE_CANCEL) {
            if (typeof message.id === 'string') this.removeIncoming(message.id);
        } else if (message.t === INVITE_REPLY) {
            const reply = readReply(message, INVITE_REPLY, ['accepted', 'declined']);
            const entry = reply && this.outgoing.get(reply.id);
            if (!entry || keyOf(entry.username) !== keyOf(from)) return;
            if (reply.answer === 'accepted') {
                entry.status = 'accepted';
                this.setInvite(from, {status: 'accepted', at: now});
                NotificationSystem.success(this.props.intl.formatMessage(messages.joined, {name: from}), 4000);
            } else {
                this.props.service.revokeInviteKey(entry.key);
                this.outgoing.delete(reply.id);
                this.setInvite(from, {status: 'declined', at: now});
                NotificationSystem.info(this.props.intl.formatMessage(messages.declinedToast, {name: from}), 4000);
            }
        } else if (message.t === ASK_REPLY) {
            const reply = readReply(message, ASK_REPLY, ['declined']);
            if (reply && this.state.asks[keyOf(from)]) this.setAsk(from, {status: 'declined', at: now});
        }
    }

    async ensureHosting () {
        const {service, projectSession} = this.props;
        if (service.isConnected) return service.isHost;
        if (projectSession && projectSession.canHost && !projectSession.session) {
            await projectSession.onHost();
        } else {
            await this.props.onCreateRoom(randomHex(16), this.props.roturHandle, 'private');
        }
        return service.isConnected && service.isHost;
    }

    async handleInvite (username) {
        const current = this.state.invites[keyOf(username)];
        if (current && ['sending', 'sent'].includes(current.status)) return;
        this.setInvite(username, {status: 'sending', at: Date.now()});
        let hosting = false;
        try {
            hosting = await this.ensureHosting();
        } catch (error) {
            hosting = false;
        }
        if (!hosting) {
            this.setInvite(username, null);
            NotificationSystem.error(this.props.intl.formatMessage(messages.inviteFailed), 5000);
            return;
        }
        const {service} = this.props;
        const key = randomHex(16);
        const at = Date.now();
        service.addInviteKey(key, username, at + INVITE_TTL);
        const invite = makeInvite({roomId: service.roomId, key, projectTitle: this.props.projectTitle});
        this.outgoing.set(invite.id, {username, key, status: 'sent', at});
        const delivered = await this.friends.send(username, invite);
        if (!delivered) {
            service.revokeInviteKey(key);
            this.outgoing.delete(invite.id);
            this.setInvite(username, {status: 'unreachable', at: Date.now()});
            return;
        }
        this.setInvite(username, {status: 'sent', at});
    }

    async handleAsk (username) {
        const ask = makeAsk({projectTitle: this.props.projectTitle});
        this.setAsk(username, {status: 'sent', at: Date.now()});
        if (!(await this.friends.send(username, ask))) {
            this.setAsk(username, null);
            this.setInvite(username, {status: 'unreachable', at: Date.now()});
        }
    }

    confirmJoin (invite) {
        const {intl, projectChanged, service} = this.props;
        const name = invite.from;
        const hostingOthers = service.isConnected && service.isHost &&
            service.getConnectedUsers().length > 1;
        const sentences = [intl.formatMessage(messages.joinReplaces, {name})];
        if (hostingOthers) sentences.push(intl.formatMessage(messages.joinEndsHosting));
        else if (service.isConnected) sentences.push(intl.formatMessage(messages.joinLeaves));
        if (projectChanged) sentences.push(intl.formatMessage(messages.joinUnsaved));
        sentences.push(intl.formatMessage(messages.joinBackup));
        const choices = projectChanged ? [
            {value: 'join', label: intl.formatMessage(messages.joinWithoutSaving)},
            {value: 'save', label: intl.formatMessage(messages.saveAndJoin)}
        ] : [{value: 'join', label: intl.formatMessage(messages.joinButton)}];
        return new Promise(resolve => this.props.openSimpleDialog({
            type: 'confirm',
            title: intl.formatMessage(messages.joinTitle, {name}),
            message: sentences.join(' '),
            choices,
            onOk: value => resolve(value),
            onCancel: () => resolve(null)
        }));
    }

    async saveBeforeJoining () {
        const {intl, vm, projectTitle} = this.props;
        try {
            if (await smartSave({vm, title: projectTitle, onSaved: this.props.onProjectUnchanged})) return true;
            NotificationSystem.info(intl.formatMessage(messages.finishSaving), 6000);
        } catch (error) {
            NotificationSystem.error(intl.formatMessage(messages.saveFailed), 6000);
        }
        return false;
    }

    async handleAcceptInvite (invite) {
        this.setState({busyId: invite.id});
        const choice = await this.confirmJoin(invite);
        if (!choice || (choice === 'save' && !(await this.saveBeforeJoining()))) {
            this.setState({busyId: null});
            return;
        }
        try {
            await this.props.onJoinRoom(invite.room, this.props.roturHandle, null, invite.key, {confirmed: true});
        } catch (error) {
            this.setState({busyId: null});
            if (!/cancel/i.test(error && error.message)) {
                this.removeIncoming(invite.id);
                NotificationSystem.error(
                    this.props.intl.formatMessage(messages.joinFailed, {name: invite.from}), 5000
                );
            }
            return;
        }
        this.setState({busyId: null});
        this.removeIncoming(invite.id);
        this.friends.send(invite.from, makeReply(INVITE_REPLY, invite.id, 'accepted'));
        this.friends.sendToOwnTabs(makeHandled(invite.id));
        this.props.onOpen();
    }

    handleDeclineInvite (invite) {
        this.removeIncoming(invite.id);
        this.friends.send(invite.from, makeReply(INVITE_REPLY, invite.id, 'declined'));
        this.friends.sendToOwnTabs(makeHandled(invite.id));
    }

    async handleAcceptAsk (ask) {
        this.removeIncoming(ask.id);
        this.friends.sendToOwnTabs(makeHandled(ask.id));
        await this.handleInvite(ask.from);
    }

    handleDeclineAsk (ask) {
        this.removeIncoming(ask.id);
        this.friends.send(ask.from, makeReply(ASK_REPLY, ask.id, 'declined'));
        this.friends.sendToOwnTabs(makeHandled(ask.id));
    }

    handleConnect () {
        this.friends.connect();
    }

    handleRetry () {
        this.friends.refresh();
    }

    handleSetVisible (visible) {
        this.friends.setVisible(visible);
    }

    async handleAddFriend (username) {
        await this.friends.addFriend(username);
    }

    async handleAcceptRequest (username) {
        try {
            await this.friends.acceptRequest(username);
        } catch (error) {
            NotificationSystem.error(this.props.intl.formatMessage(messages.friendRequestFailed), 5000);
        }
    }

    async handleDeclineRequest (username) {
        try {
            await this.friends.declineRequest(username);
        } catch (error) {
            NotificationSystem.error(this.props.intl.formatMessage(messages.friendRequestFailed), 5000);
        }
    }

    isFriend (username) {
        return this.friends.isFriend(username);
    }

    render () {
        const {service, intl} = this.props;
        const {snapshot} = this.state;
        const guest = service.isConnected && !service.isHost;
        const panel = (
            <FriendsPanel
                asks={this.state.asks}
                blockedReason={guest ? intl.formatMessage(messages.guestBlocked) : null}
                canAsk={!service.isConnected}
                canInvite={!guest}
                invites={this.state.invites}
                sessionMembers={this.props.sessionMembers}
                snapshot={snapshot}
                onAcceptRequest={this.handleAcceptRequest}
                onAddFriend={this.handleAddFriend}
                onAsk={this.handleAsk}
                onConnect={this.handleConnect}
                onDeclineRequest={this.handleDeclineRequest}
                onInvite={this.handleInvite}
                onRetry={this.handleRetry}
                onSetVisible={this.handleSetVisible}
                onSignIn={this.props.onSignIn}
            />
        );
        const tools = {
            ready: snapshot.status === 'ready',
            me: this.props.roturHandle,
            isFriend: this.isFriend,
            addFriend: this.handleAddFriend
        };
        return (
            <React.Fragment>
                {this.props.children(panel, tools)}
                <InviteCards
                    asks={this.state.incomingAsks}
                    busyId={this.state.busyId}
                    invites={this.state.incomingInvites}
                    onAcceptAsk={this.handleAcceptAsk}
                    onAcceptInvite={this.handleAcceptInvite}
                    onDeclineAsk={this.handleDeclineAsk}
                    onDeclineInvite={this.handleDeclineInvite}
                />
            </React.Fragment>
        );
    }
}

FriendsCollab.propTypes = {
    children: PropTypes.func.isRequired,
    intl: intlShape.isRequired,
    projectSession: PropTypes.shape({
        canHost: PropTypes.bool,
        session: PropTypes.object,
        onHost: PropTypes.func
    }),
    openSimpleDialog: PropTypes.func.isRequired,
    projectChanged: PropTypes.bool,
    projectTitle: PropTypes.string,
    roturHandle: PropTypes.string,
    sessionMembers: PropTypes.arrayOf(PropTypes.string).isRequired,
    service: PropTypes.shape({
        isConnected: PropTypes.bool,
        isHost: PropTypes.bool,
        roomId: PropTypes.string,
        on: PropTypes.func.isRequired,
        off: PropTypes.func.isRequired,
        getConnectedUsers: PropTypes.func.isRequired,
        addInviteKey: PropTypes.func.isRequired,
        revokeInviteKey: PropTypes.func.isRequired
    }).isRequired,
    onCreateRoom: PropTypes.func.isRequired,
    onJoinRoom: PropTypes.func.isRequired,
    vm: PropTypes.object,
    onOpen: PropTypes.func.isRequired,
    onProjectUnchanged: PropTypes.func.isRequired,
    onSignIn: PropTypes.func.isRequired
};

export {FriendsCollab};

export default injectIntl(connect(
    state => ({
        projectChanged: state.scratchGui.projectChanged,
        projectTitle: state.scratchGui.projectTitle,
        vm: state.scratchGui.vm,
        sessionMembers: state.scratchGui.collaboration.connectedUsers
            .map(user => String(user.handle || '').toLowerCase())
            .filter(Boolean)
    }),
    dispatch => ({
        openSimpleDialog: config => dispatch(openSimpleDialog(config)),
        onProjectUnchanged: () => dispatch(setProjectUnchanged()),
        onSignIn: () => dispatch(openRoturLoginModal())
    })
)(FriendsCollab));
