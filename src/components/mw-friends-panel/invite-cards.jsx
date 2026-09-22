import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Check, Send, Users, X} from 'lucide-react';

import Avatar from '../mw-avatar/avatar.jsx';
import ValueButton from './value-button.jsx';
import styles from './invite-cards.css';

const Card = ({from, title, children, actions}) => (
    <div
        aria-live="polite"
        className={styles.card}
        role="status"
    >
        <div className={styles.top}>
            <span className={styles.avatarWrap}>
                <Avatar
                    size={36}
                    username={from}
                />
                <span className={styles.badge}>
                    <Users
                        aria-hidden="true"
                        size={11}
                    />
                </span>
            </span>
            <div className={styles.text}>
                <p className={styles.message}>{children}</p>
                {title ? <p className={styles.project}>{title}</p> : null}
            </div>
        </div>
        <div className={styles.actions}>{actions}</div>
    </div>
);

Card.propTypes = {
    actions: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    from: PropTypes.string.isRequired,
    title: PropTypes.string
};

const InviteCards = ({invites, asks, busyId, onAcceptInvite, onDeclineInvite, onAcceptAsk, onDeclineAsk}) => {
    if (!invites.length && !asks.length) return null;
    return (
        <div className={styles.stack}>
            {invites.map(invite => (
                <Card
                    actions={(
                        <React.Fragment>
                            <ValueButton
                                disabled={busyId === invite.id}
                                iconElem={X}
                                size="small"
                                value={invite}
                                variant="secondary"
                                onPress={onDeclineInvite}
                            >
                                <FormattedMessage
                                    defaultMessage="Decline"
                                    description="Button that declines a collaboration invite from a friend"
                                    id="mw.friendInvite.decline"
                                />
                            </ValueButton>
                            <ValueButton
                                disabled={busyId === invite.id}
                                iconElem={Check}
                                size="small"
                                value={invite}
                                variant="primary"
                                onPress={onAcceptInvite}
                            >
                                <FormattedMessage
                                    defaultMessage="Join"
                                    description="Button that accepts a collaboration invite from a friend"
                                    id="mw.friendInvite.join"
                                />
                            </ValueButton>
                        </React.Fragment>
                    )}
                    from={invite.from}
                    key={invite.id}
                    title={invite.title}
                >
                    <FormattedMessage
                        defaultMessage="{name} invited you to edit together."
                        description="Card shown when a friend invites you to their live editing session"
                        id="mw.friendInvite.message"
                        values={{name: <strong>{invite.from}</strong>}}
                    />
                </Card>
            ))}
            {asks.map(ask => (
                <Card
                    actions={(
                        <React.Fragment>
                            <ValueButton
                                disabled={busyId === ask.id}
                                iconElem={X}
                                size="small"
                                value={ask}
                                variant="secondary"
                                onPress={onDeclineAsk}
                            >
                                <FormattedMessage
                                    defaultMessage="Not now"
                                    description="Button that declines a friend's request to join your session"
                                    id="mw.friendAsk.decline"
                                />
                            </ValueButton>
                            <ValueButton
                                disabled={busyId === ask.id}
                                iconElem={Send}
                                size="small"
                                value={ask}
                                variant="primary"
                                onPress={onAcceptAsk}
                            >
                                <FormattedMessage
                                    defaultMessage="Invite"
                                    description="Button that invites a friend who asked to join your session"
                                    id="mw.friendAsk.invite"
                                />
                            </ValueButton>
                        </React.Fragment>
                    )}
                    from={ask.from}
                    key={ask.id}
                >
                    <FormattedMessage
                        defaultMessage="{name} wants to edit with you."
                        description="Card shown when a friend asks to join your live editing session"
                        id="mw.friendAsk.message"
                        values={{name: <strong>{ask.from}</strong>}}
                    />
                </Card>
            ))}
        </div>
    );
};

const itemShape = PropTypes.shape({
    id: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
    title: PropTypes.string
});

InviteCards.propTypes = {
    asks: PropTypes.arrayOf(itemShape).isRequired,
    busyId: PropTypes.string,
    invites: PropTypes.arrayOf(itemShape).isRequired,
    onAcceptAsk: PropTypes.func.isRequired,
    onAcceptInvite: PropTypes.func.isRequired,
    onDeclineAsk: PropTypes.func.isRequired,
    onDeclineInvite: PropTypes.func.isRequired
};

export default InviteCards;
