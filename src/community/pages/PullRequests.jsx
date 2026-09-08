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
            setError(loadError.message || 'Could not load pull requests.');
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

    if (resolving) return <main className={styles.page}><p className={styles.state}>{communityText('Finding project…')}</p></main>;
    if (resolveError) return <main className={styles.page}><div className={styles.state}><p>{resolveError}</p></div></main>;
    if (error) return <main className={styles.page}><div className={styles.state}><p>{error}</p><Button onClick={load}>{communityText('Try again')}</Button></div></main>;
    if (!project || !pulls) return <main className={styles.page}><p className={styles.state}>{communityText('Loading pull requests…')}</p></main>;

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div><Link to={baseUrl}>{project.title}</Link><h1>{communityText('Pull requests')}</h1></div>
                <Button variant="primary" onClick={newPull}><Plus size={16} />{communityText(' New pull request')}</Button>
            </header>
            <div className={styles.tools}>
                <label><Search size={16} /><input value={query} placeholder={communityText('Search pull requests')} onChange={event => setQuery(event.target.value)} /></label>
            </div>
            <section className={styles.list}>
                <header>
                    <button className={state === 'open' ? styles.active : ''} onClick={() => setState('open')}><GitPullRequest size={16} /> {openCount}{communityText(' Open')}</button>
                    <button className={state === 'closed' ? styles.active : ''} onClick={() => setState('closed')}>{closedCount}{communityText(' Closed')}</button>
                </header>
                {filtered.length ? filtered.map(pull => (
                    <article key={pull.index}>
                        <GitPullRequest className={pull.state === 'open' ? styles.openIcon : styles.closedIcon} size={18} />
                        <div>
                            <Link to={`${baseUrl}/pulls/${pull.index}`}>{pull.title}</Link>
                            <span>#{pull.index}{communityText(' opened ')}{timeAgo(pull.created)}{communityText(' by ')}<UserLink username={pull.user}><Avatar username={pull.user} size={18} /></UserLink> <UserLink username={pull.user}>{pull.user}</UserLink></span>
                        </div>
                        <span className={styles.comments}><MessageSquare size={14} /> {pull.commentCount || 0}</span>
                    </article>
                )) : <p className={styles.empty}>{communityText('No ')}{state}{communityText(' pull requests match.')}</p>}
            </section>
        </main>
    );
};

export default PullRequests;
