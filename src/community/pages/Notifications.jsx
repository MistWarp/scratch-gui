import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Heart, MessageCircle, GitFork, UserPlus, AtSign, ShieldAlert, Megaphone, Flag} from 'lucide-react';
import api, {projectUrl} from '../api';
import Avatar from '../components/Avatar.jsx';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format';
import styles from './Notifications.module.css';

const ICONS = {
    love: Heart,
    comment: MessageCircle,
    profile_comment: MessageCircle,
    remix: GitFork,
    follow: UserPlus,
    mention: AtSign,
    standing: ShieldAlert,
    moderation: ShieldAlert,
    news: Megaphone,
    report_update: Flag
};

const SYSTEM_TYPES = ['standing', 'moderation', 'news', 'report_update'];

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

const Notifications = () => {
    const {user, loading} = useUser();
    const [items, setItems] = useState(null);

    useEffect(() => {
        if (!user) {
            return;
        }
        api.notifications()
            .then(data => setItems(data.notifications || []))
            .catch(() => setItems([]))
            .finally(() => api.readNotifications()
                .then(() => window.dispatchEvent(new Event('mw:notifications-read')))
                .catch(() => {}));
    }, [user]);

    if (loading) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }
    if (!user) {
        return <main className={styles.page}><p className={styles.status}>Sign in to see your notifications.</p></main>;
    }

    return (
        <main className={styles.page}>
            <h1>Notifications</h1>
            {items === null ? (
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
                                            to={projectUrl(n.projectId)}
                                            className={styles.body}
                                        >{describe(n)}</Link>
                                    ) : (n.type === 'profile_comment' || n.profile) ? (
                                        <Link
                                            to={`/users/${n.profile || user.username}`}
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

export default Notifications;
