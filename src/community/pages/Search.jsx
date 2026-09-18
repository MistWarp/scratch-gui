import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link, Navigate, useSearchParams} from 'react-router-dom';
import api from '../api';
import rotur from '../rotur';
import useLatest from '../use-latest.js';
import ProjectCard from '../components/ProjectCard.jsx';
import SpaceCard from '../components/SpaceCard.jsx';
import Avatar from '../components/Avatar.jsx';
import GroupTag from '../components/GroupTag.jsx';
import Button from '../components/ui/Button.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import {rankSections} from '../search-rank.js';
import styles from './Search.module.css';

const SORTS = [
    {key: 'relevance', label: 'Best match'},
    {key: 'trending', label: 'Trending'},
    {key: 'recent', label: 'Recent'},
    {key: 'loved', label: 'Most loved'}
];
const TABS = ['all', 'projects', 'people', 'spaces'];
const PAGE_SIZE = 24;
const PREVIEW = {projects: 8, people: 5, spaces: 4};

const Search = () => {
    const {text: communityText} = useCommunityText();
    const [params, setParams] = useSearchParams();
    const q = (params.get('q') || '').trim();
    const requestedTab = params.get('tab') || 'all';
    const tab = TABS.includes(requestedTab) ? requestedTab : 'all';
    const requestedSort = params.get('sort') || 'relevance';
    const sort = SORTS.some(option => option.key === requestedSort) ? requestedSort : 'relevance';
    const [projects, setProjects] = useState([]);
    const [projectTotal, setProjectTotal] = useState(0);
    const [people, setPeople] = useState([]);
    const [peopleTotal, setPeopleTotal] = useState(0);
    const [spaces, setSpaces] = useState([]);
    const [spaceTotal, setSpaceTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState('');
    const beginLoad = useLatest();

    useEffect(() => {
        if (!q) return;
        const fresh = beginLoad();
        setLoading(true);
        setFailed(false);
        setLoadMoreError('');
        Promise.allSettled([
            api.explore({q, sort, limit: PAGE_SIZE}),
            api.searchUsers(q, {limit: PAGE_SIZE}).then(data => (
                rotur.withGroupTags(data.users || []).then(users => ({users, total: data.total ?? users.length}))
            )),
            api.spaces({q, limit: PAGE_SIZE})
        ]).then(fresh(([projectResult, peopleResult, spaceResult]) => {
            const projectData = projectResult.status === 'fulfilled' ? projectResult.value : {};
            const peopleData = peopleResult.status === 'fulfilled' ? peopleResult.value : {};
            const spaceData = spaceResult.status === 'fulfilled' ? spaceResult.value : {};
            setProjects(projectData.projects || []);
            setProjectTotal(projectData.total || 0);
            setPeople(peopleData.users || []);
            setPeopleTotal(peopleData.total || 0);
            setSpaces(spaceData.spaces || []);
            setSpaceTotal(spaceData.total || 0);
            setFailed([projectResult, peopleResult, spaceResult].every(result => result.status === 'rejected'));
            setLoading(false);
        }));
    }, [q, sort, attempt, beginLoad]);

    if (!q) return <Navigate to="/explore" replace />;

    const setParam = (key, value, fallback) => {
        const next = new URLSearchParams(params);
        if (value === fallback) next.delete(key);
        else next.set(key, value);
        setParams(next);
    };

    const loadMore = async () => {
        setLoadingMore(true);
        setLoadMoreError('');
        try {
            const data = await api.explore({q, sort, offset: projects.length, limit: PAGE_SIZE});
            setProjects(current => current.concat(data.projects || []));
            setProjectTotal(data.total || 0);
        } catch (error) {
            setLoadMoreError(error.message || communityText('Could not load more projects.'));
        } finally {
            setLoadingMore(false);
        }
    };

    const projectGrid = items => (
        <div className={styles.grid}>
            {items.map(project => <ProjectCard key={project.id} project={project} showTrend={sort === 'trending'} />)}
        </div>
    );

    const peopleList = items => (
        <div className={styles.people}>
            {items.map(person => (
                <Link key={person.username} to={`/users/${person.username}`} className={styles.person}>
                    <Avatar username={person.username} size={44} />
                    <div className={styles.personInfo}>
                        <span className={styles.personName}>{person.username}</span>
                        {person.group_tag ? <GroupTag tag={person.group_tag} compact linked={false} /> : null}
                        <span className={styles.personMeta}>
                            {person.followers ?? 0} {person.followers === 1 ? communityText('follower') : communityText('followers')}
                            {' · '}
                            {person.projects} {person.projects === 1 ? communityText('project') : communityText('projects')}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );

    const spaceGrid = items => (
        <div className={styles.spaceGrid}>
            {items.map(space => <SpaceCard key={space._id} space={space} to={`/spaces/${space._id}`} />)}
        </div>
    );

    const sections = rankSections([
        {key: 'projects', heading: 'Projects', total: projectTotal, match: projects.map(project => project.title), items: projects.slice(0, PREVIEW.projects), render: projectGrid},
        {key: 'people', heading: 'People', total: peopleTotal, match: people.map(person => person.username), items: people.slice(0, PREVIEW.people), render: peopleList},
        {key: 'spaces', heading: 'Studios and challenges', total: spaceTotal, match: spaces.map(space => space.title), items: spaces.slice(0, PREVIEW.spaces), render: spaceGrid}
    ].filter(section => section.items.length), q);

    const tabs = [
        {key: 'all', label: communityText('All')},
        {key: 'projects', label: <>{communityText('Projects')} <b>{projectTotal}</b></>},
        {key: 'people', label: <>{communityText('People')} <b>{peopleTotal}</b></>},
        {key: 'spaces', label: <>{communityText('Studios')} <b>{spaceTotal}</b></>}
    ];

    return (
        <main className={styles.page}>
            <h1 className={styles.title}>{communityText("Results for \"{value1}\"", {value1: q})}</h1>
            <UnderlineTabs
                items={tabs}
                value={tab}
                onChange={key => setParam('tab', key, 'all')}
                ariaLabel="Search result types"
                className={styles.tabs}
            />
            {loading ? <p className={styles.status}>{communityText('Searching…')}</p> : failed ? (
                <p className={styles.status}>{communityText("Couldn't load these results.")}{' '}
                    <Button onClick={() => setAttempt(a => a + 1)}>{communityText('Try again')}</Button>
                </p>
            ) : tab === 'all' ? (
                sections.length ? sections.map(section => (
                    <section key={section.key} className={styles.section}>
                        <div className={styles.sectionHead}>
                            <h2>{communityText(section.heading)}</h2>
                            {section.total > section.items.length ? (
                                <button type="button" className={styles.seeAll} onClick={() => setParam('tab', section.key, 'all')}>
                                    {communityText("See all {value1}", {value1: section.total})}
                                </button>
                            ) : null}
                        </div>
                        {section.render(section.items)}
                    </section>
                )) : <p className={styles.status}>{communityText('Nothing matched that search.')}</p>
            ) : tab === 'projects' ? (
                <>
                    <SectionTabs
                        items={SORTS}
                        value={sort}
                        onChange={key => setParam('sort', key, 'relevance')}
                        className={styles.sorts}
                        itemClassName={styles.sort}
                        activeClassName={styles.sortActive}
                        ariaLabel="Project sorting"
                    />
                    {projects.length ? projectGrid(projects) : <p className={styles.status}>{communityText('No projects matched that search.')}</p>}
                    {projects.length < projectTotal ? (
                        <div className={styles.more}>
                            <Button busy={loadingMore} busyLabel={communityText('Loading…')} onClick={loadMore}>
                                {communityText("Load more ({value1} left)", {value1: projectTotal - projects.length})}
                            </Button>
                            {loadMoreError ? <span role="alert">{loadMoreError}</span> : null}
                        </div>
                    ) : null}
                </>
            ) : tab === 'people' ? (
                people.length ? peopleList(people) : <p className={styles.status}>{communityText('No people matched that search.')}</p>
            ) : (
                spaces.length ? spaceGrid(spaces) : <p className={styles.status}>{communityText('No studios or challenges matched that search.')}</p>
            )}
        </main>
    );
};

export default Search;
