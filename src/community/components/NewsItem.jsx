import React from 'react';
import {Trash2} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format';
import ReactionButtons from './ReactionButtons.jsx';
import RichText from './RichText.jsx';
import styles from './NewsItem.module.css';

const NewsItem = ({item, onChanged}) => {
    const {user} = useUser();
    const canDelete = Boolean(user && user.isAdmin);

    const react = async type => {
        try {
            await api.reactNews(item.id, type);
            onChanged();
        } catch (e) {
            return;
        }
    };

    const remove = async () => {
        if (!window.confirm('Delete this update?')) return;
        try {
            await api.deleteNews(item.id);
            onChanged();
        } catch (e) {
            return;
        }
    };

    return (
        <article className={styles.item}>
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
            <div className={styles.footer}>
                <ReactionButtons
                    reactions={item.reactions}
                    onReact={react}
                />
                {item.author ? <span className={styles.author}>posted by {item.author}</span> : null}
            </div>
        </article>
    );
};

export default NewsItem;
