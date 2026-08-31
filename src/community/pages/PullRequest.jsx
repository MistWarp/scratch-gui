/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {
    ArrowLeft, Check, ChevronRight, FileCode2, GitCommitHorizontal,
    GitMerge, GitPullRequest, MessageSquare, Trash2
} from 'lucide-react';
import api, {projectUrl} from '../api';
import DiffView, {parseDiff} from '../components/DiffView.jsx';
import FileBrowserTree from '../components/FileBrowserTree.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
import RichText from '../components/RichText.jsx';
import UserLink from '../components/UserLink.jsx';
import {useUser} from '../UserContext.jsx';
import {formatDate, timeAgo} from '../format.js';
import setPageMeta from '../page-meta.js';
import {buildCommitDiffFromInspection} from '../commit-diff.js';
import {buildProjectArtifactsFromFileEntries} from '../../lib/git/mwp.js';
import styles from './PullRequest.module.css';

const decodeBase64 = value => {
    const binary = atob(value || '');
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
};

const loadServerMerge = async data => {
    const tree = await api.commitTree(data.targetProjectId, data.expectedHead);
    const loaded = await Promise.all((tree.files || []).map(async file => {
        const result = await api.commitFile(data.targetProjectId, data.expectedHead, file.path);
        return [file.path, decodeBase64(result.content)];
    }));
    const files = new Map(loaded);
    const conflicts = [];
    const binaryConflicts = [];
    for (const change of data.merge.changes || []) {
        if (change.conflict && change.binary) {
            binaryConflicts.push({...change, choice: ''});
        } else {
            if (change.deleted) files.delete(change.path);
            else files.set(change.path, decodeBase64(change.content));
            if (change.conflict) {
                conflicts.push({path: change.path, content: new TextDecoder().decode(decodeBase64(change.content))});
            }
        }
    }
    return {files, conflicts, binaryConflicts};
};

const PULL_DIFF_CACHE_PREFIX = 'mw:pull-diff:';
const PULL_DIFF_CACHE_MAX_ENTRIES = 6;
const PULL_DIFF_CACHE_MAX_BYTES = 8 * 1024 * 1024;
const PULL_DIFF_ENTRY_MAX_BYTES = 2 * 1024 * 1024;
const pullDiffCacheKey = pull => {
    const session = api.loadSession() || 'anonymous';
    return `${PULL_DIFF_CACHE_PREFIX}${session}:${pull.targetProjectId}:${pull.baseCommit}:${pull.headCommit}`;
};
export const readPullDiffCache = pull => {
    try {
        const raw = sessionStorage.getItem(pullDiffCacheKey(pull));
        if (raw === null) return null;
        try {
            const cached = JSON.parse(raw);
            return typeof cached.diff === 'string' ? cached.diff : raw;
        } catch (error) {
            return raw;
        }
    } catch (error) {
        return null;
    }
};
export const writePullDiffCache = (pull, diff) => {
    if (diff.length * 2 > PULL_DIFF_ENTRY_MAX_BYTES) return;
    try {
        sessionStorage.setItem(pullDiffCacheKey(pull), JSON.stringify({at: Date.now(), diff}));
        const entries = [];
        for (let index = 0; index < sessionStorage.length; index++) {
            const key = sessionStorage.key(index);
            if (!key || !key.startsWith(PULL_DIFF_CACHE_PREFIX)) continue;
            const value = sessionStorage.getItem(key) || '';
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
                sessionStorage.removeItem(entry.key);
            }
        });
    } catch (error) {
        // Large diffs can exceed the session quota. The page still works without this cache.
    }
};

export const shouldLoadPullDiff = ({tab, pull, diff, diffError}) => (
    tab === 'files' && Boolean(pull) && diff === null && !diffError
);

export const buildPullRequestDiff = (apiClient, data) => {
    if (!data.inspection) throw new Error('The server did not return pull request changes.');
    const pullApi = {
        commitFile: (projectId, sha, path) => apiClient.commitFile(
            projectId,
            sha,
            path,
            data.pull.index,
            data.targetProjectId || data.pull.targetProjectId
        )
    };
    return buildCommitDiffFromInspection({
        apiClient: pullApi,
        projectId: data.sourceProjectId || data.pull.sourceProjectId,
        sha: data.pull.headCommit,
        inspection: data.inspection,
        parentProjectId: data.targetProjectId || data.pull.targetProjectId
    });
};

export const canMergePullRequest = project => Boolean(
    project?.isOwner || project?.myRole === 'owner' || project?.myRole === 'maintainer'
);

export const canClosePullRequest = (project, pull, user) => {
    if (typeof pull?.canClose === 'boolean') return pull.canClose;
    if (canMergePullRequest(project)) return true;
    return Boolean(user?.username && pull?.sourceOwner &&
        user.username.toLowerCase() === pull.sourceOwner.toLowerCase());
};

const PullRequest = () => {
    const {id, index} = useParams();
    const {user, login} = useUser();
    const [project, setProject] = useState(null);
    const [pull, setPull] = useState(null);
    const [diff, setDiff] = useState(null);
    const [timeline, setTimeline] = useState({comments: [], commits: [], targetCommits: []});
    const [tab, setTab] = useState('conversation');
    const [selectedPath, setSelectedPath] = useState('');
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
    const contextRef = useRef(`${id}:${index}`);
    const diffRequestRef = useRef('');
    contextRef.current = `${id}:${index}`;

    const loadDiff = useCallback(async (activePull, context) => {
        if (diffRequestRef.current === context) return;
        diffRequestRef.current = context;
        const cached = readPullDiffCache(activePull);
        if (cached !== null) {
            if (contextRef.current === context) setDiff(cached);
            if (diffRequestRef.current === context) diffRequestRef.current = '';
            return;
        }
        setDiffError('');
        try {
            const diffData = await api.pullDiff(id, index);
            const nextDiff = await buildPullRequestDiff(api, diffData);
            const renderedDiff = nextDiff || 'No textual changes.';
            writePullDiffCache(activePull, renderedDiff);
            if (contextRef.current === context) setDiff(renderedDiff);
        } catch (error) {
            if (contextRef.current === context) setDiffError(error.message || 'Could not load these file changes.');
        } finally {
            if (diffRequestRef.current === context) diffRequestRef.current = '';
        }
    }, [id, index]);

    const load = useCallback(async () => {
        const context = `${id}:${index}`;
        setLoadingError('');
        try {
            const [projectData, pullData, timelineData] = await Promise.all([
                api.getProject(id),
                api.getPull(id, index),
                api.pullTimeline(id, index)
            ]);
            if (contextRef.current !== context) return;
            setProject(projectData.project || projectData);
            setPull(pullData.pull);
            setTimeline({
                comments: timelineData.comments || [],
                commits: timelineData.commits || [],
                targetCommits: timelineData.targetCommits || []
            });
            setPageMeta({title: `${pullData.pull.title} · Pull request #${pullData.pull.index}`});
        } catch (error) {
            if (contextRef.current === context) {
                setLoadingError(error.message || 'Could not load this pull request.');
            }
        }
    }, [id, index, loadDiff]);

    useEffect(() => {
        setProject(null);
        setPull(null);
        setDiff(null);
        setTimeline({comments: [], commits: [], targetCommits: []});
        setTab('conversation');
        setSelectedPath('');
        setMergeSession(null);
        setMergeError('');
        setCloseConfirmOpen(false);
        setClosing(false);
        setCloseError('');
        setDiffError('');
        setCommentText('');
        setCommentError('');
        load();
    }, [load]);

    useEffect(() => {
        if (!shouldLoadPullDiff({tab, pull, diff, diffError})) return;
        loadDiff(pull, `${id}:${index}`);
    }, [diff, diffError, id, index, loadDiff, pull, tab]);

    const uploadMerge = async (data, activePull, files) => {
        const result = await buildProjectArtifactsFromFileEntries(
            [...files].map(([path, fileData]) => ({path, data: fileData}))
        );
        await api.uploadPullMerge(id, {
            sb3: result.sb3,
            mergeTree: result.tree,
            expectedHead: data.expectedHead,
            pullId: activePull.index
        });
        setMergeSession(null);
        await load();
    };

    const merge = async () => {
        if (!pull || merging) return;
        setMerging(true);
        setMergeError('');
        try {
            const data = await api.mergePull(id, pull.index);
            if (data.merged) {
                setMergeSession(null);
                await load();
                return;
            }
            const result = await loadServerMerge(data);
            if (result.conflicts.length || result.binaryConflicts.length) {
                setMergeSession({
                    pull,
                    data,
                    files: result.files,
                    conflicts: result.conflicts,
                    binaryConflicts: result.binaryConflicts
                });
            } else {
                await uploadMerge(data, pull, result.files);
            }
        } catch (error) {
            setMergeError(error.message || 'Merge failed.');
        } finally {
            setMerging(false);
        }
    };

    const resolveConflicts = async () => {
        if (!mergeSession || merging) return;
        const session = mergeSession;
        setMerging(true);
        setMergeError('');
        try {
            const resolvedFiles = new Map(session.files);
            for (const file of session.conflicts) {
                resolvedFiles.set(file.path, new TextEncoder().encode(file.content));
            }
            for (const file of session.binaryConflicts) {
                if (!file.choice) throw new Error(`Choose a version for ${file.path}`);
                const deleted = file.choice === 'theirs' ? file.theirsDeleted : file.oursDeleted;
                const content = file.choice === 'theirs' ? file.theirs : file.ours;
                if (deleted) resolvedFiles.delete(file.path);
                else resolvedFiles.set(file.path, decodeBase64(content));
            }
            await uploadMerge(session.data, session.pull, resolvedFiles);
        } catch (error) {
            setMergeError(error.message || 'The conflicts could not be resolved.');
        } finally {
            setMerging(false);
        }
    };

    const closePull = async () => {
        if (!pull || closing) return;
        setClosing(true);
        setCloseError('');
        try {
            const data = await api.closePull(id, pull.index);
            setPull(data.pull);
            setCloseConfirmOpen(false);
        } catch (error) {
            setCloseError(error.message || 'Could not close this pull request.');
        } finally {
            setClosing(false);
        }
    };

    const updateTextConflict = (path, content) => {
        setMergeSession(session => ({
            ...session,
            conflicts: session.conflicts.map(item => (
                item.path === path ? {...item, content} : item
            ))
        }));
    };

    const updateBinaryConflict = (path, choice) => {
        setMergeSession(session => ({
            ...session,
            binaryConflicts: session.binaryConflicts.map(item => (
                item.path === path ? {...item, choice} : item
            ))
        }));
    };

    const refreshTimeline = async () => {
        const data = await api.pullTimeline(id, index);
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
        setCommentBusy(true);
        setCommentError('');
        try {
            await api.addPullComment(id, index, content);
            setCommentText('');
            await refreshTimeline();
        } catch (error) {
            setCommentError(error.message || 'Could not post this comment.');
        } finally {
            setCommentBusy(false);
        }
    };

    const deleteComment = async comment => {
        if (commentBusy) return;
        setCommentBusy(true);
        setCommentError('');
        try {
            await api.deletePullComment(id, index, comment.id);
            await refreshTimeline();
        } catch (error) {
            setCommentError(error.message || 'Could not delete this comment.');
        } finally {
            setCommentBusy(false);
        }
    };

    const files = useMemo(() => parseDiff(diff), [diff]);
    const conversationEvents = useMemo(() => [
        ...timeline.targetCommits.map(commit => ({...commit, eventType: 'target-commit'})),
        ...timeline.commits.map(commit => ({...commit, eventType: 'source-commit'})),
        ...timeline.comments.map(comment => ({...comment, eventType: 'comment', date: comment.created}))
    ].sort((a, b) => Number(a.date) - Number(b.date)), [timeline]);

    if (loadingError) {
        return (
            <main className={styles.page}>
                <Link className={styles.back} to={projectUrl(id)}><ArrowLeft size={15} /> Back to project</Link>
                <div className={styles.loadState}><p>{loadingError}</p><Button onClick={load}>Try again</Button></div>
            </main>
        );
    }
    if (!pull || !project) return <main className={styles.page}><p className={styles.loadState}>Loading pull request…</p></main>;

    const open = pull.state === 'open';
    const canMerge = typeof pull.canMerge === 'boolean' ? pull.canMerge : canMergePullRequest(project);
    const canClose = canClosePullRequest(project, pull, user);
    const changedFileCount = diff === null ? (pull.fileCount ?? pull.filesChanged ?? '…') : files.length;
    return (
        <main className={styles.page}>
            <Link className={styles.back} to={`${projectUrl(id)}#pull-requests`}>
                <ArrowLeft size={15} /> {project.title || 'Project'}
            </Link>
            <header className={styles.prHeader}>
                <h1>{pull.title} <span>#{pull.index}</span></h1>
                <div className={styles.prMeta}>
                    <span className={open ? styles.openBadge : styles.closedBadge}>
                        {open ? <GitPullRequest size={15} /> : <Check size={15} />}
                        {open ? 'Open' : pull.merged ? 'Merged' : 'Closed'}
                    </span>
                    <Link to={`/users/${pull.user}`}><Avatar username={pull.user} size={24} />{pull.user}</Link>
                    <span>wants to merge from</span>
                    <Link to={projectUrl(pull.sourceProjectId)}>
                        <code>{pull.sourceTitle || 'Fork'}/{pull.headBranch}</code>
                    </Link>
                    <ChevronRight size={13} />
                    <Link to={projectUrl(pull.targetProjectId)}>
                        <code>{project.title || 'Project'}/{pull.baseBranch}</code>
                    </Link>
                </div>
            </header>

            <SectionTabs
                items={[
                    {key: 'conversation', label: <><MessageSquare size={15} /> Conversation <span>{timeline.comments.length + 1}</span></>},
                    {key: 'commits', label: <><GitCommitHorizontal size={15} /> Commits <span>{timeline.commits.length}</span></>},
                    {key: 'files', label: <><FileCode2 size={15} /> Files changed <span>{changedFileCount}</span></>}
                ]}
                value={tab}
                onChange={setTab}
                className={styles.tabs}
                itemClassName={styles.tab}
                activeClassName={styles.tabActive}
                ariaLabel="Pull request sections"
            />

            {tab === 'conversation' ? (
                <div className={styles.conversationGrid}>
                    <section className={styles.timeline}>
                        <div className={styles.eventFeed}>
                            <article className={styles.description}>
                                <MessageSquare className={styles.commentMarker} size={14} />
                                <header><UserLink username={pull.user}><Avatar username={pull.user} size={28} /></UserLink><UserLink username={pull.user}><strong>{pull.user}</strong></UserLink> opened this pull request</header>
                                <div>{pull.body ? <RichText text={pull.body} /> : <p>No description was provided.</p>}</div>
                            </article>
                            {conversationEvents.map((event, eventIndex) => (event.eventType === 'comment' ? (
                                <article className={styles.commentCard} key={`comment-${event.id}`}>
                                    <MessageSquare className={styles.commentMarker} size={14} />
                                    <header>
                                        <Link to={`/users/${event.author}`}><Avatar username={event.author} size={28} /><strong>{event.author}</strong></Link>
                                        <span>commented {timeAgo(event.created)}</span>
                                        {user && (user.isAdmin || project.isOwner || user.username.toLowerCase() === event.author.toLowerCase()) ? (
                                            <button type="button" title="Delete comment" disabled={commentBusy} onClick={() => deleteComment(event)}><Trash2 size={14} /></button>
                                        ) : null}
                                    </header>
                                    <div><RichText text={event.content} /></div>
                                </article>
                            ) : (
                                <div className={styles.commitEvent} key={`${event.eventType}-${event.sha}-${eventIndex}`}>
                                    <GitCommitHorizontal size={16} />
                                    <UserLink username={event.author}><Avatar username={event.author} size={24} /></UserLink>
                                    <span><UserLink username={event.author}><strong>{event.author}</strong></UserLink> committed {event.eventType === 'target-commit' ? `to ${pull.baseBranch}` : `on ${pull.headBranch}`}</span>
                                    <code>{event.message || 'Untitled commit'}</code>
                                    <small>
                                        <Link to={`/project/${event.eventType === 'target-commit' ? id : pull.sourceProjectId}/commits/${event.sha}`}>
                                            {String(event.sha || '').slice(0, 7)}
                                        </Link> · {timeAgo(event.date)}
                                    </small>
                                </div>
                            )))}
                        </div>
                        {user ? (
                            <form className={styles.commentForm} onSubmit={submitComment}>
                                <Avatar username={user.username} size={34} />
                                <div>
                                    <textarea value={commentText} maxLength={500} placeholder="Leave a comment" disabled={commentBusy} onChange={event => setCommentText(event.target.value)} />
                                    <footer>
                                        {commentError ? <span className={styles.error}>{commentError}</span> : <span>{commentText.length}/500</span>}
                                        <Button type="submit" variant="primary" disabled={!commentText.trim()} busy={commentBusy} busyLabel="Posting…">Comment</Button>
                                    </footer>
                                </div>
                            </form>
                        ) : (
                            <div className={styles.signInComment}><Button onClick={login}>Sign in to comment</Button></div>
                        )}
                    </section>
                    <aside className={styles.mergeBox}>
                        <div className={open ? styles.mergeStatusOpen : styles.mergeStatusClosed}>
                            {open ? <GitMerge size={20} /> : <Check size={20} />}
                            <div><strong>{open ? 'Ready for review' : 'Pull request closed'}</strong><span>{open ? 'Review the files before merging.' : 'No more changes can be merged.'}</span></div>
                        </div>
                        {mergeError ? <p className={styles.error}>{mergeError}</p> : null}
                        {open && canMerge ? (
                            <Button variant="primary" onClick={merge} busy={merging} busyLabel="Merging…">Merge pull request</Button>
                        ) : open ? <p className={styles.note}>Only project owners and maintainers can merge this pull request.</p> : null}
                        {open && canClose ? (
                            <Button
                                variant="secondary"
                                disabled={merging}
                                onClick={() => {
                                    setCloseError('');
                                    setCloseConfirmOpen(true);
                                }}
                            >Close pull request</Button>
                        ) : null}
                    </aside>
                </div>
            ) : tab === 'commits' ? (
                <section className={styles.commitsPanel}>
                    <header><GitCommitHorizontal size={17} /><strong>Commits on {formatDate(timeline.commits[0]?.date, 'this pull request')}</strong></header>
                    {timeline.commits.length ? timeline.commits.map(commit => (
                        <article className={styles.commitRow} key={commit.sha}>
                            <UserLink username={commit.author}><Avatar username={commit.author} size={26} /></UserLink>
                            <div><Link to={`/project/${pull.sourceProjectId}/commits/${commit.sha}`}><strong>{commit.message || 'Untitled commit'}</strong></Link><span><UserLink username={commit.author}>{commit.author}</UserLink> committed {timeAgo(commit.date)}</span></div>
                            <code>{String(commit.sha || '').slice(0, 7)}</code>
                        </article>
                    )) : <p className={styles.emptyCommits}>No commits found after the fork point.</p>}
                </section>
            ) : (
                <div className={styles.filesLayout}>
                    <FileBrowserTree files={files} selectedPath={selectedPath} onSelect={setSelectedPath} showAll showStats />
                    <section className={styles.diffColumn}>
                        {diffError ? <div className={styles.diffFailure}><p>{diffError}</p><Button onClick={() => loadDiff(pull, `${id}:${index}`)}>Try again</Button></div> : diff === null ? (
                            <div className={styles.loadState}>Loading file changes…</div>
                        ) : <DiffView diff={diff} selectedPath={selectedPath} />}
                    </section>
                </div>
            )}

            {mergeSession ? (
                <section className={styles.conflicts}>
                    <h2>Resolve merge conflicts</h2>
                    <p>Edit each text file, then choose which version to keep for every asset.</p>
                    {mergeSession.conflicts.map(file => (
                        <label key={file.path}>
                            <span>{file.path}</span>
                            <textarea
                                value={file.content}
                                disabled={merging}
                                onChange={event => updateTextConflict(file.path, event.target.value)}
                            />
                        </label>
                    ))}
                    {mergeSession.binaryConflicts.map(file => (
                        <div className={styles.binaryConflict} key={file.path}>
                            <span>{file.path}</span>
                            <button className={file.choice === 'ours' ? styles.choiceActive : ''} onClick={() => updateBinaryConflict(file.path, 'ours')}>Keep current project</button>
                            <button className={file.choice === 'theirs' ? styles.choiceActive : ''} onClick={() => updateBinaryConflict(file.path, 'theirs')}>Use pull request</button>
                        </div>
                    ))}
                    <Button variant="primary" onClick={resolveConflicts} busy={merging} busyLabel="Merging…">Save resolutions and merge</Button>
                </section>
            ) : null}
            {closeConfirmOpen ? (
                <Modal
                    icon={GitPullRequest}
                    title="Close pull request?"
                    onClose={() => setCloseConfirmOpen(false)}
                    dismissDisabled={closing}
                    actions={(
                        <React.Fragment>
                            <Button variant="danger" busy={closing} busyLabel="Closing…" onClick={closePull}>Close pull request</Button>
                            <Button variant="secondary" disabled={closing} onClick={() => setCloseConfirmOpen(false)}>Cancel</Button>
                        </React.Fragment>
                    )}
                >
                    <p>This closes the pull request without merging its changes.</p>
                    {closeError ? <p className={styles.error}>{closeError}</p> : null}
                </Modal>
            ) : null}
        </main>
    );
};

export default PullRequest;
