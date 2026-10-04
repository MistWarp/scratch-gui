import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Coins} from 'lucide-react';
import {Link} from 'react-router-dom';
import api, {friendlyError, projectUrl} from '../api.js';
import {listCommerceBounties} from '../credits.js';
import ExploreHeader, {ExploreSearch} from '../components/ExploreHeader.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import UserLink from '../components/UserLink.jsx';
import useLatest from '../use-latest.js';
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

const isPublicProject = project => Boolean(project && project.shared && (project.visibility || 'public') === 'public');

// Fills in one project's bounties once its lookup settles. A project that
// isn't public (or that the server says is gone or private) takes its
// bounties off the page; one that failed to load keeps them with a
// placeholder.
export const applyBountyProject = (entries, id, {project, error}) => {
    if (!entries) return entries;
    const hidden = error ? [401, 403, 404].includes(error.status) : !isPublicProject(project);
    return entries.flatMap(entry => {
        if (entry.bounty.resource_id !== id) return [entry];
        if (hidden) return [];
        return [{...entry, project: error ? null : project, status: error ? 'failed' : 'ready'}];
    });
};

const Bounties = () => {
    const {text: communityText} = useCommunityText();
    const [entries, setEntries] = useState(null);
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');

    const beginLoad = useLatest();

    const load = useCallback(async () => {
        const fresh = beginLoad();
        setError('');
        setEntries(null);
        let bounties;
        try {
            const data = await listCommerceBounties({source: 'mistwarp', resource_type: 'project', status: 'open'});
            bounties = (data.bounties || []).filter(item => item.resource_id);
        } catch (loadError) {
            fresh(() => {
                setError(friendlyError(loadError, communityText('Could not load bounties.')));
                setEntries([]);
            })();
            return;
        }
        // Show the bounties straight away and fill in each project as it loads.
        fresh(setEntries)(bounties.map(bounty => ({bounty, project: null, status: 'loading'})));
        const projectIds = [...new Set(bounties.map(item => item.resource_id))];
        await mapWithConcurrency(projectIds, 4, async id => {
            let result;
            try {
                const data = await api.getProject(id);
                result = {project: data.project || data};
            } catch (projectError) {
                result = {error: projectError};
            }
            fresh(setEntries)(current => applyBountyProject(current, id, result));
        });
    }, [beginLoad]);

    useEffect(() => {
        load();
    }, [load]);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return entries || [];
        return (entries || []).filter(({bounty, project}) => (
            `${bounty.title} ${bounty.description || ''} ${project ? `${project.title} ${project.owner}` : ''}`.toLowerCase().includes(needle)
        ));
    }, [entries, query]);

    return (
        <main className={styles.page}>
            <ExploreHeader active="bounties" lead={communityText('Funded improvements open across public MistWarp projects.')}>
                <ExploreSearch ariaLabel={communityText('Search bounties')} value={query} onChange={setQuery} />
            </ExploreHeader>
            {entries === null ? <StatusMessage>{communityText('Loading bounties…')}</StatusMessage> : error ? (
                <StatusMessage error onRetry={load}>{error}</StatusMessage>
            ) : visible.length ? (
                <section className={styles.grid}>
                    {visible.map(({bounty, project, status}) => (
                        <article key={bounty.id}>
                            <div className={styles.reward}><Coins size={16} /><strong>{communityText('{amount} credits', {amount: bounty.amount})}</strong></div>
                            <h2>{bounty.title}</h2>
                            {bounty.description ? <p>{bounty.description}</p> : <p className={styles.muted}>{communityText('No extra details provided.')}</p>}
                            <footer>
                                {project ? (
                                    <div><span>{communityText('On')}</span><Link to={projectUrl(project)}>{project.title}</Link><UserLink username={project.owner}>{communityText('by {owner}', {owner: project.owner})}</UserLink></div>
                                ) : (
                                    <div aria-busy={status === 'loading'}>
                                        <span>{communityText('On')}</span>
                                        <span className={styles.projectPlaceholder}>{status === 'loading' ? communityText('Loading project…') : communityText('Project unavailable')}</span>
                                    </div>
                                )}
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
