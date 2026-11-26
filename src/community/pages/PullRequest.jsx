import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {
    Check, ChevronRight, FileCode2, GitCommitHorizontal,
    GitMerge, GitPullRequest, MessageSquare, Trash2
} from 'lucide-react';
import api, {projectUrl} from '../api';
import {useResolvedProjectId, projectBaseUrl} from '../use-resolved-project-id.js';
import ChangesView from '../components/ChangesView.jsx';
import DiffView, {parseDiff} from '../components/DiffView.jsx';
import SpriteList from '../components/SpriteList.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import {tabPanelProps} from '../components/SectionTabs.jsx';
import RichText from '../components/RichText.jsx';
import UserLink from '../components/UserLink.jsx';
import {canMaintainProject, canViewProjectSource} from '../project-source-access.js';
import {useUser} from '../UserContext.jsx';
import {formatDate, timeAgo} from '../format.js';
import setPageMeta from '../page-meta.js';
import {buildCommitDiffFromInspection, loadCommitFileTexts, withFileCache} from '../commit-diff.js';
import {
    analyseChanges,
    describeTarget,
    findTarget,
    isChangesResponse,
    loadSpriteTexts,
    sidebarFilesFor
} from '../commit-changes.js';
import {base64ToBytes, mediaTypeForAssetPath} from '../asset-media.js';
import {buildProjectArtifactsFromFileEntries} from '../../lib/git/mwp.js';
import MergeConflicts from '../components/MergeConflicts.jsx';
import {
    materializeMerge,
    resolvedMergeFiles,
    unresolvedBinaryConflict,
    unresolvedTextConflict,
    withBinaryChoice,
    withTextResolution
} from '../merge-session.js';
import styles from './PullRequest.module.css';
import {session as sessionStore} from '../../modules/storage';

const PULL_DIFF_CACHE_PREFIX = 'mw:pull-diff:';
const PULL_DIFF_CACHE_MAX_ENTRIES = 6;
const PULL_DIFF_CACHE_MAX_BYTES = 8 * 1024 * 1024;
const PULL_DIFF_ENTRY_MAX_BYTES = 2 * 1024 * 1024;
const pullDiffCacheKey = pull => {
    const session = api.loadSession() || 'anonymous';
    return `${PULL_DIFF_CACHE_PREFIX}${session}:${pull.targetProjectId}:${pull.currentTargetHead || pull.baseCommit}:${pull.headCommit}`;
};
export const readPullDiffCacheEntry = pull => {
    const raw = sessionStore.readString(pullDiffCacheKey(pull));
    if (raw === null) return null;
    try {
        const cached = JSON.parse(raw);
        if (typeof cached.diff !== 'string') return {diff: raw, refs: null, fileTexts: null};
        return {
            diff: cached.diff,
            refs: cached.refs && typeof cached.refs === 'object' ? cached.refs : null,
            fileTexts: cached.fileTexts && typeof cached.fileTexts === 'object' ? cached.fileTexts : null
        };
    } catch (error) {
        return {diff: raw, refs: null, fileTexts: null};
    }
};
export const readPullDiffCache = pull => {
    const entry = readPullDiffCacheEntry(pull);
    return entry ? entry.diff : null;
};
export const writePullDiffCache = (pull, diff, refs = null, fileTexts = {}) => {
    if (diff.length * 2 > PULL_DIFF_ENTRY_MAX_BYTES) return;
    const textsFit = (JSON.stringify(fileTexts || {}).length + diff.length) * 2 <= PULL_DIFF_ENTRY_MAX_BYTES;
    const stored = {at: Date.now(), diff, refs, fileTexts: textsFit ? fileTexts : null};
    if (!sessionStore.writeJSON(pullDiffCacheKey(pull), stored)) return;
    const entries = [];
    for (const key of sessionStore.keys()) {
        if (!key.startsWith(PULL_DIFF_CACHE_PREFIX)) continue;
        const value = sessionStore.readString(key) || '';
        let at = 0;
        try {
            at = Number(JSON.parse(value).at) || 0;
        } catch (error) {
            // Old cache entries have no timestamp and get removed first.
        }
        entries.push({key, at, bytes: value.length * 2});
    }
    entries.sort((a, b) => b.at - a.at);
    let bytes = 0;
    entries.forEach((entry, index) => {
        bytes += entry.bytes;
        if (index >= PULL_DIFF_CACHE_MAX_ENTRIES || bytes > PULL_DIFF_CACHE_MAX_BYTES) {
            sessionStore.remove(entry.key);
        }
    });
};

export const pullMergeUpload = (data, pullIndex, artifacts) => ({
    sb3: artifacts.sb3,
    mergeTree: artifacts.tree,
    expectedHead: data.expectedHead,
    pullId: pullIndex,
    sourceHead: data.sourceHead
});

const RESTART_MERGE_CODES = ['head_changed', 'pull_head_changed', 'pull_not_open', 'target_branch_missing'];

export const pullMergeFailure = (error, communityText, fallback) => {
    const restart = RESTART_MERGE_CODES.includes(error?.code);
    if (error?.code === 'uncommitted_changes') {
        return {restart, message: communityText('Commit the changes saved in this project before merging this pull request.')};
    }
    if (error?.code === 'target_branch_changed' && error.data?.branch) {
        return {restart, message: communityText('Switch this project to the {value1} branch before merging this pull request.', {value1: error.data.branch})};
    }
    if (error?.code === 'target_branch_missing' && error.data?.branch) {
        return {restart, message: communityText('This pull request targets the {value1} branch, which no longer exists. Close it and open a new one.', {value1: error.data.branch})};
    }
    if (error?.code === 'pull_head_changed') {
        return {restart, message: communityText('The remix changed while you were merging. Review the new changes, then merge again.')};
    }
    if (error?.code === 'head_changed') {
        return {restart, message: communityText('This project changed while you were merging. Merge again to include the latest changes.')};
    }
    if (error?.code === 'pull_not_open' || (error?.status === 404 && error?.message === 'open pull request not found')) {
        return {restart: true, message: communityText('This pull request was closed or merged while you were merging.')};
    }
    if (error?.code === 'pull_merge_unavailable') {
        return {restart, message: communityText('This pull request cannot be merged because the two histories could not be compared.')};
    }
    if (error?.code === 'pull_not_closed') {
        return {restart: true, message: communityText('The project saved, but the pull request could not be marked as merged. Reload the page to check its state.')};
    }
    if (error?.status === 403) {
        return {restart: true, message: communityText('Only project owners and maintainers can merge this pull request, and only while they can see inside the remix.')};
    }
    if (error?.status === 404) {
        return {restart: true, message: fallback};
    }
    return {restart, message: error?.message || fallback};
};

export const shouldLoadPullDiff = ({tab, pull, diff, diffError, changes = null, fileDiff = false}) => (
    tab === 'files' && Boolean(pull) && diff === null && !diffError && (!changes || fileDiff)
);

const loadPullChanges = async (id, index) => {
    try {
        const data = await api.pullChanges(id, index);
        return isChangesResponse(data?.inspection) ? {inspection: data.inspection, pull: data.pull || null} : null;
    } catch (error) {
        return null;
    }
};

export const pullAssetRefs = (pull, id) => ({
    oldProject: pull.targetProjectId || id,
    oldSha: pull.baseCommit || '',
    newProject: pull.sourceProjectId || id,
    newSha: pull.headCommit || '',
    pullIndex: pull.index,
    pullTarget: pull.targetProjectId || ''
});

export const pullApiFor = (apiClient, data) => ({
    commitFile: (projectId, sha, path) => apiClient.commitFile(
        projectId,
        sha,
        path,
        data.pull.index,
        data.targetProjectId || data.pull.targetProjectId
    )
});

export const buildPullRequestDiff = (apiClient, data) => {
    if (!data.inspection) throw new Error('The server did not return pull request changes.');
    return buildCommitDiffFromInspection({
        apiClient: pullApiFor(apiClient, data),
        projectId: data.sourceProjectId || data.pull.sourceProjectId,
        sha: data.pull.headCommit,
        inspection: data.inspection,
        parentProjectId: data.targetProjectId || data.pull.targetProjectId
    });
};

export const buildPullRequestFileTexts = (apiClient, data) => {
    if (!data.inspection) throw new Error('The server did not return pull request changes.');
    return loadCommitFileTexts({
        apiClient: pullApiFor(apiClient, data),
        projectId: data.sourceProjectId || data.pull.sourceProjectId,
        sha: data.pull.headCommit,
        inspection: data.inspection,
        parentProjectId: data.targetProjectId || data.pull.targetProjectId
    });
};

export const canMergePullRequest = canMaintainProject;

const canMergePull = (pull, project) => Boolean(
    pull && (typeof pull.canMerge === 'boolean' ? pull.canMerge : canMergePullRequest(project))
);

const isPullBranchBlocked = (pull, project) => Boolean(
    pull?.state === 'open' && canMergePull(pull, project) && pull.baseBranch &&
    (pull.baseBranchMissing || (project?.gitBranch && pull.baseBranch !== project.gitBranch))
);

export const canClosePullRequest = (project, pull, user) => {
    if (typeof pull?.canClose === 'boolean') return pull.canClose;
    if (canMergePullRequest(project)) return true;
    return Boolean(user?.username && pull?.sourceOwner &&
        user.username.toLowerCase() === pull.sourceOwner.toLowerCase());
};

const PullRequest = () => {
    const {text: communityText} = useCommunityText();
    const {index, slug} = useParams();
    const {projectId: id, resolving, resolveError} = useResolvedProjectId();
    const {user, login} = useUser();
    const viewer = user?.username || '';
    const [project, setProject] = useState(null);
    const [loadedContext, setLoadedContext] = useState('');
    const [pull, setPull] = useState(null);
    const [diff, setDiff] = useState(null);
    const [fileTexts, setFileTexts] = useState({});
    const [changes, setChanges] = useState(null);
    const [spriteTexts, setSpriteTexts] = useState(null);
    const [fileDiff, setFileDiff] = useState(false);
    const [assetRefs, setAssetRefs] = useState(null);
    const [timeline, setTimeline] = useState({comments: [], commits: [], targetCommits: []});
    const [tab, setTab] = useState('conversation');
    const [activeSprite, setActiveSprite] = useState('');
    const [loadingError, setLoadingError] = useState('');
    const [diffError, setDiffError] = useState('');
    const [mergeError, setMergeError] = useState('');
    const [merging, setMerging] = useState(false);
    const [mergeSession, setMergeSession] = useState(null);
    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const [closeError, setCloseError] = useState('');
    const [commentText, setCommentText] = useState('');
    const [commentBusy, setCommentBusy] = useState(false);
    const [commentError, setCommentError] = useState('');
    const contextRef = useRef(`${viewer}:${id}:${index}`);
    const diffRequestRef = useRef('');
    const diffGenerationRef = useRef(0);
    contextRef.current = `${viewer}:${id}:${index}`;

    const loadDiff = useCallback(async (activePull, context, wantFileDiff = false, targetHead = '') => {
        if (contextRef.current !== context || loadedContext !== context) return;
        const token = `${diffGenerationRef.current}:${context}:${activePull.headCommit || ''}:${targetHead}:${wantFileDiff ? 'file' : 'summary'}`;
        if (diffRequestRef.current === token) return;
        diffRequestRef.current = token;
        const current = () => contextRef.current === context && diffRequestRef.current === token;
        const finish = () => {
            if (diffRequestRef.current === token) diffRequestRef.current = '';
        };
        setAssetRefs(pullAssetRefs(activePull, id));
        if (!wantFileDiff) {
            setDiffError('');
            const structured = await loadPullChanges(id, index);
            if (!current()) return;
            if (structured) {
                if (structured.pull) setAssetRefs(pullAssetRefs({...activePull, ...structured.pull}, id));
                setChanges(structured.inspection);
                finish();
                return;
            }
        }
        const cacheKeyPull = {...activePull, currentTargetHead: targetHead};
        const cached = readPullDiffCacheEntry(cacheKeyPull);
        if (cached !== null && cached.refs && cached.refs.newSha === (activePull.headCommit || '') && (!wantFileDiff || cached.fileTexts)) {
            setAssetRefs(cached.refs);
            setDiff(cached.diff);
            setFileTexts(cached.fileTexts || {});
            finish();
            return;
        }
        setDiffError('');
        try {
            const diffData = await api.pullDiff(id, index);
            const cachingApi = withFileCache(api);
            const [nextDiff, nextTexts] = await Promise.all([
                buildPullRequestDiff(cachingApi, diffData),
                buildPullRequestFileTexts(cachingApi, diffData)
            ]);
            const renderedDiff = nextDiff || 'No textual changes.';
            const refs = pullAssetRefs({...activePull, ...(diffData.pull || {})}, id);
            if (current()) {
                writePullDiffCache(cacheKeyPull, renderedDiff, refs, nextTexts);
                setAssetRefs(refs);
                setDiff(renderedDiff);
                setFileTexts(nextTexts);
            }
        } catch (error) {
            if (current()) {
                setDiffError(error?.code === 'pull_history_unavailable' ?
                    communityText('The changes in this pull request could not be compared with the project.') :
                    (error.message || communityText('Could not load these file changes.')));
            }
        } finally {
            finish();
        }
    }, [id, index, loadedContext]);

    const load = useCallback(async () => {
        if (!id) return;
        const context = `${viewer}:${id}:${index}`;
        setLoadingError('');
        try {
            const projectData = await api.getProject(id);
            if (contextRef.current !== context) return;
            if (!canViewProjectSource(projectData.project || projectData)) {
                throw new Error('You do not have permission to view changes for this project.');
            }
            const pullData = await api.getPull(id, index);
            if (contextRef.current !== context) return;
            if (pullData.pull.canInspect === false) {
                throw new Error('You do not have access to these changes.');
            }
            const sourceData = await api.getProject(pullData.pull.sourceProjectId);
            if (contextRef.current !== context) return;
            if (!canViewProjectSource(sourceData.project || sourceData)) {
                throw new Error('You do not have access to the source project.');
            }
            const timelineData = await api.pullTimeline(id, index);
            if (contextRef.current !== context) return;
            setProject(projectData.project || projectData);
            setLoadedContext(context);
            setPull(pullData.pull);
            setTimeline({
                comments: timelineData.comments || [],
                commits: timelineData.commits || [],
                targetCommits: timelineData.targetCommits || []
            });
            setPageMeta({title: communityText('{title} · Pull request #{index}', {title: pullData.pull.title, index: pullData.pull.index})});
            return {pull: pullData.pull, project: projectData.project || projectData};
        } catch (error) {
            if (contextRef.current === context) {
                setLoadingError(error.message || 'Could not load this pull request.');
            }
        }
        return null;
    }, [id, index, viewer]);

    const refreshProject = useCallback(async () => {
        const context = `${viewer}:${id}:${index}`;
        const projectData = await api.getProject(id).catch(() => null);
        if (!projectData || contextRef.current !== context) return null;
        const nextProject = projectData.project || projectData;
        setProject(nextProject);
        return nextProject;
    }, [id, index, viewer]);

    const gateRefreshRef = useRef(null);
    const refreshGate = useCallback(() => {
        if (gateRefreshRef.current) return gateRefreshRef.current;
        const context = `${viewer}:${id}:${index}`;
        const refresh = Promise.all([api.getPull(id, index), api.getProject(id)])
            .then(([pullData, projectData]) => {
                if (contextRef.current !== context || !pullData?.pull || pullData.pull.canInspect === false) return;
                setProject(projectData.project || projectData);
                setPull(pullData.pull);
            })
            .catch(() => null)
            .then(() => {
                if (gateRefreshRef.current === refresh) gateRefreshRef.current = null;
            });
        gateRefreshRef.current = refresh;
        return refresh;
    }, [id, index, viewer]);

    const canMerge = canMergePull(pull, project);
    const branchBlocked = isPullBranchBlocked(pull, project);
    const gateNoteNodeRef = useRef(null);
    const focusGateRef = useRef(false);
    const gateNoteRef = useCallback(node => {
        gateNoteNodeRef.current = node;
        if (node && focusGateRef.current) {
            focusGateRef.current = false;
            node.focus();
        }
    }, []);
    const focusGateNote = () => {
        if (gateNoteNodeRef.current) {
            focusGateRef.current = false;
            gateNoteNodeRef.current.focus();
            return;
        }
        focusGateRef.current = true;
    };
    useEffect(() => () => {
        contextRef.current = '';
    }, []);
    useEffect(() => {
        if (branchBlocked) setMergeError('');
    }, [branchBlocked]);
    useEffect(() => {
        if (!branchBlocked) return;
        const onReturn = () => {
            if (document.visibilityState !== 'hidden') refreshGate();
        };
        window.addEventListener('focus', onReturn);
        document.addEventListener('visibilitychange', onReturn);
        return () => {
            window.removeEventListener('focus', onReturn);
            document.removeEventListener('visibilitychange', onReturn);
        };
    }, [branchBlocked, refreshGate]);

    useEffect(() => {
        gateRefreshRef.current = null;
        focusGateRef.current = false;
        setProject(null);
        setPull(null);
        setDiff(null);
        setFileTexts({});
        setChanges(null);
        setSpriteTexts(null);
        setFileDiff(false);
        setAssetRefs(null);
        setTimeline({comments: [], commits: [], targetCommits: []});
        setTab('conversation');
        setActiveSprite('');
        setMerging(false);
        setMergeSession(null);
        setMergeError('');
        setCloseConfirmOpen(false);
        setClosing(false);
        setCloseError('');
        setDiffError('');
        setCommentText('');
        setCommentBusy(false);
        setCommentError('');
        load();
    }, [load]);

    useEffect(() => {
        if (!shouldLoadPullDiff({tab, pull, diff, diffError, changes, fileDiff})) return;
        loadDiff(pull, `${viewer}:${id}:${index}`, fileDiff, project?.gitHead || '');
    }, [changes, diff, diffError, fileDiff, id, index, loadDiff, project, pull, tab, viewer]);

    const pageContext = () => `${viewer}:${id}:${index}`;
    const stillOn = context => contextRef.current === context;

    const uploadMerge = async (data, activePull, files, context) => {
        const result = await buildProjectArtifactsFromFileEntries(
            [...files].map(([path, fileData]) => ({path, data: fileData}))
        );
        await api.uploadPullMerge(id, pullMergeUpload(data, activePull.index, result));
        if (!stillOn(context)) return;
        setMergeSession(null);
        await load();
    };

    const failMerge = async (error, fallback, context) => {
        if (!stillOn(context)) return;
        const failure = pullMergeFailure(error, communityText, fallback);
        let gateShown = false;
        if (error?.code === 'target_branch_changed') {
            const refreshed = await refreshProject();
            gateShown = isPullBranchBlocked(pull, refreshed);
        }
        if (!stillOn(context)) return;
        if (!failure.restart) {
            setMergeError(gateShown ? '' : failure.message);
            if (gateShown) focusGateNote();
            return;
        }
        setMergeSession(null);
        diffGenerationRef.current += 1;
        diffRequestRef.current = '';
        const reloaded = await load();
        if (!stillOn(context)) return;
        gateShown = isPullBranchBlocked(reloaded?.pull, reloaded?.project);
        setMergeError(gateShown ? '' : failure.message);
        if (gateShown) focusGateNote();
        setDiff(null);
        setChanges(null);
        setFileTexts({});
        setSpriteTexts(null);
        setFileDiff(false);
        setDiffError('');
    };

    const merge = async () => {
        if (!pull || merging) return;
        const context = pageContext();
        setMerging(true);
        setMergeError('');
        try {
            const data = await api.mergePull(id, pull.index);
            if (!stillOn(context)) return;
            if (data.merged) {
                setMergeSession(null);
                await load();
                return;
            }
            const result = await materializeMerge({...data, targetHead: data.expectedHead});
            if (!stillOn(context)) return;
            if (result.conflicts.length || result.binaryConflicts.length) {
                setMergeSession({
                    pull,
                    data,
                    files: result.files,
                    conflicts: result.conflicts,
                    binaryConflicts: result.binaryConflicts
                });
            } else {
                await uploadMerge(data, pull, result.files, context);
            }
        } catch (error) {
            await failMerge(error, communityText('Merge failed.'), context);
        } finally {
            if (stillOn(context)) setMerging(false);
        }
    };

    const resolveConflicts = async () => {
        if (!mergeSession || merging) return;
        const session = mergeSession;
        const context = pageContext();
        setMerging(true);
        setMergeError('');
        try {
            const unresolvedText = unresolvedTextConflict(session);
            if (unresolvedText) {
                setMergeError(communityText('Resolve the conflict in {value1}.', {value1: unresolvedText.path}));
                return;
            }
            const unresolved = unresolvedBinaryConflict(session);
            if (unresolved) {
                setMergeError(communityText('Choose a version for {value1}.', {value1: unresolved.path}));
                return;
            }
            await uploadMerge(session.data, session.pull, resolvedMergeFiles(session), context);
        } catch (error) {
            await failMerge(error, communityText('The conflicts could not be resolved.'), context);
        } finally {
            if (stillOn(context)) setMerging(false);
        }
    };

    const closePull = async () => {
        if (!pull || closing) return;
        const context = pageContext();
        setClosing(true);
        setCloseError('');
        try {
            const data = await api.closePull(id, pull.index);
            if (!stillOn(context)) return;
            setPull(data.pull);
            setMergeSession(null);
            setMergeError('');
            setCloseConfirmOpen(false);
        } catch (error) {
            if (!stillOn(context)) return;
            if (error?.code === 'pull_not_open' || (error?.status === 404 && error?.message === 'open pull request not found')) {
                setCloseConfirmOpen(false);
                setMergeSession(null);
                setMergeError(communityText('This pull request was already closed or merged.'));
                await load();
                return;
            }
            if (error?.status === 403) {
                setCloseConfirmOpen(false);
                setMergeSession(null);
                setMergeError(communityText('Only the remix owner and project maintainers can close this pull request.'));
                await load();
                return;
            }
            if (error?.status === 404) {
                setCloseConfirmOpen(false);
                setMergeSession(null);
                setMergeError(communityText('Could not close this pull request.'));
                await load();
                return;
            }
            setCloseError(error.message || communityText('Could not close this pull request.'));
        } finally {
            if (stillOn(context)) setClosing(false);
        }
    };

    const updateTextConflict = (path, content) => {
        setMergeSession(session => withTextResolution(session, path, content));
    };

    const updateBinaryConflict = (path, choice) => {
        setMergeSession(session => withBinaryChoice(session, path, choice));
    };

    const refreshTimeline = async context => {
        const data = await api.pullTimeline(id, index);
        if (!stillOn(context)) return;
        setTimeline({
            comments: data.comments || [],
            commits: data.commits || [],
            targetCommits: data.targetCommits || []
        });
    };

    const submitComment = async event => {
        event.preventDefault();
        const content = commentText.trim();
        if (!content || commentBusy) return;
        const context = pageContext();
        setCommentBusy(true);
        setCommentError('');
        try {
            await api.addPullComment(id, index, content);
            if (!stillOn(context)) return;
            setCommentText('');
            await refreshTimeline(context);
        } catch (error) {
            if (stillOn(context)) setCommentError(error.message || 'Could not post this comment.');
        } finally {
            if (stillOn(context)) setCommentBusy(false);
        }
    };

    const deleteComment = async comment => {
        if (commentBusy) return;
        const context = pageContext();
        setCommentBusy(true);
        setCommentError('');
        try {
            await api.deletePullComment(id, index, comment.id);
            await refreshTimeline(context);
        } catch (error) {
            if (stillOn(context)) setCommentError(error.message || 'Could not delete this comment.');
        } finally {
            if (stillOn(context)) setCommentBusy(false);
        }
    };

    const files = useMemo(() => parseDiff(diff), [diff]);
    const analysis = useMemo(() => (changes ? analyseChanges(changes) : null), [changes]);
    const showChanges = Boolean(analysis) && !fileDiff;
    const sidebarFiles = useMemo(() => (showChanges ? sidebarFilesFor(analysis) : files), [showChanges, analysis, files]);
    const describeSprite = useCallback(
        sprite => {
            const target = findTarget(analysis, sprite.name);
            return target ? describeTarget(target, communityText) : '';
        },
        [analysis, communityText]
    );
    const labelSprite = useCallback(sprite => findTarget(analysis, sprite.name)?.name || sprite.name, [analysis]);
    const liveSourceHead = assetRefs?.newSha || pull?.headCommit || '';
    useEffect(() => {
        if (!analysis || !pull || !liveSourceHead) return () => {};
        let active = true;
        loadSpriteTexts(analysis, async path => {
            const result = await api.commitFile(
                pull.sourceProjectId || id,
                liveSourceHead,
                path,
                pull.index,
                pull.targetProjectId || ''
            );
            return new TextDecoder().decode(base64ToBytes(result.content || ''));
        }).then(texts => {
            if (active) setSpriteTexts(texts);
        });
        return () => {
            active = false;
        };
    }, [analysis, pull, id, liveSourceHead]);
    const loadPullAsset = useCallback(async (side, path) => {
        if (!assetRefs) return null;
        const target = side === 'old' ?
            {projectId: assetRefs.oldProject, sha: assetRefs.oldSha} :
            {projectId: assetRefs.newProject, sha: assetRefs.newSha};
        if (!target.sha) return null;
        const result = await api.commitFile(
            target.projectId,
            target.sha,
            path,
            assetRefs.pullIndex,
            assetRefs.pullTarget
        );
        return {bytes: base64ToBytes(result.content || ''), mediaType: mediaTypeForAssetPath(path)};
    }, [assetRefs]);
    const conversationEvents = useMemo(() => [
        ...timeline.targetCommits.map(commit => ({...commit, eventType: 'target-commit'})),
        ...timeline.commits.map(commit => ({...commit, eventType: 'source-commit'})),
        ...timeline.comments.map(comment => ({...comment, eventType: 'comment', date: comment.created}))
    ].sort((a, b) => Number(a.date) - Number(b.date)), [timeline]);

    const baseUrl = projectBaseUrl({project, projectId: id, vanitySlug: slug});

    if (resolving) {
        return <main className={styles.page}><StatusMessage>{communityText('Finding project…')}</StatusMessage></main>;
    }
    if (resolveError) {
        return (
            <main className={styles.page}>
                <StatusMessage error>{resolveError}</StatusMessage>
            </main>
        );
    }
    if (loadingError) {
        return (
            <main className={styles.page}>
                <PageHeader compact backTo={baseUrl} backLabel={communityText('Back to project')} icon={GitPullRequest} title={communityText('Pull request')} />
                <StatusMessage error onRetry={load}>{loadingError}</StatusMessage>
            </main>
        );
    }
    if (!pull || !project || loadedContext !== `${viewer}:${id}:${index}`) return <main className={styles.page}><StatusMessage>{communityText('Loading pull request…')}</StatusMessage></main>;

    const open = pull.state === 'open';
    const canClose = canClosePullRequest(project, pull, user);
    const branchGone = Boolean(pull.baseBranch && pull.baseBranchMissing);
    const wrongBranch = Boolean(pull.baseBranch && project.gitBranch && pull.baseBranch !== project.gitBranch && !branchGone);
    const changedFileCount = analysis && !fileDiff ?
        analysis.targets.reduce((total, entry) => total + entry.count, analysis.others.length) :
        diff === null ? '…' : files.length;
    return (
        <main className={styles.page}>
            <PageHeader
                backTo={`${baseUrl}#pull-requests`}
                backLabel={project.title || communityText('Project')}
                icon={GitPullRequest}
                title={<>{pull.title} <span className={styles.prNumber}>#{pull.index}</span></>}
            >
                <div className={styles.prMeta}>
                    <span className={open ? styles.openBadge : styles.closedBadge}>
                        {open ? <GitPullRequest size={15} /> : <Check size={15} />}
                        {open ? communityText('Open') : pull.merged ? communityText('Merged') : communityText('Closed')}
                    </span>
                    <Link to={`/users/${pull.user}`}><Avatar username={pull.user} size={24} />{pull.user}</Link>
                    <span>{communityText('wants to merge from')}</span>
                    <Link to={projectUrl(pull.sourceProjectId)}>
                        <code>{pull.sourceTitle || communityText('Fork')}/{pull.headBranch}</code>
                    </Link>
                    <ChevronRight size={13} />
                    <Link to={baseUrl}>
                        <code>{project.title || communityText('Project')}/{pull.baseBranch}</code>
                    </Link>
                </div>
                <UnderlineTabs
                    items={[
                        {key: 'conversation', label: <><MessageSquare size={15} />{communityText('Conversation')} <b>{timeline.comments.length + 1}</b></>},
                        {key: 'commits', label: <><GitCommitHorizontal size={15} />{communityText('Commits')} <b>{timeline.commits.length}</b></>},
                        {key: 'files', label: <><FileCode2 size={15} />{communityText('Files changed')} <b>{changedFileCount}</b></>}
                    ]}
                    value={tab}
                    onChange={setTab}
                    ariaLabel="Pull request sections"
                    idPrefix="pull"
                />
            </PageHeader>

            <div {...tabPanelProps('pull', tab)}>
                {tab === 'conversation' ? (
                    <div className={styles.conversationGrid}>
                        <section className={styles.timeline}>
                            <div className={styles.eventFeed}>
                                <article className={styles.description}>
                                    <MessageSquare className={styles.commentMarker} size={14} />
                                    <header><UserLink username={pull.user}><Avatar username={pull.user} size={28} /></UserLink><UserLink username={pull.user}><strong>{pull.user}</strong></UserLink>{communityText('opened this pull request')}</header>
                                    <div>{pull.body ? <RichText text={pull.body} /> : <p>{communityText('No description was provided.')}</p>}</div>
                                </article>
                                {conversationEvents.map((event, eventIndex) => (event.eventType === 'comment' ? (
                                    <article className={styles.commentCard} key={`comment-${event.id}`} id={`comment-id-${event.id}`}>
                                        <MessageSquare className={styles.commentMarker} size={14} />
                                        <header>
                                            <Link to={`/users/${event.author}`}><Avatar username={event.author} size={28} /><strong>{event.author}</strong></Link>
                                            <span>{communityText('commented {value1}', {value1: timeAgo(event.created)})}</span>
                                            {user && (user.isAdmin || project.isOwner || user.username.toLowerCase() === event.author.toLowerCase()) ? (
                                                <button type="button" title={communityText('Delete comment')} disabled={commentBusy} onClick={() => deleteComment(event)}><Trash2 size={14} /></button>
                                            ) : null}
                                        </header>
                                        <div><RichText text={event.content} /></div>
                                    </article>
                                ) : (
                                    <div className={styles.commitEvent} key={`${event.eventType}-${event.sha}-${eventIndex}`}>
                                        <GitCommitHorizontal size={16} />
                                        <UserLink username={event.author}><Avatar username={event.author} size={24} /></UserLink>
                                        <span><UserLink username={event.author}><strong>{event.author}</strong></UserLink>{' '}{event.eventType === 'target-commit' ? communityText('committed to {value1}', {value1: pull.baseBranch}) : communityText('committed on {value1}', {value1: pull.headBranch})}</span>
                                        <code>{event.message || communityText('Untitled commit')}</code>
                                        <small>
                                            <Link to={`/project/${event.eventType === 'target-commit' ? id : pull.sourceProjectId}/commits/${event.sha}`}>
                                                {String(event.sha || '').slice(0, 7)}
                                            </Link>, {timeAgo(event.date)}
                                        </small>
                                    </div>
                                )))}
                            </div>
                            {user ? (
                                <form className={styles.commentForm} onSubmit={submitComment}>
                                    <Avatar username={user.username} size={34} />
                                    <div>
                                        <textarea value={commentText} maxLength={500} placeholder={communityText('Leave a comment')} disabled={commentBusy} onChange={event => setCommentText(event.target.value)} />
                                        {commentError ? <Notice variant="error" className={styles.commentNotice}>{commentError}</Notice> : null}
                                        <footer>
                                            <span>{commentText.length}/500</span>
                                            <Button type="submit" variant="primary" disabled={!commentText.trim()} busy={commentBusy} busyLabel={communityText('Posting…')}>{communityText('Comment')}</Button>
                                        </footer>
                                    </div>
                                </form>
                            ) : (
                                <SignInPrompt compact onSignIn={login} title={communityText('Sign in to comment')}>{communityText('Join the conversation on this pull request once you are signed in.')}</SignInPrompt>
                            )}
                        </section>
                        <aside className={styles.mergeBox}>
                            <div className={open ? styles.mergeStatusOpen : styles.mergeStatusClosed}>
                                {open ? <GitMerge size={20} /> : <Check size={20} />}
                                <div><strong>{open ? communityText('Ready for review') : communityText('Pull request closed')}</strong><span>{open ? communityText('Review the files before merging.') : communityText('No more changes can be merged.')}</span></div>
                            </div>
                            {mergeError && !mergeSession && !branchBlocked ? <Notice variant="error">{mergeError}</Notice> : null}
                            {open && canMerge && branchGone ? (
                                <p className={styles.note} ref={gateNoteRef} tabIndex={-1} role="status">
                                    {communityText('This pull request targets the {value1} branch, which no longer exists. Close it and open a new one.', {value1: pull.baseBranch})}
                                </p>
                            ) : open && canMerge && wrongBranch ? (
                                <p className={styles.note} ref={gateNoteRef} tabIndex={-1} role="status">
                                    {communityText('This pull request targets the {value1} branch, and this project is on {value2}. It can be merged once the project is back on {value1}.', {value1: pull.baseBranch, value2: project.gitBranch})}
                                </p>
                            ) : open && canMerge && mergeSession ? (
                                <p className={styles.note}>{communityText('Resolve the conflicts below to finish merging.')}</p>
                            ) : open && canMerge ? (
                                <Button variant="primary" onClick={merge} busy={merging} busyLabel={communityText('Merging…')}>{communityText('Merge pull request')}</Button>
                            ) : open && !mergeError ? <p className={styles.note}>{communityText('Only project owners and maintainers can merge this pull request.')}</p> : null}
                            {open && canClose ? (
                                <Button
                                    variant="secondary"
                                    disabled={merging}
                                    onClick={() => {
                                        setCloseError('');
                                        setCloseConfirmOpen(true);
                                    }}
                                >{communityText('Close pull request')}</Button>
                            ) : null}
                        </aside>
                    </div>
                ) : tab === 'commits' ? (
                    <section className={styles.commitsPanel}>
                        <header><GitCommitHorizontal size={17} /><strong>{communityText('Commits on {value1}', {value1: formatDate(timeline.commits[0]?.date, communityText('this pull request'))})}</strong></header>
                        {timeline.commits.length ? timeline.commits.map(commit => (
                            <article className={styles.commitRow} key={commit.sha}>
                                <UserLink username={commit.author}><Avatar username={commit.author} size={26} /></UserLink>
                                <div><Link to={`/project/${pull.sourceProjectId}/commits/${commit.sha}`}><strong>{commit.message || communityText('Untitled commit')}</strong></Link><span><UserLink username={commit.author}>{commit.author}</UserLink>{' '}{communityText('committed {value1}', {value1: timeAgo(commit.date)})}</span></div>
                                <code>{String(commit.sha || '').slice(0, 7)}</code>
                            </article>
                        )) : <div className={styles.emptyCommits}><EmptyState compact icon={GitCommitHorizontal} title={communityText('No commits yet')}>{communityText('No commits found after the fork point.')}</EmptyState></div>}
                    </section>
                ) : (
                    <div className={styles.filesLayout}>
                        <SpriteList
                            files={sidebarFiles}
                            fileTexts={showChanges ? (spriteTexts || {}) : fileTexts}
                            loadAsset={showChanges && !spriteTexts ? null : loadPullAsset}
                            activeSprite={activeSprite}
                            describe={showChanges ? describeSprite : null}
                            labelOf={showChanges ? labelSprite : null}
                            onSelect={name => setActiveSprite(current => (current === name ? '' : name))}
                        />
                        <section className={styles.diffColumn}>
                            {analysis ? (
                                <div className={styles.diffViewSwitch}>
                                    <Button onClick={() => setFileDiff(current => !current)}>
                                        {fileDiff ? communityText('Show summary') : communityText('Show file diff')}
                                    </Button>
                                </div>
                            ) : null}
                            {showChanges ? (
                                <ChangesView
                                    analysis={analysis}
                                    spriteFilter={activeSprite}
                                    loadAsset={loadPullAsset}
                                    onShowLines={() => setFileDiff(true)}
                                />
                            ) : diffError ? <StatusMessage error onRetry={() => loadDiff(pull, `${viewer}:${id}:${index}`, fileDiff, project?.gitHead || '')}>{diffError}</StatusMessage> : diff === null ? (
                                <StatusMessage>{communityText('Loading file changes…')}</StatusMessage>
                            ) : <DiffView diff={diff} spriteFilter={activeSprite} loadAsset={loadPullAsset} fileTexts={fileTexts} />}
                        </section>
                    </div>
                )}
            </div>

            {mergeSession ? (
                <div className={styles.conflicts}>
                    <MergeConflicts
                        title={communityText('Resolve merge conflicts')}
                        lead={communityText('Edit each text file, then choose which version to keep for every asset.')}
                        conflicts={mergeSession.conflicts}
                        binaryConflicts={mergeSession.binaryConflicts}
                        keepLabel={communityText('Keep current project')}
                        useLabel={communityText('Use pull request')}
                        submitLabel={communityText('Save resolutions and merge')}
                        busy={merging}
                        busyLabel={communityText('Merging…')}
                        error={mergeError || (wrongBranch ? communityText('Switch this project to the {value1} branch before merging this pull request.', {value1: pull.baseBranch}) : '')}
                        focusOnMount
                        headingLevel="h2"
                        onTextChange={updateTextConflict}
                        onChoose={updateBinaryConflict}
                        onSubmit={resolveConflicts}
                        actions={(
                            <Button
                                disabled={merging}
                                onClick={() => {
                                    setMergeSession(null);
                                    setMergeError('');
                                }}
                            >
                                {communityText('Cancel')}
                            </Button>
                        )}
                    />
                </div>
            ) : null}
            {closeConfirmOpen ? (
                <ConfirmModal
                    icon={GitPullRequest}
                    title={communityText('Close pull request?')}
                    destructive
                    busy={closing}
                    busyLabel={communityText('Closing…')}
                    confirmLabel={communityText('Close pull request')}
                    error={closeError || null}
                    onConfirm={closePull}
                    onCancel={() => setCloseConfirmOpen(false)}
                >
                    {communityText('This closes the pull request without merging its changes.')}
                </ConfirmModal>
            ) : null}
        </main>
    );
};

export default PullRequest;
