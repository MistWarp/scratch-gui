import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {Link, Navigate, useNavigate, useSearchParams} from 'react-router-dom';
import {Search as SearchIcon} from 'lucide-react';
import api from '../api';
import rotur from '../rotur';
import searchPath from '../search-path.js';
import useLatest from '../use-latest.js';
import ProjectCard from '../components/ProjectCard.jsx';
import SpaceCard from '../components/SpaceCard.jsx';
import Avatar from '../components/Avatar.jsx';
import GroupTag from '../components/GroupTag.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import {ExploreSearch} from '../components/ExploreHeader.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import SectionTabs, {tabPanelProps} from '../components/SectionTabs.jsx';
import CardGridSkeleton from '../components/CardGridSkeleton.jsx';
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
const SECTION_KEYS = ['projects', 'people', 'spaces'];
const PAGE_SIZE = 24;
const PREVIEW = {projects: 8, people: 5, spaces: 4};
const EMPTY_SECTION = {items: [], total: 0, failed: false, exhausted: false};
const ITEM_KEYS = {projects: project => project.id, people: person => person.username, spaces: space => space._id};

// Reads one page of a result type after the first `count` results. People search has
// no offset, so the next page asks for a longer list and replaces the current one.
export const fetchSearchSection = (key, {q, sort, count}) => {
    if (key === 'projects') {
        return api.explore({q, sort, offset: count, limit: PAGE_SIZE})
            .then(data => ({items: data.projects || [], total: data.total || 0}));
    }
    if (key === 'people') {
        return api.searchUsers(q, {limit: count + PAGE_SIZE}).then(data => (
            rotur.withGroupTags(data.users || []).then(users => ({items: users, total: data.total ?? users.length, replace: true}))
        ));
    }
    return api.spaces({q, offset: count, limit: PAGE_SIZE})
        .then(data => ({items: data.spaces || [], total: data.total || 0}));
};

export const mergeSearchPage = (key, current, page) => {
    if (page.replace) return page.items;
    const seen = new Set(current.map(ITEM_KEYS[key]));
    return current.concat(page.items.filter(item => !seen.has(ITEM_KEYS[key](item))));
};

const Search = () => {
    const {text: communityText} = useCommunityText();
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();
    const q = (params.get('q') || '').trim();
    const requestedTab = params.get('tab') || 'all';
    const tab = TABS.includes(requestedTab) ? requestedTab : 'all';
    const requestedSort = params.get('sort') || 'relevance';
    const sort = SORTS.some(option => option.key === requestedSort) ? requestedSort : 'relevance';
    const [draft, setDraft] = useState(q);
    const [results, setResults] = useState({projects: EMPTY_SECTION, people: EMPTY_SECTION, spaces: EMPTY_SECTION});
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    const [loadingMore, setLoadingMore] = useState('');
    const [loadMoreError, setLoadMoreError] = useState(null);
    const beginLoad = useLatest();
    const loadMoreVersion = useRef(0);
    const loadMoreLocks = useRef(new Set());

    useEffect(() => {
        setDraft(q);
    }, [q]);

    useEffect(() => {
        if (!q) return;
        const fresh = beginLoad();
        loadMoreVersion.current += 1;
        setLoading(true);
        setLoadingMore('');
        setLoadMoreError(null);
        Promise.allSettled(SECTION_KEYS.map(key => fetchSearchSection(key, {q, sort, count: 0}))).then(fresh(settled => {
            const next = {};
            SECTION_KEYS.forEach((key, index) => {
                const result = settled[index];
                next[key] = result.status === 'fulfilled' ?
                    {...EMPTY_SECTION, items: result.value.items, total: result.value.total} :
                    {...EMPTY_SECTION, failed: true};
            });
            setResults(next);
            setLoading(false);
        }));
    }, [q, sort, attempt, beginLoad]);

    if (!q) return <Navigate to="/explore" replace />;

    const failed = SECTION_KEYS.every(key => results[key].failed);

    const setParam = (key, value, fallback) => {
        const next = new URLSearchParams(params);
        if (value === fallback) next.delete(key);
        else next.set(key, value);
        setParams(next);
    };

    const submitSearch = value => {
        const nextQuery = value.trim();
        if (!nextQuery) {
            navigate(searchPath(nextQuery));
            return;
        }
        setParam('q', nextQuery, '');
    };

    const loadMoreErrors = {
        projects: communityText('Could not load more projects.'),
        people: communityText('Could not load more people.'),
        spaces: communityText('Could not load more spaces.')
    };

    // Loads the next page of one result type, or reloads it from the start after it failed.
    const loadSection = async (key, more) => {
        const version = loadMoreVersion.current;
        const lock = `${version}:${key}`;
        if (loadMoreLocks.current.has(lock)) return;
        loadMoreLocks.current.add(lock);
        setLoadingMore(key);
        setLoadMoreError(null);
        try {
            const page = await fetchSearchSection(key, {q, sort, count: more ? results[key].items.length : 0});
            if (loadMoreVersion.current !== version) return;
            setResults(current => {
                const before = more ? current[key].items : [];
                const items = mergeSearchPage(key, before, page);
                return {
                    ...current,
                    [key]: {items, total: page.total, failed: false, exhausted: more && items.length <= before.length}
                };
            });
        } catch (error) {
            if (loadMoreVersion.current !== version) return;
            if (more) setLoadMoreError({key, message: error.message || loadMoreErrors[key]});
            else setResults(current => ({...current, [key]: {...EMPTY_SECTION, failed: true}}));
        } finally {
            loadMoreLocks.current.delete(lock);
            if (loadMoreVersion.current === version) setLoadingMore(current => (current === key ? '' : current));
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
                            {communityText('{count, plural, one {# follower} other {# followers}}', {count: person.followers ?? 0})}
                            {', '}
                            {communityText('{count, plural, one {# project} other {# projects}}', {count: person.projects || 0})}
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

    const {projects, people, spaces} = results;
    const sections = rankSections([
        {key: 'projects', heading: 'Projects', total: projects.total, match: projects.items.map(project => project.title), items: projects.items.slice(0, PREVIEW.projects), render: projectGrid},
        {key: 'people', heading: 'People', total: people.total, match: people.items.map(person => person.username), items: people.items.slice(0, PREVIEW.people), render: peopleList},
        {key: 'spaces', heading: 'Spaces', total: spaces.total, match: spaces.items.map(space => space.title), items: spaces.items.slice(0, PREVIEW.spaces), render: spaceGrid}
    ].filter(section => section.items.length), q);

    const sectionErrors = {
        projects: communityText('Could not load projects.'),
        people: communityText('Could not load people.'),
        spaces: communityText('Could not load spaces.')
    };
    const sectionError = (key, compact) => (
        loadingMore === key ? <StatusMessage compact={compact}>{communityText('Searching…')}</StatusMessage> : (
            <StatusMessage compact={compact} error onRetry={() => loadSection(key, false)}>{sectionErrors[key]}</StatusMessage>
        )
    );

    const moreButton = key => {
        const section = results[key];
        if (section.failed || section.exhausted || section.items.length >= section.total) return null;
        return (
            <div className={styles.more}>
                <Button busy={loadingMore === key} busyLabel={communityText('Loading…')} onClick={() => loadSection(key, true)}>
                    {communityText('Load more ({value1} left)', {value1: section.total - section.items.length})}
                </Button>
                {loadMoreError && loadMoreError.key === key ? <span role="alert">{loadMoreError.message}</span> : null}
            </div>
        );
    };

    const tabLabel = (label, key) => <>{label}{results[key].failed ? null : <>{' '}<b>{results[key].total}</b></>}</>;
    const tabs = [
        {key: 'all', label: communityText('All')},
        {key: 'projects', label: tabLabel(communityText('Projects'), 'projects')},
        {key: 'people', label: tabLabel(communityText('People'), 'people')},
        {key: 'spaces', label: tabLabel(communityText('Spaces'), 'spaces')}
    ];
    const failedSections = SECTION_KEYS.filter(key => results[key].failed);
    // Sorting reorders the project results in place, so it's a button group, not tabs.
    const sortControl = (
        <SectionTabs
            items={SORTS}
            value={sort}
            onChange={key => setParam('sort', key, 'relevance')}
            className={styles.sorts}
            itemClassName={styles.sort}
            activeClassName={styles.sortActive}
            ariaLabel="Project sorting"
            variant="buttons"
        />
    );

    return (
        <main className={styles.page}>
            <PageHeader
                compact
                icon={SearchIcon}
                title={communityText('Results for "{value1}"', {value1: q})}
                actions={(
                    <ExploreSearch
                        ariaLabel={communityText('Search MistWarp')}
                        value={draft}
                        onChange={setDraft}
                        onSubmit={submitSearch}
                    />
                )}
            >
                <UnderlineTabs
                    items={tabs}
                    value={tab}
                    onChange={key => setParam('tab', key, 'all')}
                    ariaLabel="Search result types"
                    idPrefix="search"
                />
            </PageHeader>
            <div {...tabPanelProps('search', tab)}>
                {tab === 'projects' && loading ? (
                    <>
                        {sortControl}
                        <CardGridSkeleton className={styles.grid} count={PREVIEW.projects} />
                    </>
                ) : loading ? <StatusMessage>{communityText('Searching…')}</StatusMessage> : failed ? (
                    <StatusMessage error onRetry={() => setAttempt(a => a + 1)}>{communityText('Could not load these results.')}</StatusMessage>
                ) : tab === 'all' ? (
                    <>
                        {sections.map(section => (
                            <section key={section.key} className={styles.section}>
                                <SectionHeading
                                    title={communityText(section.heading)}
                                    actions={section.total > section.items.length ? (
                                        <button type="button" className={styles.seeAll} onClick={() => setParam('tab', section.key, 'all')}>
                                            {communityText('See all {value1}', {value1: section.total})}
                                        </button>
                                    ) : null}
                                />
                                {section.render(section.items)}
                            </section>
                        ))}
                        {failedSections.map(key => <div key={key} className={styles.section}>{sectionError(key, true)}</div>)}
                        {sections.length || failedSections.length ? null : (
                            <EmptyState icon={SearchIcon} title={communityText('Nothing matched that search')}>{communityText('Try a different search term.')}</EmptyState>
                        )}
                    </>
                ) : tab === 'projects' ? (
                    <>
                        {sortControl}
                        {projects.failed ? sectionError('projects') : projects.items.length ? projectGrid(projects.items) : <EmptyState icon={SearchIcon} title={communityText('No projects matched that search')}>{communityText('Try a different search term.')}</EmptyState>}
                        {moreButton('projects')}
                    </>
                ) : tab === 'people' ? (
                    <>
                        {people.failed ? sectionError('people') : people.items.length ? peopleList(people.items) : <EmptyState icon={SearchIcon} title={communityText('No people matched that search')}>{communityText('Try a different search term.')}</EmptyState>}
                        {moreButton('people')}
                    </>
                ) : (
                    <>
                        {spaces.failed ? sectionError('spaces') : spaces.items.length ? spaceGrid(spaces.items) : <EmptyState icon={SearchIcon} title={communityText('No spaces matched that search')}>{communityText('Try a different search term.')}</EmptyState>}
                        {moreButton('spaces')}
                    </>
                )}
            </div>
        </main>
    );
};

export default Search;
