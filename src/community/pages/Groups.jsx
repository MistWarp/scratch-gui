import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable react/jsx-no-bind, max-len */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Building2, Plus, Users} from 'lucide-react';
import {Link, useSearchParams} from 'react-router-dom';
import rotur from '../rotur.js';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ListSkeleton from '../components/ListSkeleton.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import ExploreHeader, {ExploreSearch} from '../components/ExploreHeader.jsx';
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
    const {text: communityText} = useCommunityText();
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
            if (loadSequence.current === sequence) setError(e.message || communityText('Could not load groups.'));
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
        <ExploreHeader
            active="groups"
            lead={communityText('Organisations that share projects, spaces, members, and funding.')}
            actions={<Button variant="primary" onClick={() => window.location.assign(ROTUR_GROUP_CREATION_URL)}><Plus size={16} />{communityText('New group')}</Button>}
        >
            <ExploreSearch
                ariaLabel={communityText('Search groups')}
                value={query}
                onChange={setQuery}
                onSubmit={value => {
                    const normalized = value.trim();
                    if (normalized !== requestedQuery) {
                        submittedQuery.current = normalized;
                        setSearchParams(withGroupQuery(searchParams, normalized));
                    }
                    load(normalized);
                }}
            />
        </ExploreHeader>
        {error ? <StatusMessage error onRetry={() => load(requestedQuery)}>{error}</StatusMessage> : null}
        {loading ? (
            <ListSkeleton
                className={styles.list}
                count={8}
                label={communityText('Loading groups…')}
                media="square"
            />
        ) : null}
        {!loading && !error && !cards.length ? (
            <EmptyState icon={Building2} title={communityText('No groups found')}>
                {query.trim() ? communityText('Try a different search term.') : communityText('Public Rotur groups will show up here.')}
            </EmptyState>
        ) : null}
        {cards.length ? (
            <ul className={styles.list}>
                {cards.map(group => (
                    <li key={group.tag}>
                        <Link
                            className={styles.row}
                            to={`/groups/${group.tag}`}
                        >
                            <span className={styles.icon}>
                                {group.icon_url ? <img src={group.icon_url} alt="" /> : <Building2 size={20} aria-hidden="true" />}
                            </span>
                            <span className={styles.text}>
                                <span className={styles.name}>
                                    <strong>{group.name}</strong>
                                    <span>@{group.tag}</span>
                                </span>
                                <span className={styles.description}>{group.description || communityText('A Rotur group on MistWarp.')}</span>
                            </span>
                            <span className={styles.members}>
                                <span title={communityText('{count} members', {count: group.member_count || 0})}>
                                    <Users size={12} aria-hidden="true" />
                                    <span aria-hidden="true">{group.member_count || 0}</span>
                                    <span className={styles.srOnly}>{communityText('{count} members', {count: group.member_count || 0})}</span>
                                </span>
                                {mineTags.has(group.tag) ? <span className={styles.joined}>{communityText('Joined')}</span> : null}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        ) : null}
    </main>);
};

export {withGroupQuery};
export default Groups;
