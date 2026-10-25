import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {Link, Navigate, useSearchParams} from 'react-router-dom';
import api from '../api';
import useLatest from '../use-latest.js';
import GameCard, {CardSkeleton} from '../components/GameCard.jsx';
import Button from '../components/ui/Button.jsx';
import QuietLink from '../components/ui/QuietLink.jsx';
import SelectMenu from '../components/ui/SelectMenu.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import ExploreHeader from '../components/ExploreHeader.jsx';
import searchPath from '../search-path.js';
import {useUser} from '../UserContext.jsx';
import styles from './Explore.module.css';

const SORTS = [
    {key: 'trending', label: 'Trending'},
    {key: 'recent', label: 'New'},
    {key: 'loved', label: 'Most loved'},
    {key: 'undiscovered', label: 'Hidden gems'}
];

const FILTERS = [
    {key: '', label: 'Everything'},
    {key: 'games', label: 'Games'},
    {key: 'multiplayer', label: 'Multiplayer'},
    {key: 'mobile', label: 'Plays on phones'},
    {key: 'animation', label: 'Animation'},
    {key: 'art', label: 'Art'},
    {key: 'music', label: 'Music'},
    {key: 'tools', label: 'Tools'},
    {key: 'tutorial', label: 'Tutorials'},
    {key: 'feedback', label: 'Looking for feedback'}
];
const PAGE_SIZE = 24;
const MAX_RESTORED_PAGES = 10;

const getPageDepth = value => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.min(MAX_RESTORED_PAGES, Math.max(1, parsed)) : 1;
};

const mergeProjects = pages => {
    const seen = new Set();
    const merged = [];
    for (const page of pages) {
        for (const project of page || []) {
            if (!project || seen.has(project.id)) continue;
            seen.add(project.id);
            merged.push(project);
        }
    }
    return merged;
};

const shouldSkipPageRestore = (expectedParams, currentParams) => (
    Boolean(expectedParams) && expectedParams === currentParams
);

const normalizeExploreParams = currentParams => {
    const next = new URLSearchParams(currentParams);
    const requestedSort = next.get('sort');
    if (!SORTS.some(option => option.key === requestedSort) || requestedSort === 'trending') next.delete('sort');
    const query = (next.get('q') || '').trim();
    if (query) next.set('q', query);
    else next.delete('q');
    const tag = (next.get('tag') || '').trim();
    if (tag) next.set('tag', tag);
    else next.delete('tag');
    const pageDepth = getPageDepth(next.get('page'));
    if (pageDepth > 1) next.set('page', String(pageDepth));
    else next.delete('page');
    return next;
};

const Explore = () => {
    const {text: communityText} = useCommunityText();
    const {user} = useUser();
    const viewerName = (user && user.username) || '';
    const [params, setParams] = useSearchParams();
    const requestedSort = params.get('sort') || 'trending';
    const sort = SORTS.some(option => option.key === requestedSort) ? requestedSort : 'trending';
    const q = params.get('q') || '';
    const tag = params.get('tag') || '';
    const pageDepth = getPageDepth(params.get('page'));
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    // Once a page has loaded, later sorts and filters keep it on screen
    // (dimmed) until the new one arrives, instead of blanking the grid.
    const [loaded, setLoaded] = useState(false);
    const [shownKey, setShownKey] = useState('');
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [total, setTotal] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState('');
    const loadMoreVersion = useRef(0);
    const loadMoreLocks = useRef(new Set());
    const skipNextPageRestore = useRef('');
    const paramsKey = params.toString();

    const beginLoad = useLatest();

    useEffect(() => {
        const normalized = normalizeExploreParams(params);
        if (normalized.toString() !== paramsKey) setParams(normalized, {replace: true});
    }, [params, paramsKey, setParams]);

    useEffect(() => {
        if (q.trim()) return;
        if (shouldSkipPageRestore(skipNextPageRestore.current, paramsKey)) {
            skipNextPageRestore.current = '';
            return;
        }
        skipNextPageRestore.current = '';
        loadMoreVersion.current += 1;
        setLoadingMore(false);
        setLoadMoreError('');
        const fresh = beginLoad();
        setLoading(true);
        setFailed(false);
        const pageRequests = Array.from({length: pageDepth}, (_, pageIndex) => (
            api.explore({sort, q, tag, offset: pageIndex * PAGE_SIZE, limit: PAGE_SIZE})
        ));
        Promise.all(pageRequests)
            .then(fresh(pages => {
                setProjects(mergeProjects(pages.map(page => page.projects)));
                setTotal(pages.length ? pages[0].total || 0 : 0);
                setShownKey(`${sort}:${tag}:${attempt}`);
                setLoaded(true);
            }))
            .catch(fresh(() => setFailed(true)))
            .finally(fresh(() => setLoading(false)));
    }, [sort, q, tag, pageDepth, paramsKey, beginLoad, attempt, viewerName]);

    const browseLink = changes => {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(changes)) {
            if (value && !(key === 'sort' && value === 'trending')) next.set(key, value);
            else next.delete(key);
        }
        next.delete('page');
        const query = next.toString();
        return `/explore${query ? `?${query}` : ''}`;
    };
    const go = changes => setParams(new URLSearchParams(browseLink(changes).split('?')[1] || ''));

    const loadMore = async () => {
        const version = loadMoreVersion.current;
        if (loadMoreLocks.current.has(version)) return;
        loadMoreLocks.current.add(version);
        setLoadingMore(true);
        setLoadMoreError('');
        try {
            const data = await api.explore({
                sort,
                q,
                tag,
                offset: pageDepth * PAGE_SIZE,
                limit: PAGE_SIZE
            });
            if (loadMoreVersion.current !== version) return;
            const incoming = data.projects || [];
            if (incoming.length) {
                setProjects(current => mergeProjects([current, incoming]));
                const next = new URLSearchParams(params);
                next.set('page', String(pageDepth + 1));
                skipNextPageRestore.current = next.toString();
                setParams(next, {replace: true});
            }
            setTotal(data.total || 0);
        } catch (requestError) {
            if (loadMoreVersion.current === version) setLoadMoreError(requestError.message || communityText('Could not load more projects.'));
        } finally {
            loadMoreLocks.current.delete(version);
            if (loadMoreVersion.current === version) setLoadingMore(false);
        }
    };

    if (q.trim()) return <Navigate to={searchPath(q)} replace />;

    const filterList = (title, options, key, current) => (
        <div className={styles.filterGroup}>
            <h2 id={`explore-${key}`}>{title}</h2>
            <ul aria-labelledby={`explore-${key}`}>
                {options.map(option => (
                    <li key={option.key}>
                        <Link
                            to={browseLink({[key]: option.key})}
                            aria-current={current === option.key ? 'page' : null}
                            className={current === option.key ? styles.filterActive : styles.filter}
                        >{communityText(option.label)}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <main className={styles.page}>
            <ExploreHeader active="projects" />
            <div className={styles.browse}>
                <aside className={styles.filters}>
                    {filterList(communityText('Sort'), SORTS, 'sort', sort)}
                    {filterList(communityText('Show'), FILTERS, 'tag', tag)}
                </aside>
                <div className={styles.results}>
                    <div className={styles.compactFilters}>
                        <SelectMenu
                            ariaLabel={communityText('Sort projects')}
                            value={sort}
                            onChange={value => go({sort: value})}
                            options={SORTS.map(option => ({value: option.key, label: communityText(option.label)}))}
                        />
                        <SelectMenu
                            align="right"
                            ariaLabel={communityText('Filter by category')}
                            value={tag}
                            onChange={value => go({tag: value})}
                            options={FILTERS.map(option => ({value: option.key, label: communityText(option.label)}))}
                        />
                    </div>
                    {loading && (!loaded || !projects.length) ? (
                        <div
                            className={styles.grid}
                            aria-hidden="true"
                        >
                            {Array.from({length: 9}, (_, index) => <CardSkeleton key={index} />)}
                        </div>
                    ) : failed ? (
                        <StatusMessage
                            className={styles.status}
                            compact
                            error
                            onRetry={() => setAttempt(a => a + 1)}
                        >{communityText('Could not load projects.')}</StatusMessage>
                    ) : projects.length ? (
                        <div
                            key={shownKey}
                            className={loading ? `${styles.grid} ${styles.stale}` : styles.grid}
                            aria-busy={loading}
                        >
                            {projects.map((project, index) => (
                                <GameCard
                                    key={project.id}
                                    className={index === 0 && sort === 'trending' ? `${styles.card} ${styles.lead}` : styles.card}
                                    rank={index < 10 && (sort === 'trending' || sort === 'loved') ? index + 1 : null}
                                    style={{'--delay': `${(index % PAGE_SIZE) * 25}ms`}}
                                    project={project}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.empty}>
                            {communityText('Nothing here yet.')}
                            {' '}
                            {tag || sort !== 'trending' ? (
                                <QuietLink to="/explore">{communityText('See everything')}</QuietLink>
                            ) : null}
                        </p>
                    )}
                    {!loading && !failed && projects.length < total ? (
                        <div className={styles.more}>
                            <Button
                                busy={loadingMore}
                                busyLabel={communityText('Loading…')}
                                onClick={loadMore}
                            >
                                {communityText('Load more ({value1} left)', {value1: total - projects.length})}
                            </Button>
                            {loadMoreError ? <span role="alert">{loadMoreError}</span> : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </main>
    );
};

export {getPageDepth, mergeProjects, normalizeExploreParams, shouldSkipPageRestore};
export default Explore;
