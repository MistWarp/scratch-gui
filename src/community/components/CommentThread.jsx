import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {Link} from 'react-router-dom';
import {Reply, Search, MoreHorizontal, Pencil, Flag, Trash2} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import Avatar from './Avatar.jsx';
import ReactionButtons from './ReactionButtons.jsx';
import ReportModal from './ReportModal.jsx';
import Modal from './ui/Modal.jsx';
import SelectMenu from './ui/SelectMenu.jsx';
import RichText from './RichText.jsx';
import GroupTag from './GroupTag.jsx';
import Dropdown, {DropdownItem} from './ui/Dropdown.jsx';
import {timeAgo, sameUser, formatPlaytime} from '../format';
import useLatest from '../use-latest.js';
import styles from './CommentThread.module.css';

const COMMENT_KINDS = [
    {value: 'comment', label: 'Comment'},
    {value: 'bug', label: 'Bug report'},
    {value: 'suggestion', label: 'Suggestion'},
    {value: 'question', label: 'Question'}
];
const ROOT_PAGE = 20;
export const addCreatedComment = (comments, comment) => {
    const previous = (comments || []).find(item => sameUser(item.author, comment.author));
    const created = previous && Number.isFinite(previous.playtimeMs) ?
        {...comment, playtimeMs: previous.playtimeMs} : comment;
    return [created, ...(comments || []).filter(item => item.id !== created.id)];
};
export const mergeCommentPages = (current, incoming) => {
    const byId = new Map((current || []).map(comment => [comment.id, comment]));
    for (const comment of incoming || []) byId.set(comment.id, comment);
    return Array.from(byId.values()).sort((a, b) => (b.created || 0) - (a.created || 0));
};
const kindLabel = kind => COMMENT_KINDS.find(item => item.value === kind)?.label || 'Comment';

const CommentRow = ({
    comment, onReply, onDelete, onEdit, onSaveEdit, onCancelEdit, onReact, onReport, canReply, canDelete,
    canEdit, canReport, deleting, editing, editText, editBusy, onEditTextChange, reacting, isReply, id
}) => {
    const hasMenu = canEdit || canReport || canDelete;
    return (
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
                    <GroupTag username={comment.author} compact />
                    {!isReply && comment.kind && comment.kind !== 'comment' ? (
                        <span className={`${styles.kind} ${styles[`kind-${comment.kind}`] || ''}`}>
                            {kindLabel(comment.kind)}
                        </span>
                    ) : null}
                    {Number.isFinite(comment.playtimeMs) && comment.playtimeMs > 0 ? (
                        <span className={styles.playtime}>{formatPlaytime(comment.playtimeMs)}</span>
                    ) : null}
                    {comment.created ? (
                        <span className={styles.time}>{timeAgo(comment.created)}</span>
                    ) : null}
                    {comment.edited ? (
                        <span className={styles.edited} title="Edited" aria-label="Edited">✎</span>
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
                    {hasMenu ? (
                        <Dropdown
                            renderTrigger={({toggle}) => (
                                <button
                                    type="button"
                                    className={styles.iconAction}
                                    aria-label="Comment actions"
                                    title="Comment actions"
                                    onClick={toggle}
                                >
                                    <MoreHorizontal size={15} />
                                </button>
                            )}
                        >
                            {({close}) => (
                                <>
                                    {canEdit ? <DropdownItem
                                        onClick={() => {
                                            close(); onEdit();
                                        }}
                                    ><Pencil size={14} /> Edit comment</DropdownItem> : null}
                                    {canReport ? <DropdownItem
                                        onClick={() => {
                                            close(); onReport();
                                        }}
                                    ><Flag size={14} /> Report comment</DropdownItem> : null}
                                    {canDelete ? <DropdownItem
                                        danger disabled={deleting} onClick={() => {
                                            close(); onDelete();
                                        }}
                                    ><Trash2 size={14} /> Delete comment</DropdownItem> : null}
                                </>
                            )}
                        </Dropdown>
                    ) : null}
                </div>
                {editing ? (
                    <div className={styles.editComposer}>
                        <textarea
                            className={styles.input}
                            value={editText}
                            maxLength={500}
                            disabled={editBusy}
                            onChange={event => onEditTextChange(event.target.value)}
                        />
                        <div className={styles.composerButtons}>
                            <button
                                type="button"
                                className={styles.cancel}
                                disabled={editBusy}
                                onClick={onCancelEdit}
                            >Cancel</button>
                            <button
                                type="button"
                                className={styles.post}
                                disabled={editBusy || !editText.trim()}
                                onClick={onSaveEdit}
                            >{editBusy ? 'Saving…' : 'Save'}</button>
                        </div>
                    </div>
                ) : <p className={styles.text}><RichText text={comment.content} /></p>}
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
};

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
            <textarea
                className={styles.input}
                placeholder={placeholder}
                value={value}
                maxLength={500}
                disabled={busy}
                onChange={e => onChange(e.target.value)}
            />
            {error ? <div className={styles.error}>{error}</div> : null}
            <div className={styles.composerFooter}>
                {!small && onKindChange ? (
                    <SelectMenu
                        compact
                        className={styles.kindMenu}
                        options={COMMENT_KINDS}
                        value={kind}
                        disabled={busy}
                        onChange={onKindChange}
                        ariaLabel="Comment type"
                        width={180}
                    />
                ) : null}
                {composerAction ? <div className={styles.composerAction}>{composerAction}</div> : null}
                <div className={styles.composerButtons}>
                    {onCancel ? (
                        <button
                            type="button"
                            className={styles.cancel}
                            disabled={busy}
                            onClick={onCancel}
                        >Cancel</button>
                    ) : null}
                    <button
                        type="button"
                        className={styles.post}
                        disabled={busy || !value.trim()}
                        onClick={onSubmit}
                    >{small ? 'Reply' : 'Post'}</button>
                </div>
            </div>
        </div>
    </div>
);

const CommentThread = ({
    source, canModerate, disabled, disabledReason, reportContext, projectComments = false, composerAction,
    onCountChange = null
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
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [editBusy, setEditBusy] = useState(false);
    const [reactingId, setReactingId] = useState(null);
    const [rootLimit, setRootLimit] = useState(ROOT_PAGE);
    const [totalRoots, setTotalRoots] = useState(0);
    const [nextOffset, setNextOffset] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [moreFailed, setMoreFailed] = useState(false);
    const [allCommentsLoaded, setAllCommentsLoaded] = useState(false);
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
    const beginExtraLoad = useLatest();

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
            .then(() => {
                const anchorMatch = window.location.hash.match(/^#comment-id-(.+)$/);
                return source.list({
                    offset: 0,
                    limit: ROOT_PAGE,
                    anchor: anchorMatch ? anchorMatch[1] : ''
                });
            })
            .then(fresh(d => {
                const loaded = (d.comments || []).sort((a, b) => (b.created || 0) - (a.created || 0));
                const loadedRoots = loaded.filter(comment => !comment.parent).length;
                const hasPaging = Number.isFinite(d.totalRoots) && Number.isFinite(d.nextOffset);
                setComments(loaded);
                setTotalRoots(hasPaging ? d.totalRoots : loadedRoots);
                setNextOffset(hasPaging ? d.nextOffset : loadedRoots);
                setAllCommentsLoaded(!hasPaging || d.nextOffset >= d.totalRoots);
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
        setEditingId(null);
        setEditText('');
        setEditBusy(false);
        setReactingId(null);
        setRootLimit(ROOT_PAGE);
        setTotalRoots(0);
        setNextOffset(0);
        setLoadingMore(false);
        setMoreFailed(false);
        setAllCommentsLoaded(false);
        setLoadingComments(true);
        setLoadFailed(false);
        beginExtraLoad();
        load();
    }, [beginExtraLoad, load]);

    const loadMore = async () => {
        if (loadingMore || nextOffset >= totalRoots) return;
        const actionSource = source;
        const actionViewer = viewerName;
        setLoadingMore(true);
        setMoreFailed(false);
        try {
            const data = await actionSource.list({offset: nextOffset, limit: ROOT_PAGE});
            if (sourceRef.current !== actionSource || viewerRef.current !== actionViewer) return;
            setComments(current => mergeCommentPages(current, data.comments));
            const next = Number.isFinite(data.nextOffset) ? data.nextOffset : nextOffset + ROOT_PAGE;
            const total = Number.isFinite(data.totalRoots) ? data.totalRoots : totalRoots;
            setNextOffset(next);
            setTotalRoots(total);
            setAllCommentsLoaded(next >= total);
            setRootLimit(limit => limit + ROOT_PAGE);
        } catch (e) {
            if (sourceRef.current === actionSource && viewerRef.current === actionViewer) setMoreFailed(true);
        } finally {
            if (sourceRef.current === actionSource && viewerRef.current === actionViewer) setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!projectComments || allCommentsLoaded || loadingComments || loadingMore) return;
        if (!search.trim() && kindFilter === 'all') return;
        const actionSource = source;
        const actionViewer = viewerName;
        const fresh = beginExtraLoad();
        const timer = window.setTimeout(() => {
            setLoadingMore(true);
            setMoreFailed(false);
            actionSource.list({all: true})
                .then(fresh(data => {
                    if (sourceRef.current !== actionSource || viewerRef.current !== actionViewer) return;
                    const loaded = (data.comments || []).sort((a, b) => (b.created || 0) - (a.created || 0));
                    const rootCount = Number.isFinite(data.totalRoots) ?
                        data.totalRoots : loaded.filter(comment => !comment.parent).length;
                    setComments(loaded);
                    setTotalRoots(rootCount);
                    setNextOffset(rootCount);
                    setAllCommentsLoaded(true);
                    setLoadingMore(false);
                }))
                .catch(fresh(() => {
                    setMoreFailed(true);
                    setLoadingMore(false);
                }));
        }, 250);
        return () => window.clearTimeout(timer);
    }, [allCommentsLoaded, beginExtraLoad, kindFilter, loadingComments, loadingMore, projectComments,
        search, source, viewerName]);

    // If the page was opened deep-linking to a reply (e.g. from a notification),
    // expand that reply's thread so the anchor can be found and scrolled to.
    useEffect(() => {
        if (!comments.length) return;
        const match = window.location.hash.match(/^#comment-id-(.+)$/);
        if (!match) return;
        const target = comments.find(c => String(c.id) === match[1]);
        const rootId = target && (target.parent || target.id);
        const rootIndex = comments.filter(c => !c.parent).findIndex(c => c.id === rootId);
        if (rootIndex >= 0) setRootLimit(limit => Math.max(limit, rootIndex + 1));
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
            const data = await actionSource.add(text.trim(), parent, commentKind);
            if (sourceRef.current !== actionSource || viewerRef.current !== actionViewer) return;
            if (data && data.comment) {
                setComments(current => addCreatedComment(current, data.comment));
                if (!data.comment.parent) {
                    setTotalRoots(total => total + 1);
                    setNextOffset(offset => offset + 1);
                }
                if (onCountChange) onCountChange(1);
            }
            setContent('');
            setKind('comment');
            setReplyText('');
            setReplyTo(null);
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
        const removingComment = comments.find(comment => comment.id === commentId);
        try {
            await actionSource.remove(commentId);
            if (sourceRef.current !== actionSource || viewerRef.current !== actionViewer) return;
            const removedCount = comments.filter(c => c.id === commentId || c.parent === commentId).length;
            setComments(cs => cs.filter(c => c.id !== commentId && c.parent !== commentId));
            if (removingComment && !removingComment.parent) {
                setTotalRoots(total => Math.max(0, total - 1));
                setNextOffset(offset => Math.max(0, offset - 1));
            }
            if (onCountChange && removedCount) onCountChange(-removedCount);
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

    const saveEdit = async commentId => {
        if (!source.edit || !editText.trim()) return;
        const actionSource = source;
        const actionViewer = viewerName;
        const releaseAction = beginAction(actionSource, actionViewer, 'edit');
        if (!releaseAction) return;
        setEditBusy(true);
        setError(null);
        try {
            const data = await actionSource.edit(commentId, editText.trim());
            if (sourceRef.current !== actionSource || viewerRef.current !== actionViewer) return;
            if (data && data.comment) {
                setComments(cs => cs.map(comment => (
                    comment.id === commentId ? {...comment, ...data.comment} : comment
                )));
            }
            setEditingId(null);
            setEditText('');
        } catch (e) {
            if (sourceRef.current === actionSource && viewerRef.current === actionViewer) {
                setError(e.message || 'Could not edit comment.');
            }
        } finally {
            releaseAction();
            if (sourceRef.current === actionSource && viewerRef.current === actionViewer) setEditBusy(false);
        }
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
    const canEdit = comment => Boolean(source.edit && user) && sameUser(comment.author, user.username);
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
    const visibleRoots = filteredRoots.slice(0, rootLimit);

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
                    <label className={styles.searchField}>
                        <Search size={15} aria-hidden="true" />
                        <input
                            type="search"
                            value={search}
                            placeholder="Search comments"
                            aria-label="Search comments"
                            onChange={event => {
                                setSearch(event.target.value);
                                setRootLimit(ROOT_PAGE);
                            }}
                        />
                    </label>
                    <SelectMenu
                        compact
                        options={[{value: 'all', label: 'All types'}, ...COMMENT_KINDS]}
                        value={kindFilter}
                        className={styles.filterMenu}
                        ariaLabel="Filter comments by type"
                        onChange={nextKind => {
                            setKindFilter(nextKind);
                            setRootLimit(ROOT_PAGE);
                        }}
                        width={180}
                    />
                </div>
            ) : null}

            {filteredRoots.length ? (
                <>
                    {visibleRoots.map(comment => (
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
                                onEdit={() => {
                                    setError(null);
                                    setEditingId(comment.id);
                                    setEditText(comment.content || '');
                                }}
                                onSaveEdit={() => saveEdit(comment.id)}
                                onCancelEdit={() => setEditingId(null)}
                                editText={editText}
                                onEditTextChange={setEditText}
                                onReact={type => react(comment.id, type)}
                                onReport={() => setReportId(comment.id)}
                                canReply={canReply}
                                canDelete={canDelete(comment)}
                                canEdit={canEdit(comment)}
                                editing={editingId === comment.id}
                                editBusy={editBusy}
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
                                                    canEdit={canEdit(reply)}
                                                    editing={editingId === reply.id}
                                                    editBusy={editBusy}
                                                    canReport={canReport(reply)}
                                                    deleting={removingId !== null}
                                                    reacting={reactingId !== null}
                                                    onReply={() => openReply(comment.id, `@${reply.author} `)}
                                                    onDelete={() => {
                                                        setError(null);
                                                        setDeleteId(reply.id);
                                                    }}
                                                    onEdit={() => {
                                                        setError(null);
                                                        setEditingId(reply.id);
                                                        setEditText(reply.content || '');
                                                    }}
                                                    onSaveEdit={() => saveEdit(reply.id)}
                                                    onCancelEdit={() => setEditingId(null)}
                                                    editText={editText}
                                                    onEditTextChange={setEditText}
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
                    ))}
                    {visibleRoots.length < filteredRoots.length ? (
                        <button
                            type="button"
                            className={`${styles.showMore} ${styles.rootMore}`}
                            onClick={() => setRootLimit(limit => limit + ROOT_PAGE)}
                        >
                            Show {Math.min(ROOT_PAGE, filteredRoots.length - visibleRoots.length)} more comments
                        </button>
                    ) : nextOffset < totalRoots ? (
                        <button
                            type="button"
                            className={`${styles.showMore} ${styles.rootMore}`}
                            disabled={loadingMore}
                            onClick={loadMore}
                        >
                            {loadingMore ? 'Loading…' :
                                `Show ${Math.min(ROOT_PAGE, totalRoots - nextOffset)} more comments`}
                        </button>
                    ) : null}
                    {moreFailed ? <p className={styles.moreError}>Could not load more comments. Try again.</p> : null}
                </>
            ) : (
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
