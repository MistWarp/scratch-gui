import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {
    AppWindow, AtSign, Coins, Flag, Gavel, GitFork, Heart, Megaphone,
    MessageCircle, Reply, ShieldAlert, UserPlus, GitPullRequest, Layers3, Lightbulb, Star, Users
} from 'lucide-react';
import {projectUrl} from '../api';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import RichText from '../components/RichText.jsx';
import {useUser} from '../UserContext.jsx';
import {fetchNotifications, markNotificationsRead, subscribeNotifications} from '../../lib/rotur/client.js';
import {timeAgo} from '../format';
import styles from './Notifications.module.css';
import {getNotificationPreferences, categoryForNotification} from '../notification-preferences';

const ICONS = {
    love: Heart,
    comment: MessageCircle,
    profile_comment: MessageCircle,
    reply: Reply,
    remix: GitFork,
    follow: UserPlus,
    mention: AtSign,
    like: Heart,
    repost: GitFork,
    group_invite: UserPlus,
    group_request_accepted: UserPlus,
    group_request_declined: UserPlus,
    group_kicked: ShieldAlert,
    group_banned: ShieldAlert,
    group_ownership_transferred: ShieldAlert,
    cosmetic_gift: Coins,
    item_received: Coins,
    item_sold: Coins,
    item_purchased: Coins,
    purchase: Coins,
    donation: Coins,
    standing: ShieldAlert,
    moderation: ShieldAlert,
    news: Megaphone,
    report_update: Flag,
    contribution: GitPullRequest,
    space_project: Layers3,
    space_comment: MessageCircle,
    space_curator_invite: UserPlus,
    space_curator_accepted: Users,
    space_curator_declined: Users,
    space_curator_removed: ShieldAlert,
    challenge_judge_invite: Gavel,
    challenge_judge_accepted: Gavel,
    challenge_join: UserPlus,
    project_feedback: Lightbulb,
    project_review: Star,
    roadmap_comment: Lightbulb,
    notification: AppWindow
};

const SYSTEM_TYPES = ['standing', 'moderation', 'news', 'report_update'];

const GROUP_TYPES = [
    'group_invite',
    'group_request_accepted',
    'group_request_declined',
    'group_kicked',
    'group_banned',
    'group_ownership_transferred'
];

// Rotur / usernames follow this shape; titles that don't match are app
// messages rather than account names.
const USERNAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,19}$/;

const commentAnchor = n => (n.commentId ? `#comment-id-${n.commentId}` : '');

const groupUrl = n => (n.group_tag ? `https://rotur.dev/groups/${encodeURIComponent(n.group_tag)}` : null);

const REPORT_OUTCOMES = {
    dismiss: 'reviewed; no action was taken',
    warn_user: 'actioned with a warning',
    ban_user: 'actioned with a ban',
    unshare_project: 'actioned; the project was unshared'
};

const escapeRegex = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const linkify = text => <RichText text={text} />;

// Generic notifications carry the sender in `title` (MistWarp posts
// title = actor) and the full sentence in `body`; drop the duplicated
// prefix so "shima" + "shima commented on your project" reads cleanly.
const stripSender = (sender, text) => {
    if (!sender || !text) {
        return text;
    }
    return text.replace(new RegExp(`^${escapeRegex(sender)}[\\s:.,\\u2014-]*`, 'i'), '');
};

const mergeNotifications = (...lists) => {
    const seen = new Set();
    const merged = [];
    for (const list of lists) {
        for (const item of list || []) {
            if (!item) continue;
            const key = item.id || `${item.type}:${item.created || item.timestamp}:${item.actor || item.title || ''}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(item);
        }
    }
    return merged;
};

const markItemsRead = items => (items || []).map(item => ({...item, read: true}));

// Prefer a username-shaped title (real actor) over the app account that
// posted the notification ("MistWarp"). Returns null when no actor is known.
const actorFor = n => {
    const title = typeof n.title === 'string' ? n.title : '';
    if (title && USERNAME_RE.test(title) && title.toLowerCase() !== 'mistwarp') {
        return title;
    }
    return n.actor || n.from || title || null;
};

const describe = n => {
    switch (n.type) {
    case 'love': return n.projectTitle ?
        <span>loved <strong>{n.projectTitle}</strong></span> :
        <span>loved your project</span>;
    case 'comment': return n.projectTitle ?
        <span>commented on <strong>{n.projectTitle}</strong></span> :
        <span>commented on your project</span>;
    case 'profile_comment': return <span>commented on your profile</span>;
    case 'reply': return n.post_id ?
        <span>replied to your post</span> :
        n.projectTitle ?
            <span>replied to your comment on <strong>{n.projectTitle}</strong></span> :
            <span>replied to your comment</span>;
    case 'purchase': return (
        <span>
            bought {n.projectTitle ? <strong>{n.projectTitle}</strong> : 'your project'}
            {n.amount ? ` for ${n.amount} credits` : ''}
        </span>
    );
    case 'donation': return (
        <span>donated {n.amount ? `${n.amount} credits` : 'credits'} to you</span>
    );
    case 'remix': return n.projectTitle ?
        <span>remixed <strong>{n.projectTitle}</strong></span> :
        <span>remixed your project</span>;
    case 'follow': return <span>followed you</span>;
    case 'mention': return n.post_id ?
        <span>mentioned you in a post</span> :
        n.projectTitle ?
            <span>mentioned you on <strong>{n.projectTitle}</strong></span> :
            <span>mentioned you in a comment</span>;
    case 'like': return <span>liked your post</span>;
    case 'repost': return <span>reposted your post</span>;
    case 'group_invite': return <span>invited you to join <strong>{n.group_name}</strong></span>;
    case 'group_request_accepted': return <span>accepted your request to join <strong>{n.group_name}</strong></span>;
    case 'group_request_declined': return <span>declined your request to join <strong>{n.group_name}</strong></span>;
    case 'group_kicked': return <span>removed you from <strong>{n.group_name}</strong></span>;
    case 'group_banned': return <span>banned you from <strong>{n.group_name}</strong></span>;
    case 'group_ownership_transferred': return <span>transferred <strong>{n.group_name}</strong> to you</span>;
    case 'cosmetic_gift': return <span>sent you <strong>{n.cosmetic_name}</strong></span>;
    case 'item_received': return <span>sent you <strong>{n.item_name}</strong></span>;
    case 'item_sold': return <span>bought <strong>{n.item_name}</strong> from you</span>;
    case 'item_purchased': return <span>you bought <strong>{n.item_name}</strong></span>;
    case 'standing': return n.reason ?
        <span>Your account standing is now <strong>{n.level}</strong>: {n.reason}</span> :
        <span>Your account standing is now <strong>{n.level}</strong>.</span>;
    case 'moderation': return <span>{n.message || 'A moderator sent you a message.'}</span>;
    case 'news': return <span>New announcement: <strong>{n.title}</strong></span>;
    case 'report_update': return <span>Your report was {REPORT_OUTCOMES[n.action] || 'reviewed'}.</span>;
    case 'contribution': return <span>sent changes for <strong>{n.projectTitle}</strong></span>;
    case 'space_project': return (
        <span>added <strong>{n.projectTitle}</strong> to <strong>{n.spaceTitle}</strong></span>
    );
    case 'space_comment': return <span>commented on <strong>{n.spaceTitle}</strong></span>;
    case 'space_curator_invite': return <span>invited you to curate <strong>{n.spaceTitle}</strong></span>;
    case 'space_curator_accepted': return (
        <span>accepted your invitation to curate <strong>{n.spaceTitle}</strong></span>
    );
    case 'space_curator_declined': return (
        <span>declined your invitation to curate <strong>{n.spaceTitle}</strong></span>
    );
    case 'space_curator_removed': return <span>removed you as a curator of <strong>{n.spaceTitle}</strong></span>;
    case 'challenge_judge_invite': return <span>invited you to judge <strong>{n.spaceTitle}</strong></span>;
    case 'challenge_judge_accepted': return (
        <span>accepted your invitation to judge <strong>{n.spaceTitle}</strong></span>
    );
    case 'challenge_join': return <span>joined <strong>{n.spaceTitle}</strong></span>;
    case 'project_feedback': return <span>sent {n.feedbackType} feedback for <strong>{n.projectTitle}</strong></span>;
    case 'project_review': return <span>rated <strong>{n.projectTitle}</strong> {n.rating} out of 5</span>;
    case 'roadmap_comment': return <span>commented on <strong>{n.roadmapTitle}</strong></span>;
    default: return <span>did something</span>;
    }
};

// Generic Rotur notifications (any app's /v2/notify/ push) arrive as
// type "notification" with title/body/from/source. Title holds the sender
// for MistWarp; other apps may put an app name or message summary there.
const GenericNotification = ({n}) => {
    const sender = n.title || n.from || n.actor || '';
    const isUser = Boolean(sender) && USERNAME_RE.test(sender) &&
        sender.toLowerCase() !== 'mistwarp' &&
        sender.toLowerCase() !== String(n.source || '').toLowerCase();
    const raw = n.body || n.content || '';
    if (!isUser && !sender && !raw) {
        return null;
    }
    const text = isUser ? stripSender(sender, raw) : raw;
    const showTitle = !isUser && Boolean(sender) && sender !== text;
    const channel = n.channelName ? ` in #${n.channelName}` : '';
    const target = n.projectId ? `${projectUrl(n.projectId)}${commentAnchor(n)}` : null;
    const sourceLink = typeof n.source === 'string' && /^https?:\/\//.test(n.source);
    const showSource = Boolean(n.source) && n.source !== 'mistwarp' && !sourceLink;

    let content;
    if (showTitle) {
        content = (
            <>
                <span className={styles.senderTitle}>{sender}</span>
                {linkify(text)}{channel}
            </>
        );
    } else {
        content = <>{linkify(text || sender)}{channel}</>;
    }
    if (target) {
        content = <Link to={target} className={styles.body}>{content}</Link>;
    } else if (sourceLink) {
        content = <a href={n.source} target="_blank" rel="noreferrer" className={styles.body}>{content}</a>;
    } else {
        content = <span className={styles.body}>{content}</span>;
    }

    if (isUser) {
        return (
            <>
                <span className={styles.avatarWrap}>
                    <Link to={`/users/${sender}`}>
                        <Avatar username={sender} size={40} />
                    </Link>
                    <span className={styles.iconBadge}><AtSign size={12} /></span>
                </span>
                <div className={styles.text}>
                    <Link to={`/users/${sender}`} className={styles.actor}>{sender}</Link>
                    {' '}
                    {content}
                </div>
            </>
        );
    }
    return (
        <>
            <span className={styles.sysAvatar}><AppWindow size={20} /></span>
            <div className={styles.text}>
                {content}
                {showSource ? <span className={styles.sourceTag}>{n.source}</span> : null}
            </div>
        </>
    );
};

GenericNotification.propTypes = {
    n: PropTypes.object.isRequired
};

const Notifications = ({hideHeading}) => {
    const {user, loading, login} = useUser();
    const viewerName = (user && user.username) || '';
    const [items, setItems] = useState(null);
    const [preferences, setPreferences] = useState(getNotificationPreferences());

    useEffect(() => {
        const update = () => setPreferences(getNotificationPreferences());
        window.addEventListener('mw:notification-preferences', update);
        return () => window.removeEventListener('mw:notification-preferences', update);
    }, []);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!viewerName) {
            return () => {};
        }
        return subscribeNotifications(notification => {
            setItems(prev => mergeNotifications([notification], prev || []));
        });
    }, [viewerName]);

    useEffect(() => {
        const onRemoved = event => {
            const id = event.detail && event.detail.id;
            if (typeof id !== 'string') {
                return;
            }
            setItems(prev => (prev ? prev.filter(item => item.id !== id) : prev));
        };
        window.addEventListener('mw:notifications-removed', onRemoved);
        return () => window.removeEventListener('mw:notifications-removed', onRemoved);
    }, []);

    useEffect(() => {
        setItems(null);
        setFailed(false);
        if (!viewerName) {
            return () => {};
        }
        let cancelled = false;
        fetchNotifications()
            .then(list => {
                if (cancelled) return;
                setItems(current => mergeNotifications(current || [], list));
                markNotificationsRead()
                    .then(marked => {
                        if (!marked || cancelled) return;
                        setItems(markItemsRead);
                        window.dispatchEvent(new Event('mw:notifications-read'));
                    })
                    .catch(() => {});
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });
        return () => {
            cancelled = true;
        };
    }, [attempt, viewerName]);

    if (loading) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }
    if (!user) {
        return (
            <main className={styles.page}>
                <p className={styles.status}>
                    Sign in to see your notifications. <Button onClick={login}>Sign in</Button>
                </p>
            </main>
        );
    }
    const visibleItems = (items || [])
        .filter(item => preferences[categoryForNotification(item.type)] !== false);

    return (
        <main className={styles.page}>
            {hideHeading ? null : <h1>Notifications</h1>}
            {failed ? (
                <p className={styles.status}>
                    {items === null ? 'Couldn\'t load notifications.' : 'Some notifications may be missing.'}{' '}
                    <Button onClick={() => setAttempt(a => a + 1)}>Try again</Button>
                </p>
            ) : null}
            {items === null ? (!failed ? (
                <p className={styles.status}>Loading…</p>
            ) : null) : visibleItems.length ? (
                <div className={styles.list}>
                    {visibleItems.map(n => {
                        const Icon = ICONS[n.type] || Heart;
                        const ts = n.created || n.timestamp;
                        const time = timeAgo(ts);

                        if (n.type === 'notification') {
                            return (
                                <div key={n.id} className={n.read ? styles.item : styles.itemUnread}>
                                    <GenericNotification n={n} />
                                    <span className={styles.time}>{time}</span>
                                </div>
                            );
                        }

                        if (SYSTEM_TYPES.includes(n.type)) {
                            return (
                                <div key={n.id} className={n.read ? styles.item : styles.itemUnread}>
                                    <span className={styles.sysAvatar}><Icon size={20} /></span>
                                    <div className={styles.text}>
                                        {n.type === 'news' && n.newsId ? (
                                            <Link to="/news" className={styles.body}>{describe(n)}</Link>
                                        ) : (
                                            <span className={styles.body}>{describe(n)}</span>
                                        )}
                                    </div>
                                    <span className={styles.time}>{time}</span>
                                </div>
                            );
                        }

                        const actor = actorFor(n);
                        if (!actor) {
                            return null;
                        }
                        const groupLink = GROUP_TYPES.includes(n.type) ? groupUrl(n) : null;
                        const body = groupLink ? (
                            <a href={groupLink} target="_blank" rel="noreferrer" className={styles.body}>
                                {describe(n)}
                            </a>
                        ) : describe(n);
                        return (
                            <div key={n.id} className={n.read ? styles.item : styles.itemUnread}>
                                <span className={styles.avatarWrap}>
                                    <Link to={`/users/${actor}`}>
                                        <Avatar username={actor} size={40} />
                                    </Link>
                                    <span className={styles.iconBadge}><Icon size={12} /></span>
                                </span>
                                <div className={styles.text}>
                                    <Link to={`/users/${actor}`} className={styles.actor}>{actor}</Link>
                                    {' '}
                                    {n.spaceId ? (
                                        <Link
                                            to={`/spaces/${n.spaceId}`}
                                            className={styles.body}
                                        >{body}</Link>
                                    ) : n.roadmapId ? (
                                        <Link
                                            to={`/roadmap#idea-${n.roadmapId}`}
                                            className={styles.body}
                                        >{body}</Link>
                                    ) : n.projectId ? (
                                        <Link
                                            to={`${projectUrl(n.projectId)}${commentAnchor(n)}`}
                                            className={styles.body}
                                        >{body}</Link>
                                    ) : (n.type === 'profile_comment' || n.profile) ? (
                                        <Link
                                            to={`/users/${n.profile || user.username}${commentAnchor(n)}`}
                                            className={styles.body}
                                        >{body}</Link>
                                    ) : body}
                                </div>
                                <span className={styles.time}>{time}</span>
                            </div>
                        );
                    })}
                </div>
            ) : items.length ? (
                <p className={styles.status}>
                    Your notification preferences hide all current activity.{' '}
                    <Link to="/settings?section=notifications">Change preferences</Link>
                </p>
            ) : (
                <p className={styles.status}>Nothing yet. Activity on your projects shows up here.</p>
            )}
        </main>
    );
};

Notifications.propTypes = {
    hideHeading: PropTypes.bool
};

export {markItemsRead, mergeNotifications};
export default Notifications;
