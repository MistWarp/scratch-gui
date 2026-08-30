import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Bookmark, Check, Copy, Edit3, Flag, Heart, MessageCircle, Pin, Repeat2,
    ShieldOff, Trash2
} from 'lucide-react';
import rotur from '../rotur.js';
import {timeAgo} from '../format.js';
import {postUrl} from '../following-feed.js';
import {useUser} from '../UserContext.jsx';
import Avatar from './Avatar.jsx';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import PostAttachment from './PostAttachment.jsx';
import RichText from './RichText.jsx';
import UserLink from './UserLink.jsx';
import styles from './SocialPost.module.css';

const count = value => (Array.isArray(value) ? value.length : Number(value) || 0);

const Poll = ({postId, poll, onChange}) => {
    const [busy, setBusy] = useState(false);
    const voted = Number.isInteger(poll.voted) ? poll.voted : null;
    const total = Number(poll.total) || 0;
    const vote = async option => {
        if (busy || voted !== null) return;
        setBusy(true);
        try {
            const result = await rotur.votePost(postId, option);
            if (result && result.poll) onChange(result.poll);
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className={styles.poll}>
            {(poll.options || []).map((option, index) => {
                const percentage = total ? Math.round((Number(option.count) || 0) / total * 100) : 0;
                return voted !== null ? (
                    <div className={styles.pollResult} key={`${option.text}-${index}`}>
                        <span className={styles.pollBar} style={{width: `${percentage}%`}} />
                        <span>{voted === index ? <Check size={13} /> : null}{option.text}</span>
                        <strong>{percentage}%</strong>
                    </div>
                ) : (
                    <button type="button" key={`${option.text}-${index}`} disabled={busy} onClick={() => vote(index)}>
                        {option.text}
                    </button>
                );
            })}
            <small>{total} {total === 1 ? 'vote' : 'votes'}</small>
        </div>
    );
};

Poll.propTypes = {
    postId: PropTypes.string.isRequired,
    poll: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

const SocialPost = ({initialPost, detail = false, onChange, onDelete}) => {
    const {user, login} = useUser();
    const navigate = useNavigate();
    const [post, setPost] = useState(initialPost);
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [reply, setReply] = useState('');
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(initialPost.content || '');
    const [saved, setSaved] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const mine = Boolean(user && String(user.username).toLowerCase() === String(post.user).toLowerCase());
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const liked = Boolean(user && likes.some(name => (
        String(name).toLowerCase() === String(user.username).toLowerCase()
    )));
    const replies = Array.isArray(post.replies) ? post.replies : [];
    const media = post.attachments && post.attachments.length ? post.attachments :
        (post.attachment ? [post.attachment] : []);

    const update = next => {
        setPost(next);
        if (onChange) onChange(next);
    };
    const run = async (name, action) => {
        if (!user) {
            login();
            return null;
        }
        setBusy(name);
        setError('');
        setNotice('');
        try {
            return await action();
        } catch (cause) {
            setError(cause.message || 'Could not update this post.');
            return null;
        } finally {
            setBusy('');
        }
    };

    useEffect(() => {
        setPost(initialPost);
        setEditText(initialPost.content || '');
    }, [initialPost]);

    useEffect(() => {
        if (!user || !detail) return;
        let active = true;
        Promise.allSettled([rotur.bookmarks(), rotur.blockedUsers()]).then(([bookmarks, blocks]) => {
            if (!active) return;
            if (bookmarks.status === 'fulfilled') {
                setSaved((bookmarks.value || []).some(item => item.id === post.id));
            }
            if (blocks.status === 'fulfilled') {
                setBlocked((blocks.value.blocked || []).some(name => (
                    String(name).toLowerCase() === String(post.user).toLowerCase()
                )));
            }
        });
        return () => {
            active = false;
        };
    }, [detail, post.id, post.user, user && user.username]);

    const toggleLike = () => run('like', async () => {
        const nextLikes = liked ? likes.filter(name => String(name).toLowerCase() !== user.username.toLowerCase()) :
            [...likes, user.username];
        update({...post, likes: nextLikes});
        try {
            if (liked) await rotur.unlikePost(post.id);
            else await rotur.likePost(post.id);
        } catch (cause) {
            update({...post, likes});
            throw cause;
        }
    });
    const sendReply = event => {
        event.preventDefault();
        const content = reply.trim();
        if (!content) return;
        run('reply', async () => {
            const created = await rotur.replyToPost(post.id, content);
            update({...post, replies: [...replies, {...created, user: created.user || user.username}]});
            setReply('');
        });
    };
    const saveEdit = event => {
        event.preventDefault();
        const content = editText.trim();
        if (!content) return;
        run('edit', async () => {
            const result = await rotur.editPost(post.id, content);
            update({...post, content, edited_at: result.edited_at || Date.now()});
            setEditing(false);
        });
    };
    const toggleSaved = () => run('save', async () => {
        if (saved) await rotur.unbookmarkPost(post.id);
        else await rotur.bookmarkPost(post.id);
        setSaved(!saved);
        setNotice(saved ? 'Removed from saved posts.' : 'Post saved.');
    });
    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}${postUrl(post.id)}`);
            setNotice('Link copied.');
        } catch (_) {
            setError('Could not copy the link.');
        }
    };

    return (
        <article className={detail ? styles.detail : styles.card}>
            {confirmDelete ? (
                <Modal
                    icon={Trash2}
                    title="Delete post?"
                    onClose={() => setConfirmDelete(false)}
                    actions={<>
                        <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
                        <Button
                            variant="danger" busy={busy === 'delete'} onClick={() => run('delete', async () => {
                                await rotur.deletePost(post.id);
                                setConfirmDelete(false);
                                if (onDelete) onDelete(post.id);
                                else navigate(`/users/${post.user}`);
                            })}
                        >Delete post</Button>
                    </>}
                ><p>This permanently deletes the post.</p></Modal>
            ) : null}
            {reportTarget ? (
                <Modal
                    icon={Flag}
                    title={`Report ${reportTarget.type}`}
                    onClose={() => setReportTarget(null)}
                    actions={<>
                        <Button onClick={() => setReportTarget(null)}>Cancel</Button>
                        <Button
                            variant="danger" disabled={!reportReason.trim()} busy={busy === 'report'} onClick={() => (
                                run('report', async () => {
                                    await rotur.reportPost(
                                        reportTarget.type,
                                        reportTarget.id,
                                        reportReason.trim()
                                    );
                                    setReportTarget(null);
                                    setReportReason('');
                                    setNotice('Report submitted.');
                                })
                            )}
                        >Submit report</Button>
                    </>}
                >
                    <textarea
                        className={styles.reportInput}
                        value={reportReason}
                        maxLength={1000}
                        placeholder={`What is wrong with this ${reportTarget.type}?`}
                        onChange={event => setReportReason(event.target.value)}
                    />
                </Modal>
            ) : null}
            <UserLink username={post.user}><Avatar username={post.user} size={44} /></UserLink>
            <div className={styles.body}>
                <header>
                    <UserLink username={post.user}><strong>{post.user}</strong></UserLink>
                    {post.pinned ? <span className={styles.tag}><Pin size={11} /> Pinned</span> : null}
                    <time>{timeAgo(post.timestamp)}</time>
                    {post.edited_at ? <span className={styles.edited}>edited</span> : null}
                </header>
                {editing ? (
                    <form className={styles.editForm} onSubmit={saveEdit}>
                        <textarea
                            value={editText}
                            maxLength={2000}
                            onChange={event => setEditText(event.target.value)}
                        />
                        <div>
                            <Button onClick={() => setEditing(false)}>Cancel</Button>
                            <Button type="submit" variant="primary" busy={busy === 'edit'}>Save</Button>
                        </div>
                    </form>
                ) : <div className={styles.content}><RichText text={post.content || ''} /></div>}
                {media.length ? (
                    <div className={styles.media} data-count={media.length}>
                        {media.map(url => <PostAttachment key={url} url={url} />)}
                    </div>
                ) : null}
                {post.poll ? (
                    <Poll postId={post.id} poll={post.poll} onChange={poll => update({...post, poll})} />
                ) : null}
                {post.is_repost && post.original_post ? (
                    <div className={styles.quoted}><SocialPost initialPost={post.original_post} /></div>
                ) : null}
                <div className={styles.via}>
                    {post.os ? `Posted from ${post.os}` : null}
                    {post.views ? (
                        `${post.os ? ' · ' : ''}${post.views} ${post.views === 1 ? 'view' : 'views'}`
                    ) : null}
                </div>
                <div className={styles.actions}>
                    <Button
                        onClick={toggleLike}
                        disabled={Boolean(busy)}
                        aria-label={liked ? 'Unlike post' : 'Like post'}
                    >
                        <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {count(likes)}
                    </Button>
                    <Button onClick={() => (detail ? null : navigate(postUrl(post.id)))}>
                        <MessageCircle size={16} /> {count(replies)}
                    </Button>
                    {!post.is_repost && !post.profile_only ? <Button
                        disabled={Boolean(busy)} onClick={() => run('repost', async () => {
                            await rotur.repost(post.id);
                            setNotice('Reposted to your profile.');
                        })}
                    ><Repeat2 size={16} /> {detail ? 'Repost' : null}</Button> : null}
                    <Button disabled={Boolean(busy)} onClick={toggleSaved}>
                        <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                        {detail ? (saved ? 'Saved' : 'Save') : null}
                    </Button>
                    {detail ? <Button onClick={copyLink}><Copy size={16} /> Copy link</Button> : null}
                </div>
                <div className={styles.manage}>
                    {mine && !post.is_repost ? (
                        <Button onClick={() => setEditing(true)}><Edit3 size={15} /> Edit</Button>
                    ) : null}
                    {mine ? <Button
                        onClick={() => run('pin', async () => {
                            if (post.pinned) await rotur.unpinPost(post.id);
                            else await rotur.pinPost(post.id);
                            update({...post, pinned: !post.pinned});
                        })}
                    ><Pin size={15} /> {post.pinned ? 'Unpin' : 'Pin'}</Button> : null}
                    {mine ? (
                        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                            <Trash2 size={15} /> Delete
                        </Button>
                    ) : null}
                    {!mine ? (
                        <Button onClick={() => setReportTarget({type: 'post', id: post.id})}>
                            <Flag size={15} /> Report
                        </Button>
                    ) : null}
                    {!mine && user ? <Button
                        onClick={() => run('block', async () => {
                            if (blocked) await rotur.unblockUser(post.user);
                            else await rotur.blockUser(post.user);
                            setBlocked(!blocked);
                            setNotice(blocked ? `Unblocked ${post.user}.` : `Blocked ${post.user}.`);
                        })}
                    >
                        <ShieldOff size={15} /> {blocked ? 'Unblock' : 'Block'} {post.user}
                    </Button> : null}
                </div>
                {error ? <p className={styles.error} role="alert">{error}</p> : null}
                {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
                {detail ? (
                    <div className={styles.replies}>
                        {user ? (
                            <form onSubmit={sendReply}>
                                <Avatar username={user.username} size={32} />
                                <input
                                    value={reply}
                                    maxLength={1000}
                                    placeholder="Post your reply"
                                    onChange={event => setReply(event.target.value)}
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    busy={busy === 'reply'}
                                    disabled={!reply.trim()}
                                >Reply</Button>
                            </form>
                        ) : <Button onClick={login}>Sign in to reply</Button>}
                        {replies.map(item => (
                            <div className={styles.reply} key={item.id}>
                                <UserLink username={item.user}>
                                    <Avatar username={item.user} size={32} />
                                </UserLink>
                                <div>
                                    <header>
                                        <UserLink username={item.user}><strong>{item.user}</strong></UserLink>
                                        <time>{timeAgo(item.timestamp)}</time>
                                    </header>
                                    <RichText text={item.content || ''} />
                                </div>
                                {user && item.user.toLowerCase() !== user.username.toLowerCase() ? (
                                    <button
                                        type="button"
                                        aria-label="Report reply"
                                        onClick={() => setReportTarget({type: 'reply', id: item.id})}
                                    ><Flag size={14} /></button>
                                ) : null}
                            </div>
                        ))}
                        {!replies.length ? <p className={styles.empty}>No replies yet.</p> : null}
                    </div>
                ) : null}
            </div>
        </article>
    );
};

SocialPost.propTypes = {
    initialPost: PropTypes.object.isRequired,
    detail: PropTypes.bool,
    onChange: PropTypes.func,
    onDelete: PropTypes.func
};

export default SocialPost;
