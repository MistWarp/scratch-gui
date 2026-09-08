import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
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
    const {text: communityText} = useCommunityText();
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
                title={communityText('Delete update?')}
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
                    >{communityText('Cancel')}</Button>
                    <Button
                        variant="danger"
                        busy={actionBusy === 'delete'}
                        busyLabel={communityText('Deleting…')}
                        onClick={confirmRemove}
                    >{communityText('Delete update')}</Button>
                </>}
            >
                <p>{communityText('This permanently deletes “')}{item.title}”.</p>
                {error ? <p className={styles.error}>{error}</p> : null}
            </Modal>
        ) : null}
        <article className={`${styles.item} ${compact ? styles.compact : ''} ${full ? styles.full : ''}`}>
            <div className={styles.head}>
                <Title>{full ? item.title : <Link to={`/news/${item.id}`}>{item.title}</Link>}</Title>
                {!full ? (
                    <span className={styles.date}>
                        {item.updated ? communityText("edited {value1}", {value1: timeAgo(item.updated)}) : timeAgo(item.created)}
                    </span>
                ) : null}
                {canManage && onEdit ? (
                    <IconButton
                        variant="secondary"
                        className={styles.edit}
                        label={communityText("Edit {value1}", {value1: item.title})}
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
                        label={communityText("Delete {value1}", {value1: item.title})}
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
                        <>{communityText('By ')}<UserLink username={item.author}>{item.author}</UserLink>{' '}</>
                    ) : null}{communityText('on ')}{formatDate(item.created)}
                    {item.updated ? communityText(" · Updated {value1}", {value1: formatDate(item.updated)}) : ''}
                </p>
            ) : null}
            <Markdown className={styles.body}>{item.body}</Markdown>
            {showAnalytics ? (
                <div className={styles.analytics} aria-label={communityText('Post analytics')}>
                    <span><Eye size={14} /> {(item.views || 0).toLocaleString(getCommunityLocale())}{communityText(' views')}</span>
                    <span><Heart size={14} /> {(item.reactionCounts?.heart || 0).toLocaleString(getCommunityLocale())}{communityText(' likes')}</span>
                    <span>{(item.reactionCounts?.brokenheart || 0).toLocaleString(getCommunityLocale())}{communityText(' dislikes')}</span>
                    {item.viewHistory ? (
                        <span>{Object.keys(item.viewHistory).length}{communityText(' active days')}</span>
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
                                <strong>{option.votes} {option.votes === 1 ? communityText('vote') : communityText('votes')} · {percent}%</strong>
                            </button>
                        );
                    })}
                    <span className={styles.pollTotal}>{pollTotal}{communityText(' total ')}{pollTotal === 1 ? communityText('vote') : communityText('votes')}</span>
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
                {item.archived ? <span className={`${styles.category} ${styles.footerCategory}`}>{communityText('Archived')}</span> : null}
                {category === 'update' ? null : (
                    <span className={`${styles.category} ${styles[`category${categoryLabel}`] || ''} ${styles.footerCategory}`}>
                        {categoryLabel}
                    </span>
                )}
            </div>
            {canManage && item.reactionUsers ? (
                <div className={styles.reactionUsers}>
                    <span>{communityText('Liked by ')}{(item.reactionUsers.heart || []).join(', ') || communityText('nobody')}</span>
                    <span>{communityText('Disliked by ')}{(item.reactionUsers.brokenheart || []).join(', ') || communityText('nobody')}</span>
                </div>
            ) : null}
            {error ? <p className={styles.error}>{error}</p> : null}
        </article>
    </>);
};

export default NewsItem;
