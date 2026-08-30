import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller} from 'react-virtualized';
import {Link} from 'react-router-dom';
import {ExternalLink, Heart, MessageCircle, Pin, Trash2} from 'lucide-react';
import rotur from '../rotur';
import {timeAgo} from '../format';
import Avatar from './Avatar.jsx';
import Button from './ui/Button.jsx';
import RichText from './RichText.jsx';
import GroupTag from './GroupTag.jsx';
import Modal from './ui/Modal.jsx';
import PostAttachment from './PostAttachment.jsx';
import PostComposer from './PostComposer.jsx';
import UserLink from './UserLink.jsx';
import {postUrl} from '../following-feed.js';
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
export const pouncePostUrl = postUrl;

const VIRTUALIZATION_THRESHOLD = 20;

const VirtualPostList = ({posts, renderPost}) => {
    const cache = useMemo(() => new CellMeasurerCache({fixedWidth: true, defaultHeight: 150}), []);
    useEffect(() => {
        cache.clearAll();
    }, [cache, posts]);
    return (
        <WindowScroller>
            {({height, isScrolling, onChildScroll, scrollTop}) => (
                <AutoSizer disableHeight>
                    {({width}) => (
                        <List
                            autoHeight
                            deferredMeasurementCache={cache}
                            height={height}
                            isScrolling={isScrolling}
                            onScroll={onChildScroll}
                            rowCount={posts.length}
                            rowHeight={cache.rowHeight}
                            rowRenderer={({index, key, parent, style}) => (
                                <CellMeasurer
                                    cache={cache}
                                    columnIndex={0}
                                    key={key}
                                    parent={parent}
                                    rowIndex={index}
                                >
                                    {({measure, registerChild}) => (
                                        <div ref={registerChild} style={style} className={styles.virtualRow}>
                                            {renderPost(posts[index], measure)}
                                        </div>
                                    )}
                                </CellMeasurer>
                            )}
                            scrollTop={scrollTop}
                            width={width}
                        />
                    )}
                </AutoSizer>
            )}
        </WindowScroller>
    );
};

VirtualPostList.propTypes = {
    posts: PropTypes.arrayOf(PropTypes.object).isRequired,
    renderPost: PropTypes.func.isRequired
};

const ProfilePosts = ({posts, username, viewer, editable, onChange, onLogin}) => {
    const [deleting, setDeleting] = useState('');
    const [confirmingDelete, setConfirmingDelete] = useState('');
    const [liking, setLiking] = useState('');
    const [error, setError] = useState('');
    const deleteInFlight = useRef(new Set());

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
    const toggleLike = async post => {
        if (!viewer || !viewer.username) {
            onLogin();
            return;
        }
        if (liking === post.id) return;
        const likes = Array.isArray(post.likes) ? post.likes : [];
        const viewerName = viewer.username.toLowerCase();
        const liked = likes.some(name => String(name).toLowerCase() === viewerName);
        const nextLikes = liked ? likes.filter(name => String(name).toLowerCase() !== viewerName) :
            [...likes, viewer.username];
        const nextPosts = posts.map(item => (item.id === post.id ? {...item, likes: nextLikes} : item));
        setLiking(post.id);
        setError('');
        onChange(nextPosts);
        try {
            if (liked) await rotur.unlikePost(post.id);
            else await rotur.likePost(post.id);
        } catch (cause) {
            onChange(posts);
            setError(cause.message || 'Could not update this post.');
        } finally {
            setLiking('');
        }
    };
    const renderPost = (post, measure) => {
        const when = postTimestamp(post.timestamp);
        const likes = Array.isArray(post.likes) ? post.likes : [];
        const liked = Boolean(viewer && likes.some(name => (
            String(name).toLowerCase() === String(viewer.username).toLowerCase()
        )));
        const media = post.attachments && post.attachments.length ? post.attachments :
            (post.attachment ? [post.attachment] : []);
        return (
            <article key={post.id} className={styles.post}>
                <UserLink username={post.user || username}>
                    <Avatar username={post.user || username} size={42} />
                </UserLink>
                <div className={styles.body}>
                    <header>
                        <UserLink username={post.user || username}><strong>{post.user || username}</strong></UserLink>
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
                    {media.length ? (
                        <div className={styles.media}>
                            {media.map(url => (
                                <PostAttachment key={url} url={url} onPreviewChange={measure} />
                            ))}
                        </div>
                    ) : null}
                    <footer>
                        <button
                            type="button"
                            className={liked ? styles.liked : ''}
                            disabled={liking === post.id}
                            aria-label={liked ? 'Unlike post' : 'Like post'}
                            onClick={() => toggleLike(post)}
                        >
                            <Heart size={15} fill={liked ? 'currentColor' : 'none'} /> {postMetricCount(post.likes)}
                        </button>
                        <span aria-label={`${postMetricCount(post.replies)} replies`}>
                            <MessageCircle size={15} /> {postMetricCount(post.replies)}
                        </span>
                        <Link to={pouncePostUrl(post.id)}>Open post <ExternalLink size={13} /></Link>
                    </footer>
                </div>
            </article>
        );
    };
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
            {editable && viewer ? (
                <PostComposer
                    user={viewer}
                    profileOnly
                    onPosted={post => onChange([post, ...posts])}
                />
            ) : null}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            {!sorted.length ? (
                <p className={styles.empty}>
                    {editable ? 'You have not posted anything yet.' : `${username} has not posted anything yet.`}
                </p>
            ) : null}
            <div className={styles.list}>
                {sorted.length > VIRTUALIZATION_THRESHOLD ? (
                    <VirtualPostList posts={sorted} renderPost={renderPost} />
                ) : sorted.map(renderPost)}
            </div>
        </div>
    );
};

ProfilePosts.propTypes = {
    posts: PropTypes.arrayOf(PropTypes.object).isRequired,
    username: PropTypes.string.isRequired,
    viewer: PropTypes.object,
    editable: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    onLogin: PropTypes.func.isRequired
};

export default ProfilePosts;
