import React, {useRef, useState} from 'react';
import {Archive, ArchiveRestore, Trash2, ExternalLink, Eye, Heart, Pencil} from 'lucide-react';
import {Link} from 'react-router-dom';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import {formatDate, timeAgo} from '../format';
import ReactionButtons from './ReactionButtons.jsx';
import Markdown from './Markdown.jsx';
import Avatar from './Avatar.jsx';
import Button from './ui/Button.jsx';
import IconButton from './ui/IconButton.jsx';
import Modal from './ui/Modal.jsx';
import styles from './NewsItem.module.css';
import UserLink from './UserLink.jsx';

export const safeNewsLink = link => {
    const url = link && typeof link.url === 'string' ? link.url.trim() : '';
    if (/^https:\/\/\S+$/i.test(url)) return {url, external: true};
    if (/^\/(?!\/)/.test(url)) return {url, external: false};
    return null;
};

const NewsItem = ({compact, full = false, item, onArchive, onChanged, onEdit, showAnalytics = false}) => {
    const {user, login} = useUser();
    const canDelete = Boolean(user && user.isAdmin);
    const canManage = canDelete && !compact && Boolean(onEdit);
    const [error, setError] = useState('');
    const [actionBusy, setActionBusy] = useState('');
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const actionInFlight = useRef(false);
    const releaseAction = () => {
        actionInFlight.current = false;
    };

    const react = async type => {
        if (actionInFlight.current) return;
        if (!user) {
            login();
            return;
        }
        actionInFlight.current = true;
        setActionBusy('reaction');
        setError('');
        try {
            await api.reactNews(item.id, type);
            onChanged();
        } catch (e) {
            setError(e.message || 'Could not react.');
        } finally {
            releaseAction();
            setActionBusy('');
        }
    };

    const remove = () => {
        if (actionInFlight.current) return;
        setError('');
        setConfirmingDelete(true);
    };

    const confirmRemove = async () => {
        if (actionInFlight.current) return;
        actionInFlight.current = true;
        setActionBusy('delete');
        setError('');
        try {
            await api.deleteNews(item.id);
            setConfirmingDelete(false);
            onChanged();
        } catch (e) {
            setError(e.message || 'Could not delete update.');
        } finally {
            releaseAction();
            setActionBusy('');
        }
    };

    const vote = async option => {
        if (actionInFlight.current) return;
        if (!user) {
            login();
            return;
        }
        actionInFlight.current = true;
        setActionBusy('vote');
        setError('');
        try {
            await api.voteNewsPoll(item.id, option);
            onChanged();
        } catch (e) {
            setError(e.message || 'Could not vote.');
        } finally {
            releaseAction();
            setActionBusy('');
        }
    };

    const category = item.category || 'update';
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
    const pollTotal = item.poll ? Number(item.poll.total) || 0 : 0;
    const newsLink = safeNewsLink(item.link);
    const linkUrl = newsLink ? newsLink.url : '';
    const linkLabel = item.link && item.link.label ? item.link.label : 'Open link';
    const externalLink = Boolean(newsLink && newsLink.external);
    const Title = full ? 'h1' : 'h3';

    return (<>
        {confirmingDelete ? (
            <Modal
                icon={Trash2}
                title="Delete update?"
                dismissDisabled={actionBusy === 'delete'}
                onClose={() => {
                    setConfirmingDelete(false);
                    setError('');
                }}
                actions={<>
                    <Button
                        disabled={actionBusy === 'delete'}
                        onClick={() => {
                            setConfirmingDelete(false);
                            setError('');
                        }}
                    >Cancel</Button>
                    <Button
                        variant="danger"
                        busy={actionBusy === 'delete'}
                        busyLabel="Deleting…"
                        onClick={confirmRemove}
                    >Delete update</Button>
                </>}
            >
                <p>This permanently deletes “{item.title}”.</p>
                {error ? <p className={styles.error}>{error}</p> : null}
            </Modal>
        ) : null}
        <article className={`${styles.item} ${compact ? styles.compact : ''} ${full ? styles.full : ''}`}>
            {item.archived ? <span className={styles.category}>Archived</span> : null}
            {category === 'update' ? null : (
                <span className={`${styles.category} ${styles[`category${categoryLabel}`] || ''}`}>
                    {categoryLabel}
                </span>
            )}
            <div className={styles.head}>
                <Title>{full ? item.title : <Link to={`/news/${item.id}`}>{item.title}</Link>}</Title>
                {!full ? (
                    <span className={styles.date}>
                        {item.updated ? `edited ${timeAgo(item.updated)}` : timeAgo(item.created)}
                    </span>
                ) : null}
                {canManage && onEdit ? (
                    <IconButton
                        variant="secondary"
                        className={styles.edit}
                        label={`Edit ${item.title}`}
                        disabled={Boolean(actionBusy)}
                        onClick={() => onEdit(item)}
                    >
                        <Pencil size={14} />
                    </IconButton>
                ) : null}
                {canManage && onArchive ? (
                    <IconButton
                        variant="secondary"
                        className={styles.edit}
                        label={`${item.archived ? 'Restore' : 'Archive'} ${item.title}`}
                        disabled={Boolean(actionBusy)}
                        onClick={() => onArchive(item)}
                    >
                        {item.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    </IconButton>
                ) : null}
                {canManage ? (
                    <IconButton
                        variant="secondary"
                        className={styles.delete}
                        label={`Delete ${item.title}`}
                        disabled={Boolean(actionBusy)}
                        onClick={remove}
                    >
                        <Trash2 size={14} />
                    </IconButton>
                ) : null}
            </div>
            {!full && item.author ? (
                <UserLink className={styles.postAuthor} username={item.author}>
                    <Avatar username={item.author} size={22} />
                    <span>{item.author}</span>
                </UserLink>
            ) : null}
            {full ? (
                <p className={styles.byline}>
                    {item.author ? (
                        <>By <UserLink username={item.author}>{item.author}</UserLink>{' '}</>
                    ) : null}
                    on {formatDate(item.created)}
                    {item.updated ? ` · Updated ${formatDate(item.updated)}` : ''}
                </p>
            ) : null}
            <Markdown className={styles.body}>{item.body}</Markdown>
            {showAnalytics ? (
                <div className={styles.analytics} aria-label="Post analytics">
                    <span><Eye size={14} /> {(item.views || 0).toLocaleString()} views</span>
                    <span><Heart size={14} /> {(item.reactionCounts?.heart || 0).toLocaleString()} likes</span>
                    <span>{(item.reactionCounts?.brokenheart || 0).toLocaleString()} dislikes</span>
                    {item.viewHistory ? (
                        <span>{Object.keys(item.viewHistory).length} active days</span>
                    ) : null}
                </div>
            ) : null}
            {!compact && item.poll && item.poll.options ? (
                <div className={styles.poll}>
                    {item.poll.options.map(option => {
                        const percent = pollTotal ? Math.round((option.votes / pollTotal) * 100) : 0;
                        return (
                            <button
                                type="button"
                                key={option.id}
                                className={option.voted ? styles.pollOptionVoted : styles.pollOption}
                                disabled={Boolean(actionBusy)}
                                onClick={() => vote(option.id)}
                            >
                                <i style={{width: `${percent}%`}} />
                                <span>{option.text}</span>
                                <strong>{option.votes} {option.votes === 1 ? 'vote' : 'votes'} · {percent}%</strong>
                            </button>
                        );
                    })}
                    <span className={styles.pollTotal}>{pollTotal} total {pollTotal === 1 ? 'vote' : 'votes'}</span>
                </div>
            ) : null}
            {!compact && linkUrl ? externalLink ? (
                <a className={styles.postLink} href={linkUrl} target="_blank" rel="noreferrer">
                    {linkLabel}
                    <ExternalLink size={13} />
                </a>
            ) : (
                <Link className={styles.postLink} to={linkUrl}>
                    {linkLabel}
                    <ExternalLink size={13} />
                </Link>
            ) : null}
            <div className={`${styles.footer} ${compact ? styles.compactFooter : ''}`}>
                <ReactionButtons
                    counts={item.reactionCounts}
                    activeReaction={item.myReaction || ''}
                    onReact={react}
                    disabled={Boolean(actionBusy)}
                    disabledTitle={!user ? 'Sign in to react' : 'Saving…'}
                />
            </div>
            {canManage && item.reactionUsers ? (
                <div className={styles.reactionUsers}>
                    <span>Liked by {(item.reactionUsers.heart || []).join(', ') || 'nobody'}</span>
                    <span>Disliked by {(item.reactionUsers.brokenheart || []).join(', ') || 'nobody'}</span>
                </div>
            ) : null}
            {error ? <p className={styles.error}>{error}</p> : null}
        </article>
    </>);
};

export default NewsItem;
