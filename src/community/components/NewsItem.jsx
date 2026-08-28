import React, {useRef, useState} from 'react';
import {Trash2, ExternalLink} from 'lucide-react';
import {Link} from 'react-router-dom';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format';
import ReactionButtons from './ReactionButtons.jsx';
import RichText from './RichText.jsx';
import Button from './ui/Button.jsx';
import IconButton from './ui/IconButton.jsx';
import Modal from './ui/Modal.jsx';
import styles from './NewsItem.module.css';

export const safeNewsLink = link => {
    const url = link && typeof link.url === 'string' ? link.url.trim() : '';
    if (/^https:\/\/\S+$/i.test(url)) return {url, external: true};
    if (/^\/(?!\/)/.test(url)) return {url, external: false};
    return null;
};

const NewsItem = ({compact, item, onChanged}) => {
    const {user, login} = useUser();
    const canDelete = Boolean(user && user.isAdmin);
    const [error, setError] = useState('');
    const [actionBusy, setActionBusy] = useState('');
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const actionInFlight = useRef(false);
    const releaseAction = () => {
        actionInFlight.current = false;
    };

    const react = async type => {
        if (actionInFlight.current) return;
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
        <article className={`${styles.item} ${compact ? styles.compact : ''}`}>
            {category === 'update' ? null : (
                <span className={`${styles.category} ${styles[`category${categoryLabel}`] || ''}`}>
                    {categoryLabel}
                </span>
            )}
            <div className={styles.head}>
                <h3>{item.title}</h3>
                <span className={styles.date}>{timeAgo(item.created)}</span>
                {canDelete ? (
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
            <p className={styles.body}><RichText text={item.body} /></p>
            {item.poll && item.poll.options ? (
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
            {linkUrl ? externalLink ? (
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
            <div className={styles.footer}>
                <ReactionButtons
                    reactions={item.reactions}
                    onReact={react}
                    disabled={Boolean(actionBusy)}
                    disabledTitle={!user ? 'Sign in to react' : 'Saving…'}
                />
                {item.author ? <span className={styles.author}>posted by {item.author}</span> : null}
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
        </article>
    </>);
};

export default NewsItem;
