import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Heart, MessageCircle, GitFork, UserPlus} from 'lucide-react';
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
    follow: UserPlus
};

const describe = n => {
    switch (n.type) {
    case 'love': return <span>loved <strong>{n.projectTitle}</strong></span>;
    case 'comment': return <span>commented on <strong>{n.projectTitle}</strong></span>;
    case 'profile_comment': return <span>commented on your profile</span>;
    case 'remix': return <span>remixed <strong>{n.projectTitle}</strong></span>;
    case 'follow': return <span>followed you</span>;
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
            .catch(() => setItems([]));
        api.readNotifications().catch(() => {});
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
                                    ) : n.type === 'profile_comment' ? (
                                        <Link
                                            to={`/users/${user.username}`}
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
