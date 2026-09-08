import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {isMilestoneNotification, milestoneText, milestoneLink} from '../milestone-notifications.js';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {
    AppWindow, AtSign, Coins, ExternalLink, Flag, Gavel, GitFork, Heart, Megaphone,
    MessageCircle, Reply, ShieldAlert, UserPlus, Users, GitPullRequest, GitMerge, Layers3,
    Lightbulb, Star
} from 'lucide-react';
import {projectUrl} from '../api';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import RichText from '../components/RichText.jsx';
import {useUser} from '../UserContext.jsx';
import {
    fetchFollowingFeed,
    fetchNotifications,
    markNotificationsRead,
    subscribeNotifications
} from '../../lib/rotur/client.js';
import {timeAgo} from '../format';
import {fetchCommentPreview} from '../comment-preview.js';
import {interleaveTimeline, postUrl} from '../following-feed.js';
import styles from './Notifications.module.css';
import {getNotificationPreferences, categoryForNotification} from '../notification-preferences';

const TYPE_STYLE = {
    project_shared: {icon: Users, color: '#38b8a5'},
    love: {icon: Heart, color: '#e5639c'},
    like: {icon: Heart, color: '#e5639c'},
    like_milestone: {icon: Heart, color: '#e5639c'},
    follower_milestone: {icon: Users, color: '#38b8a5'},
    comment: {icon: MessageCircle, color: '#4c8dff'},
    profile_comment: {icon: MessageCircle, color: '#4c8dff'},
    space_comment: {icon: MessageCircle, color: '#4c8dff'},
    roadmap_comment: {icon: Lightbulb, color: '#e0a63c'},
    reply: {icon: Reply, color: '#3fae6a'},
    remix: {icon: GitFork, color: '#ef8f3c'},
    repost: {icon: GitFork, color: '#ef8f3c'},
    follow: {icon: UserPlus, color: '#38b8a5'},
    mention: {icon: AtSign, color: '#9a6ff0'},
    group_invite: {icon: UserPlus, color: '#38b8a5'},
    group_request_accepted: {icon: UserPlus, color: '#3fae6a'},
    group_request_declined: {icon: UserPlus, color: '#e35d6a'},
    group_kicked: {icon: ShieldAlert, color: '#e35d6a'},
    group_banned: {icon: ShieldAlert, color: '#e35d6a'},
    group_ownership_transferred: {icon: ShieldAlert, color: '#e0a63c'},
    cosmetic_gift: {icon: Coins, color: '#e0a63c'},
    item_received: {icon: Coins, color: '#e0a63c'},
    item_sold: {icon: Coins, color: '#e0a63c'},
    item_purchased: {icon: Coins, color: '#e0a63c'},
    purchase: {icon: Coins, color: '#e0a63c'},
    donation: {icon: Coins, color: '#e0a63c'},
    standing: {icon: ShieldAlert, color: '#e35d6a'},
    moderation: {icon: ShieldAlert, color: '#e35d6a'},
    news: {icon: Megaphone, color: '#9a6ff0'},
    report_update: {icon: Flag, color: '#e35d6a'},
    contribution: {icon: GitPullRequest, color: '#4c8dff'},
    contribution_merged: {icon: GitMerge, color: '#3fae6a'},
    space_project: {icon: Layers3, color: '#ef8f3c'},
    space_curator_invite: {icon: UserPlus, color: '#38b8a5'},
    space_curator_accepted: {icon: Users, color: '#3fae6a'},
    space_curator_declined: {icon: Users, color: '#e35d6a'},
    space_curator_removed: {icon: ShieldAlert, color: '#e35d6a'},
    challenge_judge_invite: {icon: Gavel, color: '#e0a63c'},
    challenge_judge_accepted: {icon: Gavel, color: '#3fae6a'},
    challenge_join: {icon: UserPlus, color: '#38b8a5'},
    project_feedback: {icon: Lightbulb, color: '#e0a63c'},
    project_review: {icon: Star, color: '#e0a63c'},
    notification: {icon: AppWindow, color: '#8a93a6'}
};

const typeStyle = type => TYPE_STYLE[type] || TYPE_STYLE.notification;

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

// Comment-bearing notifications carry no text (Rotur relays strip the
// payload), so resolve the comment through its thread: `?anchor=` returns
// just that thread. Rendered like a comment section, as a block under the
// headline — never nested inside the headline link, since rendered
// mentions/URLs are links themselves.
const PREVIEW_TYPES = new Set([
    'comment',
    'reply',
    'mention',
    'profile_comment',
    'space_comment',
    'roadmap_comment'
]);

const canPreview = n => {
    if (typeof n.preview === 'string' && n.preview.trim()) return true;
    if (PREVIEW_TYPES.has(n.type)) return true;
    return n.type === 'like_milestone' && n.contentKind === 'comment';
};

const CommentPreview = ({n}) => {
    const inline = typeof n.preview === 'string' && n.preview.trim() ? n.preview : null;
    const [fetched, setFetched] = useState(null);
    useEffect(() => {
        if (inline || !canPreview(n)) return () => {};
        let cancelled = false;
        fetchCommentPreview(n).then(text => {
            if (!cancelled && text) setFetched(text);
        });
        return () => {
            cancelled = true;
        };
    }, [inline, n.id]);
    const text = inline || fetched;
    if (!text) return null;
    return (
        <div className={styles.preview}>
            <RichText text={text} />
        </div>
    );
};

CommentPreview.propTypes = {
    n: PropTypes.object.isRequired
};

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
    case 'project_shared': return <span>shared <strong>{n.projectTitle || 'a project'}</strong> with you</span>;
    case 'love': return n.projectTitle ?
        <span>loved <strong>{n.projectTitle}</strong></span> :
        <span>loved your project</span>;
    case 'comment': return n.pull ? (
        n.projectTitle ?
            <span>commented on <strong>{n.projectTitle}</strong> pr #{n.pull}</span> :
            <span>commented on pr #{n.pull}</span>
    ) : n.projectTitle ?
        <span>commented on <strong>{n.projectTitle}</strong></span> :
        <span>commented on your project</span>;
    case 'profile_comment': return <span>commented on your profile</span>;
    case 'reply': return n.post_id ?
        <span>replied to your post</span> :
        n.pull && n.projectTitle ?
            <span>replied to your comment on <strong>{n.projectTitle}</strong> pr #{n.pull}</span> :
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
        n.pull && n.projectTitle ?
            <span>mentioned you on <strong>{n.projectTitle}</strong> pr #{n.pull}</span> :
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
    case 'contribution': return n.pull && n.projectTitle ?
        <span>sent changes for <strong>{n.projectTitle}</strong> pr #{n.pull}</span> :
        n.projectTitle ?
            <span>sent changes for <strong>{n.projectTitle}</strong></span> :
            <span>sent changes</span>;
    case 'contribution_merged': return n.pull && n.projectTitle ?
        <span>merged changes for <strong>{n.projectTitle}</strong> pr #{n.pull}</span> :
        n.projectTitle ?
            <span>merged changes for <strong>{n.projectTitle}</strong></span> :
            <span>merged changes</span>;
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
    const target = n.projectId && n.pull ? `/project/${n.projectId}/pulls/${n.pull}${commentAnchor(n)}` :
        n.projectId ? `${projectUrl(n.projectId)}${commentAnchor(n)}` : null;
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
                        <Avatar username={sender} size={32} />
                    </Link>
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
            <span className={styles.sysAvatar}><AppWindow size={16} /></span>
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

const FollowingPost = ({post}) => {
    const {text: communityText} = useCommunityText();
    const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likes) || 0;
    const replies = Array.isArray(post.replies) ? post.replies.length : Number(post.replies) || 0;
    return (
        <div className={styles.followingPost}>
            <span className={styles.avatarWrap}>
                <Link to={`/users/${post.user}`}><Avatar username={post.user} size={32} /></Link>
            </span>
            <div className={styles.text}>
                <div className={styles.postHead}>
                    <Link to={`/users/${post.user}`} className={styles.actor}>{post.user}</Link>
                    <span>{communityText('posted')}</span>
                    <time>{timeAgo(post.timestamp)}</time>
                </div>
                <div className={styles.postContent}><RichText text={post.content} /></div>
                <div className={styles.postMeta}>
                    <span><Heart size={13} /> {likes}</span>
                    <span><MessageCircle size={13} /> {replies}</span>
                    <Link to={postUrl(post.id)}>{communityText('Open post ')}<ExternalLink size={12} /></Link>
                </div>
            </div>
        </div>
    );
};

FollowingPost.propTypes = {
    post: PropTypes.object.isRequired
};

const targetFor = (n, viewerName) => {
    if (isMilestoneNotification(n)) return {to: milestoneLink(n)};
    if (GROUP_TYPES.includes(n.type) && groupUrl(n)) return {href: groupUrl(n)};
    if (n.spaceId) return {to: `/spaces/${n.spaceId}`};
    if (n.roadmapId) return {to: `/roadmap#idea-${n.roadmapId}`};
    if (n.projectId && n.pull) return {to: `/project/${n.projectId}/pulls/${n.pull}${commentAnchor(n)}`};
    if (n.projectId) return {to: `${projectUrl(n.projectId)}${commentAnchor(n)}`};
    if (n.type === 'profile_comment' || n.profile) {
        return {to: `/users/${n.profile || viewerName}${commentAnchor(n)}`};
    }
    if (n.type === 'news' && n.newsId) return {to: '/news'};
    return null;
};

// Uniform row: avatar (or a flat tinted icon when there is no actor),
// a metadata line, and a plain comment preview below it.
const NotificationRow = ({n, viewerName}) => {
    const {icon: Icon, color} = typeStyle(n.type);
    const time = timeAgo(n.created || n.timestamp);
    const itemClass = n.read ? styles.item : styles.itemUnread;
    const target = targetFor(n, viewerName);

    let title;
    if (isMilestoneNotification(n)) {
        title = <Link to={milestoneLink(n)} className={styles.body}>{milestoneText(n)}</Link>;
    } else if (SYSTEM_TYPES.includes(n.type)) {
        title = target ?
            <Link to={target.to} className={styles.body}>{describe(n)}</Link> :
            <span className={styles.body}>{describe(n)}</span>;
    } else {
        const actor = actorFor(n);
        if (!actor) return null;
        const body = describe(n);
        const linked = target && target.href ?
            <a href={target.href} target="_blank" rel="noreferrer" className={styles.body}>{body}</a> :
            target ?
                <Link to={target.to} className={styles.body}>{body}</Link> :
                body;
        title = (
            <>
                <Link to={`/users/${actor}`} className={styles.actor}>{actor}</Link>
                {' '}
                {linked}
            </>
        );
    }

    const actor = actorFor(n);
    const visual = actor ? (
        <span className={styles.avatarWrap}>
            <Link to={`/users/${actor}`}>
                <Avatar username={actor} size={32} />
            </Link>
        </span>
    ) : (
        <span
            className={styles.typeIcon}
            style={{color, backgroundColor: `${color}1a`}}
        ><Icon size={16} /></span>
    );

    return (
        <div className={itemClass}>
            {visual}
            <div className={styles.main}>
                <div className={styles.headline}>
                    <span className={styles.title}>{title}</span>
                    <span className={styles.time}>{time}</span>
                </div>
                <CommentPreview n={n} />
            </div>
        </div>
    );
};

NotificationRow.propTypes = {
    n: PropTypes.object.isRequired,
    viewerName: PropTypes.string
};

const Notifications = ({hideHeading}) => {
    const {text: communityText} = useCommunityText();
    const {user, loading, login} = useUser();
    const viewerName = (user && user.username) || '';
    const [items, setItems] = useState(null);
    const [followingPosts, setFollowingPosts] = useState(null);
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
        setFollowingPosts(null);
        setFailed(false);
        if (!viewerName) {
            return () => {};
        }
        let cancelled = false;
        Promise.allSettled([fetchNotifications(), fetchFollowingFeed()]).then(results => {
            if (cancelled) return;
            const [notificationResult, feedResult] = results;
            if (notificationResult.status === 'fulfilled') {
                setItems(current => mergeNotifications(current || [], notificationResult.value));
                markNotificationsRead()
                    .then(marked => {
                        if (!marked || cancelled) return;
                        setItems(markItemsRead);
                        window.dispatchEvent(new Event('mw:notifications-read'));
                    })
                    .catch(() => {});
            } else {
                setItems(current => current || []);
                setFailed(true);
            }
            if (feedResult.status === 'fulfilled') {
                setFollowingPosts(feedResult.value);
            } else {
                setFollowingPosts([]);
                setFailed(true);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [attempt, viewerName]);

    if (loading) {
        return <main className={styles.page}><p className={styles.status}>{communityText('Loading…')}</p></main>;
    }
    if (!user) {
        return (
            <main className={styles.page}>
                <p className={styles.status}>{communityText('Sign in to see your notifications. ')}<Button onClick={login}>{communityText('Sign in')}</Button>
                </p>
            </main>
        );
    }
    const visibleItems = (items || [])
        .filter(item => preferences[categoryForNotification(item.type)] !== false);
    const timeline = interleaveTimeline(visibleItems, followingPosts || []);
    const timelineLoaded = items !== null && followingPosts !== null;

    return (
        <main className={styles.page}>
            {hideHeading ? null : <h1>{communityText('Notifications')}</h1>}
            {failed ? (
                <p className={styles.status}>
                    {!timelineLoaded ? communityText("Couldn't load activity.") : communityText('Some activity may be missing.')}{' '}
                    <Button onClick={() => setAttempt(a => a + 1)}>{communityText('Try again')}</Button>
                </p>
            ) : null}
            {!timelineLoaded ? (!failed ? (
                <p className={styles.status}>{communityText('Loading…')}</p>
            ) : null) : timeline.length ? (
                <div className={styles.list}>
                    {timeline.map(n => {
                        if (n.timelineType === 'following-post') {
                            return <FollowingPost key={`post:${n.id}`} post={n} />;
                        }
                        if (n.type === 'notification') {
                            return (
                                <div key={n.id} className={n.read ? styles.item : styles.itemUnread}>
                                    <GenericNotification n={n} />
                                    <span className={styles.time}>{timeAgo(n.created || n.timestamp)}</span>
                                </div>
                            );
                        }
                        return <NotificationRow key={n.id} n={n} viewerName={viewerName} />;
                    })}
                </div>
            ) : items.length ? (
                <p className={styles.status}>{communityText('Your notification preferences hide all current activity.')}{' '}
                    <Link to="/settings?section=notifications">{communityText('Change preferences')}</Link>
                </p>
            ) : (
                <p className={styles.status}>{communityText('Nothing yet. Notifications and posts from people you follow show up here.')}</p>
            )}
        </main>
    );
};

Notifications.propTypes = {
    hideHeading: PropTypes.bool
};

export {markItemsRead, mergeNotifications};
export default Notifications;
