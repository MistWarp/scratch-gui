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
import ConfirmModal from './ui/ConfirmModal.jsx';
import IconButton from './ui/IconButton.jsx';
import Notice from './ui/Notice.jsx';
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
            setError(e.message || communityText('Could not react.'));
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
            setError(e.message || communityText('Could not delete update.'));
        } finally {
            releaseAction();
            setActionBusy('');
        }
    };

    const cancelRemove = () => {
        setConfirmingDelete(false);
        setError('');
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
            setError(e.message || communityText('Could not vote.'));
        } finally {
            releaseAction();
            setActionBusy('');
        }
    };

    const category = item.category || 'update';
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
    const categoryLabels = {
        release: communityText('Release'),
        event: communityText('Event'),
        poll: communityText('Poll')
    };
    const pollTotal = item.poll ? Number(item.poll.total) || 0 : 0;
    const newsLink = safeNewsLink(item.link);
    const linkUrl = newsLink ? newsLink.url : '';
    const linkLabel = item.link && item.link.label ? item.link.label : communityText('Open link');
    const externalLink = Boolean(newsLink && newsLink.external);
    const Title = full ? 'h1' : 'h3';
    const formatCount = value => (value || 0).toLocaleString(getCommunityLocale());
    const reactionUsers = item.reactionUsers || {};
    const likedBy = (reactionUsers.heart || []).join(', ');
    const dislikedBy = (reactionUsers.brokenheart || []).join(', ');

    return (<>
        {confirmingDelete ? (
            <ConfirmModal
                destructive
                icon={Trash2}
                title={communityText('Delete update?')}
                confirmLabel={communityText('Delete update')}
                busy={actionBusy === 'delete'}
                busyLabel={communityText('Deleting…')}
                error={error}
                onConfirm={confirmRemove}
                onCancel={cancelRemove}
            >
                {communityText('This permanently deletes “{value1}”.', {value1: item.title})}
            </ConfirmModal>
        ) : null}
        <article className={`${styles.item} ${compact ? styles.compact : ''} ${full ? styles.full : ''}`}>
            <div className={styles.head}>
                <Title>{full ? item.title : <Link to={`/news/${item.id}`}>{item.title}</Link>}</Title>
                {!full ? (
                    <span className={styles.date}>
                        {item.updated ?
                            communityText('edited {value1}', {value1: timeAgo(item.updated)}) :
                            timeAgo(item.created)}
                    </span>
                ) : null}
                {canManage && onEdit ? (
                    <IconButton
                        variant="secondary"
                        className={styles.edit}
                        label={communityText('Edit {value1}', {value1: item.title})}
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
                        label={item.archived ?
                            communityText('Restore {value1}', {value1: item.title}) :
                            communityText('Archive {value1}', {value1: item.title})}
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
                        label={communityText('Delete {value1}', {value1: item.title})}
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
                        <span className={styles.bylineAuthor}>
                            {communityText('By')}
                            <UserLink username={item.author}>{item.author}</UserLink>
                        </span>
                    ) : null}
                    <span>{communityText('Published {value1}', {value1: formatDate(item.created)})}</span>
                    {item.updated ? (
                        <span>{communityText('Updated {value1}', {value1: formatDate(item.updated)})}</span>
                    ) : null}
                </p>
            ) : null}
            <Markdown className={styles.body}>{item.body}</Markdown>
            {showAnalytics ? (
                <div className={styles.analytics} aria-label={communityText('Post analytics')}>
                    <span>
                        <Eye size={14} />
                        {communityText('{value1} views', {value1: formatCount(item.views)})}
                    </span>
                    <span>
                        <Heart size={14} />
                        {communityText('{value1} likes', {value1: formatCount(item.reactionCounts?.heart)})}
                    </span>
                    <span>
                        {communityText('{value1} dislikes', {value1: formatCount(item.reactionCounts?.brokenheart)})}
                    </span>
                    {item.viewHistory ? (
                        <span>
                            {communityText('{value1} active days', {value1: Object.keys(item.viewHistory).length})}
                        </span>
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
                                <strong>
                                    {option.votes === 1 ?
                                        communityText('1 vote · {value1}%', {value1: percent}) :
                                        communityText('{value1} votes · {value2}%', {
                                            value1: option.votes, value2: percent
                                        })}
                                </strong>
                            </button>
                        );
                    })}
                    <span className={styles.pollTotal}>
                        {pollTotal === 1 ?
                            communityText('1 vote in total') :
                            communityText('{value1} votes in total', {value1: pollTotal})}
                    </span>
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
                    disabledTitle={user ? communityText('Saving…') : communityText('Sign in to react')}
                />
                {item.archived ? (
                    <span className={`${styles.category} ${styles.footerCategory}`}>{communityText('Archived')}</span>
                ) : null}
                {category === 'update' ? null : (
                    <span
                        className={[
                            styles.category, styles[`category${categoryLabel}`] || '', styles.footerCategory
                        ].join(' ')}
                    >
                        {categoryLabels[category] || categoryLabel}
                    </span>
                )}
            </div>
            {canManage && item.reactionUsers ? (
                <div className={styles.reactionUsers}>
                    <span>{communityText('Liked by {value1}', {value1: likedBy || communityText('nobody')})}</span>
                    <span>
                        {communityText('Disliked by {value1}', {value1: dislikedBy || communityText('nobody')})}
                    </span>
                </div>
            ) : null}
            {error && !confirmingDelete ? <Notice variant="error" className={styles.message}>{error}</Notice> : null}
        </article>
    </>);
};

export default NewsItem;
