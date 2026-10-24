import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {MessageCircle} from 'lucide-react';
import api from '../api';
import {timeAgo} from '../format';
import {useCommunityIntl} from '../i18n.jsx';
import {roadmapStatusMatches} from '../roadmap-filters';
import QuietLink from './ui/QuietLink.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './HomeCommunity.module.css';

const NEWS = 3;
const IDEAS = 4;
const STATUS_LABELS = {
    open: 'Suggested',
    planned: 'Planned',
    building: 'In progress',
    shipped: 'Shipped',
    declined: 'Not planned'
};

// News bodies are markdown; the list only needs a line of plain text.
const plainText = body => String(body || '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const useList = load => {
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
    }, [attempt]);
    return [items, () => setAttempt(value => value + 1)];
};

const RowsSkeleton = ({count}) => (
    <ul
        className={styles.list}
        aria-hidden="true"
    >
        {Array.from({length: count}, (_, index) => (
            <li
                key={index}
                className={`${styles.item} ${styles.itemSkeleton}`}
            ><span /><span /></li>
        ))}
    </ul>
);

RowsSkeleton.propTypes = {
    count: PropTypes.number.isRequired
};

export const NewsList = () => {
    const {text} = useCommunityIntl();
    const [items, retry] = useList(() => api.news()
        .then(data => (data.news || []).filter(item => !item.archived).slice(0, NEWS)));
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
            {items === null ? <RowsSkeleton count={NEWS} /> : null}
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
            {items && items.length ? (
                <ul className={styles.list}>
                    {items.map(item => (
                        <li
                            key={item.id}
                            className={styles.item}
                        >
                            <h3><Link to={`/news/${item.id}`}>{item.title}</Link></h3>
                            <p className={styles.excerpt}>{plainText(item.body)}</p>
                            <p className={styles.meta}>
                                <span>{item.author}</span>
                                <span>{timeAgo(item.created)}</span>
                            </p>
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
};

export const RoadmapList = () => {
    const {text} = useCommunityIntl();
    const [ideas, retry] = useList(() => api.roadmap()
        .then(data => (data.ideas || [])
            .filter(idea => roadmapStatusMatches(idea.status, ''))
            .sort((left, right) => (Number(right.score) || 0) - (Number(left.score) || 0))
            .slice(0, IDEAS)));
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
            {ideas === null ? <RowsSkeleton count={IDEAS} /> : null}
            {ideas === false ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={retry}
                >{text("Couldn't load roadmap suggestions.")}</StatusMessage>
            ) : null}
            {ideas && !ideas.length ? (
                <p className={styles.empty}>
                    {text('No active suggestions')}
                    {' '}
                    <QuietLink to="/roadmap">{text('Add the first one')}</QuietLink>
                </p>
            ) : null}
            {ideas && ideas.length ? (
                <ul className={styles.list}>
                    {ideas.map(idea => (
                        <li
                            key={idea._id}
                            className={`${styles.item} ${styles.idea}`}
                        >
                            <span
                                className={styles.score}
                                title={text('Score')}
                            >{idea.score || 0}</span>
                            <div>
                                <h3><Link to={`/roadmap#idea-${idea._id}`}>{idea.title}</Link></h3>
                                <p className={styles.meta}>
                                    <span>{text(STATUS_LABELS[idea.status] || idea.status)}</span>
                                    {idea.category ? <span>{idea.category}</span> : null}
                                    <span className={styles.comments}>
                                        <MessageCircle
                                            size={12}
                                            aria-hidden="true"
                                        />
                                        {idea.commentCount || 0}
                                    </span>
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : null}
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
