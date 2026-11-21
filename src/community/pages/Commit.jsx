import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {CircleDashed, GitCommitHorizontal, Plus, Settings2, X} from 'lucide-react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import api from '../api';
import {useResolvedProjectId, projectBaseUrl} from '../use-resolved-project-id.js';
import Avatar from '../components/Avatar.jsx';
import ChangesView from '../components/ChangesView.jsx';
import DiffView, {parseDiff} from '../components/DiffView.jsx';
import ProjectFiles from '../components/ProjectFiles.jsx';
import SpriteList from '../components/SpriteList.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import {tabPanelProps} from '../components/SectionTabs.jsx';
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
import {
    analyseChanges,
    describeTarget,
    findTarget,
    isChangesResponse,
    loadSpriteTexts,
    sidebarFilesFor
} from '../commit-changes.js';
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

const remixBaseFor = (project, sha) => ({
    enabled: Boolean(sha !== 'worktree' && project.remixParent && project.remixBaseCommit && project.gitHead === sha),
    projectId: project.remixParent,
    sha: project.remixBaseCommit,
    currentHead: project.gitHead
});

export const usableChanges = (changes, remixBase) => {
    if (!isChangesResponse(changes)) return null;
    const empty = !changes.targets.length && !(changes.files || []).length;
    if (empty && remixBase?.enabled) return null;
    return changes;
};

const loadChanges = async (id, sha, remixBase) => {
    try {
        return usableChanges(await api.commitChanges(id, sha), remixBase);
    } catch (error) {
        return null;
    }
};

const entryFromCommit = (inspected, sha, loadedProject = null) => {
    const metadata = inspected.commit || {};
    const isWorktree = sha === 'worktree';
    return {
        ...metadata,
        ...inspected,
        oid: inspected.oid || inspected.sha || sha,
        message: inspected.message || metadata.message || '',
        date: inspected.date || metadata.date || (isWorktree ? (loadedProject?.edited || 0) : 0),
        authorName: metadata.author?.name || metadata.author || (isWorktree ? (loadedProject?.owner || '') : ''),
        coAuthors: metadata.coAuthors || metadata.collaborators || []
    };
};

const Commit = () => {
    const {text: communityText} = useCommunityText();
    const {slug, sha} = useParams();
    const isWorktree = sha === 'worktree';
    const {projectId: id, resolving, resolveError} = useResolvedProjectId();
    const {user} = useUser();
    const viewer = user?.username || '';
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [project, setProject] = useState(null);
    const [loadedContext, setLoadedContext] = useState('');
    const [entry, setEntry] = useState(null);
    const [diff, setDiff] = useState(null);
    const [changes, setChanges] = useState(null);
    const [lineDiffError, setLineDiffError] = useState('');
    const [thumbTexts, setThumbTexts] = useState(null);
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
        setLoadProgress({progress: 8, label: isWorktree ? 'Finding uncommitted changes' : 'Finding this commit'});
        try {
            const projectData = await api.getProject(id);
            if (contextRef.current !== context) return;
            if (!canViewProjectSource(projectData.project || projectData)) {
                throw new Error('You do not have permission to view commits for this project.');
            }
            const coAuthorsPromise = isWorktree ?
                Promise.resolve(null) :
                api.commitCoAuthors(id, sha).catch(() => null);
            const loadedProject = projectData.project || projectData;
            const remixBase = remixBaseFor(loadedProject, sha);
            setLoadProgress({progress: 24, label: isWorktree ? 'Reading uncommitted changes' : 'Reading commit'});
            const structured = await loadChanges(id, sha, remixBase);
            if (contextRef.current !== context) return;
            let inspected = structured;
            if (!structured) {
                const remoteInspection = await api.commitInspection(id, sha);
                if (contextRef.current !== context) return;
                setLoadProgress({progress: 34, label: 'Reading project details'});
                inspected = await loadCommitInspection({
                    apiClient: api,
                    projectId: id,
                    sha,
                    inspection: remoteInspection,
                    onProgress: next => {
                        if (contextRef.current === context) setLoadProgress(next);
                    },
                    remixBase
                });
                if (contextRef.current !== context) return;
            }
            const metadata = inspected.commit || {};
            setProject(loadedProject);
            setLoadedContext(context);
            setEntry(entryFromCommit(inspected, sha, loadedProject));
            setChanges(structured);
            setDiff(structured ? null : (inspected.diff || 'No textual changes.'));
            setPageMeta({
                title: isWorktree ?
                    communityText('Uncommitted changes · {value1}', {value1: loadedProject.title}) :
                    communityText('{value1} · Commit', {value1: metadata.message || sha.slice(0, 7)})
            });
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
    }, [id, isWorktree, sha, viewer]);

    useEffect(() => {
        setProject(null);
        setEntry(null);
        setDiff(null);
        setChanges(null);
        setLineDiffError('');
        setThumbTexts(null);
        setActiveSprite('');
        setLoadProgress({progress: 8, label: 'Finding this commit'});
        load();
    }, [load]);

    const files = useMemo(() => parseDiff(diff), [diff]);
    const fileTexts = useMemo(() => ({
        ...textsFromInspectionFiles(entry?.files || []),
        ...entry?.fileTexts
    }), [entry]);
    const analysis = useMemo(() => (changes ? analyseChanges(changes) : null), [changes]);
    const sidebarFiles = useMemo(() => sidebarFilesFor(analysis), [analysis]);
    const describeSprite = useCallback(
        sprite => {
            const target = findTarget(analysis, sprite.name);
            return target ? describeTarget(target, communityText) : '';
        },
        [analysis, communityText]
    );
    const labelSprite = useCallback(sprite => findTarget(analysis, sprite.name)?.name || sprite.name, [analysis]);
    const changeCount = useMemo(() => (analysis ? analysis.targets.reduce(
        (total, target) => total + target.count,
        analysis.others.length
    ) : 0), [analysis]);
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
    const viewParam = searchParams.get('view');
    const fileView = viewParam === 'files';
    const lineView = Boolean(changes) && viewParam === 'lines';
    const activeView = fileView ? 'files' : lineView ? 'lines' : 'changes';
    const historicalPath = searchParams.get('path') || '';
    const showDiff = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('view');
        next.delete('path');
        setSearchParams(next);
    };
    const showLines = () => {
        const next = new URLSearchParams(searchParams);
        next.set('view', 'lines');
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

    useEffect(() => {
        if (!lineView || diff !== null || lineDiffError || !project) return () => {};
        let active = true;
        (async () => {
            try {
                const inspected = await loadCommitInspection({
                    apiClient: api,
                    projectId: id,
                    sha,
                    remixBase: remixBaseFor(project, sha)
                });
                if (!active) return;
                setEntry(current => (current ? {...current, fileTexts: inspected.fileTexts} : current));
                setDiff(inspected.diff || 'No textual changes.');
            } catch (loadError) {
                if (active) setLineDiffError(loadError.message || 'Could not load the file diff.');
            }
        })();
        return () => {
            active = false;
        };
    }, [lineView, diff, lineDiffError, project, id, sha]);

    useEffect(() => {
        if (!analysis) return () => {};
        let active = true;
        loadSpriteTexts(analysis, async path => {
            const result = await api.commitFile(id, sha, path);
            return new TextDecoder().decode(base64ToBytes(result.content || ''));
        }).then(texts => {
            if (active) setThumbTexts(texts);
        });
        return () => {
            active = false;
        };
    }, [analysis, id, sha]);

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
                <PageHeader
                    compact
                    backTo={`${baseUrl}#history`}
                    backLabel={communityText('Back to project')}
                    icon={isWorktree ? CircleDashed : GitCommitHorizontal}
                    title={isWorktree ? communityText('Uncommitted changes') : communityText('Commit')}
                />
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

    const filesTabLabel = isWorktree ? communityText('Working files') : communityText('Files at this commit');

    return (
        <main className={styles.page}>
            <PageHeader
                compact
                backTo={`${baseUrl}#history`}
                backLabel={project.title}
                icon={isWorktree ? CircleDashed : GitCommitHorizontal}
                title={isWorktree ? communityText('Uncommitted changes') : (entry.message || communityText('Untitled commit'))}
                actions={!isWorktree && canManageCommit(project) ? (
                    <Button onClick={openManage}><Settings2 size={14} />{communityText('Manage')}</Button>
                ) : null}
            >
                <div className={styles.meta}>
                    {isWorktree ? (
                        <span className={styles.uncommittedBadge}>
                            <CircleDashed size={13} aria-hidden="true" />
                            {communityText('Not committed')}
                        </span>
                    ) : null}
                    {entry.authorName ? (
                        <React.Fragment>
                            <UserLink username={entry.authorName}><Avatar username={entry.authorName} size={26} /></UserLink>
                            <UserLink username={entry.authorName}><strong>{entry.authorName}</strong></UserLink>
                        </React.Fragment>
                    ) : null}
                    {isWorktree ? (
                        <span>
                            {entry.date ?
                                communityText('saved without committing {value1}', {value1: formatDateTime(entry.date)}) :
                                communityText('saved without committing')}
                        </span>
                    ) : (
                        <span>{communityText('committed {value1}', {value1: formatDateTime(entry.date || (entry.commit.author?.timestamp * 1000))})}</span>
                    )}
                    {!isWorktree && normalizeCommitCoAuthors(entry).length ? (
                        <span className={styles.credited}>{communityText('co-authored by')}{' '}{normalizeCommitCoAuthors(entry).map((username, index) => (
                            <React.Fragment key={username}>
                                {index ? ', ' : ''}<UserLink username={username}>{username}</UserLink>
                            </React.Fragment>
                        ))}
                        </span>
                    ) : null}
                    <code>{isWorktree ? (entry.parent ? entry.parent.slice(0, 7) : communityText('Working copy')) : entry.oid}</code>
                </div>
                <UnderlineTabs
                    items={changes ? [
                        {key: 'changes', label: changeCount ? <>{communityText('Changes')} <b>{changeCount}</b></> : communityText('Changes')},
                        {key: 'lines', label: communityText('File diff')},
                        {key: 'files', label: filesTabLabel}
                    ] : [
                        {key: 'changes', label: <>{communityText('Changes')} <b>{files.length}</b></>},
                        {key: 'files', label: filesTabLabel}
                    ]}
                    value={activeView}
                    onChange={key => {
                        if (key === 'files') showFiles(historicalPath);
                        else if (key === 'lines') showLines();
                        else showDiff();
                    }}
                    ariaLabel="Commit views"
                    idPrefix="commit"
                />
            </PageHeader>
            <div {...tabPanelProps('commit', activeView)}>
                {fileView ? (
                    <ProjectFiles
                        bounded
                        project={{...project, gitHead: sha}}
                        initialPath={historicalPath}
                        onSelectPath={selectHistoricalFile}
                    />
                ) : changes && !lineView ? (
                    <div className={styles.layout}>
                        <SpriteList
                            files={sidebarFiles}
                            fileTexts={thumbTexts || {}}
                            loadAsset={thumbTexts ? loadCommitAsset : null}
                            activeSprite={activeSprite}
                            describe={describeSprite}
                            labelOf={labelSprite}
                            onSelect={name => setActiveSprite(current => (current === name ? '' : name))}
                        />
                        <section className={styles.diff}>
                            <ChangesView
                                analysis={analysis}
                                spriteFilter={activeSprite}
                                loadAsset={loadCommitAsset}
                                onOpenFile={showFiles}
                                onShowLines={showLines}
                            />
                        </section>
                    </div>
                ) : lineView && lineDiffError ? (
                    <StatusMessage error onRetry={() => setLineDiffError('')}>{lineDiffError}</StatusMessage>
                ) : lineView && diff === null ? (
                    <StatusMessage>{communityText('Loading diff…')}</StatusMessage>
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
                ) : (
                    <EmptyState icon={isWorktree ? CircleDashed : GitCommitHorizontal} title={communityText('No files changed')}>
                        {isWorktree ?
                            communityText('There are no uncommitted changes.') :
                            communityText('This commit did not change any files.')}
                    </EmptyState>
                )}
            </div>
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
