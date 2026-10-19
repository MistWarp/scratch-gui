import classNames from 'classnames';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {
    AppWindow, AtSign, Bell, ChartColumn, ChevronDown, Coins, ExternalLink, Eye, Flag, Gavel, GitFork, GitMerge,
    GitPullRequest, Heart, Layers3, Lightbulb, Megaphone, MessageCircle, PawPrint, Repeat2, Settings, ShieldAlert,
    Star, UserPlus, Users
} from 'lucide-react';
import {projectUrl} from '../api';
import {
    USERNAME_RE, commentAnchor, describeAction, describeGroup, describeNotification, describeStack,
    groupVerbs, joinList, richTranslator, stripSender, targetFor
} from '../notification-text.jsx';
import {
    clawPostId, excerptOf, groupActor, groupNotifications, isSystemNotification, matchesFilter, notificationTime
} from '../notification-groups.js';
import rotur from '../rotur.js';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import {tabPanelProps} from '../components/SectionTabs.jsx';
import RichText from '../components/RichText.jsx';
import PostProjectCard from '../components/PostProjectCard.jsx';
import {madeWithProject} from '../claw-links.js';
import {useUser} from '../UserContext.jsx';
import {
    fetchFollowingFeed,
    fetchNotifications,
    markNotificationsRead,
    subscribeNotifications
} from '../../lib/rotur/client.js';
import {timeAgo} from '../format';
import {fetchCommentPreview} from '../comment-preview.js';
import {normalizeFollowingPosts, postUrl} from '../following-feed.js';
import styles from './Notifications.module.css';
import {getNotificationPreferences, categoryForNotification} from '../notification-preferences';

const TYPE_ICON = {
    project_shared: Users,
    love: Heart,
    like: Heart,
    pounce: PawPrint,
    like_milestone: Heart,
    follower_milestone: Users,
    post_milestone: Eye,
    claw_weekly_recap: ChartColumn,
    claw_teen_lock: Settings,
    comment: MessageCircle,
    profile_comment: MessageCircle,
    space_comment: MessageCircle,
    roadmap_comment: Lightbulb,
    reply: MessageCircle,
    remix: GitFork,
    repost: Repeat2,
    follow: UserPlus,
    mention: AtSign,
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
    project_hidden: ShieldAlert,
    project_restored: ShieldAlert,
    news: Megaphone,
    report_update: Flag,
    contribution: GitPullRequest,
    contribution_merged: GitMerge,
    space_project: Layers3,
    space_curator_invite: UserPlus,
    space_curator_accepted: Users,
    space_curator_declined: Users,
    space_curator_removed: ShieldAlert,
    challenge_judge_invite: Gavel,
    challenge_judge_accepted: Gavel,
    challenge_join: UserPlus,
    project_feedback: Lightbulb,
    project_review: Star,
    notification: AppWindow
};

const iconFor = type => TYPE_ICON[type] || AppWindow;

const FILTERS = [
    {key: 'all', label: 'All'},
    {key: 'mentions', label: 'Mentions'},
    {key: 'claw', label: 'Claw'},
    {key: 'projects', label: 'Projects'}
];

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
    if (n.post_id) return false;
    if (PREVIEW_TYPES.has(n.type)) return true;
    return n.type === 'like_milestone' && n.contentKind === 'comment';
};

const inlinePreview = n => {
    if (typeof n.preview === 'string' && n.preview.trim()) return n.preview;
    if (n.post_id && typeof n.content === 'string' && n.content.trim()) return n.content;
    return null;
};

const CommentPreview = ({n, plain}) => {
    const inline = inlinePreview(n);
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
    if (plain) return <span className={styles.detailExcerpt}>{text}</span>;
    return (
        <div className={styles.excerpt}>
            <RichText text={text} />
        </div>
    );
};

CommentPreview.propTypes = {
    n: PropTypes.object.isRequired,
    plain: PropTypes.bool
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

const genericSender = n => {
    const sender = n.title || n.from || n.actor || '';
    const isUser = Boolean(sender) && USERNAME_RE.test(sender) &&
        sender.toLowerCase() !== 'mistwarp' &&
        sender.toLowerCase() !== String(n.source || '').toLowerCase();
    return {sender, isUser};
};

const genericTarget = n => {
    if (n.projectId && n.pull) return {to: `/project/${n.projectId}/pulls/${n.pull}${commentAnchor(n)}`};
    if (n.projectId) return {to: `${projectUrl(n.projectId)}${commentAnchor(n)}`};
    if (typeof n.source === 'string' && /^https?:\/\//.test(n.source)) return {href: n.source};
    return null;
};

const linkTo = (target, className, children) => {
    if (target && target.href) {
        return <a href={target.href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
    }
    if (target) return <Link to={target.to} className={className}>{children}</Link>;
    return <span>{children}</span>;
};

const linkWrap = (target, className) => children => linkTo(target, className, children);

const postSnippets = new Map();

const loadSnippet = id => {
    if (!postSnippets.has(id)) {
        postSnippets.set(id, Promise.resolve()
            .then(() => rotur.post(id))
            .then(post => (post && typeof post.content === 'string' ? post.content.replace(/\s+/g, ' ').trim() : ''))
            .catch(() => ''));
    }
    return postSnippets.get(id);
};

const PostSnippet = ({id}) => {
    const [text, setText] = useState('');
    useEffect(() => {
        let active = true;
        loadSnippet(id).then(value => {
            if (active) setText(value);
        });
        return () => {
            active = false;
        };
    }, [id]);
    return text ? <span className={styles.detailPost}>{text}</span> : null;
};

PostSnippet.propTypes = {
    id: PropTypes.string.isRequired
};

const ActorLink = ({name}) => (
    <Link to={`/users/${name}`} className={classNames(styles.actor, styles.raised)}>{name}</Link>
);

ActorLink.propTypes = {
    name: PropTypes.string.isRequired
};

const ActorAvatar = ({name}) => (
    <Link to={`/users/${name}`} className={styles.raised} tabIndex={-1} aria-hidden="true">
        <Avatar username={name} size={24} />
    </Link>
);

ActorAvatar.propTypes = {
    name: PropTypes.string.isRequired
};

const TypeIcon = ({type}) => {
    const Icon = iconFor(type);
    return <span className={styles.typeIcon}><Icon size={14} aria-hidden="true" /></span>;
};

TypeIcon.propTypes = {
    type: PropTypes.string
};

const ActionIcons = ({types}) => (
    <span className={styles.icons} aria-hidden="true">
        {types.map(type => {
            const Icon = iconFor(type);
            return <Icon key={type} size={14} />;
        })}
    </span>
);

ActionIcons.propTypes = {
    types: PropTypes.arrayOf(PropTypes.string).isRequired
};

const Toggle = ({open, onToggle, stretch, label}) => (
    <button
        type="button"
        className={classNames(styles.toggle, stretch ? styles.stretch : styles.raised, {[styles.toggleOpen]: open})}
        aria-expanded={open}
        aria-label={label}
        onClick={onToggle}
    >
        <ChevronDown size={16} aria-hidden="true" />
    </button>
);

Toggle.propTypes = {
    open: PropTypes.bool,
    onToggle: PropTypes.func.isRequired,
    stretch: PropTypes.bool,
    label: PropTypes.string.isRequired
};

const Row = ({unread, visual, sentence, excerpt, icons, time, toggle, details, cover, sentenceId}) => {
    const {text: communityText} = useCommunityText();
    return (
        <li className={classNames(styles.row, {[styles.unread]: unread})} data-notification-row="">
            <div className={styles.line}>
                {cover}
                {unread ? (
                    <span className={styles.dot}><span className={styles.srOnly}>{communityText('New')}</span></span>
                ) : null}
                <span className={styles.visual}>{visual}</span>
                <div className={styles.main}>
                    <p className={styles.sentence} id={sentenceId}>{sentence}</p>
                    {excerpt}
                </div>
                <span className={styles.meta}>
                    {icons}
                    <time className={styles.time} dateTime={time ? new Date(time).toISOString() : null}>
                        {timeAgo(time)}
                    </time>
                    {toggle || <span className={styles.toggleSlot} aria-hidden="true" />}
                </span>
            </div>
            {details}
        </li>
    );
};

Row.propTypes = {
    unread: PropTypes.bool,
    visual: PropTypes.node,
    sentence: PropTypes.node,
    excerpt: PropTypes.node,
    icons: PropTypes.node,
    time: PropTypes.number,
    toggle: PropTypes.node,
    details: PropTypes.node,
    cover: PropTypes.node,
    sentenceId: PropTypes.string
};

const GenericRow = ({n, unread}) => {
    const {text: communityText} = useCommunityText();
    const {sender, isUser} = genericSender(n);
    const raw = n.body || n.content || '';
    if (!isUser && !sender && !raw) return null;
    const text = isUser ? stripSender(sender, raw) : raw;
    const showTitle = !isUser && Boolean(sender) && sender !== text;
    const t = richTranslator(communityText);
    const body = text || sender;
    const message = n.channelName ?
        t('{message} in #{channel}', {message: linkify(body), channel: n.channelName}) :
        linkify(body);
    const showSource = Boolean(n.source) && n.source !== 'mistwarp' && !/^https?:\/\//.test(String(n.source));
    const target = genericTarget(n);
    const sentenceId = `notification-${n.id}`;
    const cover = target ? linkWrap(target, styles.cover)(null) : null;
    return (
        <Row
            unread={unread}
            time={notificationTime(n)}
            sentenceId={sentenceId}
            cover={cover ? React.cloneElement(cover, {'aria-labelledby': sentenceId}) : null}
            visual={isUser ? <ActorAvatar name={sender} /> : <TypeIcon type="notification" />}
            sentence={(
                <>
                    {isUser ? <><ActorLink name={sender} />{' '}</> : null}
                    {showTitle ? <><strong className={styles.strong}>{sender}</strong>{' '}</> : null}
                    <span className={styles.message}>{message}</span>
                    {showSource ? <span className={styles.sourceTag}>{n.source}</span> : null}
                </>
            )}
        />
    );
};

GenericRow.propTypes = {
    n: PropTypes.object.isRequired,
    unread: PropTypes.bool
};

const SingleRow = ({n, viewerName, unread}) => {
    const {text: communityText} = useCommunityText();
    if (n.type === 'notification') return <GenericRow n={n} unread={unread} />;
    const system = isSystemNotification(n);
    if (!system && !groupActor(n)) return null;
    const actor = system ? null : groupActor(n);
    const target = targetFor(n, viewerName);
    const t = richTranslator(communityText, linkWrap(target, target ? styles.stretch : null));
    const sentence = describeNotification(n, t, actor ? <ActorLink name={actor} /> : null);
    return (
        <Row
            unread={unread}
            time={notificationTime(n)}
            visual={actor ? <ActorAvatar name={actor} /> : <TypeIcon type={n.type} />}
            sentence={sentence}
            excerpt={<CommentPreview n={n} />}
            icons={actor ? <ActionIcons types={[n.type]} /> : null}
        />
    );
};

SingleRow.propTypes = {
    n: PropTypes.object.isRequired,
    viewerName: PropTypes.string,
    unread: PropTypes.bool
};

const ClusterRow = ({row, viewerName, unread, open, onToggle}) => {
    const {text: communityText, locale} = useCommunityText();
    const single = row.targets.length === 1;
    const target = single ? targetFor(row.items[0], viewerName) : null;
    const t = richTranslator(communityText, target ? linkWrap(target, styles.stretch) : null);
    const verbs = groupVerbs(communityText);
    const actions = joinList(row.types.map(type => verbs[type]), locale);
    const sentence = describeGroup(row, t, <ActorLink name={row.actor} />, actions);
    const plain = richTranslator(communityText);
    const details = open ? (
        <ul className={styles.details}>
            {row.items.map(item => {
                const itemTarget = targetFor(item, viewerName);
                const Icon = iconFor(item.type);
                const excerpt = excerptOf(item);
                const content = (
                    <>
                        <Icon size={14} aria-hidden="true" className={styles.detailIcon} />
                        <span className={styles.detailText}>
                            <span className={styles.detailLabel}>{describeAction(item, plain)}</span>
                            {excerpt ? <span className={styles.detailExcerpt}>{excerpt}</span> : null}
                            {!excerpt && clawPostId(item) ? <PostSnippet id={clawPostId(item)} /> : null}
                            {!excerpt && item.type === 'comment' ? <CommentPreview n={item} plain /> : null}
                        </span>
                        <time className={styles.time}>{timeAgo(notificationTime(item))}</time>
                    </>
                );
                return (
                    <li key={item.id || notificationTime(item)}>
                        {itemTarget ? linkWrap(itemTarget, styles.detail)(content) : (
                            <span className={styles.detail}>{content}</span>
                        )}
                    </li>
                );
            })}
        </ul>
    ) : null;
    const excerpt = row.excerpt ? (
        <div className={styles.excerpt}><RichText text={row.excerpt} /></div>
    ) : (row.conversation ? <CommentPreview n={row.conversation} /> : null);
    return (
        <Row
            unread={unread}
            time={row.time}
            visual={<ActorAvatar name={row.actor} />}
            sentence={sentence}
            excerpt={excerpt}
            icons={<ActionIcons types={row.types} />}
            toggle={(
                <Toggle
                    open={open}
                    onToggle={onToggle}
                    stretch={!target}
                    label={open ?
                        communityText('Hide details') :
                        communityText('Show all {count}', {count: row.items.length})}
                />
            )}
            details={details}
        />
    );
};

ClusterRow.propTypes = {
    row: PropTypes.object.isRequired,
    viewerName: PropTypes.string,
    unread: PropTypes.bool,
    open: PropTypes.bool,
    onToggle: PropTypes.func.isRequired
};

const StackRow = ({row, viewerName, unread, open, onToggle}) => {
    const {text: communityText} = useCommunityText();
    const target = targetFor(row.items[0], viewerName);
    const t = richTranslator(communityText, linkWrap(target, target ? styles.stretch : null));
    const other = <strong className={styles.strong}>{row.actors[1]}</strong>;
    const sentence = describeStack(row, t, <ActorLink name={row.actors[0]} />, other);
    const seen = new Set();
    const people = row.items.filter(item => {
        const name = String(groupActor(item)).toLowerCase();
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
    });
    const details = open ? (
        <ul className={styles.details}>
            {people.map(item => {
                const name = groupActor(item);
                return (
                    <li key={item.id || name}>
                        <Link to={`/users/${name}`} className={styles.detail}>
                            <Avatar username={name} size={20} />
                            <span className={styles.detailText}>
                                <span className={styles.detailName}>{name}</span>
                            </span>
                            <time className={styles.time}>{timeAgo(notificationTime(item))}</time>
                        </Link>
                    </li>
                );
            })}
        </ul>
    ) : null;
    return (
        <Row
            unread={unread}
            time={row.time}
            visual={(
                <span className={styles.stack} aria-hidden="true">
                    {row.actors.slice(0, 3).map(name => <Avatar key={name} username={name} size={24} />)}
                </span>
            )}
            sentence={sentence}
            icons={<ActionIcons types={[row.type]} />}
            toggle={(
                <Toggle
                    open={open}
                    onToggle={onToggle}
                    stretch={!target}
                    label={open ? communityText('Hide people') : communityText('Show people')}
                />
            )}
            details={details}
        />
    );
};

StackRow.propTypes = {
    row: PropTypes.object.isRequired,
    viewerName: PropTypes.string,
    unread: PropTypes.bool,
    open: PropTypes.bool,
    onToggle: PropTypes.func.isRequired
};

const FollowingPost = ({post}) => {
    const {text: communityText} = useCommunityText();
    const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likes) || 0;
    const replies = Array.isArray(post.replies) ? post.replies.length : Number(post.replies) || 0;
    const project = madeWithProject(post);
    return (
        <li className={styles.followingPost}>
            <span className={styles.postAvatar}>
                <Link to={`/users/${post.user}`}><Avatar username={post.user} size={32} /></Link>
            </span>
            <div className={styles.main}>
                <div className={styles.postHead}>
                    <Link to={`/users/${post.user}`} className={styles.actor}>{post.user}</Link>
                    <span>{communityText('posted')}</span>
                    <time>{timeAgo(post.timestamp)}</time>
                </div>
                <div className={styles.postContent}><RichText text={String(post.content || '').trim()} /></div>
                {project ? <PostProjectCard project={project} compact /> : null}
                <div className={styles.postMeta}>
                    {likes ? <span><Heart size={13} aria-hidden="true" /> {likes}</span> : null}
                    {replies ? <span><MessageCircle size={13} aria-hidden="true" /> {replies}</span> : null}
                    <Link to={postUrl(post.id)}>{communityText('Open post')}<ExternalLink size={12} /></Link>
                </div>
            </div>
        </li>
    );
};

FollowingPost.propTypes = {
    post: PropTypes.object.isRequired
};

const filterFrom = value => (FILTERS.some(filter => filter.key === value) ? value : 'all');

const Notifications = ({hideHeading}) => {
    const {text: communityText} = useCommunityText();
    const {user, loading, login} = useUser();
    const viewerName = (user && user.username) || '';
    const [items, setItems] = useState(null);
    const [followingPosts, setFollowingPosts] = useState(null);
    const [preferences, setPreferences] = useState(getNotificationPreferences());
    const [searchParams, setSearchParams] = useSearchParams();
    const filter = filterFrom(searchParams.get('filter'));
    const [expanded, setExpanded] = useState(() => new Set());

    useEffect(() => {
        const update = () => setPreferences(getNotificationPreferences());
        window.addEventListener('mw:notification-preferences', update);
        return () => window.removeEventListener('mw:notification-preferences', update);
    }, []);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [newIds, setNewIds] = useState(() => new Set());
    const isNew = useCallback(n => !n.read || newIds.has(n.id), [newIds]);

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

    const visibleItems = useMemo(() => (items || [])
        .filter(item => preferences[categoryForNotification(item.type)] !== false), [items, preferences]);

    const timeline = useMemo(() => {
        const rows = groupNotifications(visibleItems.filter(item => matchesFilter(item, filter)),
            {cluster: filter !== 'mentions'});
        const posts = filter === 'all' || filter === 'claw' ?
            normalizeFollowingPosts(followingPosts || []).map(post => ({
                kind: 'post', key: `post:${post.id}`, post, time: post.timestamp
            })) : [];
        return [...rows, ...posts]
            .map((entry, index) => ({entry, index}))
            .sort((a, b) => (b.entry.time - a.entry.time) || (a.index - b.index))
            .map(({entry}) => entry);
    }, [visibleItems, followingPosts, filter]);

    const toggle = useCallback(key => setExpanded(current => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
    }), []);

    const changeFilter = useCallback(key => {
        setSearchParams(current => {
            const next = new URLSearchParams(current);
            if (key === 'all') next.delete('filter');
            else next.set('filter', key);
            return next;
        }, {replace: true});
    }, [setSearchParams]);

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
    const timelineLoaded = items !== null && followingPosts !== null;

    const renderEntry = entry => {
        if (entry.kind === 'post') return <FollowingPost key={entry.key} post={entry.post} />;
        const unread = entry.items.some(isNew);
        if (entry.kind === 'actor') {
            return (
                <ClusterRow
                    key={entry.key}
                    row={entry}
                    viewerName={viewerName}
                    unread={unread}
                    open={expanded.has(entry.key)}
                    onToggle={() => toggle(entry.key)}
                />
            );
        }
        if (entry.kind === 'stack') {
            return (
                <StackRow
                    key={entry.key}
                    row={entry}
                    viewerName={viewerName}
                    unread={unread}
                    open={expanded.has(entry.key)}
                    onToggle={() => toggle(entry.key)}
                />
            );
        }
        return <SingleRow key={entry.key} n={entry.items[0]} viewerName={viewerName} unread={unread} />;
    };

    let body;
    if (!timelineLoaded) {
        body = failed ? null : <StatusMessage />;
    } else if (timeline.length) {
        body = <ol className={styles.list}>{timeline.map(renderEntry)}</ol>;
    } else if (filter !== 'all' && (items.length || (followingPosts || []).length)) {
        body = <p className={styles.emptyFilter}>{communityText('Nothing here yet.')}</p>;
    } else if (items.length) {
        body = (
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
        );
    } else {
        body = (
            <EmptyState icon={Bell} title={communityText('Nothing yet')}>
                {communityText('Notifications and posts from people you follow show up here.')}
            </EmptyState>
        );
    }

    return (
        <main className={styles.page}>
            {hideHeading ? null : (
                <PageHeader compact className={styles.header} title={communityText('Notifications')} />
            )}
            <UnderlineTabs
                items={FILTERS}
                value={filter}
                onChange={changeFilter}
                ariaLabel="Filter notifications"
                idPrefix="notifications"
                className={styles.tabs}
            />
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
            <div {...tabPanelProps('notifications', filter)} className={styles.panel}>
                {body}
            </div>
        </main>
    );
};

Notifications.propTypes = {
    hideHeading: PropTypes.bool
};

export {markItemsRead, mergeNotifications};
export default Notifications;
