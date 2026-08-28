import PropTypes from 'prop-types';
import React, {useRef, useState} from 'react';
import {ExternalLink, Heart, MessageCircle, Pin, Send, Trash2} from 'lucide-react';
import rotur from '../rotur';
import {timeAgo} from '../format';
import Avatar from './Avatar.jsx';
import Button from './ui/Button.jsx';
import RichText from './RichText.jsx';
import GroupTag from './GroupTag.jsx';
import Modal from './ui/Modal.jsx';
import styles from './ProfilePosts.module.css';

export const postMetricCount = value => (Array.isArray(value) ? value.length :
    (Number.isFinite(value) ? Math.max(0, value) : 0));
export const postTimestamp = value => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return numeric > 10000000000 ? numeric : numeric * 1000;
};
export const sortProfilePosts = posts => [...posts].sort((left, right) => {
    if (Boolean(left.pinned) !== Boolean(right.pinned)) return left.pinned ? -1 : 1;
    return (postTimestamp(right.timestamp) || 0) - (postTimestamp(left.timestamp) || 0);
});
export const pouncePostUrl = id => `https://pounce.rotur.dev/#/p/${encodeURIComponent(id)}`;

const ProfilePosts = ({posts, username, editable, onChange, onLogin}) => {
    const [content, setContent] = useState('');
    const [busy, setBusy] = useState(false);
    const [deleting, setDeleting] = useState('');
    const [confirmingDelete, setConfirmingDelete] = useState('');
    const [error, setError] = useState('');
    const submitInFlight = useRef(false);
    const deleteInFlight = useRef(new Set());
    const releaseSubmit = () => {
        submitInFlight.current = false;
    };

    const submit = async event => {
        event.preventDefault();
        const trimmed = content.trim();
        if (!trimmed || submitInFlight.current) return;
        submitInFlight.current = true;
        setBusy(true);
        setError('');
        try {
            const post = await rotur.createProfilePost(trimmed);
            onChange([post, ...posts]);
            setContent('');
        } catch (cause) {
            if ((cause.message || '').toLowerCase().includes('log in')) onLogin();
            setError(cause.message || 'Could not publish your post.');
        } finally {
            releaseSubmit();
            setBusy(false);
        }
    };

    const remove = async id => {
        if (deleteInFlight.current.has(id)) return;
        deleteInFlight.current.add(id);
        setDeleting(id);
        setError('');
        try {
            await rotur.deletePost(id);
            onChange(posts.filter(post => post.id !== id));
            setConfirmingDelete('');
        } catch (cause) {
            setError(cause.message || 'Could not delete this post.');
        } finally {
            deleteInFlight.current.delete(id);
            setDeleting('');
        }
    };

    const sorted = sortProfilePosts(posts);
    return (
        <div className={styles.posts}>
            {confirmingDelete ? (
                <Modal
                    icon={Trash2}
                    title="Delete profile post?"
                    dismissDisabled={deleting === confirmingDelete}
                    onClose={() => {
                        setConfirmingDelete('');
                        setError('');
                    }}
                    actions={(
                        <React.Fragment>
                            <Button
                                disabled={deleting === confirmingDelete}
                                onClick={() => {
                                    setConfirmingDelete('');
                                    setError('');
                                }}
                            >Cancel</Button>
                            <Button
                                variant="danger"
                                busy={deleting === confirmingDelete}
                                busyLabel="Deleting…"
                                onClick={() => remove(confirmingDelete)}
                            >Delete post</Button>
                        </React.Fragment>
                    )}
                >
                    <p>This permanently deletes the post from your Rotur profile.</p>
                    {error ? <p className={styles.error} role="alert">{error}</p> : null}
                </Modal>
            ) : null}
            {editable ? (
                <form className={styles.composer} onSubmit={submit}>
                    <textarea
                        value={content}
                        maxLength={2000}
                        disabled={busy}
                        placeholder="Post something to your profile"
                        aria-label="New profile post"
                        onChange={event => setContent(event.target.value)}
                    />
                    <div className={styles.composerFooter}>
                        <span>{content.length}/2000</span>
                        <Button
                            type="submit"
                            variant="primary"
                            busy={busy}
                            busyLabel="Posting…"
                            disabled={!content.trim()}
                        >
                            <Send size={15} /> Post
                        </Button>
                    </div>
                </form>
            ) : null}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            {!sorted.length ? (
                <p className={styles.empty}>
                    {editable ? 'You have not posted anything yet.' : `${username} has not posted anything yet.`}
                </p>
            ) : null}
            <div className={styles.list}>
                {sorted.map(post => {
                    const when = postTimestamp(post.timestamp);
                    return (
                        <article key={post.id} className={styles.post}>
                            <Avatar username={post.user || username} size={42} />
                            <div className={styles.body}>
                                <header>
                                    <strong>{post.user || username}</strong>
                                    <GroupTag username={post.user || username} compact />
                                    {post.pinned ? (
                                        <span className={styles.pinned}><Pin size={11} /> Pinned</span>
                                    ) : null}
                                    {when ? (
                                        <time
                                            dateTime={new Date(when).toISOString()}
                                            title={new Date(when).toLocaleString()}
                                        >{timeAgo(when)}</time>
                                    ) : null}
                                    {editable ? (
                                        <button
                                            type="button"
                                            className={styles.delete}
                                            disabled={deleting === post.id}
                                            onClick={() => {
                                                setError('');
                                                setConfirmingDelete(post.id);
                                            }}
                                            aria-label="Delete post"
                                        ><Trash2 size={15} /></button>
                                    ) : null}
                                </header>
                                <div className={styles.content}><RichText text={post.content || ''} /></div>
                                <footer>
                                    <span aria-label={`${postMetricCount(post.likes)} likes`}>
                                        <Heart size={15} /> {postMetricCount(post.likes)}
                                    </span>
                                    <span aria-label={`${postMetricCount(post.replies)} replies`}>
                                        <MessageCircle size={15} /> {postMetricCount(post.replies)}
                                    </span>
                                    <a
                                        href={pouncePostUrl(post.id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >Open on Pounce <ExternalLink size={13} /></a>
                                </footer>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
};

ProfilePosts.propTypes = {
    posts: PropTypes.arrayOf(PropTypes.object).isRequired,
    username: PropTypes.string.isRequired,
    editable: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    onLogin: PropTypes.func.isRequired
};

export default ProfilePosts;
