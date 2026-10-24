import PropTypes from 'prop-types';
import React, {useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {formatDate} from '../format';
import {useCommunityIntl} from '../i18n.jsx';
import {excerptParts} from '../news-excerpt.js';
import {ExploreSearch} from './ExploreHeader.jsx';
import {AuthorLink, Excerpt, NEWS_KINDS, NewsCover, NewsThumb, kindOf, usePlaces} from './NewsParts.jsx';
import Button from './ui/Button.jsx';
import QuietLink from './ui/QuietLink.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './NewsFeed.module.css';

const PAGE = 8;

const plainText = item => excerptParts(item.body).map(part => part.text || part.label || '')
    .join(' ');

const matches = (item, query) => {
    if (!query) return true;
    const haystack = `${item.title} ${item.author} ${plainText(item)}`.toLowerCase();
    return query.toLowerCase().split(/\s+/).filter(Boolean)
        .every(word => haystack.includes(word));
};

const Meta = ({item}) => {
    const {text} = useCommunityIntl();
    return (
        <p className={styles.meta}>
            <AuthorLink username={item.author} />
            <span>{formatDate(item.created)}</span>
            <span>{text(NEWS_KINDS[kindOf(item)].label)}</span>
        </p>
    );
};

Meta.propTypes = {
    item: PropTypes.shape({author: PropTypes.string, created: PropTypes.number}).isRequired
};

const FeedSkeleton = () => (
    <div aria-hidden="true">
        <div className={styles.lead}>
            <div className={styles.leadText}>
                <span className={`${styles.line} ${styles.lineWide}`} />
                <span className={styles.line} />
                <span className={`${styles.line} ${styles.lineShort}`} />
            </div>
        </div>
        <ul className={styles.list}>
            {[0, 1, 2].map(index => (
                <li
                    key={index}
                    className={styles.row}
                >
                    <span className={styles.thumbSkeleton} />
                    <div className={styles.rowText}>
                        <span className={styles.line} />
                        <span className={`${styles.line} ${styles.lineShort}`} />
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

// The public News page: newest story first, then the rest, by kind or search.
const NewsFeed = ({items, failed, onRetry}) => {
    const {text} = useCommunityIntl();
    const [params, setParams] = useSearchParams();
    const kind = params.get('kind') || '';
    const query = params.get('q') || '';
    const [shown, setShown] = useState(PAGE);
    const published = useMemo(() => (items || []).filter(item => !item.archived), [items]);
    const kinds = Object.keys(NEWS_KINDS).filter(key => published.some(item => kindOf(item) === key));
    const {filtered, lead, rest, remaining, visible} = useMemo(() => {
        const found = published.filter(item => (!kind || kindOf(item) === kind) && matches(item, query.trim()));
        const first = query.trim() ? null : found[0];
        const others = first ? found.slice(1) : found;
        const page = others.slice(0, shown);
        return {
            filtered: found,
            lead: first,
            rest: page,
            remaining: others.length - page.length,
            visible: first ? [first, ...page] : page
        };
    }, [published, kind, query, shown]);
    const places = usePlaces(visible);

    const update = changes => {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
        }
        setShown(PAGE);
        setParams(next, {replace: true});
    };
    const kindLink = key => {
        const next = new URLSearchParams(params);
        if (key) next.set('kind', key);
        else next.delete('kind');
        const search = next.toString();
        return `/news${search ? `?${search}` : ''}`;
    };

    return (
        <>
            <div className={styles.toolbar}>
                {kinds.length > 1 ? (
                    <nav
                        className={styles.kinds}
                        aria-label={text('Kinds of post')}
                    >
                        {['', ...kinds].map(key => (
                            <Link
                                key={key || 'all'}
                                to={kindLink(key)}
                                aria-current={kind === key ? 'page' : null}
                                className={kind === key ? styles.kindActive : styles.kind}
                                onClick={() => setShown(PAGE)}
                            >{key ? text(NEWS_KINDS[key].plural) : text('All news')}</Link>
                        ))}
                    </nav>
                ) : <span />}
                <ExploreSearch
                    ariaLabel={text('Search news')}
                    value={query}
                    onChange={value => update({q: value})}
                />
            </div>

            {items === null && !failed ? <FeedSkeleton /> : null}
            {failed ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={onRetry}
                >{text("Couldn't load news.")}</StatusMessage>
            ) : null}
            {items && !published.length ? (
                <p className={styles.empty}>{text('News from MistWarp will show up here.')}</p>
            ) : null}
            {items && published.length && !filtered.length ? (
                <p className={styles.empty}>
                    {text('No posts match.')}
                    {' '}
                    <QuietLink to="/news">{text('Show all news')}</QuietLink>
                </p>
            ) : null}

            {lead ? (
                <article className={styles.lead}>
                    <NewsCover
                        className={styles.leadCover}
                        item={lead}
                        places={places}
                    />
                    <div className={styles.leadText}>
                        <h2><Link to={`/news/${lead.id}`}>{lead.title}</Link></h2>
                        <Excerpt
                            className={styles.clamp4}
                            item={lead}
                            places={places}
                        />
                        <Meta item={lead} />
                    </div>
                </article>
            ) : null}

            {rest.length ? (
                <ul className={styles.list}>
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
                                    className={styles.clamp2}
                                    item={item}
                                    places={places}
                                />
                                <Meta item={item} />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : null}

            {remaining > 0 ? (
                <div className={styles.more}>
                    <Button onClick={() => setShown(value => value + PAGE)}>
                        {text('Show more ({value1} left)', {value1: remaining})}
                    </Button>
                </div>
            ) : null}
        </>
    );
};

NewsFeed.propTypes = {
    failed: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.shape({
        archived: PropTypes.bool,
        body: PropTypes.string,
        category: PropTypes.string,
        id: PropTypes.string,
        title: PropTypes.string
    })),
    onRetry: PropTypes.func.isRequired
};

export default NewsFeed;
