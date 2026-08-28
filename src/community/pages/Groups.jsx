/* eslint-disable react/jsx-no-bind, max-len */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Building2, Plus, Search, Users} from 'lucide-react';
import {Link, useSearchParams} from 'react-router-dom';
import rotur from '../rotur.js';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import ExploreNav from '../components/ExploreNav.jsx';
import styles from './Groups.module.css';

const ROTUR_GROUP_CREATION_URL = 'https://rotur.dev/groups?create=1';

const withGroupQuery = (currentParams, query) => {
    const next = new URLSearchParams(currentParams);
    const normalized = query.trim();
    if (normalized) next.set('q', normalized);
    else next.delete('q');
    return next;
};

const Groups = () => {
    const {user} = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedQuery = (searchParams.get('q') || '').trim();
    const [query, setQuery] = useState(requestedQuery);
    const [groups, setGroups] = useState([]);
    const [mine, setMine] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const loadSequence = useRef(0);
    const submittedQuery = useRef(null);

    const load = search => {
        const sequence = loadSequence.current + 1;
        loadSequence.current = sequence;
        setLoading(true);
        setError('');
        setGroups([]);
        setMine([]);
        Promise.all([
            rotur.groups.search(search),
            user ? rotur.groups.mine().catch(() => []) : Promise.resolve([])
        ]).then(([publicGroups, myGroups]) => {
            if (loadSequence.current !== sequence) return;
            setGroups(Array.isArray(publicGroups) ? publicGroups : []);
            setMine(Array.isArray(myGroups) ? myGroups : []);
        }).catch(e => {
            if (loadSequence.current === sequence) setError(e.message || 'Could not load groups.');
        }).finally(() => {
            if (loadSequence.current === sequence) setLoading(false);
        });
    };

    useEffect(() => {
        const normalized = withGroupQuery(searchParams, requestedQuery);
        if (normalized.toString() !== searchParams.toString()) setSearchParams(normalized, {replace: true});
    }, [requestedQuery, searchParams, setSearchParams]);
    useEffect(() => setQuery(requestedQuery), [requestedQuery]);
    useEffect(() => {
        if (submittedQuery.current !== null) {
            if (submittedQuery.current === requestedQuery) submittedQuery.current = null;
            return;
        }
        load(requestedQuery);
    }, [requestedQuery, user?.username]);
    useEffect(() => () => {
        loadSequence.current += 1;
    }, []);
    const mineTags = useMemo(() => new Set(mine.map(group => group.tag)), [mine]);

    const cards = query.trim() ? groups : [...mine, ...groups.filter(group => !mineTags.has(group.tag))];
    return (<main className={styles.page}>
        <ExploreNav active="groups" />
        <header className={styles.hero}>
            <div><span className={styles.eyebrow}><Building2 size={17} /> MistWarp groups</span><h1>Build as an organisation</h1><p>Groups share Rotur membership and funding while owning MistWarp studios, projects, challenges, and collections.</p></div>
            <Button variant="primary" onClick={() => window.location.assign(ROTUR_GROUP_CREATION_URL)}><Plus size={16} /> New group</Button>
        </header>

        <form
            className={styles.search} onSubmit={event => {
                event.preventDefault();
                const normalized = query.trim();
                if (normalized !== requestedQuery) {
                    submittedQuery.current = normalized;
                    setSearchParams(withGroupQuery(searchParams, normalized));
                }
                load(normalized);
            }}
        ><Search size={18} /><input aria-label="Search groups" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search groups" /><button>Search</button></form>
        {error ? <p className={styles.error}>{error} <Button onClick={() => load(requestedQuery)}>Try again</Button></p> : null}
        {loading ? <p className={styles.status}>Loading groups…</p> : null}
        {!loading && !error && !cards.length ? <p className={styles.status}>No groups found.</p> : null}
        <section className={styles.grid}>
            {cards.map(group => (<Link className={styles.card} to={`/groups/${group.tag}`} key={group.tag}>
                <div className={styles.icon}>{group.icon_url ? <img src={group.icon_url} alt="" /> : <Building2 />}</div>
                <div><h2>{group.name}</h2><span>@{group.tag}</span><p>{group.description || 'A Rotur group on MistWarp.'}</p><small><Users size={14} /> {group.member_count || 0} members{mineTags.has(group.tag) ? ' · Joined' : ''}</small></div>
            </Link>))}
        </section>
    </main>);
};

export {withGroupQuery};
export default Groups;
