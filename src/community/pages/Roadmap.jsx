/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {Bug, MessageCircle, Plus, Search, Sparkles} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import CommentThread from '../components/CommentThread.jsx';
import RichText from '../components/RichText.jsx';
import ReactionButtons from '../components/ReactionButtons.jsx';
import {timeAgo} from '../format';
import styles from './Roadmap.module.css';

const STATUS_LABELS = {
    open: 'Suggested',
    planned: 'Planned',
    building: 'In progress',
    shipped: 'Shipped',
    declined: 'Not planned'
};

const IdeaCard = ({idea, user, login, onVote, onStatus, onInterest}) => {
    const [discussionOpen, setDiscussionOpen] = useState(false);
    const source = useMemo(() => ({
        list: () => api.ideaComments(idea._id),
        add: (content, parent) => api.addIdeaComment(idea._id, content, parent),
        remove: comment => api.deleteIdeaComment(idea._id, comment)
    }), [idea._id]);

    return (
        <article id={`idea-${idea._id}`} className={styles.idea}>
            <ReactionButtons
                variant="vertical"
                heartKey="like"
                downKey="dislike"
                activeReaction={idea.myVote || ''}
                onReact={choice => onVote(idea, choice)}
                showCounts={false}
                between={<span className={styles.score}><strong>{idea.score || 0}</strong><small>score</small></span>}
            />
            <div className={styles.ideaBody}>
                <div className={styles.ideaTop}>
                    <div className={styles.labels}>
                        <span className={idea.kind === 'bug' ? styles.bugLabel : styles.ideaLabel}>{idea.kind === 'bug' ? <Bug size={11} /> : null}{idea.kind === 'bug' ? 'Bug' : 'Idea'}</span>
                        <span title="Area">{idea.category}</span>
                        {!user || !user.isAdmin ? <span className={styles[`status${idea.status}`]} title="Status">{STATUS_LABELS[idea.status] || idea.status}</span> : null}
                        {(!user || !user.isAdmin) && idea.interested ? <span className={styles.official} title="MistWarp is interested in this suggestion"><Sparkles size={11} /> MistWarp is interested</span> : null}
                    </div>
                    {user && user.isAdmin ? (
                        <div className={styles.adminActions}>
                            <select aria-label="Suggestion status" value={idea.status} onChange={event => onStatus(idea, event.target.value)}>
                                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                            <button className={idea.interested ? styles.officialToggleOn : styles.officialToggle} title={idea.interested ? 'Remove MistWarp interest' : 'Mark MistWarp as interested'} onClick={() => onInterest(idea, !idea.interested)}>
                                <Sparkles size={11} />
                                {idea.interested ? 'Interested' : 'Mark interested'}
                            </button>
                        </div>
                    ) : null}
                </div>
                <h2>{idea.title}</h2>
                <p className={styles.description}><RichText text={idea.description} /></p>
                <div className={styles.ideaFooter}>
                    <div className={styles.meta}>
                        <Link to={`/users/${idea.author}`}><Avatar username={idea.author} size={24} />{idea.author}</Link>
                        <span>{timeAgo(idea.created)}</span>
                    </div>
                    <button className={styles.discussionButton} onClick={() => setDiscussionOpen(value => !value)}>
                        <MessageCircle size={15} />
                        {idea.commentCount || 0} {(idea.commentCount || 0) === 1 ? 'comment' : 'comments'}
                        <span>{discussionOpen ? 'Hide' : 'Discuss'}</span>
                    </button>
                </div>
                {discussionOpen ? (
                    <div className={styles.discussion}>
                        {!user ? <button className={styles.signIn} onClick={login}>Sign in to join the discussion</button> : null}
                        <CommentThread source={source} canModerate={Boolean(user && (user.isAdmin || user.username.toLowerCase() === idea.author.toLowerCase()))} reportContext={`roadmap suggestion ${idea.title}`} />
                    </div>
                ) : null}
            </div>
        </article>
    );
};

const Roadmap = () => {
    const {user, login} = useUser();
    const [params] = useSearchParams();
    const [ideas, setIdeas] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [creating, setCreating] = useState(params.get('new') === 'bug');
    const [form, setForm] = useState({kind: params.get('new') === 'bug' ? 'bug' : 'idea', title: '', description: '', category: 'Community'});
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [kindFilter, setKindFilter] = useState('');
    const updateForm = (field, value) => setForm(current => ({...current, [field]: value}));

    const categories = useMemo(() => (ideas ? [...new Set(ideas.map(idea => idea.category).filter(Boolean))].sort() : []), [ideas]);
    const visibleIdeas = useMemo(() => {
        if (!ideas) return [];
        const normalizedQuery = query.trim().toLowerCase();
        return ideas.filter(idea => {
            if (statusFilter && idea.status !== statusFilter) return false;
            if (categoryFilter && idea.category !== categoryFilter) return false;
            if (sourceFilter && idea.source !== sourceFilter) return false;
            if (kindFilter && (idea.kind || 'idea') !== kindFilter) return false;
            if (!normalizedQuery) return true;
            return `${idea.title} ${idea.description} ${idea.author} ${idea.category}`.toLowerCase().includes(normalizedQuery);
        });
    }, [ideas, query, statusFilter, categoryFilter, sourceFilter, kindFilter]);
    const filtering = Boolean(query || statusFilter || categoryFilter || sourceFilter || kindFilter);
    const clearFilters = () => {
        setQuery('');
        setStatusFilter('');
        setCategoryFilter('');
        setSourceFilter('');
        setKindFilter('');
    };

    const load = useCallback(() => {
        setIdeas(null);
        setLoadError(false);
        api.roadmap()
            .then(data => setIdeas(data.ideas || []))
            .catch(() => setLoadError(true));
    }, []);

    useEffect(load, [load]);
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
        setError('');
        try {
            await api.createIdea(form);
            setForm({kind: 'idea', title: '', description: '', category: 'Community'});
            setCreating(false);
            load();
        } catch (e) {
            setError(e.message || 'Could not post the suggestion.');
        }
    };

    const vote = async (idea, choice) => {
        if (!user) {
            login();
            return;
        }
        try {
            const data = await api.voteIdea(idea._id, choice);
            setIdeas(current => current.map(item => (item._id === idea._id ? {...item, ...data} : item))
                .sort((a, b) => b.score - a.score));
        } catch (e) {
            setError(e.message || 'Could not save your vote.');
        }
    };

    const updateStatus = async (idea, status) => {
        try {
            await api.updateIdea(idea._id, {status});
            setIdeas(current => current.map(item => (item._id === idea._id ? {...item, status} : item)));
        } catch (e) {
            setError(e.message || 'Could not update the status.');
        }
    };

    const updateInterest = async (idea, interested) => {
        try {
            await api.updateIdea(idea._id, {interested});
            setIdeas(current => current.map(item => (item._id === idea._id ? {...item, interested} : item)));
        } catch (e) {
            setError(e.message || 'Could not update MistWarp interest.');
        }
    };

    return (
        <main className={styles.page}>
            <header className={styles.head}>
                <div>
                    <h1>Roadmap</h1>
                    <p>Suggest improvements, report product bugs, vote on what matters, and discuss entries with the community.</p>
                </div>
                <Button onClick={() => (user ? setCreating(value => !value) : login())}><Plus size={16} /> Add an entry</Button>
            </header>
            {creating ? (
                <form className={styles.form} onSubmit={create}>
                    <label>Type<select value={form.kind} onChange={event => updateForm('kind', event.target.value)}><option value="idea">Idea</option><option value="bug">Bug report</option></select></label>
                    <label>Title<input value={form.title} required maxLength={120} placeholder="A clear summary" onChange={event => updateForm('title', event.target.value)} /></label>
                    <label>Description<textarea value={form.description} required maxLength={3000} placeholder={form.kind === 'bug' ? 'What happened, what did you expect, and how can someone reproduce it?' : 'What should change, and who would it help?'} onChange={event => updateForm('description', event.target.value)} /></label>
                    <label>Area<select value={form.category} onChange={event => updateForm('category', event.target.value)}>
                        <option>Community</option><option>Editor</option><option>Collaboration</option><option>Extensions</option><option>Mobile</option><option>Other</option>
                    </select></label>
                    <div className={styles.formActions}>
                        <Button type="submit">{form.kind === 'bug' ? 'Report bug' : 'Post idea'}</Button>
                        <button type="button" onClick={() => setCreating(false)}>Cancel</button>
                    </div>
                </form>
            ) : null}
            {error ? <p className={styles.error}>{error}</p> : null}
            {ideas && ideas.length ? (
                <div className={styles.filters}>
                    <div className={styles.searchFilter}><Search size={16} /><input aria-label="Search roadmap" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search ideas and bugs" /></div>
                    <select aria-label="Filter by type" value={kindFilter} onChange={event => setKindFilter(event.target.value)}><option value="">Ideas and bugs</option><option value="idea">Ideas</option><option value="bug">Bugs</option></select>
                    <select aria-label="Filter by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Any status</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                    <select aria-label="Filter by area" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="">Any area</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
                    <select aria-label="Filter by submitter" value={sourceFilter} onChange={event => setSourceFilter(event.target.value)}><option value="">Anyone</option><option value="community">Community</option><option value="mistwarp">MistWarp</option></select>
                    <div className={styles.filterSummary}>
                        <span>{visibleIdeas.length} {visibleIdeas.length === 1 ? 'result' : 'results'}</span>
                        {filtering ? <button onClick={clearFilters}>Clear filters</button> : null}
                    </div>
                </div>
            ) : null}
            {!ideas && !loadError ? <p className={styles.empty}>Loading suggestions…</p> : null}
            {loadError ? <p className={styles.empty}>Could not load suggestions. <button type="button" onClick={load}>Try again</button></p> : null}
            {ideas && !ideas.length ? <p className={styles.empty}>No suggestions yet. Add the first one.</p> : null}
            {ideas && ideas.length && !visibleIdeas.length ? <p className={styles.empty}>No suggestions match those filters.</p> : null}
            {visibleIdeas.length ? <div className={styles.list}>{visibleIdeas.map(idea => (
                <IdeaCard key={idea._id} idea={idea} user={user} login={login} onVote={vote} onStatus={updateStatus} onInterest={updateInterest} />
            ))}</div> : null}
        </main>
    );
};

export default Roadmap;
