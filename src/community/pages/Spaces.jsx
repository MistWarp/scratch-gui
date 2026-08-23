/* eslint-disable max-len */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Layers3, Trophy, Library, Plus, Search} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import ChallengeCalendar from '../components/ChallengeCalendar.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
import SpaceCard from '../components/SpaceCard.jsx';
import styles from './Spaces.module.css';

const KINDS = [
    {key: '', label: 'Everything'},
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
const Spaces = () => {
    const {user, login} = useUser();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedKind = searchParams.get('kind') || '';
    const kind = KINDS.some(item => item.key === requestedKind) ? requestedKind : '';
    const [spaces, setSpaces] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({title: '', description: '', kind: 'studio', visibility: 'public', startsAt: '', endsAt: ''});
    const [error, setError] = useState('');
    const loadSequence = useRef(0);
    const updateForm = (field, value) => setForm(current => ({...current, [field]: value}));

    const load = useCallback((search = '') => {
        const sequence = loadSequence.current + 1;
        loadSequence.current = sequence;
        setLoading(true);
        setFailed(false);
        const request = kind === 'mine' ? (user ? api.mySpaces() : Promise.resolve({spaces: []})) : api.spaces({kind, q: search});
        request
            .then(data => {
                if (loadSequence.current !== sequence) return;
                const result = data.spaces || [];
                const normalizedSearch = search.trim().toLowerCase();
                setSpaces(kind === 'mine' && normalizedSearch ? result.filter(space => `${space.title} ${space.description} ${space.owner}`.toLowerCase().includes(normalizedSearch)) : result);
            })
            .catch(() => {
                if (loadSequence.current === sequence) setFailed(true);
            })
            .finally(() => {
                if (loadSequence.current === sequence) setLoading(false);
            });
    }, [kind, user]);

    useEffect(() => load(), [load]);

    const changeKind = nextKind => {
        const next = new URLSearchParams(searchParams);
        if (nextKind) next.set('kind', nextKind);
        else next.delete('kind');
        setSearchParams(next);
    };

    const create = async event => {
        event.preventDefault();
        if (!user) {
            login();
            return;
        }
        setError('');
        try {
            const data = await api.createSpace({
                ...form,
                startsAt: form.startsAt ? new Date(form.startsAt).getTime() : 0,
                endsAt: form.endsAt ? new Date(form.endsAt).getTime() : 0,
                openSubmissions: form.kind !== 'collection'
            });
            setCreating(false);
            setForm({title: '', description: '', kind: 'studio', visibility: 'public', startsAt: '', endsAt: ''});
            navigate(`/spaces/${data.space._id}/manage`);
        } catch (e) {
            setError(e.message || 'Could not create the space.');
        }
    };

    return (
        <main className={styles.page}>
            <header className={styles.hero}>
                <div>
                    <h1>Spaces</h1>
                    <p>Collect projects, run a challenge, or build something with a group.</p>
                </div>
                <Button onClick={() => (user ? setCreating(value => !value) : login())}>
                    <Plus size={16} />
                    New space
                </Button>
            </header>

            {creating ? (
                <form className={styles.form} onSubmit={create}>
                    <h2>Create a space</h2>
                    <label>
                        <span>Name</span>
                        <input value={form.title} maxLength={100} required onChange={event => updateForm('title', event.target.value)} />
                    </label>
                    <label>
                        <span>What is it for?</span>
                        <textarea value={form.description} maxLength={5000} onChange={event => updateForm('description', event.target.value)} />
                    </label>
                    <fieldset className={styles.typeChoices}>
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
                        <select value={form.visibility} onChange={event => updateForm('visibility', event.target.value)}>
                            <option value="public">Public</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="private">Private</option>
                        </select>
                    </label>
                    {form.kind === 'challenge' ? (
                        <div className={styles.formRow}>
                            <label><span>Submissions open</span><input type="datetime-local" required value={form.startsAt} onChange={event => updateForm('startsAt', event.target.value)} /></label>
                            <label><span>Submissions close</span><input type="datetime-local" required value={form.endsAt} onChange={event => updateForm('endsAt', event.target.value)} /></label>
                        </div>
                    ) : null}
                    {error ? <p className={styles.error}>{error}</p> : null}
                    <div className={styles.actions}>
                        <Button type="submit">Create</Button>
                        <Button variant="secondary" type="button" onClick={() => setCreating(false)}>Cancel</Button>
                    </div>
                </form>
            ) : null}

            <div className={styles.browseTools}>
                <SectionTabs
                    items={KINDS}
                    value={kind}
                    onChange={changeKind}
                    className={styles.tabs}
                    itemClassName={styles.tab}
                    activeClassName={styles.tabActive}
                    ariaLabel="Space types"
                />
                <form
                    className={styles.spaceSearch}
                    onSubmit={event => {
                        event.preventDefault();
                        load(query);
                    }}
                >
                    <Search size={16} />
                    <input value={query} onChange={event => setQuery(event.target.value)} placeholder={kind === 'mine' ? 'Search your spaces' : 'Search spaces'} />
                    <button type="submit">Search</button>
                </form>
            </div>

            {loading ? <p className={styles.status}>Loading spaces…</p> : null}
            {failed ? <p className={styles.status}>Could not load spaces.</p> : null}
            {!loading && !failed && kind === 'mine' && !user ? <p className={styles.status}>Sign in to see spaces you own, curate, follow, or have been invited to. <Button onClick={login}>Sign in</Button></p> : null}
            {!loading && !failed && !(kind === 'mine' && !user) && !spaces.length ? <p className={styles.status}>No spaces here yet.</p> : null}
            {!loading && !failed && kind === 'challenge' && spaces.length ? <ChallengeCalendar spaces={spaces} /> : null}
            <div className={styles.grid}>
                {spaces.map(space => <SpaceCard key={space._id} space={space} to={`/spaces/${space._id}`} />)}
            </div>
        </main>
    );
};

export default Spaces;
