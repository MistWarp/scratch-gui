/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Coins, Search} from 'lucide-react';
import {Link} from 'react-router-dom';
import api, {projectUrl} from '../api.js';
import {listCommerceBounties} from '../credits.js';
import ExploreNav from '../components/ExploreNav.jsx';
import Button from '../components/ui/Button.jsx';
import UserLink from '../components/UserLink.jsx';
import styles from './Bounties.module.css';

export const mapWithConcurrency = async (items, limit, mapper) => {
    const results = new Array(items.length);
    let nextIndex = 0;
    const worker = async () => {
        while (nextIndex < items.length) {
            const index = nextIndex++;
            results[index] = await mapper(items[index], index);
        }
    };
    await Promise.all(Array.from({length: Math.min(limit, items.length)}, worker));
    return results;
};

const Bounties = () => {
    const [entries, setEntries] = useState(null);
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setError('');
        setEntries(null);
        try {
            const data = await listCommerceBounties({source: 'mistwarp', resource_type: 'project', status: 'open'});
            const bounties = data.bounties || [];
            const projectIds = [...new Set(bounties.map(item => item.resource_id).filter(Boolean))];
            const loadedProjects = await mapWithConcurrency(projectIds, 4, async id => {
                try {
                    const result = await api.getProject(id);
                    return result.project || result;
                } catch (_) {
                    return null;
                }
            });
            const projects = new Map(loadedProjects.filter(project => (
                project && project.shared && (project.visibility || 'public') === 'public'
            )).map(project => [project.id, project]));
            setEntries(bounties.map(bounty => ({bounty, project: projects.get(bounty.resource_id)})).filter(entry => entry.project));
        } catch (loadError) {
            setError(loadError.message || 'Could not load bounties.');
            setEntries([]);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return entries || [];
        return (entries || []).filter(({bounty, project}) => (
            `${bounty.title} ${bounty.description || ''} ${project.title} ${project.owner}`.toLowerCase().includes(needle)
        ));
    }, [entries, query]);

    return (
        <main className={styles.page}>
            <ExploreNav active="bounties" />
            <header className={styles.header}>
                <div><h1>Project bounties</h1><p>Funded improvements open across public MistWarp projects.</p></div>
                <label><Search size={16} /><input value={query} placeholder="Search bounties" onChange={event => setQuery(event.target.value)} /></label>
            </header>
            {entries === null ? <p className={styles.state}>Loading bounties…</p> : error ? (
                <div className={styles.state}><p>{error}</p><Button onClick={load}>Try again</Button></div>
            ) : visible.length ? (
                <section className={styles.grid}>
                    {visible.map(({bounty, project}) => (
                        <article key={bounty.id}>
                            <div className={styles.reward}><Coins size={16} /><strong>{bounty.amount}</strong> credits</div>
                            <h2>{bounty.title}</h2>
                            {bounty.description ? <p>{bounty.description}</p> : <p className={styles.muted}>No extra details provided.</p>}
                            <footer>
                                <div><span>On</span><Link to={projectUrl(project.id)}>{project.title}</Link><span>by <UserLink username={project.owner}>{project.owner}</UserLink></span></div>
                                <Link className={styles.open} to={`/bounties/${encodeURIComponent(bounty.id)}`}>View bounty</Link>
                            </footer>
                        </article>
                    ))}
                </section>
            ) : <p className={styles.state}>{query ? 'No bounties match your search.' : 'No public project bounties are open right now.'}</p>}
        </main>
    );
};

export default Bounties;
