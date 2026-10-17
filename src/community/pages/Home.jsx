/* eslint-disable max-len */
import {isMilestoneNotification} from '../milestone-notifications.js';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Bell, GitFork, Globe, Heart, MessageCircle, Plus, Star} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import rotur from '../rotur';
import {fetchFollowingFeed, fetchNotifications} from '../../lib/rotur/client.js';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import ProjectThumbnail from '../components/ProjectThumbnail.jsx';
import ScratchImport from '../components/ScratchImport.jsx';
import {FeaturedGames, SuggestedCreators} from '../components/HomeDiscovery.jsx';
import {ContinueProjects, DeviceBackup, Jams, StarterGallery} from '../components/HomeWorkspace.jsx';
import loadProjectPreview from '../project-preview.js';
import {track} from '../analytics.js';
import {useCommunityIntl} from '../i18n.jsx';
import {categoryForNotification, getNotificationPreferences} from '../notification-preferences';
import {normalizeFollowingPosts, postUrl, timestampMs} from '../following-feed.js';
import {
    SYSTEM_TYPES, USERNAME_RE, actorFor, describeNotification, richTranslator, targetFor
} from '../notification-text.jsx';
import styles from './Home.module.css';

const ACTIVITY_ICONS = {love: Heart, favorite: Star, share: Globe, remix: GitFork, review: Star};

const describeActivity = (item, t, actor) => {
    const project = <strong>{item.projectTitle}</strong>;
    switch (item.type) {
    case 'love': return t('{actor} loved {project}', {actor, project});
    case 'favorite': return t('{actor} favorited {project}', {actor, project});
    case 'share': return t('{actor} shared {project}', {actor, project});
    case 'remix': return t('{actor} remixed {project}', {actor, project: <strong>{item.parentTitle || item.projectTitle}</strong>});
    case 'review': return t('{actor} rated {project} {rating} out of 5', {actor, project, rating: Number(item.rating) || 0});
    default: return t('{actor} posted an update', {actor});
    }
};

const ListSkeleton = () => <div className={styles.listSkeleton} />;

const QuietLink = ({to, children}) => (
    <Link
        className={styles.quietLink}
        to={to}
    >{children}</Link>
);

// Sessions from before following:view was asked for can't read the list.
const loadFollowedActivity = () => rotur.myFollowing().catch(() => ({following: []})).then(data => {
    const following = data.following || [];
    return following.length ? api.activity(following).then(result => ({following, activity: result.activity || []})) :
        {following, activity: []};
});

const FollowingGames = ({viewerName}) => {
    const {text: communityText} = useCommunityIntl();
    const [state, setState] = useState(null);
    useEffect(() => {
        let active = true;
        setState(null);
        loadFollowedActivity(viewerName)
            .then(({following, activity}) => {
                const seen = new Set();
                const shares = activity
                    .filter(item => item.type === 'share' && item.projectId && !seen.has(item.projectId) && seen.add(item.projectId))
                    .sort((left, right) => timestampMs(right.created) - timestampMs(left.created))
                    .slice(0, 4);
                return Promise.all(shares.map(item => loadProjectPreview({id: item.projectId})
                    .then(project => ({item, project}))))
                    .then(games => ({following, games: games.filter(game => game.project)}));
            })
            .then(result => active && setState(result))
            .catch(() => active && setState({following: [], games: [], failed: true}));
        return () => {
            active = false;
        };
    }, [viewerName]);
    if (state && !state.failed && !state.following.length) {
        return (
            <section
                className={styles.panel}
                aria-labelledby="home-creators-heading"
            >
                <SectionHeading
                    id="home-creators-heading"
                    title={communityText('Creators to follow')}
                    actions={<QuietLink to="/leaderboard">{communityText('See all')}</QuietLink>}
                />
                <SuggestedCreators
                    viewerName={viewerName}
                    limit={4}
                />
            </section>
        );
    }
    return (
        <section
            className={styles.panel}
            aria-labelledby="home-following-games-heading"
        >
            <SectionHeading
                id="home-following-games-heading"
                title={communityText('New from people you follow')}
            />
            {state === null ? <ListSkeleton /> : null}
            {state && state.failed ? <StatusMessage compact>{communityText("Couldn't load activity.")}</StatusMessage> : null}
            {state && !state.failed && !state.games.length ? (
                <p className={styles.empty}>
                    {communityText('Nobody you follow has shared a game lately.')}
                    {' '}
                    <QuietLink to="/explore?sort=recent">{communityText('See new games')}</QuietLink>
                </p>
            ) : null}
            {state && state.games.length ? (
                <ul className={styles.list}>
                    {state.games.map(({item, project}) => (
                        <li
                            key={project.id}
                            className={styles.row}
                        >
                            <Link
                                className={styles.rowThumb}
                                to={projectUrl(project)}
                                tabIndex={-1}
                                aria-hidden="true"
                            >
                                <ProjectThumbnail
                                    project={project}
                                    fallbackClassName={styles.thumbFallback}
                                    lazy
                                />
                            </Link>
                            <div className={styles.rowText}>
                                <h3><Link to={projectUrl(project)}>{project.title}</Link></h3>
                                <p>
                                    <Link to={`/users/${project.owner}`}>{project.owner}</Link>
                                    <span aria-hidden="true">{' · '}</span>
                                    {timeAgo(item.created)}
                                </p>
                            </div>
                            <Button
                                as={Link}
                                size="small"
                                to={projectUrl(project)}
                                className={styles.rowAction}
                            >{communityText('Play')}</Button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
};

const ActivityRow = ({avatar, icon: Icon, children, time}) => (
    <li className={styles.activityItem}>
        {avatar}
        <span className={styles.activityText}>
            {Icon ? <Icon
                size={13}
                aria-hidden="true"
                className={styles.activityIcon}
            /> : null}
            {children}
        </span>
        <span className={styles.activityTime}>{time}</span>
    </li>
);

export const FriendsSection = ({user}) => {
    const {text: communityText} = useCommunityIntl();
    const viewerName = (user && user.username) || '';
    const [items, setItems] = useState(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setFailed(false);
        if (!viewerName) {
            setItems([]);
            return () => {};
        }
        setItems(null);
        const projectActivity = loadFollowedActivity(viewerName)
            .then(data => data.activity.filter(item => item.type !== 'share').map(item => ({...item, timelineType: 'project-activity'})));
        Promise.allSettled([projectActivity, fetchFollowingFeed(40)]).then(results => {
            if (!active) return;
            const activity = results[0].status === 'fulfilled' ? results[0].value : [];
            const posts = results[1].status === 'fulfilled' ? normalizeFollowingPosts(results[1].value) : [];
            setFailed(results.every(result => result.status === 'rejected'));
            setItems([...activity, ...posts].sort((left, right) => (
                timestampMs(right.created || right.timestamp) - timestampMs(left.created || left.timestamp)
            )));
        });
        return () => {
            active = false;
        };
    }, [attempt, viewerName]);
    return (
        <section
            className={styles.panel}
            aria-labelledby="home-friends-heading"
        >
            <SectionHeading
                id="home-friends-heading"
                title={communityText('From people you follow')}
                actions={<QuietLink to="/posts">{communityText('See all')}</QuietLink>}
            />
            {!items && !failed ? <ListSkeleton /> : null}
            {failed ? <StatusMessage
                compact
                error
                onRetry={() => setAttempt(value => value + 1)}
            >{communityText("Couldn't load activity.")}</StatusMessage> : null}
            {items && !items.length && !failed ? (
                <p className={styles.empty}>{communityText('Find a project you like and follow its creator.')}</p>
            ) : null}
            {items && items.length ? (
                <ul className={styles.list}>
                    {items.slice(0, 5).map((item, index) => {
                        const isPost = item.timelineType === 'following-post';
                        const name = isPost ? item.user : item.actor;
                        const actor = (<Link
                            to={`/users/${name}`}
                            className={styles.activityActor}
                        >{name}</Link>);
                        const to = isPost ? postUrl(item.id) : item.projectId ? projectUrl(item.projectId) : null;
                        const t = richTranslator(communityText, to ? children => <Link to={to}>{children}</Link> : null);
                        return (
                            <ActivityRow
                                key={isPost ? `post:${item.id}` : `${item.actor}-${item.created}-${index}`}
                                avatar={<Link to={`/users/${name}`}><Avatar
                                    username={name}
                                    size={32}
                                /></Link>}
                                icon={isPost ? MessageCircle : (ACTIVITY_ICONS[item.type] || Heart)}
                                time={timeAgo(item.created || item.timestamp)}
                            >
                                {isPost ?
                                    t('{actor} posted: {post}', {actor, post: item.content || communityText('View post')}) :
                                    describeActivity(item, t, actor)}
                            </ActivityRow>
                        );
                    })}
                </ul>
            ) : null}
        </section>
    );
};

export const NotificationsSection = ({user}) => {
    const {text: communityText} = useCommunityIntl();
    const viewerName = (user && user.username) || '';
    const [items, setItems] = useState(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [preferences, setPreferences] = useState(getNotificationPreferences());
    useEffect(() => {
        const update = () => setPreferences(getNotificationPreferences());
        window.addEventListener('mw:notification-preferences', update);
        return () => window.removeEventListener('mw:notification-preferences', update);
    }, []);
    useEffect(() => {
        let active = true;
        setFailed(false);
        if (!viewerName) {
            setItems([]);
            return () => {};
        }
        setItems(null);
        fetchNotifications()
            .then(data => active && setItems(data || []))
            .catch(() => active && setFailed(true));
        return () => {
            active = false;
        };
    }, [attempt, viewerName]);
    const visibleItems = (items || [])
        .filter(item => preferences[categoryForNotification(item.type)] !== false);
    return (
        <section
            className={styles.panel}
            aria-labelledby="home-notifications-heading"
        >
            <SectionHeading
                id="home-notifications-heading"
                title={communityText('Notifications')}
                actions={<QuietLink to="/notifications">{communityText('See all')}</QuietLink>}
            />
            {user && !items && !failed ? <ListSkeleton /> : null}
            {failed ? <StatusMessage
                compact
                error
                onRetry={() => setAttempt(value => value + 1)}
            >{communityText("Couldn't load notifications.")}</StatusMessage> : null}
            {items && !items.length && user ? <p className={styles.empty}>{communityText('Nothing new yet')}</p> : null}
            {items && items.length && !visibleItems.length ? (
                <p className={styles.empty}>
                    {communityText('Your notification preferences hide all recent activity.')}
                    {' '}
                    <QuietLink to="/settings?section=notifications">{communityText('Change preferences')}</QuietLink>
                </p>
            ) : null}
            {visibleItems.length ? (
                <ul className={styles.list}>
                    {visibleItems.slice(0, 5).map((item, index) => {
                        const system = isMilestoneNotification(item) || SYSTEM_TYPES.includes(item.type);
                        const name = system ? null : actorFor(item);
                        const profile = name && USERNAME_RE.test(name) ? name : null;
                        const target = targetFor(item, viewerName) || {to: profile ? `/users/${profile}` : '/notifications'};
                        const wrap = target.href ?
                            children => (<a
                                href={target.href}
                                target="_blank"
                                rel="noreferrer"
                            >{children}</a>) :
                            children => <Link to={target.to}>{children}</Link>;
                        const actor = profile ?
                            (<Link
                                to={`/users/${profile}`}
                                className={styles.activityActor}
                            >{profile}</Link>) :
                            <strong className={styles.activityActor}>{name || 'MistWarp'}</strong>;
                        const avatar = profile ? (<Avatar
                            username={profile}
                            size={32}
                        />) : <span className={styles.notificationAvatar}><Bell size={14} /></span>;
                        const avatarLink = profile ? `/users/${profile}` : target.to;
                        return (
                            <ActivityRow
                                key={item.id || index}
                                avatar={avatarLink ? <Link to={avatarLink}>{avatar}</Link> : avatar}
                                time={timeAgo(item.created || item.timestamp)}
                            >
                                {describeNotification(item, richTranslator(communityText, wrap), actor)}
                            </ActivityRow>
                        );
                    })}
                </ul>
            ) : null}
        </section>
    );
};

const Intro = ({login}) => {
    const {text: communityText} = useCommunityIntl();
    return (
        <section className={styles.intro}>
            <h1>{communityText('Make games with blocks, and play what others make')}</h1>
            <p>{communityText('MistWarp is a free block-based editor with a community of games, jams, and creators.')}</p>
            <div className={styles.actions}>
                <Button
                    as="a"
                    variant="primary"
                    href={editorUrl()}
                    onClick={() => track('start_creating', {source: 'home'})}
                >
                    <Plus
                        size={16}
                        aria-hidden="true"
                    />
                    {communityText('Start creating')}
                </Button>
                <Button onClick={login}>{communityText('Sign in')}</Button>
            </div>
            <DeviceBackup className={styles.introBackup} />
        </section>
    );
};

const Home = () => {
    const {text: communityText} = useCommunityIntl();
    const {user, login, loading} = useUser();
    const viewerName = (user && user.username) || '';
    const [projectCount, setProjectCount] = useState(null);
    const signedIn = Boolean(!loading && user);
    const signedOut = !loading && !user;
    const showStarters = Boolean(signedIn && projectCount && projectCount.username === viewerName && projectCount.total < 4);
    useEffect(() => {
        track('home_view');
    }, []);
    const games = <FeaturedGames key="games" />;
    const sections = signedIn ? [
        <ContinueProjects
            key="continue"
            username={viewerName}
            onProjectCount={setProjectCount}
            welcome={Boolean(user.isNew)}
        />,
        showStarters ? <StarterGallery key="starters" /> : null,
        <div
            key="happening"
            className={styles.columns}
        >
            <Jams />
            <FollowingGames viewerName={viewerName} />
        </div>,
        games,
        <div
            key="activity"
            className={styles.columns}
        >
            <FriendsSection user={user} />
            <NotificationsSection user={user} />
        </div>
    ] : [
        signedOut ? <Intro
            key="intro"
            login={login}
        /> : null,
        games,
        <div
            key="happening"
            className={styles.columns}
        >
            <Jams />
            <section
                className={styles.panel}
                aria-labelledby="home-creators-heading"
            >
                <SectionHeading
                    id="home-creators-heading"
                    title={communityText('Creators to follow')}
                    actions={<QuietLink to="/leaderboard">{communityText('See all')}</QuietLink>}
                />
                <SuggestedCreators limit={4} />
            </section>
        </div>,
        signedOut ? (
            <StarterGallery key="starters">
                <div className={styles.importRow}>
                    <ScratchImport source="home" />
                    <QuietLink to="/compare">{communityText('Coming from Scratch or TurboWarp? See what is different')}</QuietLink>
                </div>
            </StarterGallery>
        ) : null
    ];
    return (
        <main className={styles.page}>
            {sections}
        </main>
    );
};

export default Home;
