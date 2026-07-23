import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {Link} from 'react-router-dom';
import {Trash2, Reply, Flag} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import Avatar from './Avatar.jsx';
import ReactionButtons from './ReactionButtons.jsx';
import ReportModal from './ReportModal.jsx';
import RichText from './RichText.jsx';
import {timeAgo, sameUser} from '../format';
import useLatest from '../use-latest.js';
import styles from './CommentThread.module.css';

const CommentRow = ({comment, onReply, onDelete, onReact, onReport, canReply, canDelete, canReport, isReply, id}) => (
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
                {comment.created ? (
                    <span className={styles.time}>{timeAgo(comment.created)}</span>
                ) : null}
                <span className={styles.headSpacer} />
                {canReply ? (
                    <button
                        className={styles.iconAction}
                        title="Reply"
                        onClick={onReply}
                    >
                        <Reply size={14} />
                    </button>
                ) : null}
                {canReport ? (
                    <button
                        className={styles.iconAction}
                        title="Report comment"
                        onClick={onReport}
                    >
                        <Flag size={13} />
                    </button>
                ) : null}
                {canDelete ? (
                    <button
                        className={styles.iconAction}
                        title="Delete comment"
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
                />
            </div>
        </div>
    </div>
);

const InlineComposer = ({user, value, onChange, onSubmit, onCancel, placeholder, busy, error, small}) => (
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
                onChange={e => onChange(e.target.value)}
            />
            {error ? <div className={styles.error}>{error}</div> : null}
            <div className={styles.composerButtons}>
                <button
                    className={styles.post}
                    disabled={busy || !value.trim()}
                    onClick={onSubmit}
                >{small ? 'Reply' : 'Post'}</button>
                {onCancel ? (
                    <button
                        className={styles.cancel}
                        onClick={onCancel}
                    >Cancel</button>
                ) : null}
            </div>
        </div>
    </div>
);

const CommentThread = ({source, canModerate, disabled, disabledReason, reportContext}) => {
    const {user} = useUser();
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [reportId, setReportId] = useState(null);
    const [replyLimits, setReplyLimits] = useState({});

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
        source.list()
            .then(fresh(d => {
                setComments((d.comments || []).sort((a, b) => (b.created || 0) - (a.created || 0)));
                setLoadFailed(false);
            }))
            .catch(fresh(() => setLoadFailed(true)));
    }, [source, beginLoad]);

    useEffect(() => {
        setComments([]);
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

    const submit = async (text, parent) => {
        if (!text.trim() || busy) return;
        setBusy(true);
        setError(null);
        try {
            await source.add(text.trim(), parent);
            setContent('');
            setReplyText('');
            setReplyTo(null);
            load();
        } catch (e) {
            setError(e.message || 'Could not post comment.');
        } finally {
            setBusy(false);
        }
    };

    const remove = async commentId => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await source.remove(commentId);
            setComments(cs => cs.filter(c => c.id !== commentId && c.parent !== commentId));
        } catch (e) {
            setError(e.message || 'Could not delete comment.');
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
        try {
            await source.react(commentId, type);
            setComments(cs => cs.map(c => (c.id === commentId ?
                {...c, reactions: toggleReaction(c.reactions || {}, type, user.username)} :
                c)));
        } catch (e) {
            setError(e.message || 'Could not react.');
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

    return (
        <div className={styles.thread}>
            {disabled ? (
                <p className={styles.signedOut}>{disabledReason || 'Comments are turned off.'}</p>
            ) : user ? (
                <InlineComposer
                    user={user}
                    value={content}
                    onChange={setContent}
                    onSubmit={() => submit(content, null)}
                    placeholder="Add a comment"
                    busy={busy}
                    error={replyTo === null ? error : null}
                />
            ) : (
                <p className={styles.signedOut}>Sign in to comment.</p>
            )}

            {roots.length ? roots.map(comment => (
                <div
                    key={comment.id}
                    id={`comment-group-${comment.id}`}
                    className={styles.commentGroup}
                >
                    <CommentRow
                        comment={comment}
                        id={`comment-id-${comment.id}`}
                        onReply={() => openReply(comment.id)}
                        onDelete={() => remove(comment.id)}
                        onReact={type => react(comment.id, type)}
                        onReport={() => setReportId(comment.id)}
                        canReply={canReply}
                        canDelete={canDelete(comment)}
                        canReport={canReport(comment)}
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
                                            onReply={() => openReply(comment.id, `@${reply.author} `)}
                                            onDelete={() => remove(reply.id)}
                                            onReact={type => react(reply.id, type)}
                                            onReport={() => setReportId(reply.id)}
                                        />
                                    ))}
                                    {hidden > 0 ? (
                                        <button
                                            className={styles.showMore}
                                            onClick={() => showMoreReplies(comment.id)}
                                        >
                                            Show {hidden} more {hidden === 1 ? 'reply' : 'replies'}
                                        </button>
                                    ) : all.length > INITIAL_LIMIT ? (
                                        <button
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
                    {loadFailed ? 'Comments could not be loaded right now.' : 'No comments yet.'}
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
        </div>
    );
};

export default CommentThread;
