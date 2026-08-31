/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ArrowLeft, GitCommitHorizontal, Plus, Settings2, X} from 'lucide-react';
import {Link, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import api, {projectUrl} from '../api.js';
import Avatar from '../components/Avatar.jsx';
import DiffView, {parseDiff} from '../components/DiffView.jsx';
import FileBrowserTree from '../components/FileBrowserTree.jsx';
import ProjectFiles from '../components/ProjectFiles.jsx';
import UserLink from '../components/UserLink.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import {formatDateTime} from '../format.js';
import setPageMeta from '../page-meta.js';
import {loadCommitInspection} from '../commit-diff.js';
import styles from './Commit.module.css';

export const canManageCommit = project => Boolean(
    project?.isOwner || project?.myRole === 'owner' || project?.myRole === 'maintainer'
);

export const normalizeCommitCoAuthors = entry => {
    const source = entry?.coAuthors || entry?.commit?.coAuthors ||
        entry?.collaborators || entry?.commit?.collaborators || [];
    const seen = new Set();
    return source.reduce((names, collaborator) => {
        const name = String(collaborator?.username || collaborator || '').trim();
        const key = name.toLowerCase();
        if (!name || seen.has(key)) return names;
        seen.add(key);
        names.push(name);
        return names;
    }, []);
};

export const commitMutationSha = (result, fallback) => (
    result?.commit?.sha || result?.sha || result?.rewrittenSha || fallback
);

const Commit = () => {
    const {id, sha} = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [project, setProject] = useState(null);
    const [entry, setEntry] = useState(null);
    const [diff, setDiff] = useState(null);
    const [selectedPath, setSelectedPath] = useState('');
    const [error, setError] = useState('');
    const [manageOpen, setManageOpen] = useState(false);
    const [collaboratorName, setCollaboratorName] = useState('');
    const [manageBusy, setManageBusy] = useState('');
    const [manageError, setManageError] = useState('');
    const contextRef = useRef(`${id}:${sha}`);
    contextRef.current = `${id}:${sha}`;

    const load = useCallback(async () => {
        const context = `${id}:${sha}`;
        setError('');
        try {
            const [projectData, history, coAuthorData] = await Promise.all([
                api.getProject(id),
                api.commits(id),
                api.commitCoAuthors(id, sha).catch(() => ({coAuthors: []}))
            ]);
            const loadedProject = projectData.project || projectData;
            const branchHead = history.graph?.branchLogs?.find(branch => branch.branch === history.branch)?.oids?.[0];
            const newestCommit = branchHead || history.graph?.nodes?.[0]?.sha || history.commits?.[0]?.sha || '';
            const inspected = await loadCommitInspection({
                apiClient: api,
                projectId: id,
                sha,
                remixBase: {
                    enabled: Boolean(
                        loadedProject.remixParent &&
                        loadedProject.remixBaseCommit &&
                        newestCommit === sha
                    ),
                    projectId: loadedProject.remixParent,
                    sha: loadedProject.remixBaseCommit,
                    currentHead: loadedProject.gitHead
                }
            });
            if (contextRef.current !== context) return;
            const metadata = (history.commits || []).find(commit => commit.sha === sha) || {};
            setProject(loadedProject);
            setEntry({
                ...metadata,
                ...inspected,
                message: metadata.message || inspected.message || inspected.commit?.message || '',
                date: metadata.date || inspected.date || inspected.commit?.date || 0,
                authorName: metadata.author || inspected.commit?.author?.name || inspected.commit?.author || '',
                coAuthors: coAuthorData.coAuthors || coAuthorData.collaborators ||
                    metadata.coAuthors || metadata.collaborators || []
            });
            setDiff(inspected.diff || 'No textual changes.');
            setPageMeta({title: `${metadata.message || sha.slice(0, 7)} · Commit`});
        } catch (loadError) {
            if (contextRef.current === context) setError(loadError.message || 'Could not load this commit.');
        }
    }, [id, sha]);

    useEffect(() => {
        setProject(null);
        setEntry(null);
        setDiff(null);
        setSelectedPath('');
        load();
    }, [load]);

    const files = useMemo(() => parseDiff(diff), [diff]);
    const fileView = searchParams.get('view') === 'files';
    const historicalPath = searchParams.get('path') || '';
    const showDiff = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('view');
        next.delete('path');
        setSearchParams(next);
    };
    const showFiles = path => {
        const next = new URLSearchParams(searchParams);
        next.set('view', 'files');
        if (path) next.set('path', path);
        else next.delete('path');
        setSearchParams(next);
    };
    const selectHistoricalFile = path => {
        const next = new URLSearchParams(searchParams);
        next.set('view', 'files');
        next.set('path', path);
        setSearchParams(next, {replace: true});
    };

    const openManage = () => {
        setCollaboratorName('');
        setManageError('');
        setManageOpen(true);
    };
    const applyMutation = async (action, request) => {
        if (manageBusy) return;
        setManageBusy(action);
        setManageError('');
        try {
            const result = await request();
            const nextSha = commitMutationSha(result, sha);
            if (nextSha !== sha) {
                const query = searchParams.toString();
                setManageOpen(false);
                navigate(`/project/${id}/commits/${encodeURIComponent(nextSha)}${query ? `?${query}` : ''}`, {
                    replace: true
                });
                return;
            }
            setEntry(current => ({
                ...current,
                ...(result.commit || {}),
                coAuthors: result.commit?.coAuthors || result.coAuthors ||
                    result.commit?.collaborators || result.collaborators || current.coAuthors
            }));
        } catch (mutationError) {
            setManageError(mutationError.message || 'Could not update this commit.');
        } finally {
            setManageBusy('');
        }
    };
    const updateCoAuthors = coAuthors => applyMutation(
        'coAuthors',
        () => api.setCommitCoAuthors(id, sha, coAuthors)
    );
    const addCollaborator = event => {
        event.preventDefault();
        const name = collaboratorName.trim();
        if (!name) return;
        const coAuthors = normalizeCommitCoAuthors(entry);
        if (coAuthors.some(item => item.toLowerCase() === name.toLowerCase())) {
            setManageError(`${name} is already attached to this commit.`);
            return;
        }
        setCollaboratorName('');
        updateCoAuthors([...coAuthors, name]);
    };

    if (error) {
        return (
            <main className={styles.page}>
                <Link className={styles.back} to={`${projectUrl(id)}#history`}><ArrowLeft size={15} /> Back to project</Link>
                <div className={styles.state}><p>{error}</p><Button onClick={load}>Try again</Button></div>
            </main>
        );
    }
    if (!project || !entry) {
        return <main className={styles.page}><p className={styles.state}>Loading commit…</p></main>;
    }

    return (
        <main className={styles.page}>
            <Link className={styles.back} to={`${projectUrl(id)}#history`}><ArrowLeft size={15} /> {project.title}</Link>
            <section className={styles.header}>
                <div className={styles.title}>
                    <GitCommitHorizontal size={20} />
                    <h1>{entry.message || 'Untitled commit'}</h1>
                    {canManageCommit(project) ? (
                        <Button className={styles.manageButton} onClick={openManage}>
                            <Settings2 size={14} /> Manage
                        </Button>
                    ) : null}
                </div>
                <div className={styles.meta}>
                    <UserLink username={entry.authorName}><Avatar username={entry.authorName} size={26} /></UserLink>
                    <UserLink username={entry.authorName}><strong>{entry.authorName}</strong></UserLink>
                    <span>committed {formatDateTime(entry.date || (entry.commit.author?.timestamp * 1000))}</span>
                    {normalizeCommitCoAuthors(entry).length ? (
                        <span className={styles.credited}>
                            co-authored by {normalizeCommitCoAuthors(entry).map((username, index) => (
                                <React.Fragment key={username}>
                                    {index ? ', ' : ''}<UserLink username={username}>{username}</UserLink>
                                </React.Fragment>
                            ))}
                        </span>
                    ) : null}
                    <code>{entry.oid}</code>
                </div>
            </section>
            <nav className={styles.views} aria-label="Commit views">
                <button type="button" className={!fileView ? styles.viewActive : ''} onClick={showDiff}>Changes <span>{files.length}</span></button>
                <button type="button" className={fileView ? styles.viewActive : ''} onClick={() => showFiles(historicalPath)}>Files at this commit</button>
            </nav>
            {fileView ? (
                <ProjectFiles
                    bounded
                    project={{...project, gitHead: sha}}
                    initialPath={historicalPath}
                    onSelectPath={selectHistoricalFile}
                />
            ) : files.length ? (
                <div className={styles.layout}>
                    <FileBrowserTree files={files} selectedPath={selectedPath} onSelect={setSelectedPath} showAll showStats />
                    <section className={styles.diff}><DiffView diff={diff} selectedPath={selectedPath} onOpenFile={showFiles} /></section>
                </div>
            ) : <p className={styles.rootCommit}>No files changed in this commit.</p>}
            {manageOpen ? (
                <Modal
                    className={styles.manageModal}
                    title="Commit co-authors"
                    icon={Settings2}
                    dismissDisabled={Boolean(manageBusy)}
                    onClose={() => setManageOpen(false)}
                >
                    <section className={styles.manageSection}>
                        <div className={styles.manageSectionHead}>
                            <div><strong>Co-authors</strong><span>People credited alongside the commit author.</span></div>
                        </div>
                        {normalizeCommitCoAuthors(entry).length ? (
                            <ul className={styles.coAuthors}>
                                {normalizeCommitCoAuthors(entry).map(username => (
                                    <li key={username}>
                                        <UserLink username={username}><Avatar username={username} size={28} /></UserLink>
                                        <UserLink username={username}>{username}</UserLink>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${username}`}
                                            disabled={Boolean(manageBusy)}
                                            onClick={() => updateCoAuthors(
                                                normalizeCommitCoAuthors(entry).filter(item => item !== username)
                                            )}
                                        ><X size={15} /></button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className={styles.noCoAuthors}>No co-authors attached.</p>}
                        <form className={styles.addCollaborator} onSubmit={addCollaborator}>
                            <input
                                aria-label="Rotur username"
                                placeholder="Rotur username"
                                value={collaboratorName}
                                disabled={Boolean(manageBusy)}
                                onChange={event => setCollaboratorName(event.target.value)}
                            />
                            <Button
                                type="submit"
                                busy={manageBusy === 'coAuthors'}
                                busyLabel="Saving…"
                                disabled={Boolean(manageBusy) || !collaboratorName.trim()}
                            ><Plus size={15} /> Add</Button>
                        </form>
                    </section>
                    {manageError ? <p className={styles.manageError}>{manageError}</p> : null}
                </Modal>
            ) : null}
        </main>
    );
};

export default Commit;
