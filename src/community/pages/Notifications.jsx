import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {isMilestoneNotification} from '../milestone-notifications.js';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {
    AppWindow, AtSign, Bell, Coins, ExternalLink, Flag, Gavel, GitFork, Heart, Megaphone,
    MessageCircle, Reply, ShieldAlert, UserPlus, Users, GitPullRequest, GitMerge, Layers3,
    Lightbulb, Star
} from 'lucide-react';
import {projectUrl} from '../api';
import {
    SYSTEM_TYPES, USERNAME_RE, actorFor, commentAnchor, describeNotification, richTranslator, stripSender, targetFor
} from '../notification-text.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
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

// Generic Rotur notifications (any app's /v2/notify/ push) arrive as
// type "notification" with title/body/from/source. Title holds the sender
// for MistWarp; other apps may put an app name or message summary there.
const GenericNotification = ({n}) => {
    const {text: communityText} = useCommunityText();
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
    const t = richTranslator(communityText);
    const message = body => (n.channelName ?
        t('{message} in #{channel}', {message: linkify(body), channel: n.channelName}) :
        linkify(body));
    const target = n.projectId && n.pull ? `/project/${n.projectId}/pulls/${n.pull}${commentAnchor(n)}` :
        n.projectId ? `${projectUrl(n.projectId)}${commentAnchor(n)}` : null;
    const sourceLink = typeof n.source === 'string' && /^https?:\/\//.test(n.source);
    const showSource = Boolean(n.source) && n.source !== 'mistwarp' && !sourceLink;

    let content;
    if (showTitle) {
        content = (
            <>
                <span className={styles.senderTitle}>{sender}</span>
                {message(text)}
            </>
        );
    } else {
        content = <>{message(text || sender)}</>;
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
                    <Link to={postUrl(post.id)}>{communityText('Open post')}<ExternalLink size={12} /></Link>
                </div>
            </div>
        </div>
    );
};

FollowingPost.propTypes = {
    post: PropTypes.object.isRequired
};

// Uniform row: avatar (or a flat tinted icon when there is no actor),
// a metadata line, and a plain comment preview below it.
const NotificationRow = ({n, viewerName, isNew}) => {
    const {text: communityText} = useCommunityText();
    const {icon: Icon, color} = typeStyle(n.type);
    const time = timeAgo(n.created || n.timestamp);
    const itemClass = isNew ? styles.itemUnread : styles.item;
    const target = targetFor(n, viewerName);
    const system = isMilestoneNotification(n) || SYSTEM_TYPES.includes(n.type);
    if (!system && !actorFor(n)) return null;

    // The sentence links to its target, apart from the actor's own link.
    const wrap = target && target.href ?
        children => <a href={target.href} target="_blank" rel="noreferrer" className={styles.body}>{children}</a> :
        target ?
            children => <Link to={target.to} className={styles.body}>{children}</Link> :
            children => <span className={styles.body}>{children}</span>;
    const actorLink = system ? null : (
        <Link to={`/users/${actorFor(n)}`} className={styles.actor}>{actorFor(n)}</Link>
    );
    const title = describeNotification(n, richTranslator(communityText, wrap), actorLink);

    const actor = system ? null : actorFor(n);
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
    viewerName: PropTypes.string,
    isNew: PropTypes.bool
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
    // Ids that were unread when they loaded. They stay highlighted for the
    // rest of the visit even after the inbox is marked read.
    const [newIds, setNewIds] = useState(() => new Set());
    const isNew = n => !n.read || newIds.has(n.id);

    useEffect(() => {
        setNewIds(new Set());
    }, [viewerName]);

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
                const unread = (notificationResult.value || []).filter(item => item && item.id && !item.read);
                if (unread.length) setNewIds(current => new Set([...current, ...unread.map(item => item.id)]));
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
        return <main className={styles.page}><StatusMessage /></main>;
    }
    if (!user) {
        return (
            <main className={styles.page}>
                <SignInPrompt onSignIn={login}>{communityText('Sign in to see your notifications.')}</SignInPrompt>
            </main>
        );
    }
    const visibleItems = (items || [])
        .filter(item => preferences[categoryForNotification(item.type)] !== false);
    const timeline = interleaveTimeline(visibleItems, followingPosts || []);
    const timelineLoaded = items !== null && followingPosts !== null;

    return (
        <main className={styles.page}>
            {hideHeading ? null : <PageHeader icon={Bell} title={communityText('Notifications')} />}
            {failed ? (
                !timelineLoaded ? (
                    <StatusMessage error onRetry={() => setAttempt(a => a + 1)}>
                        {communityText("Couldn't load activity.")}
                    </StatusMessage>
                ) : (
                    <Notice
                        variant="warning"
                        className={styles.notice}
                        action={<Button onClick={() => setAttempt(a => a + 1)}>{communityText('Try again')}</Button>}
                    >
                        {communityText('Some activity may be missing.')}
                    </Notice>
                )
            ) : null}
            {!timelineLoaded ? (!failed ? (
                <StatusMessage />
            ) : null) : timeline.length ? (
                <div className={styles.list}>
                    {timeline.map(n => {
                        if (n.timelineType === 'following-post') {
                            return <FollowingPost key={`post:${n.id}`} post={n} />;
                        }
                        if (n.type === 'notification') {
                            return (
                                <div key={n.id} className={isNew(n) ? styles.itemUnread : styles.item}>
                                    <GenericNotification n={n} />
                                    <span className={styles.time}>{timeAgo(n.created || n.timestamp)}</span>
                                </div>
                            );
                        }
                        return <NotificationRow key={n.id} n={n} viewerName={viewerName} isNew={isNew(n)} />;
                    })}
                </div>
            ) : items.length ? (
                <EmptyState
                    icon={Bell}
                    title={communityText('Nothing to show')}
                    action={(
                        <Button as={Link} to="/settings?section=notifications">
                            {communityText('Change preferences')}
                        </Button>
                    )}
                >
                    {communityText('Your notification preferences hide all current activity.')}
                </EmptyState>
            ) : (
                <EmptyState icon={Bell} title={communityText('Nothing yet')}>
                    {communityText('Notifications and posts from people you follow show up here.')}
                </EmptyState>
            )}
        </main>
    );
};

Notifications.propTypes = {
    hideHeading: PropTypes.bool
};

export {markItemsRead, mergeNotifications};
export default Notifications;
