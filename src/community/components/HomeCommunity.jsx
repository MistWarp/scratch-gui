import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Blocks, ChevronUp, MessageCircle, Puzzle, Shapes, Tag, Users} from 'lucide-react';
import api from '../api';
import {timeAgo} from '../format';
import {useCommunityIntl} from '../i18n.jsx';
import {roadmapStatusMatches} from '../roadmap-filters';
import useAfterLogin from '../use-after-login.js';
import {useUser} from '../UserContext.jsx';
import {AuthorLink, Excerpt, NewsCover, NewsThumb, usePlaces} from './NewsParts.jsx';
import QuietLink from './ui/QuietLink.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './HomeCommunity.module.css';

const NEWS = 4;
const PER_GROUP = 3;
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


const NewsSkeleton = () => (
    <div aria-hidden="true">
        <div className={styles.lead}>
            <div className={styles.leadText}>
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
                    <span className={`${styles.thumbSkeleton} ${styles.pulse}`} />
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
                actions={<QuietLink to="/news">{text('All news')}</QuietLink>}
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
                <article className={styles.lead}>
                    <NewsCover
                        item={first}
                        places={places}
                    />
                    <div className={styles.leadText}>
                        <h3><Link to={`/news/${first.id}`}>{first.title}</Link></h3>
                        <Excerpt
                            className={styles.clamp3}
                            item={first}
                            places={places}
                        />
                        <p className={styles.meta}>
                            <AuthorLink username={first.author} />
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
                            <NewsThumb
                                item={item}
                                places={places}
                            />
                            <div className={styles.rowText}>
                                <h3><Link to={`/news/${item.id}`}>{item.title}</Link></h3>
                                <Excerpt
                                    className={styles.clamp1}
                                    item={item}
                                    places={places}
                                />
                                <p className={styles.meta}>
                                    <AuthorLink username={item.author} />
                                    <span>{timeAgo(item.created)}</span>
                                </p>
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
                    {idea.author ? <AuthorLink username={idea.author} /> : null}
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
