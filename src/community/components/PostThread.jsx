import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {MessageCircle} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import rotur from '../rotur.js';
import {postUrl} from '../following-feed.js';
import {useClawPostLength} from '../claw-limits.js';
import {useUser} from '../UserContext.jsx';
import Avatar from './Avatar.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import Notice from './ui/Notice.jsx';
import SelectMenu from './ui/SelectMenu.jsx';
import SocialPost from './SocialPost.jsx';
import styles from './PostThread.module.css';

const isPlaceholder = item => Boolean(item && (item.deleted || item.unavailable) && !item.user);

const Placeholder = ({item}) => {
    const {text: communityText} = useCommunityText();
    return (
        <div className={styles.placeholder}>
            {item.deleted ? communityText('This post was deleted.') : communityText('This post is not available.')}
        </div>
    );
};

Placeholder.propTypes = {
    item: PropTypes.object.isRequired
};

const ThreadItem = ({item, onDelete, onChange}) => (isPlaceholder(item) ? <Placeholder item={item} /> : (
    <SocialPost
        initialPost={item}
        showReplyContext={false}
        onChange={onChange}
        onDelete={onDelete}
    />
));

ThreadItem.propTypes = {
    item: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    onDelete: PropTypes.func
};

const ThreadAncestors = ({ancestors}) => {
    if (!ancestors.length) return null;
    return (
        <ol className={styles.ancestors}>
            {ancestors.map(item => (
                <li key={item.id} className={styles.linked}>
                    <ThreadItem item={item} />
                </li>
            ))}
        </ol>
    );
};

ThreadAncestors.propTypes = {
    ancestors: PropTypes.arrayOf(PropTypes.object).isRequired
};

const SORTS = ['relevant', 'latest'];

const ThreadReplies = ({post, replies, onReplied}) => {
    const {text: communityText} = useCommunityText();
    const {user, login} = useUser();
    const maxLength = useClawPostLength(user);
    const [sort, setSort] = useState('relevant');
    const [items, setItems] = useState(replies.items);
    const [cursor, setCursor] = useState(replies.next_cursor);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setSort('relevant');
        setItems(replies.items);
        setCursor(replies.next_cursor);
    }, [replies]);

    const changeSort = async next => {
        if (next === sort || busy) return;
        setSort(next);
        setBusy('sort');
        setError('');
        try {
            const page = await rotur.threadReplies(post.id, {sort: next});
            setItems(page.items);
            setCursor(page.next_cursor);
        } catch (cause) {
            setSort(sort);
            setError(cause.message || communityText('Could not load more replies.'));
        } finally {
            setBusy('');
        }
    };

    const replace = next => setItems(current => current.map(item => (item.id === next.id ? next : item)));
    const remove = id => setItems(current => current.filter(item => item.id !== id));

    const send = async event => {
        event.preventDefault();
        const content = draft.trim();
        if (!content || busy) return;
        setBusy('reply');
        setError('');
        try {
            const created = await rotur.replyToPost(post.id, content);
            const reply = {
                ...created,
                id: created && created.id ? String(created.id) : `local-${Date.now()}`,
                user: (created && created.user) || user.username,
                content: (created && created.content) || content,
                timestamp: (created && created.timestamp) || Date.now(),
                reply_to: post.id
            };
            setItems(current => [reply, ...current]);
            setDraft('');
            if (onReplied) onReplied(reply);
        } catch (cause) {
            setError(cause.message || communityText('Could not post your reply.'));
        } finally {
            setBusy('');
        }
    };

    const more = async () => {
        if (!cursor || busy) return;
        setBusy('more');
        setError('');
        try {
            const page = await rotur.threadReplies(post.id, {sort, cursor});
            const seen = new Set(items.map(item => item.id));
            setItems(current => [...current, ...page.items.filter(item => !seen.has(item.id))]);
            setCursor(page.next_cursor);
        } catch (cause) {
            setError(cause.message || communityText('Could not load more replies.'));
        } finally {
            setBusy('');
        }
    };

    return (
        <section className={styles.replies} aria-label={communityText('Replies')}>
            {user ? (
                <form className={styles.composer} onSubmit={send}>
                    <Avatar username={user.username} size={32} />
                    <textarea
                        aria-label={communityText('Post your reply')}
                        value={draft}
                        maxLength={maxLength}
                        rows={2}
                        placeholder={communityText('Post your reply')}
                        onChange={event => setDraft(event.target.value)}
                    />
                    <Button type="submit" variant="primary" busy={busy === 'reply'} disabled={!draft.trim()}>
                        {communityText('Reply')}
                    </Button>
                </form>
            ) : <Button onClick={login}>{communityText('Sign in to reply')}</Button>}
            {error ? <Notice variant="error">{error}</Notice> : null}
            {items.length > 1 || sort !== 'relevant' ? (
                <div className={styles.toolbar}>
                    <SelectMenu
                        align="right"
                        compact
                        ariaLabel={communityText('Sort replies')}
                        value={sort}
                        disabled={busy === 'sort'}
                        onChange={changeSort}
                        options={SORTS.map(value => ({
                            value,
                            label: value === 'relevant' ? communityText('Most relevant') : communityText('Latest')
                        }))}
                    />
                </div>
            ) : null}
            {items.length ? (
                <ol className={styles.list}>
                    {items.map(item => {
                        const previews = Array.isArray(item.reply_preview) ?
                            item.reply_preview.filter(child => child && child.id) : [];
                        const hidden = Math.max(0, (Number(item.reply_count) || 0) - previews.length);
                        return (
                            <li key={item.id} className={styles.reply}>
                                <div className={previews.length ? styles.linked : null}>
                                    <ThreadItem item={item} onChange={replace} onDelete={remove} />
                                </div>
                                {previews.map((child, index) => (
                                    <div
                                        key={child.id}
                                        className={index < previews.length - 1 ? styles.linked : null}
                                    >
                                        <ThreadItem item={child} />
                                    </div>
                                ))}
                                {hidden && !isPlaceholder(item) ? (
                                    <Link className={styles.moreLink} to={postUrl(item.id)}>
                                        {communityText(
                                            '{value1, plural, one {Show # more reply} other {Show # more replies}}',
                                            {value1: hidden}
                                        )}
                                    </Link>
                                ) : null}
                            </li>
                        );
                    })}
                </ol>
            ) : (
                <EmptyState compact icon={MessageCircle} title={communityText('No replies yet')}>
                    {communityText('Be the first to reply.')}
                </EmptyState>
            )}
            {cursor ? (
                <Button className={styles.loadMore} busy={busy === 'more'} onClick={more}>
                    {communityText('Show more replies')}
                </Button>
            ) : null}
        </section>
    );
};

ThreadReplies.propTypes = {
    post: PropTypes.object.isRequired,
    replies: PropTypes.shape({
        items: PropTypes.arrayOf(PropTypes.object).isRequired,
        next_cursor: PropTypes.string
    }).isRequired,
    onReplied: PropTypes.func
};

export {Placeholder, ThreadAncestors, ThreadReplies, isPlaceholder};
