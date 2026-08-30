/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {GitPullRequest, MessageSquare, Plus, Search} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import api, {projectUrl} from '../api.js';
import Avatar from '../components/Avatar.jsx';
import UserLink from '../components/UserLink.jsx';
import Button from '../components/ui/Button.jsx';
import {timeAgo} from '../format.js';
import setPageMeta from '../page-meta.js';
import styles from './PullRequests.module.css';

const PullRequests = () => {
    const {id} = useParams();
    const [project, setProject] = useState(null);
    const [pulls, setPulls] = useState(null);
    const [state, setState] = useState('open');
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');

    const load = useCallback(async () => {
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
    const newPull = () => {
        window.location.href = `${projectUrl(id)}#contribute`;
    };

    if (error) return <main className={styles.page}><div className={styles.state}><p>{error}</p><Button onClick={load}>Try again</Button></div></main>;
    if (!project || !pulls) return <main className={styles.page}><p className={styles.state}>Loading pull requests…</p></main>;

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div><Link to={projectUrl(id)}>{project.title}</Link><h1>Pull requests</h1></div>
                <Button variant="primary" onClick={newPull}><Plus size={16} /> New pull request</Button>
            </header>
            <div className={styles.tools}>
                <label><Search size={16} /><input value={query} placeholder="Search pull requests" onChange={event => setQuery(event.target.value)} /></label>
            </div>
            <section className={styles.list}>
                <header>
                    <button className={state === 'open' ? styles.active : ''} onClick={() => setState('open')}><GitPullRequest size={16} /> {openCount} Open</button>
                    <button className={state === 'closed' ? styles.active : ''} onClick={() => setState('closed')}>{closedCount} Closed</button>
                </header>
                {filtered.length ? filtered.map(pull => (
                    <article key={pull.index}>
                        <GitPullRequest className={pull.state === 'open' ? styles.openIcon : styles.closedIcon} size={18} />
                        <div>
                            <Link to={`${projectUrl(id)}/pulls/${pull.index}`}>{pull.title}</Link>
                            <span>#{pull.index} opened {timeAgo(pull.created)} by <UserLink username={pull.user}><Avatar username={pull.user} size={18} /></UserLink> <UserLink username={pull.user}>{pull.user}</UserLink></span>
                        </div>
                        <span className={styles.comments}><MessageSquare size={14} /> {pull.commentCount || 0}</span>
                    </article>
                )) : <p className={styles.empty}>No {state} pull requests match.</p>}
            </section>
        </main>
    );
};

export default PullRequests;
