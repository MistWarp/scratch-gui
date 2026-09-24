import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Coins, Search} from 'lucide-react';
import {Link} from 'react-router-dom';
import api, {projectUrl} from '../api.js';
import {listCommerceBounties} from '../credits.js';
import ExploreNav from '../components/ExploreNav.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
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
    const {text: communityText} = useCommunityText();
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
            setError(loadError.message || communityText('Could not load bounties.'));
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
            <PageHeader
                icon={Coins}
                title={communityText('Project bounties')}
                lead={communityText('Funded improvements open across public MistWarp projects.')}
                actions={(
                    <label className={styles.search}><Search size={16} /><input value={query} placeholder={communityText('Search bounties')} onChange={event => setQuery(event.target.value)} /></label>
                )}
            />
            <ExploreNav active="bounties" />
            {entries === null ? <StatusMessage>{communityText('Loading bounties…')}</StatusMessage> : error ? (
                <StatusMessage error onRetry={load}>{error}</StatusMessage>
            ) : visible.length ? (
                <section className={styles.grid}>
                    {visible.map(({bounty, project}) => (
                        <article key={bounty.id}>
                            <div className={styles.reward}><Coins size={16} /><strong>{communityText('{amount} credits', {amount: bounty.amount})}</strong></div>
                            <h2>{bounty.title}</h2>
                            {bounty.description ? <p>{bounty.description}</p> : <p className={styles.muted}>{communityText('No extra details provided.')}</p>}
                            <footer>
                                <div><span>{communityText('On')}</span><Link to={projectUrl(project)}>{project.title}</Link><UserLink username={project.owner}>{communityText('by {owner}', {owner: project.owner})}</UserLink></div>
                                <Button as={Link} to={`/bounties/${encodeURIComponent(bounty.id)}`}>{communityText('View bounty')}</Button>
                            </footer>
                        </article>
                    ))}
                </section>
            ) : (
                <EmptyState icon={Coins} title={query ? communityText('No bounties match your search') : communityText('No open bounties yet')}>
                    {query ? communityText('Try a different search term.') : communityText('Bounties on public projects will show up here when someone funds one.')}
                </EmptyState>
            )}
        </main>
    );
};

export default Bounties;
