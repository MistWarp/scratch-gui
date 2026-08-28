/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {Bug, Check, Circle, Hammer, Lightbulb, MessageCircle, Plus, Search, Sparkles, X} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import CommentThread from '../components/CommentThread.jsx';
import RichText from '../components/RichText.jsx';
import ReactionButtons from '../components/ReactionButtons.jsx';
import {timeAgo} from '../format';
import useLatest from '../use-latest.js';
import styles from './Roadmap.module.css';

const STATUS_LABELS = {
    open: 'Suggested',
    planned: 'Planned',
    building: 'In progress',
    shipped: 'Shipped',
    declined: 'Not planned'
};

const STAGES = [
    {id: 'open', label: 'Suggested', description: 'New requests waiting for review.', icon: Lightbulb},
    {id: 'planned', label: 'Planned', description: 'Accepted work that is up next.', icon: Circle},
    {id: 'building', label: 'In progress', description: 'Work the team is building now.', icon: Hammer},
    {id: 'shipped', label: 'Shipped', description: 'Finished work available in MistWarp.', icon: Check},
    {id: 'declined', label: 'Not planned', description: 'Requests the team has closed.', icon: X}
];

const ROADMAP_KINDS = ['idea', 'bug'];
const ROADMAP_SOURCES = ['community', 'mistwarp'];

const normalizeRoadmapParams = currentParams => {
    const next = new URLSearchParams(currentParams);
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

const IdeaCard = ({idea, user, login, onVote, onStatus, onInterest, onCommentCount, busy}) => {
    const [discussionOpen, setDiscussionOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const hasLongDescription = idea.description.length > 220 || idea.description.split('\n').length > 3;
    const source = useMemo(() => ({
        list: options => api.ideaComments(idea._id, options),
        add: (content, parent) => api.addIdeaComment(idea._id, content, parent),
        remove: comment => api.deleteIdeaComment(idea._id, comment),
        edit: (commentId, content) => api.editIdeaComment(idea._id, commentId, content)
    }), [idea._id]);

    return (
        <article id={`idea-${idea._id}`} className={styles.idea}>
            <ReactionButtons
                variant="vertical"
                heartKey="like"
                downKey="dislike"
                activeReaction={idea.myVote || ''}
                onReact={choice => onVote(idea, choice)}
                disabled={busy}
                disabledTitle="Saving…"
                showCounts={false}
                between={<span className={styles.score}><strong>{idea.score || 0}</strong><small>score</small></span>}
            />
            <div className={styles.ideaBody}>
                <div className={styles.ideaTop}>
                    <div className={styles.labels}>
                        <span className={idea.kind === 'bug' ? styles.bugLabel : styles.ideaLabel}>{idea.kind === 'bug' ? <Bug size={11} /> : null}{idea.kind === 'bug' ? 'Bug' : 'Idea'}</span>
                        <span title="Area">{idea.category}</span>
                        {(!user || !user.isAdmin) && idea.interested ? <span className={styles.official} title="MistWarp is interested in this suggestion"><Sparkles size={11} /> MistWarp is interested</span> : null}
                    </div>
                    {user && user.isAdmin ? (
                        <div className={styles.adminActions}>
                            <select aria-label="Suggestion status" value={idea.status} disabled={busy} onChange={event => onStatus(idea, event.target.value)}>
                                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                            <Button
                                variant="secondary"
                                busy={busy}
                                busyLabel="Saving…"
                                className={idea.interested ? styles.officialToggleOn : styles.officialToggle}
                                title={idea.interested ? 'Remove MistWarp interest' : 'Mark MistWarp as interested'}
                                onClick={() => onInterest(idea, !idea.interested)}
                            >
                                <Sparkles size={11} />
                                {idea.interested ? 'Interested' : 'Mark interested'}
                            </Button>
                        </div>
                    ) : null}
                </div>
                <h2>{idea.title}</h2>
                <p className={`${styles.description} ${detailsOpen ? styles.descriptionOpen : ''}`}><RichText text={idea.description} /></p>
                {hasLongDescription ? (
                    <button
                        type="button"
                        className={styles.detailsButton}
                        aria-expanded={detailsOpen}
                        onClick={() => setDetailsOpen(value => !value)}
                    >
                        {detailsOpen ? 'Show less' : 'Show full details'}
                    </button>
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
                        {idea.commentCount || 0} {(idea.commentCount || 0) === 1 ? 'comment' : 'comments'}
                        <span>{discussionOpen ? 'Hide' : 'Discuss'}</span>
                    </Button>
                </div>
                {discussionOpen ? (
                    <div className={styles.discussion}>
                        {!user ? <Button variant="primary" className={styles.signIn} onClick={login}>Sign in to join the discussion</Button> : null}
                        <CommentThread source={source} canModerate={Boolean(user && (user.isAdmin || user.username.toLowerCase() === idea.author.toLowerCase()))} reportContext={`roadmap suggestion ${idea.title}`} onCountChange={delta => onCommentCount(idea._id, delta)} />
                    </div>
                ) : null}
            </div>
        </article>
    );
};

const Roadmap = () => {
    const {user, login} = useUser();
    const viewerName = (user && user.username) || '';
    const [params, setParams] = useSearchParams();
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
    const setFilter = (key, value, replace = false) => setParams(withRoadmapParam(params, key, value), {replace});

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
    const clearFilters = () => {
        const next = new URLSearchParams(params);
        ['q', 'area', 'source', 'kind'].forEach(key => next.delete(key));
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
        if (!ideas || !location.hash.startsWith('#idea-')) return;
        const target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView({block: 'center'});
    }, [ideas]);

    const create = async event => {
        event.preventDefault();
        if (!user) {
            login();
            return;
        }
        const payload = roadmapPayload(form);
        if (!payload.title || !payload.description) {
            setError('Add a title and description before posting.');
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
                closeComposer();
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

    const updateInterest = async (idea, interested) => {
        const actionViewer = viewerName;
        const actionKey = `${actionViewer}\u0000idea`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setBusyIdea(idea._id);
        setError('');
        try {
            await api.updateIdea(idea._id, {interested});
            if (currentViewer.current === actionViewer) {
                setIdeas(current => current.map(item => (item._id === idea._id ? {...item, interested} : item)));
            }
        } catch (e) {
            if (currentViewer.current === actionViewer) {
                setError(e.message || 'Could not update MistWarp interest.');
            }
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
                    <h1>Roadmap</h1>
                    <p>See what is being considered, what is underway, and what has shipped. Vote or add context to help the team decide what comes next.</p>
                </div>
                <Button disabled={createBusy} onClick={() => (user ? (creating ? closeComposer() : openComposer('idea')) : login())}><Plus size={16} /> Add an entry</Button>
            </header>
            {creating ? (
                <form className={styles.form} onSubmit={create}>
                    <label>Type<select
                        value={form.kind}
                        disabled={createBusy}
                        onChange={event => {
                            updateForm('kind', event.target.value);
                            setParams(withRoadmapParam(params, 'new', event.target.value), {replace: true});
                        }}
                    ><option value="idea">Idea</option><option value="bug">Bug report</option></select></label>
                    <label>Title<input value={form.title} disabled={createBusy} required maxLength={120} placeholder="A clear summary" onChange={event => updateForm('title', event.target.value)} /></label>
                    <label>Description<textarea value={form.description} disabled={createBusy} required maxLength={3000} placeholder={form.kind === 'bug' ? 'What happened, what did you expect, and how can someone reproduce it?' : 'What should change, and who would it help?'} onChange={event => updateForm('description', event.target.value)} /></label>
                    <label>Area<select value={form.category} disabled={createBusy} onChange={event => updateForm('category', event.target.value)}>
                        <option>Community</option><option>Editor</option><option>Collaboration</option><option>Extensions</option><option>Mobile</option><option>Other</option>
                    </select></label>
                    <div className={styles.formActions}>
                        <Button type="submit" busy={createBusy} busyLabel="Posting…">{form.kind === 'bug' ? 'Report bug' : 'Post idea'}</Button>
                        <Button variant="secondary" disabled={createBusy} onClick={closeComposer}>Cancel</Button>
                    </div>
                </form>
            ) : null}
            {error ? <p className={styles.error}>{error}</p> : null}
            {ideas && ideas.length ? (
                <div className={styles.filters}>
                    <div className={styles.searchFilter}><Search size={16} /><input aria-label="Search roadmap" value={query} onChange={event => setFilter('q', event.target.value, true)} placeholder="Search ideas and bugs" /></div>
                    <select aria-label="Filter by type" value={kindFilter} onChange={event => setFilter('kind', event.target.value)}><option value="">Ideas and bugs</option><option value="idea">Ideas</option><option value="bug">Bugs</option></select>
                    <select aria-label="Filter by area" value={categoryFilter} onChange={event => setFilter('area', event.target.value)}><option value="">Any area</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
                    <select aria-label="Filter by submitter" value={sourceFilter} onChange={event => setFilter('source', event.target.value)}><option value="">Anyone</option><option value="community">Community</option><option value="mistwarp">MistWarp</option></select>
                    <div className={styles.filterSummary}>
                        <span>{visibleIdeas.length} {visibleIdeas.length === 1 ? 'result' : 'results'}</span>
                        {filtering ? <button type="button" onClick={clearFilters}>Clear filters</button> : null}
                    </div>
                </div>
            ) : null}
            {!ideas && !loadError ? <p className={styles.empty}>Loading suggestions…</p> : null}
            {loadError ? <p className={styles.empty}>Could not load suggestions. <button type="button" onClick={load}>Try again</button></p> : null}
            {ideas && !ideas.length ? <p className={styles.empty}>No suggestions yet. Add the first one.</p> : null}
            {ideas && ideas.length && !visibleIdeas.length ? <p className={styles.empty}>No suggestions match those filters.</p> : null}
            {visibleIdeas.length ? (
                <div className={styles.roadmapLayout}>
                    <nav className={styles.stageNav} aria-label="Roadmap stages">
                        <p>Stages</p>
                        {STAGES.map(stage => {
                            const StageIcon = stage.icon;
                            return (
                                <a key={stage.id} href={`#stage-${stage.id}`} className={styles[`stageLink${stage.id}`]}>
                                    <span><StageIcon size={15} />{stage.label}</span>
                                    <strong>{ideasByStage[stage.id].length}</strong>
                                </a>
                            );
                        })}
                    </nav>
                    <div className={styles.stageList}>
                        {STAGES.map(stage => {
                            const StageIcon = stage.icon;
                            const stageIdeas = ideasByStage[stage.id];
                            return (
                                <section key={stage.id} id={`stage-${stage.id}`} className={`${styles.stage} ${styles[`stage${stage.id}`]}`}>
                                    <header className={styles.stageHead}>
                                        <span className={styles.stageIcon}><StageIcon size={17} /></span>
                                        <div>
                                            <h2>{stage.label}</h2>
                                            <p>{stage.description}</p>
                                        </div>
                                        <strong>{stageIdeas.length}</strong>
                                    </header>
                                    {stageIdeas.length ? (
                                        <div className={styles.list}>{stageIdeas.map(idea => (
                                            <IdeaCard key={idea._id} idea={idea} user={user} login={login} onVote={vote} onStatus={updateStatus} onInterest={updateInterest} onCommentCount={updateCommentCount} busy={busyIdea === idea._id} />
                                        ))}</div>
                                    ) : <p className={styles.stageEmpty}>{filtering ? 'No matching entries in this stage.' : 'Nothing is in this stage yet.'}</p>}
                                </section>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </main>
    );
};

export {normalizeRoadmapParams, withRoadmapParam};
export default Roadmap;
