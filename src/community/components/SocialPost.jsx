import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {
    Bookmark, Check, Copy, CornerDownRight, Edit3, Flag, Heart, Megaphone, MessageCircle,
    MoreHorizontal, PawPrint, Pin, Repeat2, ShieldOff, Trash2
} from 'lucide-react';
import api from '../api.js';
import rotur from '../rotur.js';
import {formatDateTime, timeAgo} from '../format.js';
import copyText from '../copy-text.js';
import {postUrl, timestampMs} from '../following-feed.js';
import {madeWithProject} from '../claw-links.js';
import {
    canPounce, mayPromote, postStats, pouncePostLink, promotedBy, replyContext, withLike
} from '../claw-posts.js';
import {useImpression} from '../impressions.js';
import {useUser} from '../UserContext.jsx';
import Avatar from './Avatar.jsx';
import Button from './ui/Button.jsx';
import ConfirmModal from './ui/ConfirmModal.jsx';
import {Dropdown, DropdownItem} from './ui/Dropdown.jsx';
import EmptyState from './ui/EmptyState.jsx';
import IconButton from './ui/IconButton.jsx';
import Modal from './ui/Modal.jsx';
import Notice from './ui/Notice.jsx';
import GroupTag from './GroupTag.jsx';
import PostAttachment from './PostAttachment.jsx';
import PostProjectCard from './PostProjectCard.jsx';
import PostReasons from './PostReasons.jsx';
import PounceButton from './PounceButton.jsx';
import RichText from './RichText.jsx';
import UserLink from './UserLink.jsx';
import styles from './SocialPost.module.css';

const Poll = ({postId, poll, onChange}) => {
    const {text: communityText} = useCommunityText();
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
            <small>{total === 1 ? communityText('1 vote') : communityText('{value1} votes', {value1: total})}</small>
        </div>
    );
};

Poll.propTypes = {
    postId: PropTypes.string.isRequired,
    poll: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

const SocialPost = ({
    initialPost, detail = false, hideReplies = false, showReplyContext = true, onProfile = false, onChange, onDelete,
    onLayoutChange
}) => {
    const {text: communityText} = useCommunityText();
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
    const deleteInFlight = useRef(false);
    const articleRef = useRef(null);
    const mine = Boolean(user && String(user.username).toLowerCase() === String(post.user).toLowerCase());
    const stats = postStats(post, user && user.username);
    const {liked} = stats;
    const replies = Array.isArray(post.replies) ? post.replies : [];
    const context = showReplyContext ? replyContext(post) : null;
    const pouncedBy = (Array.isArray(post.pounced_by) ? post.pounced_by : [])
        .filter(name => typeof name === 'string' && name).slice(0, 3);
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
            setError(cause.message || communityText('Could not update this post.'));
            return null;
        } finally {
            setBusy('');
        }
    };

    useEffect(() => {
        setPost(initialPost);
        setEditText(initialPost.content || '');
    }, [initialPost]);

    const laidOut = useRef(false);
    useEffect(() => {
        if (!laidOut.current) {
            laidOut.current = true;
            return;
        }
        if (onLayoutChange) onLayoutChange();
    }, [editing, notice, error, post.content, post.poll, post.pinned, post.edited_at, pouncedBy.length]);

    useImpression(articleRef, post.impression);

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
        update(withLike(post, !liked, user.username));
        try {
            if (liked) await rotur.unlikePost(post.id);
            else await rotur.likePost(post.id);
            api.checkPostMilestones(post.id).catch(() => {});
        } catch (cause) {
            update(post);
            throw cause;
        }
    });
    const sendReply = event => {
        event.preventDefault();
        const content = reply.trim();
        if (!content) return;
        run('reply', async () => {
            const created = await rotur.replyToPost(post.id, content);
            update({
                ...post,
                replies: [...replies, {...created, user: created.user || user.username}],
                reply_count: stats.replyCount + 1
            });
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
        setNotice(saved ? communityText('Removed from saved posts.') : communityText('Post saved.'));
    });
    const copyLink = async () => {
        try {
            await copyText(`${window.location.origin}${postUrl(post.id)}`);
            setNotice(communityText('Link copied.'));
        } catch (_) {
            setError(communityText('Could not copy the link.'));
        }
    };
    const deletePost = () => {
        if (deleteInFlight.current) return null;
        deleteInFlight.current = true;
        return run('delete', async () => {
            await rotur.deletePost(post.id);
            setConfirmDelete(false);
            if (onDelete) onDelete(post.id);
            else navigate(`/users/${post.user}`);
        }).finally(() => {
            deleteInFlight.current = false;
        });
    };
    const togglePin = () => run('pin', async () => {
        if (post.pinned) await rotur.unpinPost(post.id);
        else await rotur.pinPost(post.id);
        update({...post, pinned: !post.pinned});
    });
    const reportingReply = Boolean(reportTarget && reportTarget.type === 'reply');
    const when = timestampMs(post.timestamp);
    const project = post.is_repost ? null : madeWithProject(post);
    const views = stats.views;
    const promotable = mayPromote(post, user && user.username);
    const viewsText = views === 1 ? communityText('1 view') : communityText('{value1} views', {value1: views});
    const promoter = detail ? null : promotedBy(post);
    const pinnedHere = Boolean(onProfile && post.pinned && !detail);
    const text = String(post.content || '').trim();
    const toggleBlock = () => run('block', async () => {
        if (blocked) await rotur.unblockUser(post.user);
        else await rotur.blockUser(post.user);
        setBlocked(!blocked);
        setNotice(blocked ?
            communityText('Unblocked {value1}.', {value1: post.user}) :
            communityText('Blocked {value1}.', {value1: post.user}));
    });

    return (
        <article className={detail ? styles.detail : styles.card} ref={articleRef}>
            {confirmDelete ? (
                <ConfirmModal
                    destructive
                    icon={Trash2}
                    title={communityText('Delete post?')}
                    confirmLabel={communityText('Delete post')}
                    busy={busy === 'delete'}
                    onConfirm={deletePost}
                    onCancel={() => setConfirmDelete(false)}
                >
                    {communityText('This permanently deletes the post.')}
                </ConfirmModal>
            ) : null}
            {reportTarget ? (
                <Modal
                    icon={Flag}
                    title={reportingReply ? communityText('Report reply') : communityText('Report post')}
                    onClose={() => setReportTarget(null)}
                    actions={<>
                        <Button onClick={() => setReportTarget(null)}>{communityText('Cancel')}</Button>
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
                                    setNotice(communityText('Report submitted.'));
                                })
                            )}
                        >{communityText('Submit report')}</Button>
                    </>}
                >
                    <textarea
                        className={styles.reportInput}
                        value={reportReason}
                        maxLength={1000}
                        placeholder={reportingReply ?
                            communityText('What is wrong with this reply?') :
                            communityText('What is wrong with this post?')}
                        onChange={event => setReportReason(event.target.value)}
                    />
                </Modal>
            ) : null}
            {promoter === null ? null : (
                <p className={styles.social}>
                    <Megaphone size={13} aria-hidden="true" />
                    <span>
                        {promoter ?
                            communityText('Promoted by {value1}', {value1: `@${promoter}`}) :
                            communityText('Promoted')}
                    </span>
                </p>
            )}
            {pinnedHere ? (
                <p className={styles.social}>
                    <Pin size={13} aria-hidden="true" />
                    <span>{communityText('Pinned')}</span>
                </p>
            ) : null}
            {pouncedBy.length ? (
                <p className={styles.social}>
                    <PawPrint size={13} aria-hidden="true" />
                    <span>
                        {communityText('Pounced by {value1}', {value1: pouncedBy.map(name => `@${name}`).join(', ')})}
                    </span>
                </p>
            ) : null}
            <UserLink className={styles.avatar} username={post.user}>
                <Avatar username={post.user} size={40} />
            </UserLink>
            <div className={styles.body}>
                <header>
                    <div className={styles.who}>
                        <UserLink className={styles.name} username={post.user}>{post.user}</UserLink>
                        <GroupTag tag={post.group_tag} username={post.user} compact className={styles.group} />
                        {when && !detail ? (
                            <React.Fragment>
                                <span className={styles.dot} aria-hidden="true">·</span>
                                <Link className={styles.timeLink} to={postUrl(post.id)}>
                                    <time dateTime={new Date(when).toISOString()}>{timeAgo(when)}</time>
                                </Link>
                            </React.Fragment>
                        ) : null}
                        {post.edited_at ? <span className={styles.edited}>{communityText('edited')}</span> : null}
                    </div>
                    {detail ? null : <PostReasons post={post} />}
                    <Dropdown
                        portal
                        className={styles.more}
                        renderTrigger={({open, toggle}) => (
                            <IconButton
                                label={communityText('Post actions')}
                                aria-expanded={open}
                                aria-haspopup="menu"
                                onClick={toggle}
                            >
                                <MoreHorizontal size={17} />
                            </IconButton>
                        )}
                    >
                        {({close}) => (
                            <React.Fragment>
                                <DropdownItem
                                    onClick={() => {
                                        close();
                                        copyLink();
                                    }}
                                ><Copy size={15} />{communityText('Copy link')}</DropdownItem>
                                {mine && !post.is_repost ? (
                                    <DropdownItem
                                        onClick={() => {
                                            close();
                                            setEditing(true);
                                        }}
                                    ><Edit3 size={15} />{communityText('Edit')}</DropdownItem>
                                ) : null}
                                {mine ? (
                                    <DropdownItem
                                        onClick={() => {
                                            close();
                                            togglePin();
                                        }}
                                    >
                                        <Pin size={15} />
                                        {post.pinned ? communityText('Unpin') : communityText('Pin')}
                                    </DropdownItem>
                                ) : null}
                                {promotable ? (
                                    <DropdownItem
                                        onClick={() => {
                                            close();
                                            window.open(pouncePostLink(post.id), '_blank', 'noopener');
                                        }}
                                    ><Megaphone size={15} />{communityText('Promote on pounce')}</DropdownItem>
                                ) : null}
                                {!mine && user ? (
                                    <DropdownItem
                                        onClick={() => {
                                            close();
                                            setReportTarget({type: 'post', id: post.id});
                                        }}
                                    ><Flag size={15} />{communityText('Report')}</DropdownItem>
                                ) : null}
                                {!mine && user && detail ? (
                                    <DropdownItem
                                        danger={!blocked}
                                        onClick={() => {
                                            close();
                                            toggleBlock();
                                        }}
                                    >
                                        <ShieldOff size={15} />
                                        {blocked ?
                                            communityText('Unblock {value1}', {value1: post.user}) :
                                            communityText('Block {value1}', {value1: post.user})}
                                    </DropdownItem>
                                ) : null}
                                {mine ? (
                                    <DropdownItem
                                        danger
                                        aria-label={communityText('Delete post')}
                                        onClick={() => {
                                            close();
                                            setConfirmDelete(true);
                                        }}
                                    ><Trash2 size={15} />{communityText('Delete')}</DropdownItem>
                                ) : null}
                            </React.Fragment>
                        )}
                    </Dropdown>
                </header>
                {context ? (
                    <p className={styles.context}>
                        <CornerDownRight size={13} aria-hidden="true" />
                        <Link to={postUrl(context.parentId)}>
                            {context.user ?
                                communityText('Replying to {value1}', {value1: `@${context.user}`}) :
                                communityText('Replying to a post')}
                        </Link>
                        {context.selfThread && context.rootId ? (
                            <Link to={postUrl(context.rootId)}>{communityText('Show this thread')}</Link>
                        ) : null}
                    </p>
                ) : null}
                {editing ? (
                    <form className={styles.editForm} onSubmit={saveEdit}>
                        <textarea
                            value={editText}
                            maxLength={2000}
                            onChange={event => setEditText(event.target.value)}
                        />
                        <div>
                            <Button onClick={() => setEditing(false)}>{communityText('Cancel')}</Button>
                            <Button type="submit" variant="primary" busy={busy === 'edit'}>
                                {communityText('Save')}
                            </Button>
                        </div>
                    </form>
                ) : null}
                {!editing && text ? <div className={styles.content}><RichText text={text} /></div> : null}
                {media.length ? (
                    <div className={styles.media} data-count={media.length}>
                        {media.map(url => (
                            <PostAttachment key={url} url={url} onPreviewChange={onLayoutChange} />
                        ))}
                    </div>
                ) : null}
                {post.poll ? (
                    <Poll postId={post.id} poll={post.poll} onChange={poll => update({...post, poll})} />
                ) : null}
                {project ? <PostProjectCard project={project} onLayoutChange={onLayoutChange} /> : null}
                {post.is_repost && post.original_post ? (
                    <div className={styles.quoted}><SocialPost initialPost={post.original_post} /></div>
                ) : null}
                {detail ? (
                    <p className={styles.stamp}>
                        {when ? <time dateTime={new Date(when).toISOString()}>{formatDateTime(when)}</time> : null}
                        {post.os ? <span>{communityText('Posted from {value1}', {value1: post.os})}</span> : null}
                        {views ? <span>{viewsText}</span> : null}
                    </p>
                ) : null}
                <div className={styles.actions}>
                    <Button
                        onClick={() => (detail ? null : navigate(postUrl(post.id)))}
                        aria-label={communityText('{value1, plural, one {Reply, # reply} other {Reply, # replies}}', {
                            value1: stats.replyCount
                        })}
                        title={communityText('Reply')}
                    >
                        <MessageCircle size={17} aria-hidden="true" />
                        {stats.replyCount ? <span>{stats.replyCount}</span> : null}
                    </Button>
                    {!post.is_repost && !post.profile_only ? (
                        <Button
                            disabled={Boolean(busy)}
                            aria-label={communityText('Repost')}
                            title={communityText('Repost')}
                            onClick={() => run('repost', async () => {
                                await rotur.repost(post.id);
                                setNotice(communityText('Reposted to your profile.'));
                            })}
                        ><Repeat2 size={17} aria-hidden="true" /></Button>
                    ) : null}
                    <Button
                        className={styles.like}
                        onClick={toggleLike}
                        disabled={Boolean(busy)}
                        aria-pressed={liked}
                        aria-label={liked ? communityText('Unlike post') : communityText('Like post')}
                        title={liked ? communityText('Unlike post') : communityText('Like post')}
                    >
                        <Heart size={17} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
                        {stats.likeCount ? <span>{stats.likeCount}</span> : null}
                    </Button>
                    {canPounce(post) ? (
                        <PounceButton
                            post={post}
                            mine={mine}
                            onChange={update}
                            onNotice={message => {
                                setError('');
                                setNotice(message);
                            }}
                            onError={message => {
                                setNotice('');
                                setError(message);
                            }}
                        />
                    ) : null}
                    <Button
                        disabled={Boolean(busy)}
                        aria-pressed={saved}
                        aria-label={communityText('Save')}
                        title={saved ? communityText('Saved') : communityText('Save')}
                        onClick={toggleSaved}
                    >
                        <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
                    </Button>
                </div>
                {error ? <Notice variant="error" className={styles.message}>{error}</Notice> : null}
                {notice ? <Notice variant="success" className={styles.message}>{notice}</Notice> : null}
                {detail && !hideReplies ? (
                    <div className={styles.replies}>
                        {user ? (
                            <form onSubmit={sendReply}>
                                <Avatar username={user.username} size={32} />
                                <input
                                    value={reply}
                                    maxLength={1000}
                                    placeholder={communityText('Post your reply')}
                                    onChange={event => setReply(event.target.value)}
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    busy={busy === 'reply'}
                                    disabled={!reply.trim()}
                                >{communityText('Reply')}</Button>
                            </form>
                        ) : <Button onClick={login}>{communityText('Sign in to reply')}</Button>}
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
                                    <div className={styles.replyText}>
                                        <RichText text={String(item.content || '').trim()} />
                                    </div>
                                </div>
                                {user && item.user.toLowerCase() !== user.username.toLowerCase() ? (
                                    <button
                                        type="button"
                                        aria-label={communityText('Report reply')}
                                        onClick={() => setReportTarget({type: 'reply', id: item.id})}
                                    ><Flag size={14} /></button>
                                ) : null}
                            </div>
                        ))}
                        {!replies.length ? (
                            <EmptyState compact icon={MessageCircle} title={communityText('No replies yet')}>
                                {communityText('Be the first to reply.')}
                            </EmptyState>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </article>
    );
};

SocialPost.propTypes = {
    initialPost: PropTypes.object.isRequired,
    detail: PropTypes.bool,
    hideReplies: PropTypes.bool,
    showReplyContext: PropTypes.bool,
    onProfile: PropTypes.bool,
    onChange: PropTypes.func,
    onDelete: PropTypes.func,
    onLayoutChange: PropTypes.func
};

export default SocialPost;
