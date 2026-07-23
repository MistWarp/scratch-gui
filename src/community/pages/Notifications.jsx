import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {
    Heart, MessageCircle, GitFork, UserPlus, AtSign, ShieldAlert, Megaphone, Flag, Reply, Coins
} from 'lucide-react';
import api, {projectUrl} from '../api';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format';
import styles from './Notifications.module.css';

const ICONS = {
    love: Heart,
    comment: MessageCircle,
    profile_comment: MessageCircle,
    reply: Reply,
    remix: GitFork,
    follow: UserPlus,
    mention: AtSign,
    purchase: Coins,
    donation: Coins,
    standing: ShieldAlert,
    moderation: ShieldAlert,
    news: Megaphone,
    report_update: Flag
};

const SYSTEM_TYPES = ['standing', 'moderation', 'news', 'report_update'];

const commentAnchor = n => (n.commentId ? `#comment-id-${n.commentId}` : '');

const REPORT_OUTCOMES = {
    dismiss: 'reviewed; no action was taken',
    warn_user: 'actioned with a warning',
    ban_user: 'actioned with a ban',
    unshare_project: 'actioned; the project was unshared'
};

const describe = n => {
    switch (n.type) {
    case 'love': return <span>loved <strong>{n.projectTitle}</strong></span>;
    case 'comment': return <span>commented on <strong>{n.projectTitle}</strong></span>;
    case 'profile_comment': return <span>commented on your profile</span>;
    case 'reply': return n.projectTitle ?
        <span>replied to your comment on <strong>{n.projectTitle}</strong></span> :
        <span>replied to your comment</span>;
    case 'purchase': return <span>bought <strong>{n.projectTitle}</strong> for {n.amount} credits</span>;
    case 'donation': return <span>donated {n.amount} credits to you</span>;
    case 'remix': return <span>remixed <strong>{n.projectTitle}</strong></span>;
    case 'follow': return <span>followed you</span>;
    case 'mention': return n.projectTitle ?
        <span>mentioned you on <strong>{n.projectTitle}</strong></span> :
        <span>mentioned you in a comment</span>;
    case 'standing': return n.reason ?
        <span>Your account standing is now <strong>{n.level}</strong>: {n.reason}</span> :
        <span>Your account standing is now <strong>{n.level}</strong>.</span>;
    case 'moderation': return <span>{n.message || 'A moderator sent you a message.'}</span>;
    case 'news': return <span>New announcement: <strong>{n.title}</strong></span>;
    case 'report_update': return <span>Your report was {REPORT_OUTCOMES[n.action] || 'reviewed'}.</span>;
    default: return <span>did something</span>;
    }
};

const Notifications = ({hideHeading}) => {
    const {user, loading} = useUser();
    const [items, setItems] = useState(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!user) {
            return;
        }
        setFailed(false);
        api.notifications()
            .then(data => {
                setItems(data.notifications || []);
                api.readNotifications()
                    .then(() => window.dispatchEvent(new Event('mw:notifications-read')))
                    .catch(() => {});
            })
            .catch(() => setFailed(true));
    }, [user, attempt]);

    if (loading) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }
    if (!user) {
        return <main className={styles.page}><p className={styles.status}>Sign in to see your notifications.</p></main>;
    }

    return (
        <main className={styles.page}>
            {hideHeading ? null : <h1>Notifications</h1>}
            {failed ? (
                <p className={styles.status}>
                    Couldn&apos;t load.{' '}
                    <Button onClick={() => setAttempt(a => a + 1)}>Try again</Button>
                </p>
            ) : items === null ? (
                <p className={styles.status}>Loading…</p>
            ) : items.length ? (
                <div className={styles.list}>
                    {items.map(n => {
                        const Icon = ICONS[n.type] || Heart;
                        const system = SYSTEM_TYPES.includes(n.type);
                        if (system) {
                            const body = <span className={styles.body}>{describe(n)}</span>;
                            return (
                                <div
                                    key={n.id}
                                    className={n.read ? styles.item : styles.itemUnread}
                                >
                                    <span className={styles.sysAvatar}><Icon size={20} /></span>
                                    <div className={styles.text}>
                                        {n.type === 'news' && n.newsId ? (
                                            <Link
                                                to="/news"
                                                className={styles.body}
                                            >{describe(n)}</Link>
                                        ) : body}
                                    </div>
                                    <span className={styles.time}>{timeAgo(n.created)}</span>
                                </div>
                            );
                        }
                        return (
                            <div
                                key={n.id}
                                className={n.read ? styles.item : styles.itemUnread}
                            >
                                <Link to={`/users/${n.actor}`}>
                                    <Avatar
                                        username={n.actor}
                                        size={40}
                                    />
                                </Link>
                                <span className={styles.icon}><Icon size={15} /></span>
                                <div className={styles.text}>
                                    <Link
                                        to={`/users/${n.actor}`}
                                        className={styles.actor}
                                    >{n.actor}</Link>
                                    {' '}
                                    {n.projectId ? (
                                        <Link
                                            to={`${projectUrl(n.projectId)}${commentAnchor(n)}`}
                                            className={styles.body}
                                        >{describe(n)}</Link>
                                    ) : (n.type === 'profile_comment' || n.profile) ? (
                                        <Link
                                            to={`/users/${n.profile || user.username}${commentAnchor(n)}`}
                                            className={styles.body}
                                        >{describe(n)}</Link>
                                    ) : (
                                        <span className={styles.body}>{describe(n)}</span>
                                    )}
                                </div>
                                <span className={styles.time}>{timeAgo(n.created)}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className={styles.status}>Nothing yet. Activity on your projects shows up here.</p>
            )}
        </main>
    );
};

Notifications.propTypes = {
    hideHeading: PropTypes.bool
};

export default Notifications;
