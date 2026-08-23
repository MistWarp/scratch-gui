import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {Link} from 'react-router-dom';
import {Trash2, Reply, Flag} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import Avatar from './Avatar.jsx';
import ReactionButtons from './ReactionButtons.jsx';
import ReportModal from './ReportModal.jsx';
import Modal from './ui/Modal.jsx';
import RichText from './RichText.jsx';
import {timeAgo, sameUser, formatPlaytime} from '../format';
import useLatest from '../use-latest.js';
import styles from './CommentThread.module.css';

const COMMENT_KINDS = [
    {value: 'comment', label: 'Comment'},
    {value: 'bug', label: 'Bug report'},
    {value: 'suggestion', label: 'Suggestion'},
    {value: 'question', label: 'Question'}
];
const kindLabel = kind => COMMENT_KINDS.find(item => item.value === kind)?.label || 'Comment';

const CommentRow = ({
    comment, onReply, onDelete, onReact, onReport, canReply, canDelete, canReport,
    deleting, reacting, isReply, id
}) => (
    <div id={id} className={isReply ? styles.replyRow : styles.row}>
        <Link to={`/users/${comment.author}`}>
            <Avatar
                username={comment.author}
                size={isReply ? 28 : 36}
            />
        </Link>
        <div className={styles.bubble}>
            <div className={styles.bubbleHead}>
                <Link
                    to={`/users/${comment.author}`}
                    className={styles.author}
                >{comment.author}</Link>
                {!isReply && comment.kind && comment.kind !== 'comment' ? (
                    <span className={`${styles.kind} ${styles[`kind-${comment.kind}`] || ''}`}>
                        {kindLabel(comment.kind)}
                    </span>
                ) : null}
                {Number.isFinite(comment.playtimeMs) ? (
                    <span className={styles.playtime}>{formatPlaytime(comment.playtimeMs)}</span>
                ) : null}
                {comment.created ? (
                    <span className={styles.time}>{timeAgo(comment.created)}</span>
                ) : null}
                <span className={styles.headSpacer} />
                {canReply ? (
                    <button
                        type="button"
                        className={styles.iconAction}
                        aria-label="Reply"
                        title="Reply"
                        onClick={onReply}
                    >
                        <Reply size={14} />
                    </button>
                ) : null}
                {canReport ? (
                    <button
                        type="button"
                        className={styles.iconAction}
                        aria-label="Report comment"
                        title="Report comment"
                        onClick={onReport}
                    >
                        <Flag size={13} />
                    </button>
                ) : null}
                {canDelete ? (
                    <button
                        type="button"
                        className={styles.iconAction}
                        aria-label="Delete comment"
                        title="Delete comment"
                        disabled={deleting}
                        onClick={onDelete}
                    >
                        <Trash2 size={13} />
                    </button>
                ) : null}
            </div>
            <p className={styles.text}><RichText text={comment.content} /></p>
            <div className={styles.reactions}>
                <ReactionButtons
                    small
                    reactions={comment.reactions}
                    onReact={onReact}
                    disabled={reacting}
                    disabledTitle="Saving…"
                />
            </div>
        </div>
    </div>
);

const InlineComposer = ({
    user, value, onChange, onSubmit, onCancel, placeholder, busy, error, small, kind, onKindChange,
    composerAction
}) => (
    <div className={small ? styles.inlineComposerSmall : styles.inlineComposer}>
        <Avatar
            username={user.username}
            size={small ? 28 : 36}
        />
        <div className={styles.composerBody}>
            {!small && (onKindChange || composerAction) ? (
                <div className={styles.composerToolbar}>
                    {onKindChange ? (
                        <select
                            className={styles.kindSelect}
                            value={kind}
                            disabled={busy}
                            onChange={event => onKindChange(event.target.value)}
                            aria-label="Comment type"
                        >
                            {COMMENT_KINDS.map(item => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>
                    ) : null}
                    {composerAction ? <div className={styles.composerAction}>{composerAction}</div> : null}
                </div>
            ) : null}
            <textarea
                className={styles.input}
                placeholder={placeholder}
                value={value}
                maxLength={500}
                disabled={busy}
                onChange={e => onChange(e.target.value)}
            />
            {error ? <div className={styles.error}>{error}</div> : null}
            <div className={styles.composerButtons}>
                <button
                    type="button"
                    className={styles.post}
                    disabled={busy || !value.trim()}
                    onClick={onSubmit}
                >{small ? 'Reply' : 'Post'}</button>
                {onCancel ? (
                    <button
                        type="button"
                        className={styles.cancel}
                        disabled={busy}
                        onClick={onCancel}
                    >Cancel</button>
                ) : null}
            </div>
        </div>
    </div>
);

const CommentThread = ({
    source, canModerate, disabled, disabledReason, reportContext, projectComments = false, composerAction
}) => {
    const {user, login} = useUser();
    const viewerName = (user && user.username) || '';
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState('');
    const [kind, setKind] = useState('comment');
    const [kindFilter, setKindFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [loadingComments, setLoadingComments] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [reportId, setReportId] = useState(null);
    const [replyLimits, setReplyLimits] = useState({});
    const [removingId, setRemovingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [reactingId, setReactingId] = useState(null);
    const sourceRef = useRef(source);
    const viewerRef = useRef(viewerName);
    const actionLocks = useRef(new Map());
    sourceRef.current = source;
    viewerRef.current = viewerName;

    const beginAction = (actionSource, actionViewer, name) => {
        let locks = actionLocks.current.get(actionSource);
        if (!locks) {
            locks = new Set();
            actionLocks.current.set(actionSource, locks);
        }
        const key = `${actionViewer}\u0000${name}`;
        if (locks.has(key)) return null;
        locks.add(key);
        return () => {
            locks.delete(key);
            if (!locks.size) actionLocks.current.delete(actionSource);
        };
    };

    const beginLoad = useLatest();

    const INITIAL_LIMIT = 3;
    const REPLY_PAGE = 5;

    const showMoreReplies = useCallback(id => {
        setReplyLimits(prev => ({
            ...prev,
            [id]: (prev[id] ?? INITIAL_LIMIT) + REPLY_PAGE
        }));
    }, []);

    const hideReplies = useCallback(id => {
        setReplyLimits(prev => {
            const next = {...prev};
            delete next[id];
            return next;
        });
    }, []);

    const load = useCallback(() => {
        const fresh = beginLoad();
        setLoadingComments(true);
        setLoadFailed(false);
        Promise.resolve()
            .then(() => source.list())
            .then(fresh(d => {
                setComments((d.comments || []).sort((a, b) => (b.created || 0) - (a.created || 0)));
                setLoadingComments(false);
            }))
            .catch(fresh(() => {
                setLoadFailed(true);
                setLoadingComments(false);
            }));
    }, [source, beginLoad, viewerName]);

    useEffect(() => {
        setComments([]);
        setContent('');
        setKind('comment');
        setKindFilter('all');
        setSearch('');
        setReplyTo(null);
        setReplyText('');
        setBusy(false);
        setError(null);
        setReportId(null);
        setReplyLimits({});
        setRemovingId(null);
        setDeleteId(null);
        setReactingId(null);
        setLoadingComments(true);
        setLoadFailed(false);
        load();
    }, [load]);

    // If the page was opened deep-linking to a reply (e.g. from a notification),
    // expand that reply's thread so the anchor can be found and scrolled to.
    useEffect(() => {
        if (!comments.length) return;
        const match = window.location.hash.match(/^#comment-id-(.+)$/);
        if (!match) return;
        const target = comments.find(c => String(c.id) === match[1]);
        if (target && target.parent) {
            const replyCount = comments.filter(c => c.parent === target.parent).length;
            setReplyLimits(prev => ({...prev, [target.parent]: replyCount}));
        }
    }, [comments]);

    const submit = async (text, parent, commentKind = 'comment') => {
        if (!text.trim()) return;
        const actionSource = source;
        const actionViewer = viewerName;
        const releaseAction = beginAction(actionSource, actionViewer, 'submit');
        if (!releaseAction) return;
        setBusy(true);
        setError(null);
        try {
            await actionSource.add(text.trim(), parent, commentKind);
            if (sourceRef.current !== actionSource || viewerRef.current !== actionViewer) return;
            setContent('');
            setKind('comment');
            setReplyText('');
            setReplyTo(null);
            load();
        } catch (e) {
            if (sourceRef.current === actionSource && viewerRef.current === actionViewer) {
                setError(e.message || 'Could not post comment.');
            }
        } finally {
            releaseAction();
            if (sourceRef.current === actionSource && viewerRef.current === actionViewer) setBusy(false);
        }
    };

    const remove = async commentId => {
        const actionSource = source;
        const actionViewer = viewerName;
        const releaseAction = beginAction(actionSource, actionViewer, 'remove');
        if (!releaseAction) return;
        setRemovingId(commentId);
        try {
            await actionSource.remove(commentId);
            if (sourceRef.current !== actionSource || viewerRef.current !== actionViewer) return;
            setComments(cs => cs.filter(c => c.id !== commentId && c.parent !== commentId));
            setDeleteId(null);
        } catch (e) {
            if (sourceRef.current === actionSource && viewerRef.current === actionViewer) {
                setError(e.message || 'Could not delete comment.');
            }
        } finally {
            releaseAction();
            if (sourceRef.current === actionSource && viewerRef.current === actionViewer) setRemovingId(null);
        }
    };

    const toggleReaction = (reactions, type, username) => {
        const had = (reactions[type] || []).some(name => sameUser(name, username));
        const next = {};
        for (const key of Object.keys(reactions)) {
            next[key] = (reactions[key] || []).filter(name => !sameUser(name, username));
        }
        if (!had) next[type] = [...(next[type] || []), username];
        return next;
    };

    const react = async (commentId, type) => {
        if (!source.react || !user) return;
        const actionSource = source;
        const actionViewer = viewerName;
        const releaseAction = beginAction(actionSource, actionViewer, 'react');
        if (!releaseAction) return;
        setReactingId(commentId);
        try {
            await actionSource.react(commentId, type);
            if (sourceRef.current !== actionSource || viewerRef.current !== actionViewer) return;
            setComments(cs => cs.map(c => (c.id === commentId ?
                {...c, reactions: toggleReaction(c.reactions || {}, type, actionViewer)} :
                c)));
        } catch (e) {
            if (sourceRef.current === actionSource && viewerRef.current === actionViewer) {
                setError(e.message || 'Could not react.');
            }
        } finally {
            releaseAction();
            if (sourceRef.current === actionSource && viewerRef.current === actionViewer) setReactingId(null);
        }
    };

    const openReply = (rootId, prefill = '') => {
        setReplyTo(rootId);
        setReplyText(prefill);
        setError(null);
    };

    const canDelete = comment => Boolean(user) &&
        (canModerate || user.isAdmin || sameUser(comment.author, user.username));
    const canReport = comment => Boolean(user) && !sameUser(comment.author, user.username);
    const canReply = Boolean(user) && !disabled;

    const {roots, replyMap} = useMemo(() => {
        const map = new Map();
        for (const c of comments) {
            if (!c.parent) continue;
            if (!map.has(c.parent)) map.set(c.parent, []);
            map.get(c.parent).push(c);
        }
        for (const list of map.values()) {
            list.sort((a, b) => (a.created || 0) - (b.created || 0));
        }
        return {roots: comments.filter(c => !c.parent), replyMap: map};
    }, [comments]);
    const repliesOf = parentId => replyMap.get(parentId) || [];
    const deleteComment = comments.find(comment => comment.id === deleteId);
    const filteredRoots = useMemo(() => {
        const query = search.trim().toLowerCase();
        return roots.filter(comment => {
            const commentKind = comment.kind || 'comment';
            if (projectComments && kindFilter !== 'all' && commentKind !== kindFilter) return false;
            if (!projectComments || !query) return true;
            const matches = item => `${item.author || ''}\n${item.content || ''}`.toLowerCase().includes(query);
            return matches(comment) || (replyMap.get(comment.id) || []).some(matches);
        });
    }, [roots, replyMap, kindFilter, search, projectComments]);

    return (
        <div className={styles.thread}>
            {disabled ? (
                <>
                    {composerAction ? (
                        <div className={styles.disabledComposerAction}>{composerAction}</div>
                    ) : null}
                    <p className={styles.signedOut}>{disabledReason || 'Comments are turned off.'}</p>
                </>
            ) : user ? (
                <InlineComposer
                    user={user}
                    value={content}
                    onChange={setContent}
                    onSubmit={() => submit(content, null, kind)}
                    placeholder="Add a comment"
                    busy={busy}
                    error={replyTo === null ? error : null}
                    kind={projectComments ? kind : null}
                    onKindChange={projectComments ? setKind : null}
                    composerAction={composerAction}
                />
            ) : (
                <p className={styles.signedOut}>
                    Sign in to comment. <button type="button" onClick={login}>Sign in</button>
                </p>
            )}

            {projectComments && comments.length ? (
                <div className={styles.commentTools}>
                    <input
                        type="search"
                        value={search}
                        placeholder="Search comments"
                        aria-label="Search comments"
                        onChange={event => setSearch(event.target.value)}
                    />
                    <select
                        value={kindFilter}
                        aria-label="Filter comments by type"
                        onChange={event => setKindFilter(event.target.value)}
                    >
                        <option value="all">All types</option>
                        {COMMENT_KINDS.map(item => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </select>
                </div>
            ) : null}

            {filteredRoots.length ? filteredRoots.map(comment => (
                <div
                    key={comment.id}
                    id={`comment-group-${comment.id}`}
                    className={styles.commentGroup}
                >
                    <CommentRow
                        comment={comment}
                        id={`comment-id-${comment.id}`}
                        onReply={() => openReply(comment.id)}
                        onDelete={() => {
                            setError(null);
                            setDeleteId(comment.id);
                        }}
                        onReact={type => react(comment.id, type)}
                        onReport={() => setReportId(comment.id)}
                        canReply={canReply}
                        canDelete={canDelete(comment)}
                        canReport={canReport(comment)}
                        deleting={removingId !== null}
                        reacting={reactingId !== null}
                    />
                    <div className={styles.replies}>
                        {(() => {
                            const all = repliesOf(comment.id);
                            const limit = replyLimits[comment.id] ?? INITIAL_LIMIT;
                            const visible = all.slice(0, limit);
                            const hidden = all.length - visible.length;
                            return (
                                <>
                                    {visible.map(reply => (
                                        <CommentRow
                                            key={reply.id}
                                            comment={reply}
                                            id={`comment-id-${reply.id}`}
                                            isReply
                                            canReply={canReply}
                                            canDelete={canDelete(reply)}
                                            canReport={canReport(reply)}
                                            deleting={removingId !== null}
                                            reacting={reactingId !== null}
                                            onReply={() => openReply(comment.id, `@${reply.author} `)}
                                            onDelete={() => {
                                                setError(null);
                                                setDeleteId(reply.id);
                                            }}
                                            onReact={type => react(reply.id, type)}
                                            onReport={() => setReportId(reply.id)}
                                        />
                                    ))}
                                    {hidden > 0 ? (
                                        <button
                                            type="button"
                                            className={styles.showMore}
                                            onClick={() => showMoreReplies(comment.id)}
                                        >
                                            Show {hidden} more {hidden === 1 ? 'reply' : 'replies'}
                                        </button>
                                    ) : all.length > INITIAL_LIMIT ? (
                                        <button
                                            type="button"
                                            className={styles.showMore}
                                            onClick={() => hideReplies(comment.id)}
                                        >
                                            Hide replies
                                        </button>
                                    ) : null}
                                </>
                            );
                        })()}
                        {replyTo === comment.id && user ? (
                            <InlineComposer
                                small
                                user={user}
                                value={replyText}
                                onChange={setReplyText}
                                onSubmit={() => submit(replyText, comment.id)}
                                onCancel={() => setReplyTo(null)}
                                placeholder={`Reply to ${comment.author}`}
                                busy={busy}
                                error={error}
                            />
                        ) : null}
                    </div>
                </div>
            )) : (
                <p className={styles.empty}>
                    {loadingComments ? 'Loading comments…' : loadFailed ? (
                        <>
                            Comments could not be loaded right now.{' '}
                            <button type="button" className={styles.showMore} onClick={load}>Try again</button>
                        </>
                    ) : comments.length ? 'No comments match those filters.' : 'No comments yet.'}
                </p>
            )}
            {reportId ? (
                <ReportModal
                    type="comment"
                    target={reportId}
                    context={reportContext}
                    onClose={() => setReportId(null)}
                />
            ) : null}
            {deleteComment ? (
                <Modal
                    icon={Trash2}
                    title="Delete comment?"
                    onClose={() => setDeleteId(null)}
                    dismissDisabled={removingId !== null}
                    actions={(
                        <React.Fragment>
                            <button
                                type="button"
                                className={styles.cancel}
                                disabled={removingId !== null}
                                onClick={() => setDeleteId(null)}
                            >Cancel</button>
                            <button
                                type="button"
                                className={styles.deleteConfirm}
                                disabled={removingId !== null}
                                onClick={() => remove(deleteComment.id)}
                            >{removingId !== null ? 'Deleting…' : 'Delete comment'}</button>
                        </React.Fragment>
                    )}
                >
                    <p className={styles.modalText}>
                        This comment will be deleted permanently.
                        {deleteComment.parent ? '' : ' Its replies will also be removed.'}
                    </p>
                    <p className={styles.commentPreview}>{deleteComment.content}</p>
                    {error ? <p className={styles.error}>{error}</p> : null}
                </Modal>
            ) : null}
        </div>
    );
};

export default CommentThread;
