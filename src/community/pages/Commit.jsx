import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {GitCommitHorizontal, Plus, Settings2, X} from 'lucide-react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import api from '../api.js';
import {useResolvedProjectId, projectBaseUrl} from '../use-resolved-project-id.js';
import Avatar from '../components/Avatar.jsx';
import DiffView, {parseDiff} from '../components/DiffView.jsx';
import ProjectFiles from '../components/ProjectFiles.jsx';
import SpriteList from '../components/SpriteList.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import UserLink from '../components/UserLink.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import {base64ToBytes, inlineDataToBytes, mediaTypeForAssetPath} from '../asset-media.js';
import {textsFromInspectionFiles} from '../fractch-summary.js';
import {formatDateTime} from '../format.js';
import setPageMeta from '../page-meta.js';
import {loadCommitInspection} from '../commit-diff.js';
import {canViewProjectSource} from '../project-source-access.js';
import {useUser} from '../UserContext.jsx';
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
    const {text: communityText} = useCommunityText();
    const {slug, sha} = useParams();
    const {projectId: id, resolving, resolveError} = useResolvedProjectId();
    const {user} = useUser();
    const viewer = user?.username || '';
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [project, setProject] = useState(null);
    const [loadedContext, setLoadedContext] = useState('');
    const [entry, setEntry] = useState(null);
    const [diff, setDiff] = useState(null);
    const [activeSprite, setActiveSprite] = useState('');
    const [error, setError] = useState('');
    const [manageOpen, setManageOpen] = useState(false);
    const [collaboratorName, setCollaboratorName] = useState('');
    const [manageBusy, setManageBusy] = useState('');
    const [manageError, setManageError] = useState('');
    const [loadProgress, setLoadProgress] = useState({progress: 8, label: 'Finding this commit'});
    const contextRef = useRef(`${viewer}:${id}:${sha}`);
    contextRef.current = `${viewer}:${id}:${sha}`;

    const load = useCallback(async () => {
        if (!id) return;
        const context = `${viewer}:${id}:${sha}`;
        setError('');
        setLoadProgress({progress: 8, label: 'Finding this commit'});
        try {
            const projectData = await api.getProject(id);
            if (contextRef.current !== context) return;
            if (!canViewProjectSource(projectData.project || projectData)) {
                throw new Error('You do not have permission to view commits for this project.');
            }
            const coAuthorsPromise = api.commitCoAuthors(id, sha).catch(() => null);
            const remoteInspection = await api.commitInspection(id, sha);
            if (contextRef.current !== context) return;
            setLoadProgress({progress: 34, label: 'Reading project details'});
            const loadedProject = projectData.project || projectData;
            const inspected = await loadCommitInspection({
                apiClient: api,
                projectId: id,
                sha,
                inspection: remoteInspection,
                onProgress: next => {
                    if (contextRef.current === context) setLoadProgress(next);
                },
                remixBase: {
                    enabled: Boolean(
                        loadedProject.remixParent &&
                        loadedProject.remixBaseCommit &&
                        loadedProject.gitHead === sha
                    ),
                    projectId: loadedProject.remixParent,
                    sha: loadedProject.remixBaseCommit,
                    currentHead: loadedProject.gitHead
                }
            });
            if (contextRef.current !== context) return;
            const metadata = inspected.commit || {};
            setProject(loadedProject);
            setLoadedContext(context);
            setEntry({
                ...metadata,
                ...inspected,
                message: inspected.message || metadata.message || '',
                date: inspected.date || metadata.date || 0,
                authorName: metadata.author?.name || metadata.author || '',
                coAuthors: metadata.coAuthors || metadata.collaborators || []
            });
            setDiff(inspected.diff || 'No textual changes.');
            setPageMeta({title: `${metadata.message || sha.slice(0, 7)} · Commit`});
            coAuthorsPromise.then(coAuthorData => {
                if (!coAuthorData || contextRef.current !== context) return;
                setEntry(current => (current ? ({
                    ...current,
                    coAuthors: coAuthorData.coAuthors || coAuthorData.collaborators || current.coAuthors
                }) : current));
            });
        } catch (loadError) {
            if (contextRef.current === context) setError(loadError.message || 'Could not load this commit.');
        }
    }, [id, sha, viewer]);

    useEffect(() => {
        setProject(null);
        setEntry(null);
        setDiff(null);
        setActiveSprite('');
        setLoadProgress({progress: 8, label: 'Finding this commit'});
        load();
    }, [load]);

    const files = useMemo(() => parseDiff(diff), [diff]);
    const fileTexts = useMemo(() => ({
        ...textsFromInspectionFiles(entry?.files || []),
        ...entry?.fileTexts
    }), [entry]);
    const assetMeta = useMemo(() => {
        const meta = new Map();
        for (const change of entry?.files || []) meta.set(change.path, change);
        return meta;
    }, [entry]);
    const commitParent = entry?.parent || '';
    const commitParentProject = entry?.parentProjectId || id;
    const loadCommitAsset = useCallback(async (side, path) => {
        const inline = side === 'old' ? assetMeta.get(path)?.oldData : assetMeta.get(path)?.newData;
        const inlineBytes = inlineDataToBytes(inline);
        if (inlineBytes && inlineBytes.length) {
            return {bytes: inlineBytes, mediaType: mediaTypeForAssetPath(path)};
        }
        const target = side === 'old' ?
            {projectId: commitParentProject, sha: commitParent} :
            {projectId: id, sha};
        if (!target.sha) return null;
        const result = await api.commitFile(target.projectId, target.sha, path);
        return {bytes: base64ToBytes(result.content || ''), mediaType: mediaTypeForAssetPath(path)};
    }, [assetMeta, commitParent, commitParentProject, id, sha]);
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

    const baseUrl = projectBaseUrl({project, projectId: id, vanitySlug: slug});

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
                navigate(`${baseUrl}/commits/${encodeURIComponent(nextSha)}${query ? `?${query}` : ''}`, {
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
            setManageError(communityText('{value1} is already attached to this commit.', {value1: name}));
            return;
        }
        setCollaboratorName('');
        updateCoAuthors([...coAuthors, name]);
    };

    if (resolveError) {
        return (
            <main className={styles.page}>
                <StatusMessage error>{resolveError}</StatusMessage>
            </main>
        );
    }
    if (error) {
        return (
            <main className={styles.page}>
                <PageHeader compact backTo={`${baseUrl}#history`} backLabel={communityText('Back to project')} icon={GitCommitHorizontal} title={communityText('Commit')} />
                <StatusMessage error onRetry={load}>{error}</StatusMessage>
            </main>
        );
    }
    if (!project || !entry || loadedContext !== `${viewer}:${id}:${sha}`) {
        if (resolving || !id) {
            return (
                <main className={styles.page}>
                    <section className={styles.loadingCard} aria-live="polite" aria-busy="true">
                        <div className={styles.loadingCopy}>
                            <h1>{communityText('Finding project…')}</h1>
                        </div>
                    </section>
                </main>
            );
        }
        return (
            <main className={styles.page}>
                <section className={styles.loadingCard} aria-live="polite" aria-busy="true">
                    <div className={styles.loadingCopy}>
                        <h1>{loadProgress.label}</h1>
                    </div>
                    <div
                        className={styles.loadingTrack}
                        role="progressbar"
                        aria-label={communityText('Commit loading progress')}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={loadProgress.progress}
                    >
                        <span style={{width: `${loadProgress.progress}%`}} />
                    </div>
                    <small>{loadProgress.progress}%</small>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <PageHeader
                compact
                backTo={`${baseUrl}#history`}
                backLabel={project.title}
                icon={GitCommitHorizontal}
                title={entry.message || communityText('Untitled commit')}
                actions={canManageCommit(project) ? (
                    <Button onClick={openManage}><Settings2 size={14} />{communityText('Manage')}</Button>
                ) : null}
            >
                <div className={styles.meta}>
                    <UserLink username={entry.authorName}><Avatar username={entry.authorName} size={26} /></UserLink>
                    <UserLink username={entry.authorName}><strong>{entry.authorName}</strong></UserLink>
                    <span>{communityText('committed {value1}', {value1: formatDateTime(entry.date || (entry.commit.author?.timestamp * 1000))})}</span>
                    {normalizeCommitCoAuthors(entry).length ? (
                        <span className={styles.credited}>{communityText('co-authored by')}{' '}{normalizeCommitCoAuthors(entry).map((username, index) => (
                            <React.Fragment key={username}>
                                {index ? ', ' : ''}<UserLink username={username}>{username}</UserLink>
                            </React.Fragment>
                        ))}
                        </span>
                    ) : null}
                    <code>{entry.oid}</code>
                </div>
                <UnderlineTabs
                    items={[
                        {key: 'changes', label: <>{communityText('Changes')} <b>{files.length}</b></>},
                        {key: 'files', label: communityText('Files at this commit')}
                    ]}
                    value={fileView ? 'files' : 'changes'}
                    onChange={key => (key === 'files' ? showFiles(historicalPath) : showDiff())}
                    ariaLabel="Commit views"
                />
            </PageHeader>
            {fileView ? (
                <ProjectFiles
                    bounded
                    project={{...project, gitHead: sha}}
                    initialPath={historicalPath}
                    onSelectPath={selectHistoricalFile}
                />
            ) : files.length ? (
                <div className={styles.layout}>
                    <SpriteList
                        files={files}
                        fileTexts={fileTexts}
                        loadAsset={loadCommitAsset}
                        activeSprite={activeSprite}
                        onSelect={name => setActiveSprite(current => (current === name ? '' : name))}
                    />
                    <section className={styles.diff}><DiffView diff={diff} spriteFilter={activeSprite} onOpenFile={showFiles} loadAsset={loadCommitAsset} fileTexts={fileTexts} /></section>
                </div>
            ) : <EmptyState icon={GitCommitHorizontal} title={communityText('No files changed')}>{communityText('This commit did not change any files.')}</EmptyState>}
            {manageOpen ? (
                <Modal
                    className={styles.manageModal}
                    title={communityText('Commit co-authors')}
                    icon={Settings2}
                    dismissDisabled={Boolean(manageBusy)}
                    onClose={() => setManageOpen(false)}
                >
                    <section className={styles.manageSection}>
                        <div className={styles.manageSectionHead}>
                            <div><strong>{communityText('Co-authors')}</strong><span>{communityText('People credited alongside the commit author.')}</span></div>
                        </div>
                        {normalizeCommitCoAuthors(entry).length ? (
                            <ul className={styles.coAuthors}>
                                {normalizeCommitCoAuthors(entry).map(username => (
                                    <li key={username}>
                                        <UserLink username={username}><Avatar username={username} size={28} /></UserLink>
                                        <UserLink username={username}>{username}</UserLink>
                                        <button
                                            type="button"
                                            aria-label={communityText('Remove {value1}', {value1: username})}
                                            disabled={Boolean(manageBusy)}
                                            onClick={() => updateCoAuthors(
                                                normalizeCommitCoAuthors(entry).filter(item => item !== username)
                                            )}
                                        ><X size={15} /></button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className={styles.noCoAuthors}>{communityText('No co-authors attached.')}</p>}
                        <form className={styles.addCollaborator} onSubmit={addCollaborator}>
                            <input
                                aria-label={communityText('Rotur username')}
                                placeholder={communityText('Rotur username')}
                                value={collaboratorName}
                                disabled={Boolean(manageBusy)}
                                onChange={event => setCollaboratorName(event.target.value)}
                            />
                            <Button
                                type="submit"
                                busy={manageBusy === 'coAuthors'}
                                busyLabel={communityText('Saving…')}
                                disabled={Boolean(manageBusy) || !collaboratorName.trim()}
                            ><Plus size={15} />{communityText('Add')}</Button>
                        </form>
                    </section>
                    {manageError ? <Notice variant="error" className={styles.manageNotice}>{manageError}</Notice> : null}
                </Modal>
            ) : null}
        </main>
    );
};

export default Commit;
