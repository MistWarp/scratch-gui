/* eslint-disable max-len */
import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useState} from 'react';
import {
    ExternalLink, EyeOff, FolderOpen, Globe, Heart, Library, Pencil, Play, Plus, SlidersHorizontal, Star, Trash2,
    Upload
} from 'lucide-react';
import {editorUrl, projectUrl} from '../api';
import {formatBytes, timeAgoText} from '../format';
import {CardStats} from './GameCard.jsx';
import ListSkeleton from './ListSkeleton.jsx';
import {ExploreSearch} from './ExploreHeader.jsx';
import StuffRow, {MenuLink, MenuSeparator, MetaLine, StuffList} from './StuffRow.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import IconButton from './ui/IconButton.jsx';
import SelectMenu from './ui/SelectMenu.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './MyStuffProjects.module.css';

const SHOWS = [
    {value: 'all', label: 'All projects'},
    {value: 'shared', label: 'Shared'},
    {value: 'unlisted', label: 'Unlisted'},
    {value: 'drafts', label: 'Drafts'},
    {value: 'untitled', label: 'Untitled drafts'}
];

const SORTS = [
    {value: 'edited', label: 'Last edited'},
    {value: 'title', label: 'Name'},
    {value: 'plays', label: 'Most played'},
    {value: 'loves', label: 'Most loved'},
    {value: 'size', label: 'Largest'}
];

const projectVisibility = project => {
    if (project.moderationHidden) return 'hidden';
    const visibility = project.visibility || (project.shared ? 'public' : 'private');
    if (visibility === 'public') return 'shared';
    if (visibility === 'unlisted') return 'unlisted';
    return 'draft';
};

// The editor names a new project "Project", so most drafts nobody named look
// alike. Those are the ones worth sweeping up.
const UNTITLED = /^\s*(project|untitled)(\s*\(?\d+\)?)?\s*$/i;
const isUntitledDraft = project => projectVisibility(project) === 'draft' && UNTITLED.test(project.title || '');

const filterProjects = (projects, {show = 'all', query = ''} = {}) => {
    const needle = query.trim().toLowerCase();
    return (projects || []).filter(project => {
        if (needle && !String(project.title || '').toLowerCase()
            .includes(needle)) return false;
        const visibility = projectVisibility(project);
        if (show === 'shared') return visibility === 'shared';
        if (show === 'unlisted') return visibility === 'unlisted';
        if (show === 'drafts') return visibility === 'draft';
        if (show === 'untitled') return isUntitledDraft(project);
        return true;
    });
};

const number = value => Number(value) || 0;
const sortProjects = (projects, sort = 'edited') => {
    const list = (projects || []).slice();
    const edited = project => number(project.edited || project.created);
    const by = {
        title: (a, b) => String(a.title || '').localeCompare(String(b.title || ''), getCommunityLocale(), {
            numeric: true,
            sensitivity: 'base'
        }),
        plays: (a, b) => number(b.views) - number(a.views),
        loves: (a, b) => number(b.loveCount) - number(a.loveCount),
        size: (a, b) => number(b.sizeBytes) - number(a.sizeBytes)
    }[sort];
    if (!by) return list;
    return list.sort((a, b) => by(a, b) || edited(b) - edited(a));
};

// Whether the list as asked for needs every project, not just the first page.
const needsEveryProject = ({show, sort, query}) => show !== 'all' || sort !== 'edited' || Boolean(query.trim());

const ProjectMenu = ({close, featured, onCollection, onFeature, onShare, onTrash, project}) => {
    const {text: communityText} = useCommunityText();
    const visibility = projectVisibility(project);
    const act = handler => () => {
        close(false);
        handler(project);
    };
    return (
        <React.Fragment>
            <MenuLink href={editorUrl({platformProject: project.id})} onClick={() => close(false)}>
                <Pencil size={15} aria-hidden="true" />{communityText('Open in editor')}
            </MenuLink>
            <MenuLink to={projectUrl(project)} onClick={() => close(false)}>
                <ExternalLink size={15} aria-hidden="true" />{communityText('Project page')}
            </MenuLink>
            <MenuLink to={`/mystuff/project/${project.id}`} onClick={() => close(false)}>
                <SlidersHorizontal size={15} aria-hidden="true" />{communityText('Manage & analytics')}
            </MenuLink>
            <MenuSeparator />
            {visibility === 'shared' ? (
                <MenuLink onClick={act(onShare)}>
                    <EyeOff size={15} aria-hidden="true" />{communityText('Unshare')}
                </MenuLink>
            ) : visibility === 'hidden' ? null : (
                <MenuLink onClick={act(onShare)}>
                    <Globe size={15} aria-hidden="true" />{communityText('Share')}
                </MenuLink>
            )}
            <MenuLink onClick={act(onCollection)}>
                <Library size={15} aria-hidden="true" />{communityText('Save to collection')}
            </MenuLink>
            {visibility === 'shared' ? (
                <MenuLink onClick={act(onFeature)}>
                    <Star size={15} fill={featured ? 'currentColor' : 'none'} aria-hidden="true" />
                    {featured ? communityText('Remove profile feature') : communityText('Feature on profile')}
                </MenuLink>
            ) : null}
            <MenuSeparator />
            <MenuLink
                danger onClick={() => {
                    close(false);
                    onTrash([project]);
                }}
            >
                <Trash2 size={15} aria-hidden="true" />{communityText('Move to Trash')}
            </MenuLink>
        </React.Fragment>
    );
};

ProjectMenu.propTypes = {
    close: PropTypes.func.isRequired,
    featured: PropTypes.bool,
    onCollection: PropTypes.func.isRequired,
    onFeature: PropTypes.func.isRequired,
    onShare: PropTypes.func.isRequired,
    onTrash: PropTypes.func.isRequired,
    project: PropTypes.object.isRequired
};

const MyStuffProjects = ({
    allLoading, busyIds, failed, featuredProject, hasMore, moreBusy, moreFailed, onCollection, onFeature,
    onLoadMore, onNeedAll, onRetry, onShare, onShowChange, onSortChange, onTrash, onUpload, projects, show, sort
}) => {
    const {text: communityText} = useCommunityText();
    const [query, setQuery] = useState('');
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(() => new Set());
    const narrowed = needsEveryProject({show, sort, query});

    useEffect(() => {
        if (narrowed && hasMore) onNeedAll();
    }, [hasMore, narrowed, onNeedAll]);

    const visible = useMemo(() => sortProjects(filterProjects(projects, {show, query}), sort), [projects, show, query, sort]);
    const untitledCount = useMemo(() => (projects || []).filter(isUntitledDraft).length, [projects]);

    // Selections only cover rows still in the list.
    useEffect(() => {
        if (!projects) return;
        setSelected(current => {
            const ids = new Set(projects.map(project => project.id));
            const next = new Set([...current].filter(id => ids.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [projects]);

    const stopSelecting = () => {
        setSelecting(false);
        setSelected(new Set());
    };
    const toggle = (id, on) => setSelected(current => {
        const next = new Set(current);
        if (on) next.add(id);
        else next.delete(id);
        return next;
    });
    const allVisibleSelected = visible.length > 0 && visible.every(project => selected.has(project.id));
    const selectAll = () => setSelected(allVisibleSelected ? new Set() : new Set(visible.map(project => project.id)));
    const trashSelected = () => {
        const chosen = (projects || []).filter(project => selected.has(project.id));
        if (!chosen.length) return;
        onTrash(chosen);
        stopSelecting();
    };

    if (failed) {
        return <StatusMessage compact error onRetry={onRetry}>{communityText('Could not load your projects.')}</StatusMessage>;
    }
    if (projects === null) {
        return <ListSkeleton count={8} media="square" label={communityText('Loading your projects…')} />;
    }
    if (!projects.length && !hasMore) {
        return (
            <EmptyState
                icon={FolderOpen}
                title={communityText('No projects yet')}
                action={(
                    <React.Fragment>
                        <Button variant="primary" as="a" href={editorUrl()}>
                            <Plus size={16} />{communityText('New project')}</Button>
                        <Button onClick={onUpload}><Upload size={16} />{communityText('Upload .sb3')}</Button>
                    </React.Fragment>
                )}
            >
                {communityText('You have not created any projects yet.')}
            </EmptyState>
        );
    }

    const selectedCount = selected.size;
    const toolbar = selecting ? (
        <div className={styles.selectBar} role="toolbar" aria-label={communityText('Selected projects')}>
            <span className={styles.selectCount} aria-live="polite">
                {selectedCount ?
                    communityText('{count} selected', {count: selectedCount.toLocaleString(getCommunityLocale())}) :
                    communityText('Pick projects to move to Trash')}
            </span>
            <Button size="small" onClick={selectAll} disabled={!visible.length}>
                {allVisibleSelected ? communityText('Clear selection') : communityText('Select all {count}', {count: visible.length})}
            </Button>
            <Button size="small" variant="danger" onClick={trashSelected} disabled={!selectedCount}>
                <Trash2 size={14} />{communityText('Move to Trash')}
            </Button>
            <Button size="small" className={styles.done} onClick={stopSelecting}>{communityText('Done')}</Button>
        </div>
    ) : (
        <div className={styles.toolbar}>
            <ExploreSearch
                ariaLabel={communityText('Search your projects')}
                value={query}
                onChange={setQuery}
            />
            <div className={styles.controls}>
                <SelectMenu
                    ariaLabel={communityText('Show projects')}
                    value={show}
                    onChange={onShowChange}
                    options={SHOWS.map(option => ({value: option.value, label: communityText(option.label)}))}
                />
                <SelectMenu
                    align="right"
                    ariaLabel={communityText('Sort projects')}
                    value={sort}
                    onChange={onSortChange}
                    options={SORTS.map(option => ({value: option.value, label: communityText(option.label)}))}
                />
                <Button className={styles.selectButton} onClick={() => setSelecting(true)}>{communityText('Select')}</Button>
            </div>
        </div>
    );

    const hint = !selecting && show === 'all' && !query.trim() && untitledCount >= 3 ? (
        <p className={styles.hint}>
            {hasMore ?
                communityText('Lots of your drafts are still called “Project” or “Untitled”.') :
                communityText('{count} drafts are still called “Project” or “Untitled”.', {count: untitledCount})}
            {' '}
            <button type="button" className={styles.hintLink} onClick={() => onShowChange('untitled')}>
                {communityText('Show them')}
            </button>
        </p>
    ) : null;

    const untitledHint = !selecting && show === 'untitled' && visible.length ? (
        <p className={styles.hint}>
            {communityText('Drafts nobody named. Open one to give it a name, or clear them out.')}
            {' '}
            <button
                type="button"
                className={styles.hintLink}
                onClick={() => {
                    setSelecting(true);
                    setSelected(new Set(visible.map(project => project.id)));
                }}
            >
                {communityText('Select all {count}', {count: visible.length})}
            </button>
        </p>
    ) : null;

    return (
        <React.Fragment>
            {toolbar}
            {hint}
            {untitledHint}
            {visible.length ? (
                <StuffList busy={allLoading}>
                    {visible.map(project => {
                        const visibility = projectVisibility(project);
                        const featured = featuredProject === project.id;
                        const busy = busyIds.has(project.id);
                        const words = {
                            shared: communityText('Shared'),
                            unlisted: communityText('Unlisted'),
                            draft: communityText('Draft'),
                            hidden: communityText('Hidden by a moderator')
                        };
                        const edited = timeAgoText(project.edited || project.created);
                        return (
                            <StuffRow
                                key={project.id}
                                project={project}
                                title={project.title || communityText('Untitled')}
                                to={projectUrl(project)}
                                dimmed={busy}
                                selecting={selecting}
                                checked={selected.has(project.id)}
                                onCheck={on => toggle(project.id, on)}
                                meta={<MetaLine
                                    parts={[
                                        <span key="v" className={visibility === 'hidden' ? styles.warn : null}>{words[visibility]}</span>,
                                        featured ? communityText('On your profile') : null,
                                        edited ? communityText('Edited {value1}', {value1: edited}) : null,
                                        project.sizeBytes ? formatBytes(project.sizeBytes) : null
                                    ]}
                                />}
                                trailing={selecting ? null : (
                                    <React.Fragment>
                                        {visibility === 'draft' ? null : (
                                            <span className={styles.stats}>
                                                <CardStats
                                                    items={[{
                                                        icon: Heart,
                                                        label: communityText('{value1, plural, one {# love} other {# loves}}', {value1: number(project.loveCount)}),
                                                        value: number(project.loveCount).toLocaleString(getCommunityLocale())
                                                    }, {
                                                        icon: Play,
                                                        label: communityText('{value1, plural, one {# view} other {# views}}', {value1: number(project.views)}),
                                                        value: number(project.views).toLocaleString(getCommunityLocale())
                                                    }]}
                                                />
                                            </span>
                                        )}
                                        <IconButton
                                            as="a"
                                            href={editorUrl({platformProject: project.id})}
                                            className={styles.edit}
                                            label={communityText('Open {value1} in the editor', {value1: project.title})}
                                        ><Pencil size={16} /></IconButton>
                                    </React.Fragment>
                                )}
                                menuLabel={communityText('Actions for {value1}', {value1: project.title})}
                                menu={selecting ? null : ({close}) => (
                                    <ProjectMenu
                                        close={close}
                                        featured={featured}
                                        project={project}
                                        onCollection={onCollection}
                                        onFeature={onFeature}
                                        onShare={onShare}
                                        onTrash={onTrash}
                                    />
                                )}
                            />
                        );
                    })}
                </StuffList>
            ) : allLoading ? (
                <ListSkeleton count={4} media="square" label={communityText('Loading your projects…')} />
            ) : (
                <p className={styles.none}>
                    {query.trim() ?
                        communityText('No projects match “{value1}”.', {value1: query.trim()}) : {
                            shared: communityText('None of your projects are shared yet.'),
                            unlisted: communityText('None of your projects are unlisted.'),
                            drafts: communityText('No drafts. Everything you made is shared.'),
                            untitled: communityText('No untitled drafts left.')
                        }[show] || communityText('Nothing here.')}
                    {' '}
                    <button
                        type="button"
                        className={styles.hintLink}
                        onClick={() => {
                            setQuery('');
                            onShowChange('all');
                        }}
                    >{communityText('Show all projects')}</button>
                </p>
            )}
            {!narrowed && hasMore ? (
                <div className={styles.more}>
                    <Button
                        busy={moreBusy}
                        busyLabel={communityText('Loading…')}
                        onClick={onLoadMore}
                    >{communityText('Load more projects')}</Button>
                    {moreFailed ? <span role="alert">{communityText('Could not load more projects.')}</span> : null}
                </div>
            ) : null}
        </React.Fragment>
    );
};

MyStuffProjects.propTypes = {
    allLoading: PropTypes.bool,
    busyIds: PropTypes.instanceOf(Set),
    failed: PropTypes.bool,
    featuredProject: PropTypes.string,
    hasMore: PropTypes.bool,
    moreBusy: PropTypes.bool,
    moreFailed: PropTypes.bool,
    onCollection: PropTypes.func.isRequired,
    onFeature: PropTypes.func.isRequired,
    onLoadMore: PropTypes.func.isRequired,
    onNeedAll: PropTypes.func.isRequired,
    onRetry: PropTypes.func.isRequired,
    onShare: PropTypes.func.isRequired,
    onShowChange: PropTypes.func.isRequired,
    onSortChange: PropTypes.func.isRequired,
    onTrash: PropTypes.func.isRequired,
    onUpload: PropTypes.func.isRequired,
    projects: PropTypes.arrayOf(PropTypes.object),
    show: PropTypes.string,
    sort: PropTypes.string
};

MyStuffProjects.defaultProps = {
    allLoading: false,
    busyIds: new Set(),
    failed: false,
    featuredProject: '',
    hasMore: false,
    moreBusy: false,
    moreFailed: false,
    projects: null,
    show: 'all',
    sort: 'edited'
};

const getProjectShow = value => (SHOWS.some(option => option.value === value) ? value : 'all');
const getProjectSort = value => (SORTS.some(option => option.value === value) ? value : 'edited');

export {
    filterProjects, getProjectShow, getProjectSort, isUntitledDraft, needsEveryProject, projectVisibility, sortProjects
};
export default MyStuffProjects;
