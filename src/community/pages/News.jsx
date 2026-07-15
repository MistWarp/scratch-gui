import React, {useEffect, useState, useCallback} from 'react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import NewsItem from '../components/NewsItem.jsx';
import styles from './News.module.css';

const News = () => {
    const {user} = useUser();
    const [items, setItems] = useState(null);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(() => {
        api.news()
            .then(data => setItems(data.news || []))
            .catch(() => setItems([]));
    }, []);

    useEffect(load, [load]);

    const submit = async event => {
        event.preventDefault();
        if (!title.trim() || !body.trim() || busy) return;
        setBusy(true);
        setError(null);
        try {
            await api.postNews(title.trim(), body.trim());
            setTitle('');
            setBody('');
            load();
        } catch (e) {
            setError(e.message || 'Could not post update.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className={styles.page}>
            <h1>News and updates</h1>

            {user && user.isAdmin ? (
                <form
                    className={styles.composer}
                    onSubmit={submit}
                >
                    <input
                        className={styles.titleInput}
                        placeholder="Update title"
                        value={title}
                        maxLength={120}
                        onChange={e => setTitle(e.target.value)}
                    />
                    <textarea
                        className={styles.bodyInput}
                        placeholder="What changed?"
                        value={body}
                        maxLength={5000}
                        onChange={e => setBody(e.target.value)}
                    />
                    {error ? <div className={styles.error}>{error}</div> : null}
                    <button
                        className={styles.submit}
                        type="submit"
                        disabled={busy || !title.trim() || !body.trim()}
                    >Post update</button>
                </form>
            ) : null}

            {items === null ? (
                <p className={styles.status}>Loading…</p>
            ) : items.length ? (
                <div className={styles.list}>
                    {items.map(item => (
                        <NewsItem
                            key={item.id}
                            item={item}
                            onChanged={load}
                        />
                    ))}
                </div>
            ) : (
                <p className={styles.status}>No updates posted yet.</p>
            )}
        </main>
    );
};

export default News;
