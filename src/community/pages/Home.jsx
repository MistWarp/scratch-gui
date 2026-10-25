/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Heart, Plus, Rocket, UsersRound} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import rotur from '../rotur';
import {fetchFollowingFeed} from '../../lib/rotur/client.js';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import QuietLink from '../components/ui/QuietLink.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import GameCard, {CardSkeleton} from '../components/GameCard.jsx';
import ScratchImport from '../components/ScratchImport.jsx';
import ScriptToy from '../components/ScriptToy.jsx';
import {FeaturedGames, GameShelf, SuggestedCreators} from '../components/HomeDiscovery.jsx';
import CommunityUpdates from '../components/HomeCommunity.jsx';
import {ContinuePlaying, ContinueProjects, DeviceBackup, StarterGallery} from '../components/HomeWorkspace.jsx';
import loadProjectPreview from '../project-preview.js';
import {track} from '../analytics.js';
import {useCommunityIntl} from '../i18n.jsx';
import {normalizeFollowingPosts, postUrl, timestampMs} from '../following-feed.js';
import {richTranslator} from '../notification-text.jsx';
import styles from './Home.module.css';

const GAMES = 4;
const UPDATES = 6;

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

const newestFirst = (left, right) => timestampMs(right.created || right.timestamp) - timestampMs(left.created || left.timestamp);

// Games people you follow shared, and everything else they did: posts on
// claw, hearts, remixes and reviews. Sessions from before following:view was
// asked for can't read the list, so they see creators to follow instead.
export const loadFollowing = () => rotur.myFollowing().catch(() => ({following: []})).then(data => {
    const following = data.following || [];
    if (!following.length) return {following, games: [], updates: [], failed: false};
    return Promise.allSettled([api.activity(following), fetchFollowingFeed(40)]).then(([activity, posts]) => {
        const items = activity.status === 'fulfilled' ? activity.value.activity || [] : [];
        const seen = new Set();
        const shares = items
            .filter(item => item.type === 'share' && item.projectId && !seen.has(item.projectId) && seen.add(item.projectId))
            .sort(newestFirst)
            .slice(0, GAMES);
        const updates = [
            ...items.filter(item => item.type !== 'share').map(item => ({...item, timelineType: 'project-activity'})),
            ...(posts.status === 'fulfilled' ? normalizeFollowingPosts(posts.value) : [])
        ].sort(newestFirst).slice(0, UPDATES);
        return Promise.all(shares.map(item => loadProjectPreview({id: item.projectId}).catch(() => null)))
            .then(games => ({
                following,
                games: games.filter(Boolean),
                updates,
                failed: activity.status === 'rejected' && posts.status === 'rejected'
            }));
    });
});

const UpdateRow = ({item}) => {
    const {text: communityText} = useCommunityIntl();
    const isPost = item.timelineType === 'following-post';
    const name = isPost ? item.user : item.actor;
    const actor = (<Link
        to={`/users/${name}`}
        className={styles.updateActor}
    >{name}</Link>);
    const to = isPost ? postUrl(item.id) : item.projectId ? projectUrl(item.projectId) : null;
    const t = richTranslator(communityText, to ? children => <Link to={to}>{children}</Link> : null);
    return (
        <li className={styles.update}>
            <Link
                to={`/users/${name}`}
                tabIndex={-1}
                aria-hidden="true"
            >
                <Avatar
                    username={name}
                    size={32}
                />
            </Link>
            <p className={styles.updateText}>
                {isPost ?
                    t('{actor} posted: {post}', {actor, post: item.content || communityText('View post')}) :
                    describeActivity(item, t, actor)}
            </p>
            <span className={styles.updateTime}>{timeAgo(item.created || item.timestamp)}</span>
        </li>
    );
};

const FollowingSkeleton = () => (
    <div
        className={styles.following}
        aria-hidden="true"
    >
        <div className={styles.followingGames}>
            {[0, 1, 2, 3].map(index => <CardSkeleton key={index} />)}
        </div>
        <ul className={styles.updates}>
            {[0, 1, 2, 3, 4].map(index => (
                <li
                    key={index}
                    className={`${styles.update} ${styles.updateSkeleton}`}
                ><span /><span /></li>
            ))}
        </ul>
    </div>
);

export const FollowingSection = ({viewerName}) => {
    const {text: communityText} = useCommunityIntl();
    const [state, setState] = useState(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setState(null);
        loadFollowing()
            .then(result => active && setState({...result, viewerName}))
            .catch(() => active && setState({following: [], games: [], updates: [], failed: true, viewerName}));
        return () => {
            active = false;
        };
    }, [viewerName, attempt]);
    const current = state && state.viewerName === viewerName ? state : null;
    if (current && !current.failed && !current.following.length) {
        return (
            <section
                className={styles.section}
                aria-labelledby="home-creators-heading"
            >
                <SectionHeading
                    id="home-creators-heading"
                    icon={UsersRound}
                    tone="var(--block-sound)"
                    title={communityText('Creators to follow')}
                    lead={communityText('Their new games and posts will show up here.')}
                    actions={<QuietLink to="/leaderboard">{communityText('See all')}</QuietLink>}
                />
                <SuggestedCreators
                    viewerName={viewerName}
                    limit={6}
                    columns
                />
            </section>
        );
    }
    const games = current ? current.games : [];
    const updates = current ? current.updates : [];
    const quiet = current && !current.failed && !games.length && !updates.length;
    return (
        <section
            className={styles.section}
            aria-labelledby="home-following-heading"
        >
            <SectionHeading
                id="home-following-heading"
                icon={Heart}
                tone="var(--block-custom)"
                title={communityText('From people you follow')}
                actions={<QuietLink to="/posts">{communityText('See all posts')}</QuietLink>}
            />
            {current ? null : <FollowingSkeleton />}
            {current && current.failed ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={() => setAttempt(value => value + 1)}
                >{communityText("Couldn't load activity.")}</StatusMessage>
            ) : null}
            {quiet ? (
                <p className={styles.empty}>
                    {communityText('Nothing new from people you follow lately.')}
                    {' '}
                    <QuietLink to="/explore?sort=recent">{communityText('See new games')}</QuietLink>
                </p>
            ) : null}
            {games.length || updates.length ? (
                <div className={games.length && updates.length ? styles.following : styles.followingSingle}>
                    {games.length ? (
                        <div className={styles.followingGames}>
                            {games.map(project => (
                                <GameCard
                                    key={project.id}
                                    project={project}
                                />
                            ))}
                        </div>
                    ) : null}
                    {updates.length ? (
                        <ul className={styles.updates}>
                            {updates.map((item, index) => (
                                <UpdateRow
                                    key={item.timelineType === 'following-post' ? `post:${item.id}` : `${item.actor}-${item.created}-${index}`}
                                    item={item}
                                />
                            ))}
                        </ul>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
};

const Intro = ({login}) => {
    const {text: communityText} = useCommunityIntl();
    return (
        <section className={styles.intro}>
            <div className={styles.introText}>
                <h1>{communityText('Make games with blocks, and play what others make')}</h1>
                <p>{communityText('MistWarp is a free block-based editor for making games and sharing them with everyone.')}</p>
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
            </div>
            <ScriptToy className={styles.introToy} />
        </section>
    );
};

const Home = () => {
    const {text: communityText} = useCommunityIntl();
    const {user, login, loading} = useUser();
    const viewerName = (user && user.username) || '';
    const signedIn = Boolean(!loading && user);
    const signedOut = !loading && !user;
    useEffect(() => {
        track('home_view');
    }, []);
    // Keyed so the shared sections stay loaded when someone signs in.
    const games = <FeaturedGames key="games" />;
    const newGames = (<GameShelf
        key="new"
        id="home-new-heading"
        icon={Rocket}
        tone="var(--block-operators)"
        title={communityText('New games')}
        query={{sort: 'recent', limit: 4}}
        link="/explore?sort=recent"
        linkLabel={communityText('See all new games')}
    />);
    const updates = <CommunityUpdates key="updates" />;
    const sections = signedIn ? [
        <FollowingSection
            key="following"
            viewerName={viewerName}
        />,
        games,
        <ContinueProjects
            key="continue"
            username={viewerName}
        />,
        <ContinuePlaying
            key="playing"
            username={viewerName}
        />,
        newGames,
        updates
    ] : [
        signedOut ? <Intro
            key="intro"
            login={login}
        /> : null,
        games,
        newGames,
        updates,
        signedOut ? (
            <section
                key="creators"
                className={styles.section}
                aria-labelledby="home-creators-heading"
            >
                <SectionHeading
                    id="home-creators-heading"
                    icon={UsersRound}
                    tone="var(--block-sound)"
                    title={communityText('Creators to follow')}
                    actions={<QuietLink to="/leaderboard">{communityText('See all')}</QuietLink>}
                />
                <SuggestedCreators
                    limit={6}
                    columns
                />
            </section>
        ) : null,
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
