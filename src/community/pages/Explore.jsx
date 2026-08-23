/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {useSearchParams, Link} from 'react-router-dom';
import api from '../api';
import useLatest from '../use-latest.js';
import ProjectCard from '../components/ProjectCard.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
import styles from './Explore.module.css';

const SORTS = [
    {key: 'trending', label: 'Trending'},
    {key: 'recent', label: 'Recent'},
    {key: 'loved', label: 'Most loved'},
    {key: 'undiscovered', label: 'Undiscovered'}
];

const CATEGORIES = ['games', 'animation', 'art', 'music', 'tools', 'tutorial', 'multiplayer', 'mobile'];

const Explore = () => {
    const [params, setParams] = useSearchParams();
    const requestedSort = params.get('sort') || 'trending';
    const sort = SORTS.some(option => option.key === requestedSort) ? requestedSort : 'trending';
    const q = params.get('q') || '';
    const tag = params.get('tag') || '';
    const [projects, setProjects] = useState([]);
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [total, setTotal] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState('');
    const loadMoreVersion = useRef(0);

    const beginLoad = useLatest();

    useEffect(() => {
        loadMoreVersion.current += 1;
        setLoadingMore(false);
        setLoadMoreError('');
        const fresh = beginLoad();
        setLoading(true);
        setFailed(false);
        api.explore({sort, q, tag, limit: 24})
            .then(fresh(data => {
                setProjects(data.projects || []);
                setTotal(data.total || 0);
            }))
            .catch(fresh(() => setFailed(true)))
            .finally(fresh(() => setLoading(false)));
        if (q.trim()) {
            api.searchUsers(q.trim())
                .then(fresh(data => setPeople((data.users || []).slice(0, 5))))
                .catch(fresh(() => setPeople([])));
        } else {
            setPeople([]);
        }
    }, [sort, q, tag, beginLoad, attempt]);

    const setSort = key => {
        const next = new URLSearchParams(params);
        next.set('sort', key);
        setParams(next);
    };

    const setTag = value => {
        const next = new URLSearchParams(params);
        if (value) next.set('tag', value);
        else next.delete('tag');
        setParams(next);
    };

    const loadMore = async () => {
        if (loadingMore) return;
        const version = loadMoreVersion.current;
        setLoadingMore(true);
        setLoadMoreError('');
        try {
            const data = await api.explore({sort, q, tag, offset: projects.length, limit: 24});
            if (loadMoreVersion.current !== version) return;
            setProjects(current => [...current, ...(data.projects || [])]);
            setTotal(data.total || 0);
        } catch (requestError) {
            if (loadMoreVersion.current === version) setLoadMoreError(requestError.message || 'Could not load more projects.');
        } finally {
            if (loadMoreVersion.current === version) setLoadingMore(false);
        }
    };

    return (
        <main className={styles.page}>
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
                <button className={!tag ? styles.categoryActive : styles.category} onClick={() => setTag('')}>All</button>
                {CATEGORIES.map(category => (
                    <button key={category} className={tag === category ? styles.categoryActive : styles.category} onClick={() => setTag(category)}>#{category}</button>
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
                    <Button onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : `Load more (${total - projects.length} left)`}</Button>
                    {loadMoreError ? <span role="alert">{loadMoreError}</span> : null}
                </div>
            ) : null}
        </main>
    );
};

export default Explore;
