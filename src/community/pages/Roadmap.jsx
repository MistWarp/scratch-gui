import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {Bug, ArrowRight, Check, ChevronLeft, ChevronRight, Circle, GitMerge, GitPullRequest, Hammer, Lightbulb, LogIn, Map, MessageCircle, Plus, Search, X} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import CommentThread from '../components/CommentThread.jsx';
import RichText from '../components/RichText.jsx';
import ReactionButtons from '../components/ReactionButtons.jsx';
import PullRequestList from '../components/PullRequestList.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import {filterPulls, groupPulls, pullLinkValue, pullRepos, roadmapIndexForPulls, roadmapProgress} from '../development.js';
import {timeAgo} from '../format';
import useLatest from '../use-latest.js';
import styles from './Roadmap.module.css';

const STATUS_LABELS = {
    open: 'Suggested',
    planned: 'Planned',
    building: 'In progress',
    shipped: 'Done',
    declined: 'Not planned'
};

const STAGES = [
    {id: 'building', label: 'In progress', description: 'Work the team is building now.', icon: Hammer},
    {id: 'shipped', label: 'Done', description: 'Finished work available in MistWarp.', icon: Check},
    {id: 'planned', label: 'Planned', description: 'Accepted work that is up next.', icon: Circle},
    {id: 'open', label: 'Suggested', description: 'New requests waiting for review.', icon: Lightbulb},
    {id: 'declined', label: 'Not planned', description: 'Requests the team has closed.', icon: X}
];

const PAGE_SIZE = 10;

const PULL_GROUP_ICONS = {review: GitPullRequest, merged: GitMerge};

const ROADMAP_KINDS = ['idea', 'bug'];
const ROADMAP_SOURCES = ['community', 'mistwarp'];

const normalizeRoadmapParams = currentParams => {
    const next = new URLSearchParams(currentParams);
    if (!STAGES.some(stage => stage.id === next.get('status'))) next.delete('status');
    if (!/^[1-9]\d*$/.test(next.get('page') || '') || !Number.isSafeInteger(Number(next.get('page')))) next.delete('page');
    if (!ROADMAP_KINDS.includes(next.get('new'))) next.delete('new');
    const query = (next.get('q') || '').trim();
    if (query) next.set('q', query);
    else next.delete('q');
    if (!ROADMAP_KINDS.includes(next.get('kind'))) next.delete('kind');
    if (!ROADMAP_SOURCES.includes(next.get('source'))) next.delete('source');
    const area = (next.get('area') || '').trim();
    if (area) next.set('area', area);
    else next.delete('area');
    const repo = (next.get('repo') || '').trim();
    if (repo) next.set('repo', repo);
    else next.delete('repo');
    return next;
};

const withRoadmapParam = (currentParams, key, value) => {
    const next = new URLSearchParams(currentParams);
    const normalized = value.trim();
    if (normalized) next.set(key, normalized);
    else next.delete(key);
    return next;
};

export const roadmapPayload = form => ({
    ...form,
    title: form.title.trim(),
    description: form.description.trim()
});

const IdeaCard = ({idea, user, login, onVote, onStatus, onCommentCount, onLinkPulls, busy, openDiscussion}) => {
    const {text: communityText} = useCommunityText();
    const [discussionOpen, setDiscussionOpen] = useState(openDiscussion);
    const [linkDraft, setLinkDraft] = useState('');
    const pulls = idea.pullRequests || [];
    // The stored links are the ones an admin attached; a pull request that
    // named this entry itself is not theirs to detach here.
    const manualLinks = useMemo(() => pulls.filter(pull => pull.linkedBy === 'manual').map(pullLinkValue), [pulls]);
    const addLink = event => {
        event.preventDefault();
        const value = linkDraft.trim();
        if (!value) return;
        onLinkPulls(idea, [...manualLinks, value]);
        setLinkDraft('');
    };
    const source = useMemo(() => ({
        list: options => api.ideaComments(idea._id, options),
        add: (content, parent) => api.addIdeaComment(idea._id, content, parent),
        remove: comment => api.deleteIdeaComment(idea._id, comment),
        edit: (commentId, content) => api.editIdeaComment(idea._id, commentId, content),
        react: (commentId, type) => api.reactIdeaComment(idea._id, commentId, type)
    }), [idea._id]);

    return (
        <div id={`details-${idea._id}`} className={styles.idea}>
            <ReactionButtons
                variant="vertical"
                heartKey="like"
                downKey="dislike"
                activeReaction={idea.myVote || ''}
                onReact={choice => onVote(idea, choice)}
                disabled={busy}
                disabledTitle="Saving…"
                showCounts={false}
                between={<span className={styles.score}><strong>{idea.score || 0}</strong><small>{communityText('score')}</small></span>}
            />
            <div className={styles.ideaBody}>
                <div className={styles.ideaTop}>
                    <div className={styles.labels}>
                        <span className={idea.kind === 'bug' ? styles.bugLabel : styles.ideaLabel}>{idea.kind === 'bug' ? <Bug size={11} /> : null}{idea.kind === 'bug' ? communityText('Bug') : communityText('Idea')}</span>
                        <span title={communityText('Area')}>{idea.category}</span>
                        <span>{communityText(STATUS_LABELS[idea.status])}</span>
                    </div>
                    {user && user.isAdmin ? (
                        <div className={styles.adminActions}>
                            <select aria-label={communityText('Suggestion status')} value={idea.status} disabled={busy} onChange={event => onStatus(idea, event.target.value)}>
                                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{communityText(label)}</option>)}
                            </select>
                        </div>
                    ) : null}
                </div>
                <p className={styles.description}><RichText text={idea.description} /></p>
                {pulls.length ? (
                    <section className={styles.pulls}>
                        <h3><GitPullRequest size={16} />{communityText('Pull requests')}</h3>
                        <PullRequestList pulls={pulls} />
                    </section>
                ) : null}
                {user && user.isAdmin ? (
                    <form className={styles.linkPull} onSubmit={addLink}>
                        <label htmlFor={`link-${idea._id}`}>{communityText('Link a pull request')}</label>
                        <div className={styles.linkPullRow}>
                            <input
                                id={`link-${idea._id}`}
                                value={linkDraft}
                                disabled={busy}
                                placeholder={communityText('scratch-gui#218 or a GitHub link')}
                                onChange={event => setLinkDraft(event.target.value)}
                            />
                            <Button type="submit" variant="secondary" disabled={busy || !linkDraft.trim()}>{communityText('Link')}</Button>
                        </div>
                        {manualLinks.length ? (
                            <ul className={styles.linkedList}>
                                {manualLinks.map(value => (
                                    <li key={value}>
                                        {value}
                                        <button
                                            type="button"
                                            disabled={busy}
                                            aria-label={`${communityText('Unlink')} ${value}`}
                                            onClick={() => onLinkPulls(idea, manualLinks.filter(item => item !== value))}
                                        ><X size={13} /></button>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </form>
                ) : null}
                <div className={styles.ideaFooter}>
                    <div className={styles.meta}>
                        <Link to={`/users/${idea.author}`}><Avatar username={idea.author} size={24} />{idea.author}</Link>
                        <span>{timeAgo(idea.created)}</span>
                    </div>
                    <Button
                        variant="secondary"
                        className={styles.discussionButton}
                        onClick={() => setDiscussionOpen(value => !value)}
                        aria-expanded={discussionOpen}
                    >
                        <MessageCircle size={15} />
                        {idea.commentCount || 0} {(idea.commentCount || 0) === 1 ? communityText('comment') : communityText('comments')}
                        <span>{discussionOpen ? communityText('Hide') : communityText('Discuss')}</span>
                    </Button>
                </div>
                {discussionOpen ? (
                    <div className={styles.discussion}>
                        {!user ? <Button variant="primary" className={styles.signIn} onClick={login}><LogIn size={15} />{communityText('Sign in to join the discussion')}</Button> : null}
                        <CommentThread source={source} canModerate={Boolean(user && (user.isAdmin || user.username.toLowerCase() === idea.author.toLowerCase()))} reportContext={`roadmap suggestion ${idea.title}`} onCountChange={delta => onCommentCount(idea._id, delta)} />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const RoadmapRow = ({idea, search, preview = false, from}) => {
    const {text: communityText} = useCommunityText();
    const description = (idea.description || '').replace(/\s+/g, ' ').trim();
    const excerpt = description.length > 160 ? `${description.slice(0, 160)}…` : description;
    const Heading = preview ? 'h3' : 'h2';
    const progress = roadmapProgress(idea);
    return (
        <article className={styles.entry}>
            <Heading className={styles.entryHeading}>
                <Link className={styles.entryLink} to={`/roadmap/entry/${encodeURIComponent(idea._id)}${search}`} state={{roadmapFrom: from}}>
                    {idea.kind === 'bug' ? <Bug size={17} aria-label={communityText('Bug')} /> : <Lightbulb size={17} aria-label={communityText('Idea')} />}
                    <span className={styles.entryTitle}>
                        <span className={styles.entryName}>{idea.title}</span>
                        <span className={styles.entryDescription}>{excerpt}</span>
                        <span className={styles.entryByline}><Avatar username={idea.author} size={16} /><span>{idea.author}</span><span className={styles.entryCategory}>{idea.category}</span></span>
                    </span>
                    {!preview ? <span className={styles.entryScore}>{idea.score || 0}<small>{communityText('score')}</small></span> : null}
                    {!preview ? <span className={styles.entryComments}><MessageCircle size={14} />{idea.commentCount || 0}<span className={styles.srOnly}>{communityText('comments')}</span></span> : null}
                    {!preview && progress.total ? (
                        <span className={styles.entryPulls}>
                            {progress.merged ? <GitMerge size={14} /> : <GitPullRequest size={14} />}
                            {progress.merged || progress.open}
                            <span className={styles.srOnly}>{progress.merged ? communityText('merged pull requests') : communityText('open pull requests')}</span>
                        </span>
                    ) : null}
                    <ChevronRight size={16} />
                </Link>
            </Heading>
        </article>
    );
};

const Roadmap = ({changes = false}) => {
    const {text: communityText} = useCommunityText();
    const {user, login} = useUser();
    const viewerName = (user && user.username) || '';
    const [params, setParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const {status: routeStatus, entryId} = useParams();
    const legacyId = params.get('idea') || (location.hash.startsWith('#idea-') ? location.hash.slice(6) : '');
    const stageId = routeStatus || params.get('status') || '';
    const stage = STAGES.find(item => item.id === stageId);
    const composerKind = ROADMAP_KINDS.includes(params.get('new')) ? params.get('new') : '';
    const [ideas, setIdeas] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [pulls, setPulls] = useState(null);
    const [pullsError, setPullsError] = useState(false);
    const creating = Boolean(composerKind);
    const [form, setForm] = useState({kind: composerKind || 'idea', title: '', description: '', category: 'Community'});
    const [error, setError] = useState('');
    const [createBusy, setCreateBusy] = useState(false);
    const [busyIdea, setBusyIdea] = useState('');
    const query = params.get('q') || '';
    const categoryFilter = params.get('area') || '';
    const repoFilter = params.get('repo') || '';
    const sourceFilter = ROADMAP_SOURCES.includes(params.get('source')) ? params.get('source') : '';
    const kindFilter = ROADMAP_KINDS.includes(params.get('kind')) ? params.get('kind') : '';
    const actionLocks = useRef(new Set());
    const currentViewer = useRef(viewerName);
    currentViewer.current = viewerName;
    const beginLoad = useLatest();
    // A separate guard: useLatest is one sequence counter, so sharing it would
    // make each loader cancel the other.
    const beginPullsLoad = useLatest();
    const updateForm = (field, value) => setForm(current => ({...current, [field]: value}));
    const closeComposer = () => {
        if (params.has('new')) {
            const next = new URLSearchParams(params);
            next.delete('new');
            setParams(next, {replace: true});
        }
    };
    const openComposer = kind => setParams(withRoadmapParam(params, 'new', kind));
    const setFilter = (key, value, replace = false) => {
        const next = withRoadmapParam(params, key, value);
        if (key !== 'page') next.delete('page');
        next.delete('idea');
        setParams(next, {replace});
    };

    const categories = useMemo(() => (ideas ? [...new Set(ideas.map(idea => idea.category).filter(Boolean))].sort() : []), [ideas]);
    const repos = useMemo(() => pullRepos(pulls), [pulls]);
    const visiblePulls = useMemo(() => filterPulls(pulls, {repo: repoFilter, query}), [pulls, repoFilter, query]);
    const pullGroups = useMemo(() => groupPulls(visiblePulls), [visiblePulls]);
    const entriesByPull = useMemo(() => roadmapIndexForPulls(ideas), [ideas]);
    const entryForPull = useCallback(pull => entriesByPull.get(pull.id) || null, [entriesByPull]);
    const visibleIdeas = useMemo(() => {
        if (!ideas) return [];
        const normalizedQuery = query.trim().toLowerCase();
        return ideas.filter(idea => {
            if (categoryFilter && idea.category !== categoryFilter) return false;
            if (sourceFilter && idea.source !== sourceFilter) return false;
            if (kindFilter && (idea.kind || 'idea') !== kindFilter) return false;
            if (!normalizedQuery) return true;
            return `${idea.title} ${idea.description} ${idea.author} ${idea.category}`.toLowerCase().includes(normalizedQuery);
        });
    }, [ideas, query, categoryFilter, sourceFilter, kindFilter]);
    const filtering = Boolean(query || categoryFilter || sourceFilter || kindFilter);
    const ideasByStage = useMemo(() => STAGES.reduce((groups, item) => ({
        ...groups,
        [item.id]: visibleIdeas.filter(idea => idea.status === item.id)
    }), {}), [visibleIdeas]);
    const stageIdeas = ideasByStage[stageId] || [];
    const selectedIdea = ideas && ideas.find(idea => String(idea._id) === entryId);
    const resultCount = stage ? stageIdeas.length : visibleIdeas.length;
    const routeParams = new URLSearchParams(params);
    ['status', 'page', 'idea', 'new', 'repo'].forEach(key => routeParams.delete(key));
    const filterSearch = routeParams.toString() ? `?${routeParams}` : '';
    const from = `${location.pathname}${location.search}`;
    const pageCount = Math.max(1, Math.ceil(stageIdeas.length / PAGE_SIZE));
    const requestedPage = Number(params.get('page'));
    const page = Math.min(pageCount, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
    const pageIdeas = stageIdeas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const PageIcon = changes ? GitPullRequest : entryId ? Lightbulb : stage ? stage.icon : Map;
    const showTabs = !entryId;
    const clearFilters = () => {
        const next = new URLSearchParams(params);
        ['q', 'area', 'source', 'kind', 'repo', 'page', 'idea'].forEach(key => next.delete(key));
        setParams(next);
    };

    const load = useCallback(() => {
        const fresh = beginLoad();
        setIdeas(null);
        setLoadError(false);
        api.roadmap()
            .then(fresh(data => setIdeas(data.ideas || [])))
            .catch(fresh(() => setLoadError(true)));
    }, [beginLoad, viewerName]);

    const loadPulls = useCallback(() => {
        const fresh = beginPullsLoad();
        setPulls(null);
        setPullsError(false);
        api.developmentPulls()
            .then(fresh(data => setPulls(data.pulls || [])))
            .catch(fresh(() => setPullsError(true)));
    }, [beginPullsLoad]);

    useEffect(load, [load]);
    useEffect(loadPulls, [loadPulls]);
    useEffect(() => {
        const normalized = normalizeRoadmapParams(params);
        if (normalized.toString() !== params.toString()) setParams(normalized, {replace: true});
    }, [params, setParams]);
    useEffect(() => {
        setCreateBusy(false);
        setBusyIdea('');
        setError('');
    }, [viewerName]);
    useEffect(() => {
        if (composerKind) setForm(current => ({...current, kind: composerKind}));
    }, [composerKind]);
    useEffect(() => {
        if (legacyId) navigate(`/roadmap/entry/${encodeURIComponent(legacyId)}`, {replace: true});
    }, [legacyId, navigate]);

    const create = async event => {
        event.preventDefault();
        if (!user) {
            login();
            return;
        }
        const payload = roadmapPayload(form);
        if (!payload.title || !payload.description) {
            setError(communityText('Add a title and description before posting.'));
            return;
        }
        const actionViewer = viewerName;
        const actionKey = `${actionViewer}\u0000create`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setCreateBusy(true);
        setError('');
        try {
            const data = await api.createIdea(payload);
            if (currentViewer.current === actionViewer) {
                setForm({kind: 'idea', title: '', description: '', category: 'Community'});
                navigate(`/roadmap/entry/${encodeURIComponent(data.idea._id)}`);
                setIdeas(current => [data.idea, ...(current || [])].sort((a, b) => b.score - a.score));
            }
        } catch (e) {
            if (currentViewer.current === actionViewer) {
                setError(e.message || 'Could not post the suggestion.');
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (currentViewer.current === actionViewer) setCreateBusy(false);
        }
    };

    const vote = async (idea, choice) => {
        if (!user) {
            login();
            return;
        }
        const actionViewer = viewerName;
        const actionKey = `${actionViewer}\u0000idea`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setBusyIdea(idea._id);
        setError('');
        try {
            const data = await api.voteIdea(idea._id, choice);
            if (currentViewer.current === actionViewer) {
                setIdeas(current => current.map(item => (item._id === idea._id ? {...item, ...data} : item))
                    .sort((a, b) => b.score - a.score));
            }
        } catch (e) {
            if (currentViewer.current === actionViewer) setError(e.message || 'Could not save your vote.');
        } finally {
            actionLocks.current.delete(actionKey);
            if (currentViewer.current === actionViewer) setBusyIdea('');
        }
    };

    const updateStatus = async (idea, status) => {
        const actionViewer = viewerName;
        const actionKey = `${actionViewer}\u0000idea`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setBusyIdea(idea._id);
        setError('');
        try {
            await api.updateIdea(idea._id, {status});
            if (currentViewer.current === actionViewer) {
                setIdeas(current => current.map(item => (item._id === idea._id ? {...item, status} : item)));
            }
        } catch (e) {
            if (currentViewer.current === actionViewer) setError(e.message || 'Could not update the status.');
        } finally {
            actionLocks.current.delete(actionKey);
            if (currentViewer.current === actionViewer) setBusyIdea('');
        }
    };

    const linkPulls = async (idea, links) => {
        const actionViewer = viewerName;
        const actionKey = `${actionViewer}\u0000idea`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setBusyIdea(idea._id);
        setError('');
        try {
            const data = await api.updateIdea(idea._id, {pulls: links});
            if (currentViewer.current === actionViewer) {
                setIdeas(current => (current || []).map(item => (item._id === idea._id ?
                    {...item, pullRequests: data.idea.pullRequests || []} :
                    item)));
            }
        } catch (e) {
            if (currentViewer.current === actionViewer) setError(e.message || 'Could not update the linked pull requests.');
        } finally {
            actionLocks.current.delete(actionKey);
            if (currentViewer.current === actionViewer) setBusyIdea('');
        }
    };

    const updateCommentCount = (id, delta) => {
        setIdeas(current => (current || []).map(idea => (idea._id === id ? {
            ...idea,
            commentCount: Math.max(0, (Number(idea.commentCount) || 0) + delta)
        } : idea)));
    };

    return (
        <main className={`${styles.page} ${styles[`stage${selectedIdea ? selectedIdea.status : stageId}`] || ''}`}>
            {stageId || entryId ? <Link className={styles.backLink} to={entryId && selectedIdea ? (location.state?.roadmapFrom || `/roadmap/${selectedIdea.status}${filterSearch}`) : `/roadmap${filterSearch}`}><ChevronLeft size={16} />{entryId ? communityText('Back to roadmap entries') : communityText('Roadmap overview')}</Link> : null}
            <header className={styles.head}>
                <div>
                    <h1><PageIcon size={26} />{changes ? communityText('Changes') : entryId ? (selectedIdea ? selectedIdea.title : communityText('Roadmap entry')) : communityText(stage ? stage.label : 'Roadmap')}</h1>
                    {changes ? <p>{communityText('Pull requests open against MistWarp\u2019s repositories, and the work that recently merged.')}</p> : null}
                    {!changes && !entryId ? <p>{stage ? communityText(stage.description) : communityText('Follow work in progress, see what is done, and vote on what comes next.')}</p> : null}
                </div>
                {!changes ? <Button disabled={createBusy} onClick={() => (user ? (creating ? closeComposer() : openComposer('idea')) : login())}><Plus size={16} />{communityText(' Add an entry')}</Button> : null}
            </header>
            {showTabs ? (
                <UnderlineTabs
                    className={styles.tabs}
                    ariaLabel="Roadmap sections"
                    value={changes ? 'changes' : 'roadmap'}
                    onChange={key => navigate(key === 'changes' ? '/roadmap/changes' : `/roadmap${filterSearch}`)}
                    items={[
                        {key: 'roadmap', label: <>{communityText('Roadmap')} <b>{ideas ? ideas.length : 0}</b></>},
                        {key: 'changes', label: <>{communityText('Changes')} <b>{pulls ? pulls.length : 0}</b></>}
                    ]}
                />
            ) : null}
            {creating && !changes ? (
                <form className={styles.form} onSubmit={create}>
                    <label>{communityText('Type')}<select
                        value={form.kind}
                        disabled={createBusy}
                        onChange={event => {
                            updateForm('kind', event.target.value);
                            setParams(withRoadmapParam(params, 'new', event.target.value), {replace: true});
                        }}
                    ><option value="idea">{communityText('Idea')}</option><option value="bug">{communityText('Bug report')}</option></select></label>
                    <label>{communityText('Title')}<input value={form.title} disabled={createBusy} required maxLength={120} placeholder={communityText('A clear summary')} onChange={event => updateForm('title', event.target.value)} /></label>
                    <label>{communityText('Description')}<textarea value={form.description} disabled={createBusy} required maxLength={3000} placeholder={form.kind === 'bug' ? communityText('What happened, what did you expect, and how can someone reproduce it?') : communityText('What should change, and who would it help?')} onChange={event => updateForm('description', event.target.value)} /></label>
                    <label>{communityText('Area')}<select value={form.category} disabled={createBusy} onChange={event => updateForm('category', event.target.value)}>
                        <option>{communityText('Community')}</option><option>{communityText('Editor')}</option><option>{communityText('Collaboration')}</option><option>{communityText('Extensions')}</option><option>{communityText('Mobile')}</option><option>{communityText('Other')}</option>
                    </select></label>
                    <div className={styles.formActions}>
                        <Button type="submit" busy={createBusy} busyLabel={communityText('Posting…')}><Plus size={16} />{form.kind === 'bug' ? communityText('Report bug') : communityText('Post idea')}</Button>
                        <Button variant="secondary" disabled={createBusy} onClick={closeComposer}>{communityText('Cancel')}</Button>
                    </div>
                </form>
            ) : null}
            {error ? <p className={styles.error}>{error}</p> : null}
            {!changes && ideas && ideas.length && !entryId && (!stageId || stage) ? (
                <div className={styles.filters}>
                    <div className={styles.searchFilter}><Search size={16} /><input aria-label={communityText('Search roadmap')} value={query} onChange={event => setFilter('q', event.target.value, true)} placeholder={communityText('Search ideas and bugs')} /></div>
                    <select aria-label={communityText('Filter by type')} value={kindFilter} onChange={event => setFilter('kind', event.target.value)}><option value="">{communityText('All types')}</option><option value="idea">{communityText('Ideas')}</option><option value="bug">{communityText('Bugs')}</option></select>
                    <select aria-label={communityText('Filter by area')} value={categoryFilter} onChange={event => setFilter('area', event.target.value)}><option value="">{communityText('Any area')}</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
                    <select aria-label={communityText('Filter by submitter')} value={sourceFilter} onChange={event => setFilter('source', event.target.value)}><option value="">{communityText('Anyone')}</option><option value="community">{communityText('Community')}</option><option value="mistwarp">{communityText('MistWarp')}</option></select>
                    <div className={styles.filterSummary}>
                        <span>{resultCount} {resultCount === 1 ? communityText('result') : communityText('results')}</span>
                        {filtering ? <button type="button" onClick={clearFilters}>{communityText('Clear filters')}</button> : null}
                    </div>
                </div>
            ) : null}
            {!changes && !ideas && !loadError ? <p className={styles.empty}>{communityText('Loading suggestions…')}</p> : null}
            {!changes && loadError ? <p className={styles.empty}>{communityText('Could not load suggestions. ')}<button type="button" onClick={load}>{communityText('Try again')}</button></p> : null}
            {changes ? (
                <>
                    {pulls && pulls.length ? (
                        <div className={styles.changeFilters}>
                            <div className={styles.searchFilter}><Search size={16} /><input aria-label={communityText('Search changes')} value={query} onChange={event => setFilter('q', event.target.value, true)} placeholder={communityText('Search pull requests')} /></div>
                            <select aria-label={communityText('Filter by repository')} value={repoFilter} onChange={event => setFilter('repo', event.target.value)}>
                                <option value="">{communityText('All repositories')}</option>
                                {repos.map(repo => <option key={repo} value={repo}>{repo}</option>)}
                            </select>
                            <div className={styles.filterSummary}>
                                <span>{visiblePulls.length} {visiblePulls.length === 1 ? communityText('result') : communityText('results')}</span>
                                {query || repoFilter ? <button type="button" onClick={clearFilters}>{communityText('Clear filters')}</button> : null}
                            </div>
                        </div>
                    ) : null}
                    {!pulls && !pullsError ? <p className={styles.empty}>{communityText('Loading changes…')}</p> : null}
                    {pullsError ? <p className={styles.empty}>{communityText('Could not load changes. ')}<button type="button" onClick={loadPulls}>{communityText('Try again')}</button></p> : null}
                    {pulls && !pulls.length ? <p className={styles.empty}>{communityText('No pull requests are open right now.')}</p> : null}
                    {pulls && pulls.length ? pullGroups.map(group => {
                        const GroupIcon = PULL_GROUP_ICONS[group.key];
                        return (
                            <section key={group.key} className={styles.changeGroup} aria-labelledby={`changes-${group.key}`}>
                                <h2 id={`changes-${group.key}`}><GroupIcon size={19} />{communityText(group.label)}<span>{group.pulls.length}</span></h2>
                                {group.pulls.length ?
                                    <PullRequestList pulls={group.pulls} entryFor={entryForPull} /> :
                                    <p className={styles.empty}>{communityText('Nothing here right now.')}</p>}
                            </section>
                        );
                    }) : null}
                </>
            ) : null}
            {!changes && ideas && entryId ? (
                selectedIdea ? <IdeaCard key={selectedIdea._id} idea={selectedIdea} user={user} login={login} onVote={vote} onStatus={updateStatus} onCommentCount={updateCommentCount} onLinkPulls={linkPulls} busy={busyIdea === selectedIdea._id} openDiscussion /> : <p className={styles.empty}>{communityText('This roadmap entry could not be found.')}</p>
            ) : null}
            {!changes && ideas && !entryId && stageId && !stage ? <p className={styles.empty}>{communityText('This roadmap stage could not be found.')}</p> : null}
            {!changes && ideas && !entryId && stage ? (
                <>
                    {pageIdeas.length ? <div className={styles.list}>{pageIdeas.map(idea => <RoadmapRow key={idea._id} idea={idea} search={filterSearch} from={from} />)}</div> : <p className={styles.empty}>{filtering ? communityText('No matching entries in this stage. Try clearing the filters.') : communityText('Nothing is in this stage yet.')}</p>}
                    {stageIdeas.length > PAGE_SIZE ? (
                        <nav className={styles.pagination} aria-label={communityText('Roadmap pages')}>
                            <Button variant="secondary" disabled={page === 1} onClick={() => setFilter('page', String(page - 1))}><ChevronLeft size={16} />{communityText('Previous')}</Button>
                            <span aria-live="polite">{communityText('Page {page} of {total}', {page, total: pageCount})}</span>
                            <Button variant="secondary" disabled={page === pageCount} onClick={() => setFilter('page', String(page + 1))}>{communityText('Next')}<ChevronRight size={16} /></Button>
                        </nav>
                    ) : null}
                </>
            ) : null}
            {!changes && ideas && !entryId && !stageId ? (
                <>
                    <div className={styles.overview}>
                        {STAGES.filter(item => item.id !== 'declined').map(item => {
                            const Icon = item.icon;
                            const entries = ideasByStage[item.id];
                            return (
                                <section key={item.id} className={`${styles.preview} ${styles[`stage${item.id}`]}`} aria-labelledby={`heading-${item.id}`}>
                                    <header className={styles.stageHead}>
                                        <h2 id={`heading-${item.id}`}><Icon size={19} />{communityText(item.label)}<span>{entries.length}</span></h2>
                                        <p>{communityText(item.description)}</p>
                                    </header>
                                    <div className={`${styles.previewList} ${entries.length > 3 ? styles.previewFaded : ''} ${!entries.length ? styles.previewListEmpty : ''}`}>
                                        {entries.slice(0, 3).map(idea => <RoadmapRow key={idea._id} idea={idea} search={filterSearch} from={from} preview />)}
                                        {!entries.length ? <p className={styles.previewEmpty}>{filtering ? communityText('No matching entries.') : communityText('Nothing is in this stage yet.')}</p> : null}
                                    </div>
                                    <Link className={styles.viewStage} to={`/roadmap/${item.id}${filterSearch}`} aria-label={`${communityText('View all')} ${communityText(item.label).toLowerCase()}`}>
                                        {communityText('View all')}<ArrowRight size={16} />
                                    </Link>
                                </section>
                            );
                        })}
                    </div>
                    <Link className={styles.archiveLink} to={`/roadmap/declined${filterSearch}`}><X size={16} />{communityText('Not planned')}<span>{ideasByStage.declined.length}</span><ArrowRight size={16} /></Link>
                </>
            ) : null}
        </main>
    );
};

export {normalizeRoadmapParams, withRoadmapParam};
export default Roadmap;
