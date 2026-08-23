import React, {useState} from 'react';
import {Trash2, ExternalLink} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format';
import ReactionButtons from './ReactionButtons.jsx';
import RichText from './RichText.jsx';
import styles from './NewsItem.module.css';

const NewsItem = ({item, onChanged}) => {
    const {user, login} = useUser();
    const canDelete = Boolean(user && user.isAdmin);
    const [error, setError] = useState('');

    const react = async type => {
        setError('');
        try {
            await api.reactNews(item.id, type);
            onChanged();
        } catch (e) {
            setError(e.message || 'Could not react.');
        }
    };

    const remove = async () => {
        if (!window.confirm('Delete this update?')) return;
        setError('');
        try {
            await api.deleteNews(item.id);
            onChanged();
        } catch (e) {
            setError(e.message || 'Could not delete update.');
        }
    };

    const vote = async option => {
        if (!user) {
            login();
            return;
        }
        setError('');
        try {
            await api.voteNewsPoll(item.id, option);
            onChanged();
        } catch (e) {
            setError(e.message || 'Could not vote.');
        }
    };

    const category = item.category || 'update';
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
    const pollTotal = item.poll ? Number(item.poll.total) || 0 : 0;
    const linkProps = item.link && item.link.url.startsWith('http') ? {target: '_blank', rel: 'noreferrer'} : {};

    return (
        <article className={styles.item}>
            {category === 'update' ? null : (
                <span className={`${styles.category} ${styles[`category${categoryLabel}`] || ''}`}>
                    {categoryLabel}
                </span>
            )}
            <div className={styles.head}>
                <h3>{item.title}</h3>
                <span className={styles.date}>{timeAgo(item.created)}</span>
                {canDelete ? (
                    <button
                        className={styles.delete}
                        title="Delete update"
                        onClick={remove}
                    >
                        <Trash2 size={14} />
                    </button>
                ) : null}
            </div>
            <p className={styles.body}><RichText text={item.body} /></p>
            {item.poll && item.poll.options ? (
                <div className={styles.poll}>
                    {item.poll.options.map(option => {
                        const percent = pollTotal ? Math.round((option.votes / pollTotal) * 100) : 0;
                        return (
                            <button
                                key={option.id}
                                className={option.voted ? styles.pollOptionVoted : styles.pollOption}
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
            {item.link && item.link.url ? (
                <a className={styles.postLink} href={item.link.url} {...linkProps}>
                    {item.link.label}
                    <ExternalLink size={13} />
                </a>
            ) : null}
            <div className={styles.footer}>
                <ReactionButtons
                    reactions={item.reactions}
                    onReact={react}
                />
                {item.author ? <span className={styles.author}>posted by {item.author}</span> : null}
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
        </article>
    );
};

export default NewsItem;
