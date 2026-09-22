import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {GitPullRequest, MessageSquare, Plus, Search} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import api from '../api.js';
import {useResolvedProjectId, projectBaseUrl} from '../use-resolved-project-id.js';
import Avatar from '../components/Avatar.jsx';
import UserLink from '../components/UserLink.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import {timeAgo} from '../format.js';
import setPageMeta from '../page-meta.js';
import styles from './PullRequests.module.css';

const PullRequests = () => {
    const {text: communityText} = useCommunityText();
    const {slug} = useParams();
    const {projectId: id, resolving, resolveError} = useResolvedProjectId();
    const [project, setProject] = useState(null);
    const [pulls, setPulls] = useState(null);
    const [state, setState] = useState('open');
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!id) return;
        setError('');
        try {
            const [projectData, pullData] = await Promise.all([api.getProject(id), api.pulls(id)]);
            const loadedProject = projectData.project || projectData;
            setProject(loadedProject);
            setPulls(pullData.pulls || []);
            setPageMeta({title: `Pull requests · ${loadedProject.title}`});
        } catch (loadError) {
            setError(loadError.message || communityText('Could not load pull requests.'));
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => (pulls || []).filter(pull => {
        const stateMatches = state === 'open' ? pull.state === 'open' : pull.state !== 'open';
        const needle = query.trim().toLowerCase();
        return stateMatches && (!needle || `${pull.title} ${pull.user} ${pull.index}`.toLowerCase().includes(needle));
    }), [pulls, query, state]);
    const openCount = (pulls || []).filter(pull => pull.state === 'open').length;
    const closedCount = (pulls || []).length - openCount;
    const baseUrl = projectBaseUrl({project, projectId: id, vanitySlug: slug});
    const newPull = () => {
        window.location.href = `${baseUrl}#contribute`;
    };

    if (resolving) return <main className={styles.page}><StatusMessage>{communityText('Finding project…')}</StatusMessage></main>;
    if (resolveError) return <main className={styles.page}><StatusMessage error>{resolveError}</StatusMessage></main>;
    if (error) return <main className={styles.page}><StatusMessage error onRetry={load}>{error}</StatusMessage></main>;
    if (!project || !pulls) return <main className={styles.page}><StatusMessage>{communityText('Loading pull requests…')}</StatusMessage></main>;

    return (
        <main className={styles.page}>
            <PageHeader
                compact
                icon={GitPullRequest}
                backTo={baseUrl}
                backLabel={project.title}
                title={communityText('Pull requests')}
                actions={<Button variant="primary" onClick={newPull}><Plus size={16} />{communityText('New pull request')}</Button>}
            >
                <label className={styles.search}><Search size={16} /><input value={query} placeholder={communityText('Search pull requests')} onChange={event => setQuery(event.target.value)} /></label>
            </PageHeader>
            <section className={styles.list}>
                <header>
                    <button type="button" className={state === 'open' ? styles.active : ''} onClick={() => setState('open')}><GitPullRequest size={16} /> {communityText('{count} open', {count: openCount})}</button>
                    <button type="button" className={state === 'closed' ? styles.active : ''} onClick={() => setState('closed')}>{communityText('{count} closed', {count: closedCount})}</button>
                </header>
                {filtered.length ? filtered.map(pull => (
                    <article key={pull.index}>
                        <GitPullRequest className={pull.state === 'open' ? styles.openIcon : styles.closedIcon} size={18} />
                        <div>
                            <Link to={`${baseUrl}/pulls/${pull.index}`}>{pull.title}</Link>
                            <span><UserLink username={pull.user}><Avatar username={pull.user} size={18} /></UserLink> {communityText('#{index} opened {time} by {user}', {index: pull.index, time: timeAgo(pull.created), user: pull.user})}</span>
                        </div>
                        <span className={styles.comments}><MessageSquare size={14} /> {pull.commentCount || 0}</span>
                    </article>
                )) : (
                    <EmptyState compact icon={GitPullRequest} title={state === 'open' ? communityText('No open pull requests match') : communityText('No closed pull requests match')}>
                        {query.trim() ? communityText('Try a different search term.') : communityText('Pull requests will show up here once someone contributes.')}
                    </EmptyState>
                )}
            </section>
        </main>
    );
};

export default PullRequests;
