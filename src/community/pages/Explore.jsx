/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {useSearchParams, Link} from 'react-router-dom';
import api from '../api';
import rotur from '../rotur';
import useLatest from '../use-latest.js';
import ProjectCard from '../components/ProjectCard.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
import ExploreNav from '../components/ExploreNav.jsx';
import GroupTag from '../components/GroupTag.jsx';
import {useUser} from '../UserContext.jsx';
import styles from './Explore.module.css';

const SORTS = [
    {key: 'trending', label: 'Trending'},
    {key: 'recent', label: 'Recent'},
    {key: 'loved', label: 'Most loved'},
    {key: 'undiscovered', label: 'Undiscovered'}
];

const CATEGORIES = ['games', 'animation', 'art', 'music', 'tools', 'tutorial', 'multiplayer', 'mobile'];
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
    const {user} = useUser();
    const viewerName = (user && user.username) || '';
    const [params, setParams] = useSearchParams();
    const requestedSort = params.get('sort') || 'trending';
    const sort = SORTS.some(option => option.key === requestedSort) ? requestedSort : 'trending';
    const q = params.get('q') || '';
    const tag = params.get('tag') || '';
    const pageDepth = getPageDepth(params.get('page'));
    const [projects, setProjects] = useState([]);
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);
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
            }))
            .catch(fresh(() => setFailed(true)))
            .finally(fresh(() => setLoading(false)));
        if (q.trim()) {
            api.searchUsers(q.trim())
                .then(data => rotur.withGroupTags((data.users || []).slice(0, 5)))
                .then(fresh(setPeople))
                .catch(fresh(() => setPeople([])));
        } else {
            setPeople([]);
        }
    }, [sort, q, tag, pageDepth, paramsKey, beginLoad, attempt, viewerName]);

    const setSort = key => {
        const next = new URLSearchParams(params);
        if (key === 'trending') next.delete('sort');
        else next.set('sort', key);
        next.delete('page');
        setParams(next);
    };

    const setTag = value => {
        const next = new URLSearchParams(params);
        if (value) next.set('tag', value);
        else next.delete('tag');
        next.delete('page');
        setParams(next);
    };

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
            if (loadMoreVersion.current === version) setLoadMoreError(requestError.message || 'Could not load more projects.');
        } finally {
            loadMoreLocks.current.delete(version);
            if (loadMoreVersion.current === version) setLoadingMore(false);
        }
    };

    return (
        <main className={styles.page}>
            <ExploreNav active="projects" />
            <div className={styles.head}>
                <h1>{q ? `Results for "${q}"` : 'Explore'}</h1>
                <SectionTabs
                    items={SORTS}
                    value={sort}
                    onChange={setSort}
                    className={styles.tabs}
                    itemClassName={styles.tab}
                    activeClassName={styles.tabActive}
                    ariaLabel="Project sorting"
                />
            </div>
            <div className={styles.categories}>
                <button type="button" className={!tag ? styles.categoryActive : styles.category} onClick={() => setTag('')}>All</button>
                {CATEGORIES.map(category => (
                    <button type="button" key={category} className={tag === category ? styles.categoryActive : styles.category} onClick={() => setTag(category)}>#{category}</button>
                ))}
            </div>
            {people.length ? (
                <div className={styles.people}>
                    {people.map(person => (
                        <Link
                            key={person.username}
                            to={`/users/${person.username}`}
                            className={styles.person}
                        >
                            <Avatar
                                username={person.username}
                                size={44}
                            />
                            <div className={styles.personInfo}>
                                <span className={styles.personName}>{person.username}</span>
                                {person.group_tag ? <GroupTag tag={person.group_tag} compact linked={false} /> : null}
                                <span className={styles.personMeta}>
                                    {person.followers ?? 0} {person.followers === 1 ? 'follower' : 'followers'}
                                    <br />
                                    {person.projects} {person.projects === 1 ? 'project' : 'projects'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : null}
            {loading ? (
                <p className={styles.status}>Loading…</p>
            ) : failed ? (
                <p className={styles.status}>
                    Couldn&apos;t load.{' '}
                    <Button onClick={() => setAttempt(a => a + 1)}>Try again</Button>
                </p>
            ) : projects.length ? (
                <div className={styles.grid}>
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            showTrend={sort === 'trending'}
                        />
                    ))}
                </div>
            ) : (
                <p className={styles.status}>No projects found.</p>
            )}
            {!loading && !failed && projects.length < total ? (
                <div className={styles.more}>
                    <Button busy={loadingMore} busyLabel="Loading…" onClick={loadMore}>
                        {`Load more (${total - projects.length} left)`}
                    </Button>
                    {loadMoreError ? <span role="alert">{loadMoreError}</span> : null}
                </div>
            ) : null}
        </main>
    );
};

export {getPageDepth, mergeProjects, normalizeExploreParams, shouldSkipPageRestore};
export default Explore;
