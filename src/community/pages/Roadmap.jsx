import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useLocation, useSearchParams} from 'react-router-dom';
import {Bug, Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Hammer, Lightbulb, LogIn, Map, MessageCircle, Plus, Search, X} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import CommentThread from '../components/CommentThread.jsx';
import RichText from '../components/RichText.jsx';
import ReactionButtons from '../components/ReactionButtons.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
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

const IdeaCard = ({idea, user, login, onVote, onStatus, onCommentCount, busy, openDiscussion}) => {
    const {text: communityText} = useCommunityText();
    const [discussionOpen, setDiscussionOpen] = useState(openDiscussion);
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

const Roadmap = () => {
    const {text: communityText} = useCommunityText();
    const {user, login} = useUser();
    const viewerName = (user && user.username) || '';
    const [params, setParams] = useSearchParams();
    const location = useLocation();
    const linkedId = params.get('idea') || (location.hash.startsWith('#idea-') ? location.hash.slice(6) : '');
    const handledLink = useRef('');
    const [expandedId, setExpandedId] = useState('');
    const stageId = STAGES.some(stage => stage.id === params.get('status')) ? params.get('status') : 'building';
    const stage = STAGES.find(item => item.id === stageId);
    const composerKind = ROADMAP_KINDS.includes(params.get('new')) ? params.get('new') : '';
    const [ideas, setIdeas] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const creating = Boolean(composerKind);
    const [form, setForm] = useState({kind: composerKind || 'idea', title: '', description: '', category: 'Community'});
    const [error, setError] = useState('');
    const [createBusy, setCreateBusy] = useState(false);
    const [busyIdea, setBusyIdea] = useState('');
    const query = params.get('q') || '';
    const categoryFilter = params.get('area') || '';
    const sourceFilter = ROADMAP_SOURCES.includes(params.get('source')) ? params.get('source') : '';
    const kindFilter = ROADMAP_KINDS.includes(params.get('kind')) ? params.get('kind') : '';
    const actionLocks = useRef(new Set());
    const currentViewer = useRef(viewerName);
    currentViewer.current = viewerName;
    const beginLoad = useLatest();
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
        setExpandedId('');
        setParams(next, {replace});
    };

    const categories = useMemo(() => (ideas ? [...new Set(ideas.map(idea => idea.category).filter(Boolean))].sort() : []), [ideas]);
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
    const ideasByStage = useMemo(() => STAGES.reduce((groups, stage) => ({
        ...groups,
        [stage.id]: visibleIdeas.filter(idea => idea.status === stage.id)
    }), {}), [visibleIdeas]);
    const stageIdeas = ideasByStage[stageId];
    const pageCount = Math.max(1, Math.ceil(stageIdeas.length / PAGE_SIZE));
    const requestedPage = Number(params.get('page'));
    const page = Math.min(pageCount, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
    const pageIdeas = stageIdeas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const StageIcon = stage.icon;
    const clearFilters = () => {
        const next = new URLSearchParams(params);
        ['q', 'area', 'source', 'kind', 'page', 'idea'].forEach(key => next.delete(key));
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

    useEffect(load, [load]);
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
        if (!linkedId) {
            handledLink.current = '';
            return;
        }
        if (!ideas || handledLink.current === linkedId) return;
        const linkedIdea = ideas.find(idea => String(idea._id) === linkedId);
        if (!linkedIdea) return;
        handledLink.current = linkedId;
        const entries = ideas.filter(idea => idea.status === linkedIdea.status);
        const next = new URLSearchParams(params);
        ['q', 'area', 'source', 'kind'].forEach(key => next.delete(key));
        next.set('status', linkedIdea.status);
        next.set('page', String(Math.floor(entries.indexOf(linkedIdea) / PAGE_SIZE) + 1));
        next.set('idea', linkedId);
        setExpandedId(linkedId);
        setParams(next, {replace: true});
    }, [ideas, linkedId, params, setParams]);
    useEffect(() => {
        if (expandedId && expandedId === linkedId) {
            const target = document.getElementById(`idea-${expandedId}`);
            if (target) target.scrollIntoView({block: 'nearest'});
        }
    }, [expandedId, linkedId, stageId, page]);

    const create = async event => {
        event.preventDefault();
        if (!user) {
            login();
            return;
        }
        const payload = roadmapPayload(form);
        if (!payload.title || !payload.description) {
            setError(communityText("Add a title and description before posting."));
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
                const next = new URLSearchParams();
                next.set('idea', data.idea._id);
                setParams(next);
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

    const updateCommentCount = (id, delta) => {
        setIdeas(current => (current || []).map(idea => (idea._id === id ? {
            ...idea,
            commentCount: Math.max(0, (Number(idea.commentCount) || 0) + delta)
        } : idea)));
    };

    return (
        <main className={styles.page}>
            <header className={styles.head}>
                <div>
                    <h1><Map size={26} />{communityText('Roadmap')}</h1>
                    <p>{communityText('Follow work in progress, see what is done, and vote on what comes next.')}</p>
                </div>
                <Button disabled={createBusy} onClick={() => (user ? (creating ? closeComposer() : openComposer('idea')) : login())}><Plus size={16} />{communityText(' Add an entry')}</Button>
            </header>
            {creating ? (
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
            {ideas && ideas.length ? (
                <div className={styles.filters}>
                    <div className={styles.searchFilter}><Search size={16} /><input aria-label={communityText('Search roadmap')} value={query} onChange={event => setFilter('q', event.target.value, true)} placeholder={communityText('Search ideas and bugs')} /></div>
                    <select aria-label={communityText('Filter by type')} value={kindFilter} onChange={event => setFilter('kind', event.target.value)}><option value="">{communityText('Ideas and bugs')}</option><option value="idea">{communityText('Ideas')}</option><option value="bug">{communityText('Bugs')}</option></select>
                    <select aria-label={communityText('Filter by area')} value={categoryFilter} onChange={event => setFilter('area', event.target.value)}><option value="">{communityText('Any area')}</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
                    <select aria-label={communityText('Filter by submitter')} value={sourceFilter} onChange={event => setFilter('source', event.target.value)}><option value="">{communityText('Anyone')}</option><option value="community">{communityText('Community')}</option><option value="mistwarp">{communityText('MistWarp')}</option></select>
                    <div className={styles.filterSummary}>
                        <span>{stageIdeas.length} {stageIdeas.length === 1 ? communityText('result') : communityText('results')}</span>
                        {filtering ? <button type="button" onClick={clearFilters}>{communityText('Clear filters')}</button> : null}
                    </div>
                </div>
            ) : null}
            {!ideas && !loadError ? <p className={styles.empty}>{communityText('Loading suggestions…')}</p> : null}
            {loadError ? <p className={styles.empty}>{communityText('Could not load suggestions. ')}<button type="button" onClick={load}>{communityText('Try again')}</button></p> : null}
            {ideas && !ideas.length ? <p className={styles.empty}>{communityText('No suggestions yet. Add the first one.')}</p> : null}
            {ideas && ideas.length ? (
                <>
                    <UnderlineTabs
                        ariaLabel={communityText('Roadmap stages')}
                        value={stageId}
                        onChange={value => setFilter('status', value)}
                        items={STAGES.map(item => {
                            const Icon = item.icon;
                            return {key: item.id, label: <><Icon size={16} />{communityText(item.label)} <b>{ideasByStage[item.id].length}</b></>};
                        })}
                    />
                    <section className={styles.stage} role="tabpanel" aria-label={communityText(stage.label)}>
                        <header className={styles.stageHead}>
                            <h2><StageIcon size={18} />{communityText(stage.label)}</h2>
                            <p>{communityText(stage.description)}</p>
                        </header>
                        {pageIdeas.length ? (
                            <div className={styles.list}>{pageIdeas.map(idea => {
                                const expanded = expandedId === String(idea._id);
                                return (
                                    <article key={idea._id} id={`idea-${idea._id}`} className={styles.entry}>
                                        <h3 className={styles.entryHeading}>
                                            <button
                                                type="button"
                                                className={styles.entryToggle}
                                                aria-expanded={expanded}
                                                aria-controls={expanded ? `details-${idea._id}` : undefined}
                                                onClick={() => setExpandedId(expanded ? '' : String(idea._id))}
                                            >
                                                {idea.kind === 'bug' ? <Bug size={17} aria-label={communityText('Bug')} /> : <Lightbulb size={17} aria-label={communityText('Idea')} />}
                                                <span className={styles.entryTitle}>{idea.title}<small>{idea.category}</small></span>
                                                <span className={styles.entryScore}>{idea.score || 0}<small>{communityText('score')}</small></span>
                                                <span className={styles.entryComments}><MessageCircle size={14} />{idea.commentCount || 0}<span className={styles.srOnly}>{communityText('comments')}</span></span>
                                                <ChevronDown size={16} className={expanded ? styles.chevronOpen : ''} />
                                            </button>
                                        </h3>
                                        {expanded ? <IdeaCard idea={idea} user={user} login={login} onVote={vote} onStatus={updateStatus} onCommentCount={updateCommentCount} busy={busyIdea === idea._id} openDiscussion={linkedId === String(idea._id)} /> : null}
                                    </article>
                                );
                            })}</div>
                        ) : <p className={styles.empty}>{filtering ? communityText('No matching entries in this stage. Try another tab or clear the filters.') : communityText('Nothing is in this stage yet.')}</p>}
                        {stageIdeas.length > PAGE_SIZE ? (
                            <nav className={styles.pagination} aria-label={communityText('Roadmap pages')}>
                                <Button variant="secondary" disabled={page === 1} onClick={() => setFilter('page', String(page - 1))}><ChevronLeft size={16} />{communityText('Previous')}</Button>
                                <span aria-live="polite">{communityText('Page {page} of {total}', {page, total: pageCount})}</span>
                                <Button variant="secondary" disabled={page === pageCount} onClick={() => setFilter('page', String(page + 1))}>{communityText('Next')}<ChevronRight size={16} /></Button>
                            </nav>
                        ) : null}
                    </section>
                </>
            ) : null}
        </main>
    );
};

export {normalizeRoadmapParams, withRoadmapParam};
export default Roadmap;
