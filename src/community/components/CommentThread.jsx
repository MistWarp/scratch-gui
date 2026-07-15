import React, {useEffect, useState, useCallback} from 'react';
import {Link} from 'react-router-dom';
import {Trash2, Reply} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import Avatar from './Avatar.jsx';
import ReactionButtons from './ReactionButtons.jsx';
import {timeAgo, sameUser} from '../format';
import styles from './CommentThread.module.css';

const CommentRow = ({comment, onReply, onDelete, onReact, canReply, canDelete, isReply}) => (
    <div className={isReply ? styles.replyRow : styles.row}>
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
            <p className={styles.text}>{comment.content}</p>
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

const CommentThread = ({source, canModerate, disabled}) => {
    const {user} = useUser();
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(() => {
        source.list()
            .then(d => setComments((d.comments || []).sort((a, b) => (b.created || 0) - (a.created || 0))))
            .catch(() => setComments([]));
    }, [source]);

    useEffect(load, [load]);

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
            load();
        } catch (e) {
            setError(e.message || 'Could not delete comment.');
        }
    };

    const react = async (commentId, type) => {
        if (!source.react) return;
        try {
            await source.react(commentId, type);
            load();
        } catch (e) {
            setError(e.message || 'Could not react.');
        }
    };

    const openReply = (rootId, prefill = '') => {
        setReplyTo(rootId);
        setReplyText(prefill);
        setError(null);
    };

    const canDelete = comment => Boolean(user) && (canModerate || sameUser(comment.author, user.username));
    const canReply = Boolean(user) && !disabled;

    const roots = comments.filter(c => !c.parent);
    const repliesOf = parentId => comments.filter(c => c.parent === parentId);

    return (
        <div className={styles.thread}>
            {disabled ? (
                <p className={styles.signedOut}>Comments are turned off.</p>
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
                    className={styles.commentGroup}
                >
                    <CommentRow
                        comment={comment}
                        onReply={() => openReply(comment.id)}
                        onDelete={() => remove(comment.id)}
                        onReact={type => react(comment.id, type)}
                        canReply={canReply}
                        canDelete={canDelete(comment)}
                    />
                    <div className={styles.replies}>
                        {repliesOf(comment.id).map(reply => (
                            <CommentRow
                                key={reply.id}
                                comment={reply}
                                isReply
                                canReply={canReply}
                                canDelete={canDelete(reply)}
                                onReply={() => openReply(comment.id, `@${reply.author} `)}
                                onDelete={() => remove(reply.id)}
                                onReact={type => react(reply.id, type)}
                            />
                        ))}
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
            )) : <p className={styles.empty}>No comments yet.</p>}
        </div>
    );
};

export default CommentThread;
