import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Play} from 'lucide-react';
import api, {embedUrl, projectUrl} from '../api';
import rotur from '../rotur.js';
import {track} from '../analytics';
import {useCommunityIntl} from '../i18n.jsx';
import useAfterLogin from '../use-after-login.js';
import Avatar from './Avatar.jsx';
import GameCard, {CardRow, CardRowSkeleton, GameMeta} from './GameCard.jsx';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import Button from './ui/Button.jsx';
import QuietLink from './ui/QuietLink.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './HomeDiscovery.module.css';

const sameName = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

export const SuggestedCreators = ({viewerName, limit, columns}) => {
    const {text} = useCommunityIntl();
    const [creators, setCreators] = useState(null);
    const [followed, setFollowed] = useState({});
    useEffect(() => {
        let active = true;
        Promise.all([
            api.leaderboard('loves'),
            viewerName ? rotur.myFollowing().catch(() => ({following: []})) : {following: []}
        ]).then(([board, follows]) => {
            if (!active) return;
            const following = follows.following || [];
            setCreators((board.users || [])
                .filter(creator => !sameName(creator.username, viewerName) &&
                    !following.some(name => sameName(name, creator.username)))
                .slice(0, limit));
        })
            .catch(() => active && setCreators([]));
        return () => {
            active = false;
        };
    }, [viewerName, limit]);
    const follow = useAfterLogin(async username => {
        setFollowed(current => ({...current, [username]: true}));
        try {
            await rotur.follow(username);
            track('suggested_creator_followed');
        } catch (e) {
            setFollowed(current => ({...current, [username]: false}));
        }
    }, 'follow');
    if (creators === null) {
        return (
            <ul
                className={columns ? `${styles.list} ${styles.listColumns}` : styles.list}
                aria-hidden="true"
            >
                {Array.from({length: limit}, (_, index) => (
                    <li
                        key={index}
                        className={`${styles.row} ${styles.rowSkeleton}`}
                    ><span /><span /></li>
                ))}
            </ul>
        );
    }
    if (!creators.length) return null;
    return (
        <ul className={columns ? `${styles.list} ${styles.listColumns}` : styles.list}>
            {creators.map(creator => (
                <li
                    key={creator.username}
                    className={styles.row}
                >
                    <Link to={`/users/${creator.username}`}><Avatar
                        username={creator.username}
                        size={36}
                    /></Link>
                    <Link
                        to={`/users/${creator.username}`}
                        className={styles.rowBody}
                    >
                        <strong>{creator.username}</strong>
                        <span>
                            {text('{value1} projects, {value2} hearts', {
                                value1: creator.projects,
                                value2: creator.loves
                            })}
                        </span>
                    </Link>
                    <Button
                        className={styles.rowAction}
                        size="small"
                        disabled={Boolean(followed[creator.username])}
                        onClick={() => follow(creator.username)}
                    >
                        {followed[creator.username] ? text('Following') : text('Follow')}
                    </Button>
                </li>
            ))}
        </ul>
    );
};

SuggestedCreators.propTypes = {
    columns: PropTypes.bool,
    limit: PropTypes.number,
    viewerName: PropTypes.string
};

SuggestedCreators.defaultProps = {
    limit: 5
};

// The first line or two of what the creator wrote, without markdown or links.
const blurb = project => String((project && (project.description || project.notes)) || '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#*_`>~=-]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);

// Today's pick, beside what it is. The thumbnail stays a normal size, since
// many are small sketches that don't hold up when blown up.
export const FeaturedGame = ({project}) => {
    const {text} = useCommunityIntl();
    const [details, setDetails] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [stageRatio, setStageRatio] = useState(0.75);
    const frame = useRef(null);

    useEffect(() => {
        let active = true;
        setDetails(null);
        setPlaying(false);
        setStageRatio(0.75);
        api.getProject(project.id)
            .then(data => active && setDetails(data.project || project))
            .catch(() => active && setDetails(project));
        return () => {
            active = false;
        };
    }, [project.id]);

    useEffect(() => {
        const onMessage = event => {
            if (!frame.current || event.source !== frame.current.contentWindow) return;
            const data = event.data;
            if (!data || data.type !== 'mw:stage-size' || !(data.width > 0) || !(data.height > 0)) return;
            setStageRatio(data.height / data.width);
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    const shown = {...project, ...(details || {})};
    const canEmbed = Boolean(details && details.hasContent !== false && !details.locked &&
        details.projectJsonUrl && details.assetsBase);
    const play = () => {
        setPlaying(true);
        track('featured_play', {source: 'home'});
    };
    const about = blurb(details);

    return (
        <article className={styles.spotlight}>
            {playing && canEmbed ? (
                <div
                    className={styles.stageWrap}
                    style={{paddingBottom: `calc(${stageRatio * 100}% + 52px)`}}
                >
                    <iframe
                        ref={frame}
                        className={styles.stage}
                        src={embedUrl(details, {bridge: false, profilePreview: true})}
                        title={shown.title}
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        sandbox={'allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-downloads ' +
                            'allow-popups allow-popups-to-escape-sandbox'}
                    />
                </div>
            ) : (
                <Link
                    to={projectUrl(shown)}
                    className={styles.poster}
                    tabIndex={-1}
                    aria-hidden="true"
                >
                    <ProjectThumbnail
                        project={shown}
                        fallbackClassName={styles.posterFallback}
                    />
                </Link>
            )}
            <div className={styles.spotlightText}>
                <h3>
                    <Link to={projectUrl(shown)}>{shown.title}</Link>
                </h3>
                <div className={styles.captionMeta}>
                    <GameMeta project={shown} />
                </div>
                {about ? <p className={styles.blurb}>{about}</p> : null}
                <div className={styles.spotlightActions}>
                    {canEmbed && !playing ? (
                        <Button
                            variant="primary"
                            onClick={play}
                        >
                            <Play
                                size={16}
                                fill="currentColor"
                                aria-hidden="true"
                            />
                            {text('Play here')}
                        </Button>
                    ) : null}
                    <Button
                        as={Link}
                        to={projectUrl(shown)}
                        variant={canEmbed && !playing ? 'secondary' : 'primary'}
                    >{text('Open game page')}</Button>
                </div>
            </div>
        </article>
    );
};

FeaturedGame.propTypes = {
    project: PropTypes.shape({
        id: PropTypes.string,
        owner: PropTypes.string,
        title: PropTypes.string
    }).isRequired
};

const useGames = (query, attempt) => {
    const [games, setGames] = useState(null);
    const key = JSON.stringify(query);
    useEffect(() => {
        let active = true;
        setGames(null);
        api.explore(query)
            .then(data => active && setGames(data.projects || []))
            .catch(() => active && setGames(false));
        return () => {
            active = false;
        };
    }, [key, attempt]);
    return games;
};

export const FeaturedGames = () => {
    const {text} = useCommunityIntl();
    const [featured, setFeatured] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const games = useGames({sort: 'trending', limit: 9}, attempt);
    useEffect(() => {
        let active = true;
        api.featuredProject()
            .then(data => active && setFeatured(data.project || null))
            .catch(() => active && setFeatured(null));
        return () => {
            active = false;
        };
    }, []);
    const ready = featured !== false && Array.isArray(games);
    const others = ready ? games.filter(game => !featured || game.id !== featured.id).slice(0, 4) : [];
    return (
        <section
            className={styles.section}
            aria-labelledby="home-featured-heading"
        >
            <SectionHeading
                id="home-featured-heading"
                title={text('Featured games')}
                actions={<QuietLink to="/explore">{text('Browse all games')}</QuietLink>}
            />
            {games === false ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={() => setAttempt(value => value + 1)}
                >{text("Couldn't load games.")}</StatusMessage>
            ) : null}
            {games !== false && !ready ? (
                <div aria-hidden="true">
                    <div className={styles.spotlight}>
                        <div className={styles.skeleton} />
                        <div className={styles.spotlightText}>
                            <span className={styles.lineSkeleton} />
                            <span className={styles.lineSkeleton} />
                        </div>
                    </div>
                    <CardRowSkeleton className={styles.trending} />
                </div>
            ) : null}
            {ready && !featured && !others.length ? (
                <p className={styles.empty}>{text('No games have been shared yet.')}</p>
            ) : null}
            {ready && featured ? <FeaturedGame project={featured} /> : null}
            {ready && others.length ? (
                <CardRow className={featured ? styles.trending : null}>
                    {others.map(game => (
                        <GameCard
                            key={game.id}
                            project={game}
                        />
                    ))}
                </CardRow>
            ) : null}
        </section>
    );
};

// A plain row of games from Explore, for New games on home.
export const GameShelf = ({id, link, linkLabel, query, title}) => {
    const {text} = useCommunityIntl();
    const [attempt, setAttempt] = useState(0);
    const games = useGames(query, attempt);
    return (
        <section
            className={styles.section}
            aria-labelledby={id}
        >
            <SectionHeading
                id={id}
                title={title}
                actions={<QuietLink to={link}>{linkLabel}</QuietLink>}
            />
            {games === null ? <CardRowSkeleton /> : null}
            {games === false ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={() => setAttempt(value => value + 1)}
                >{text("Couldn't load games.")}</StatusMessage>
            ) : null}
            {games && !games.length ? <p className={styles.empty}>{text('No games have been shared yet.')}</p> : null}
            {games && games.length ? (
                <CardRow>
                    {games.slice(0, 4).map(game => (
                        <GameCard
                            key={game.id}
                            project={game}
                        />
                    ))}
                </CardRow>
            ) : null}
        </section>
    );
};

GameShelf.propTypes = {
    id: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    linkLabel: PropTypes.node.isRequired,
    query: PropTypes.shape({
        limit: PropTypes.number,
        sort: PropTypes.string,
        tag: PropTypes.string
    }).isRequired,
    title: PropTypes.node.isRequired
};
