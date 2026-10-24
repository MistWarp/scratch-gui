import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {
    Blocks, CalendarDays, ChevronUp, MessageCircle, Newspaper, Puzzle, Rocket, Shapes, Tag, Users, Wrench
} from 'lucide-react';
import api from '../api';
import {timeAgo} from '../format';
import {useCommunityIntl} from '../i18n.jsx';
import loadProjectPreview from '../project-preview.js';
import {roadmapStatusMatches} from '../roadmap-filters';
import {excerptParts, imageFor, linkedPlaces} from '../news-excerpt.js';
import useAfterLogin from '../use-after-login.js';
import {useUser} from '../UserContext.jsx';
import Avatar from './Avatar.jsx';
import QuietLink from './ui/QuietLink.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './HomeCommunity.module.css';

const NEWS = 4;
const PER_GROUP = 3;
const NEWS_ICONS = {update: Rocket, event: CalendarDays, fix: Wrench};
const CATEGORY_ICONS = {community: Users, editor: Blocks, редактор: Blocks, extensions: Puzzle, other: Shapes};
const STATUS_LABELS = {
    open: 'Suggested',
    planned: 'Planned',
    building: 'In progress',
    shipped: 'Done',
    declined: 'Not planned'
};

const useList = (load, key = '') => {
    const [items, setItems] = useState(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setItems(null);
        load()
            .then(list => active && setItems(list))
            .catch(() => active && setItems(false));
        return () => {
            active = false;
        };
    }, [attempt, key]);
    return [items, setItems, () => setAttempt(value => value + 1)];
};

const PLACES = PropTypes.objectOf(PropTypes.shape({title: PropTypes.string, thumbUrl: PropTypes.string}));
const placeKey = route => `${route.kind}:${route.id || route.slug}`;
const placeCache = new Map();
const loadPlace = route => {
    const key = placeKey(route);
    if (!placeCache.has(key)) {
        const request = route.kind === 'space' ?
            api.getSpace(route.id).then(data => {
                const space = (data && data.space) || data || {};
                return {title: space.title, thumbUrl: space.thumbnailUrl};
            }) :
            loadProjectPreview(route.id ? {id: route.id} : {slug: route.slug})
                .then(project => (project ? {title: project.title, thumbUrl: project.thumbUrl} : null));
        placeCache.set(key, request.catch(() => null));
    }
    return placeCache.get(key);
};

// Titles and thumbnails of the projects and spaces the posts link to.
const usePlaces = items => {
    const [places, setPlaces] = useState({});
    useEffect(() => {
        let active = true;
        const routes = (items || []).flatMap(linkedPlaces);
        Promise.all(routes.map(route => loadPlace(route).then(place => [placeKey(route), place])))
            .then(entries => active && setPlaces(Object.fromEntries(entries.filter(([, place]) => place))));
        return () => {
            active = false;
        };
    }, [items]);
    return places;
};

const coverFor = (item, places) => {
    const image = imageFor(item);
    if (image) return image;
    const place = linkedPlaces(item).map(route => places[placeKey(route)])
        .find(found => found && found.thumbUrl);
    return place ? place.thumbUrl : null;
};

const NewsCover = ({item, places, to}) => {
    const [failed, setFailed] = useState(false);
    const image = coverFor(item, places);
    const Icon = NEWS_ICONS[item.category] || Newspaper;
    return (
        <Link
            className={styles.cover}
            to={to}
            tabIndex={-1}
            aria-hidden="true"
        >
            {image && !failed ? (
                <img
                    src={image}
                    alt=""
                    loading="lazy"
                    onError={() => setFailed(true)}
                />
            ) : (
                <span className={styles.coverMark}><Icon aria-hidden="true" /></span>
            )}
        </Link>
    );
};

NewsCover.propTypes = {
    item: PropTypes.shape({category: PropTypes.string}).isRequired,
    places: PLACES.isRequired,
    to: PropTypes.string.isRequired
};

const linkLabel = (part, places, text) => {
    if (part.label) return part.label;
    const route = part.route;
    if (route.kind === 'project' || route.kind === 'space') {
        const place = places[placeKey(route)];
        if (place && place.title) return place.title;
        return route.kind === 'space' ? text('the space') : text('the project');
    }
    if (route.kind === 'user') return `@${route.name}`;
    if (route.kind === 'external') {
        try {
            return new URL(route.href).hostname.replace(/^www\./, '');
        } catch (e) {
            return route.href;
        }
    }
    return route.to;
};

const Excerpt = ({className, item, places}) => {
    const {text} = useCommunityIntl();
    return (
        <p className={className}>
            {excerptParts(item.body).map((part, index) => {
                if (part.text) return <React.Fragment key={index}>{part.text}</React.Fragment>;
                const label = linkLabel(part, places, text);
                return part.route.kind === 'external' ? (
                    <a
                        key={index}
                        href={part.route.href}
                        target="_blank"
                        rel="noreferrer"
                    >{label}</a>
                ) : (
                    <Link
                        key={index}
                        to={part.route.to}
                    >{label}</Link>
                );
            })}
        </p>
    );
};

Excerpt.propTypes = {
    className: PropTypes.string,
    item: PropTypes.shape({body: PropTypes.string}).isRequired,
    places: PLACES.isRequired
};

const NewsSkeleton = () => (
    <div aria-hidden="true">
        <div className={styles.feature}>
            <span className={`${styles.cover} ${styles.pulse}`} />
            <div className={styles.featureText}>
                <span className={`${styles.line} ${styles.pulse}`} />
                <span className={`${styles.line} ${styles.lineShort} ${styles.pulse}`} />
            </div>
        </div>
        <ul className={styles.rows}>
            {[0, 1].map(index => (
                <li
                    key={index}
                    className={styles.row}
                >
                    <span className={`${styles.cover} ${styles.pulse}`} />
                    <span className={`${styles.line} ${styles.pulse}`} />
                </li>
            ))}
        </ul>
    </div>
);

export const NewsList = () => {
    const {text} = useCommunityIntl();
    const [items, , retry] = useList(() => api.news()
        .then(data => (data.news || []).filter(item => !item.archived).slice(0, NEWS)));
    const places = usePlaces(items || null);
    const [first, ...rest] = items || [];
    return (
        <section
            className={styles.column}
            aria-labelledby="home-news-heading"
        >
            <SectionHeading
                id="home-news-heading"
                title={text('News')}
                actions={<QuietLink to="/news">{text('All updates')}</QuietLink>}
            />
            {items === null ? <NewsSkeleton /> : null}
            {items === false ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={retry}
                >{text("Couldn't load news.")}</StatusMessage>
            ) : null}
            {items && !items.length ? (
                <p className={styles.empty}>{text('News from MistWarp will show up here.')}</p>
            ) : null}
            {first ? (
                <article className={styles.feature}>
                    <NewsCover
                        item={first}
                        places={places}
                        to={`/news/${first.id}`}
                    />
                    <div className={styles.featureText}>
                        <h3><Link to={`/news/${first.id}`}>{first.title}</Link></h3>
                        <Excerpt
                            className={styles.excerpt}
                            item={first}
                            places={places}
                        />
                        <p className={styles.byline}>
                            <Avatar
                                username={first.author}
                                size={20}
                            />
                            <Link to={`/users/${first.author}`}>{first.author}</Link>
                            <span>{timeAgo(first.created)}</span>
                        </p>
                    </div>
                </article>
            ) : null}
            {rest.length ? (
                <ul className={styles.rows}>
                    {rest.map(item => (
                        <li
                            key={item.id}
                            className={styles.row}
                        >
                            <NewsCover
                                item={item}
                                places={places}
                                to={`/news/${item.id}`}
                            />
                            <div className={styles.rowText}>
                                <h3><Link to={`/news/${item.id}`}>{item.title}</Link></h3>
                                <Excerpt
                                    className={styles.oneLine}
                                    item={item}
                                    places={places}
                                />
                                <p className={styles.date}>{timeAgo(item.created)}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
};

const Upvote = ({idea, onVote}) => {
    const {text} = useCommunityIntl();
    const voted = idea.myVote === 'like';
    return (
        <button
            type="button"
            className={voted ? styles.voteOn : styles.vote}
            aria-pressed={voted}
            aria-label={text('Upvote {value1}', {value1: idea.title})}
            title={voted ? text('Remove your vote') : text('Upvote')}
            onClick={() => onVote(idea)}
        >
            <ChevronUp
                size={16}
                aria-hidden="true"
            />
            <span>{idea.score || 0}</span>
        </button>
    );
};

Upvote.propTypes = {
    idea: PropTypes.shape({myVote: PropTypes.string, score: PropTypes.number, title: PropTypes.string}).isRequired,
    onVote: PropTypes.func.isRequired
};

const IdeaRow = ({idea, onVote, showStatus}) => {
    const {text} = useCommunityIntl();
    const Icon = CATEGORY_ICONS[String(idea.category || '').toLowerCase()] || Tag;
    return (
        <li className={styles.idea}>
            <Upvote
                idea={idea}
                onVote={onVote}
            />
            <div className={styles.ideaText}>
                <h3><Link to={`/roadmap#idea-${idea._id}`}>{idea.title}</Link></h3>
                <p className={styles.meta}>
                    {showStatus ? (
                        <span className={styles[`status${idea.status}`] || styles.status}>
                            {text(STATUS_LABELS[idea.status] || idea.status)}
                        </span>
                    ) : null}
                    {idea.category ? (
                        <span className={styles.metaItem}>
                            <Icon
                                size={13}
                                aria-hidden="true"
                            />
                            {idea.category}
                        </span>
                    ) : null}
                    <span
                        className={styles.metaItem}
                        title={text('Comments')}
                    >
                        <MessageCircle
                            size={13}
                            aria-hidden="true"
                        />
                        {idea.commentCount || 0}
                    </span>
                </p>
            </div>
        </li>
    );
};

IdeaRow.propTypes = {
    idea: PropTypes.shape({
        _id: PropTypes.string,
        category: PropTypes.string,
        commentCount: PropTypes.number,
        status: PropTypes.string,
        title: PropTypes.string
    }).isRequired,
    onVote: PropTypes.func.isRequired,
    showStatus: PropTypes.bool
};

const byScore = (left, right) => (Number(right.score) || 0) - (Number(left.score) || 0);
// In progress ahead of planned, then by votes.
const byProgress = (left, right) => (left.status === right.status ? byScore(left, right) :
    Number(right.status === 'building') - Number(left.status === 'building'));

const applyVote = idea => {
    const was = idea.myVote;
    const score = (Number(idea.score) || 0) + (was === 'like' ? -1 : (was === 'dislike' ? 2 : 1));
    return {...idea, myVote: was === 'like' ? '' : 'like', score};
};

export const RoadmapList = () => {
    const {text} = useCommunityIntl();
    const {user} = useUser();
    const viewerName = (user && user.username) || '';
    const [ideas, setIdeas, retry] = useList(() => api.roadmap()
        .then(data => (data.ideas || []).filter(idea => roadmapStatusMatches(idea.status, ''))), viewerName);
    const [voteError, setVoteError] = useState('');
    const vote = useAfterLogin(async idea => {
        const replace = next => setIdeas(current => (current ?
            current.map(item => (item._id === idea._id ? next : item)) : current));
        setVoteError('');
        replace(applyVote(idea));
        try {
            const data = await api.voteIdea(idea._id, 'like');
            replace({...applyVote(idea), ...(data || {})});
        } catch (e) {
            replace(idea);
            setVoteError(text('Could not save your vote.'));
        }
    }, 'vote');
    const planned = (ideas || []).filter(idea => idea.status === 'planned' || idea.status === 'building')
        .sort(byProgress)
        .slice(0, PER_GROUP);
    const wanted = (ideas || []).filter(idea => idea.status === 'open')
        .sort(byScore)
        .slice(0, PER_GROUP);
    const group = (id, title, list, showStatus) => (list.length ? (
        <div className={styles.group}>
            <h3
                id={id}
                className={styles.groupTitle}
            >{title}</h3>
            <ul
                className={styles.ideas}
                aria-labelledby={id}
            >
                {list.map(idea => (
                    <IdeaRow
                        key={idea._id}
                        idea={idea}
                        onVote={vote}
                        showStatus={showStatus}
                    />
                ))}
            </ul>
        </div>
    ) : null);
    return (
        <section
            className={styles.column}
            aria-labelledby="home-roadmap-heading"
        >
            <SectionHeading
                id="home-roadmap-heading"
                title={text('Roadmap')}
                actions={<QuietLink to="/roadmap">{text('Suggest and vote')}</QuietLink>}
            />
            {ideas === null ? (
                <ul
                    className={styles.ideas}
                    aria-hidden="true"
                >
                    {[0, 1, 2, 3].map(index => (
                        <li
                            key={index}
                            className={styles.idea}
                        >
                            <span className={`${styles.vote} ${styles.pulse}`} />
                            <span className={`${styles.line} ${styles.pulse}`} />
                        </li>
                    ))}
                </ul>
            ) : null}
            {ideas === false ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={retry}
                >{text("Couldn't load roadmap suggestions.")}</StatusMessage>
            ) : null}
            {ideas && !planned.length && !wanted.length ? (
                <p className={styles.empty}>
                    {text('No active suggestions')}
                    {' '}
                    <QuietLink to="/roadmap">{text('Add the first one')}</QuietLink>
                </p>
            ) : null}
            {ideas ? group('home-roadmap-next', text('Planned next'), planned, true) : null}
            {ideas ? group('home-roadmap-wanted', text('Most wanted'), wanted, false) : null}
            {voteError ? <p
                className={styles.voteError}
                role="alert"
            >{voteError}</p> : null}
        </section>
    );
};

// What MistWarp itself is up to, so a first visit shows the place is alive.
const CommunityUpdates = () => (
    <div className={styles.updates}>
        <NewsList />
        <RoadmapList />
    </div>
);

export default CommunityUpdates;
