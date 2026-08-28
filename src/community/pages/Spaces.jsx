/* eslint-disable max-len */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {Layers3, Trophy, Library, Plus, Search} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import ChallengeCalendar from '../components/ChallengeCalendar.jsx';
import SpaceCard from '../components/SpaceCard.jsx';
import ExploreNav from '../components/ExploreNav.jsx';
import styles from './Spaces.module.css';

const KINDS = [
    {key: 'mine', label: 'Your spaces'},
    {key: 'studio', label: 'Studios'},
    {key: 'challenge', label: 'Challenges'},
    {key: 'collection', label: 'Collections'}
];

const KIND_ICONS = {studio: Layers3, challenge: Trophy, collection: Library};
const KIND_LABELS = {studio: 'Studio', challenge: 'Challenge', collection: 'Collection'};
const KIND_DESCRIPTIONS = {
    studio: 'A shared place where curators organise projects and accept submissions.',
    challenge: 'A timed event where people make projects around a prompt.',
    collection: 'A curated project list with submissions closed by default.'
};
const PAGE_SIZE = 24;
const mergeSpaces = (current, incoming) => {
    const byId = new Map(current.map(space => [space._id, space]));
    incoming.forEach(space => byId.set(space._id, space));
    return [...byId.values()];
};
const withSpaceQuery = (params, query) => {
    const next = new URLSearchParams(params);
    const normalized = query.trim();
    if (normalized) next.set('q', normalized);
    else next.delete('q');
    return next;
};

const normalizeSpaceParams = currentParams => {
    const next = new URLSearchParams(currentParams);
    const kind = next.get('kind');
    if (!KINDS.some(item => item.key === kind) || kind === 'studio') next.delete('kind');
    const query = (next.get('q') || '').trim();
    if (query) next.set('q', query);
    else next.delete('q');
    const group = (next.get('group') || '').trim();
    if (group) next.set('group', group);
    else next.delete('group');
    if (next.get('create') !== '1') next.delete('create');
    return next;
};

const withSpaceCreate = (currentParams, open) => {
    const next = new URLSearchParams(currentParams);
    if (open) next.set('create', '1');
    else {
        next.delete('create');
        next.delete('group');
    }
    return next;
};

const challengeDatesValid = (startsAt, endsAt) => new Date(endsAt).getTime() > new Date(startsAt).getTime();
const spaceCreatePayload = form => ({
    ...form,
    title: form.title.trim(),
    description: form.description.trim(),
    startsAt: form.kind === 'challenge' && form.startsAt ? new Date(form.startsAt).getTime() : 0,
    endsAt: form.kind === 'challenge' && form.endsAt ? new Date(form.endsAt).getTime() : 0,
    openSubmissions: form.kind !== 'collection'
});

const Spaces = () => {
    const {user, login} = useUser();
    const viewerName = (user && user.username) || '';
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedKind = searchParams.get('kind') || 'studio';
    const kind = KINDS.some(item => item.key === requestedKind) ? requestedKind : 'studio';
    const requestedQuery = searchParams.get('q') || '';
    const requestedGroup = searchParams.get('group') || '';
    const createKind = ['studio', 'challenge', 'collection'].includes(searchParams.get('kind')) ? searchParams.get('kind') : 'studio';
    const [spaces, setSpaces] = useState([]);
    const [query, setQuery] = useState(requestedQuery);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [total, setTotal] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState('');
    const creating = searchParams.get('create') === '1';
    const [createBusy, setCreateBusy] = useState(false);
    const [form, setForm] = useState({title: '', description: '', kind: createKind, visibility: 'public', startsAt: '', endsAt: '', groupTag: requestedGroup});
    const [error, setError] = useState('');
    const loadSequence = useRef(0);
    const createLocks = useRef(new Set());
    const currentViewer = useRef(viewerName);
    currentViewer.current = viewerName;
    const updateForm = (field, value) => setForm(current => ({...current, [field]: value}));

    useEffect(() => {
        const normalized = normalizeSpaceParams(searchParams);
        if (normalized.toString() !== searchParams.toString()) setSearchParams(normalized, {replace: true});
    }, [searchParams, setSearchParams]);

    const load = useCallback((search = '', offset = 0) => {
        const sequence = loadSequence.current + 1;
        loadSequence.current = sequence;
        const initial = offset === 0;
        if (initial) {
            setLoading(true);
            setLoadingMore(false);
            setFailed(false);
            setSpaces([]);
            setLoadMoreError('');
        } else {
            setLoadingMore(true);
            setLoadMoreError('');
        }
        const request = kind === 'mine' ?
            (user ? api.mySpaces() : Promise.resolve({spaces: []})) :
            api.spaces({kind, q: search, offset, limit: PAGE_SIZE});
        request
            .then(data => {
                if (loadSequence.current !== sequence) return;
                const result = data.spaces || [];
                const normalizedSearch = search.trim().toLowerCase();
                const filtered = kind === 'mine' && normalizedSearch ?
                    result.filter(space => `${space.title} ${space.description} ${space.owner}`.toLowerCase().includes(normalizedSearch)) :
                    result;
                setSpaces(current => (initial ? filtered : mergeSpaces(current, filtered)));
                setTotal(kind === 'mine' ? filtered.length : Number(data.total) || 0);
            })
            .catch(() => {
                if (loadSequence.current !== sequence) return;
                if (initial) setFailed(true);
                else setLoadMoreError('Could not load more spaces.');
            })
            .finally(() => {
                if (loadSequence.current !== sequence) return;
                if (initial) setLoading(false);
                else setLoadingMore(false);
            });
    }, [kind, user]);

    useEffect(() => setQuery(requestedQuery), [requestedQuery]);
    useEffect(() => load(requestedQuery), [load, requestedQuery]);
    useEffect(() => {
        if (!creating) return;
        setForm(current => ({...current, kind: createKind, groupTag: requestedGroup}));
    }, [createKind, creating, requestedGroup]);
    useEffect(() => {
        if (!creating) setError('');
    }, [creating]);
    useEffect(() => {
        setCreateBusy(false);
        setError('');
    }, [viewerName]);

    const create = async event => {
        event.preventDefault();
        if (!user) {
            login();
            return;
        }
        const payload = spaceCreatePayload(form);
        if (!payload.title) {
            setError('Enter a name for this space.');
            return;
        }
        if (form.kind === 'challenge' && !challengeDatesValid(form.startsAt, form.endsAt)) {
            setError('Submissions must close after they open.');
            return;
        }
        const actionViewer = viewerName;
        if (createLocks.current.has(actionViewer)) return;
        createLocks.current.add(actionViewer);
        setCreateBusy(true);
        setError('');
        try {
            const data = await api.createSpace(payload);
            if (currentViewer.current === actionViewer) {
                setForm({title: '', description: '', kind: 'studio', visibility: 'public', startsAt: '', endsAt: '', groupTag: ''});
                navigate(`/spaces/${data.space._id}/manage`);
            }
        } catch (e) {
            if (currentViewer.current === actionViewer) {
                setError(e.message || 'Could not create the space.');
            }
        } finally {
            createLocks.current.delete(actionViewer);
            if (currentViewer.current === actionViewer) setCreateBusy(false);
        }
    };

    return (
        <main className={styles.page}>
            <ExploreNav active={kind === 'mine' ? 'studios' : `${kind}s`} />
            <header className={styles.hero}>
                <div>
                    <h1>{kind === 'mine' ? 'Your spaces' : `${KIND_LABELS[kind]}s`}</h1>
                    <p>{kind === 'mine' ? 'Spaces you own, curate, follow, or have been invited to.' : KIND_DESCRIPTIONS[kind]}</p>
                </div>
                <div className={styles.heroActions}>
                    {kind !== 'mine' ? <Link className={styles.mineLink} to="/spaces?kind=mine">Your spaces</Link> : null}
                    <Button
                        disabled={createBusy}
                        onClick={() => (user ? setSearchParams(withSpaceCreate(searchParams, !creating)) : login())}
                    >
                        <Plus size={16} />
                        New space
                    </Button>
                </div>
            </header>

            {creating ? (
                <form className={styles.form} onSubmit={create} aria-busy={createBusy}>
                    <h2>Create a space</h2>
                    <label>
                        <span>Name</span>
                        <input value={form.title} disabled={createBusy} maxLength={100} required onChange={event => updateForm('title', event.target.value)} />
                    </label>
                    <label>
                        <span>What is it for?</span>
                        <textarea value={form.description} disabled={createBusy} maxLength={5000} onChange={event => updateForm('description', event.target.value)} />
                    </label>
                    <fieldset className={styles.typeChoices} disabled={createBusy}>
                        <legend>Type</legend>
                        <div>
                            {Object.keys(KIND_DESCRIPTIONS).map(key => {
                                const Icon = KIND_ICONS[key];
                                return (
                                    <label key={key} className={form.kind === key ? styles.typeChoiceActive : styles.typeChoice}>
                                        <input type="radio" name="space-kind" value={key} checked={form.kind === key} onChange={event => updateForm('kind', event.target.value)} />
                                        <Icon size={18} />
                                        <span><strong>{KIND_LABELS[key]}</strong><small>{KIND_DESCRIPTIONS[key]}</small></span>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>
                    <label>
                        <span>Visibility</span>
                        <select value={form.visibility} disabled={createBusy} onChange={event => updateForm('visibility', event.target.value)}>
                            <option value="public">Public</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="private">Private</option>
                        </select>
                    </label>
                    <label>
                        <span>Group owner <small>optional Rotur group tag</small></span>
                        <input maxLength="32" value={form.groupTag} disabled={createBusy} placeholder="for example, mistwarp" onChange={event => updateForm('groupTag', event.target.value)} />
                    </label>
                    {form.kind === 'challenge' ? (
                        <div className={styles.formRow}>
                            <label><span>Submissions open</span><input type="datetime-local" disabled={createBusy} required value={form.startsAt} onChange={event => updateForm('startsAt', event.target.value)} /></label>
                            <label><span>Submissions close</span><input type="datetime-local" disabled={createBusy} required value={form.endsAt} onChange={event => updateForm('endsAt', event.target.value)} /></label>
                        </div>
                    ) : null}
                    {error ? <p className={styles.error}>{error}</p> : null}
                    <div className={styles.actions}>
                        <Button type="submit" busy={createBusy} busyLabel="Creating…">Create</Button>
                        <Button variant="secondary" type="button" disabled={createBusy} onClick={() => setSearchParams(withSpaceCreate(searchParams, false))}>Cancel</Button>
                    </div>
                </form>
            ) : null}

            <div className={styles.browseTools}>
                <form
                    className={styles.spaceSearch}
                    onSubmit={event => {
                        event.preventDefault();
                        const normalized = query.trim();
                        if (normalized === requestedQuery) load(requestedQuery);
                        else setSearchParams(withSpaceQuery(searchParams, query));
                    }}
                >
                    <Search size={16} />
                    <input aria-label={kind === 'mine' ? 'Search your spaces' : 'Search spaces'} value={query} onChange={event => setQuery(event.target.value)} placeholder={kind === 'mine' ? 'Search your spaces' : 'Search spaces'} />
                    <button type="submit">Search</button>
                </form>
            </div>

            {loading ? <p className={styles.status}>Loading spaces…</p> : null}
            {failed ? <p className={styles.status}>Could not load spaces. <Button onClick={() => load(requestedQuery)}>Try again</Button></p> : null}
            {!loading && !failed && kind === 'mine' && !user ? <p className={styles.status}>Sign in to see spaces you own, curate, follow, or have been invited to. <Button onClick={login}>Sign in</Button></p> : null}
            {!loading && !failed && !(kind === 'mine' && !user) && !spaces.length ? <p className={styles.status}>No spaces here yet.</p> : null}
            {!loading && !failed && kind === 'challenge' && spaces.length ? <ChallengeCalendar spaces={spaces} /> : null}
            <div className={styles.grid}>
                {spaces.map(space => <SpaceCard key={space._id} space={space} to={`/spaces/${space._id}`} />)}
            </div>
            {!loading && !failed && kind !== 'mine' && spaces.length < total ? (
                <div className={styles.more}>
                    <Button
                        busy={loadingMore}
                        busyLabel="Loading…"
                        onClick={() => load(requestedQuery, spaces.length)}
                    >{`Load more (${total - spaces.length} left)`}</Button>
                    {loadMoreError ? <span role="alert">{loadMoreError}</span> : null}
                </div>
            ) : null}
        </main>
    );
};

export {withSpaceCreate, withSpaceQuery, challengeDatesValid, mergeSpaces, normalizeSpaceParams, spaceCreatePayload};
export default Spaces;
