import React, {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import api from '../api.js';
import NewsItem from '../components/NewsItem.jsx';
import Button from '../components/ui/Button.jsx';
import setPageMeta from '../page-meta.js';
import styles from './NewsPost.module.css';

const NewsPost = () => {
    const {id} = useParams();
    const [item, setItem] = useState(null);
    const [error, setError] = useState('');
    const load = useCallback(() => {
        setError('');
        api.newsItem(id)
            .then(data => {
                setItem(data.item);
                setPageMeta({title: data.item.title});
            })
            .catch(cause => setError(cause.message || 'Could not load this post.'));
    }, [id]);
    useEffect(load, [load]);
    useEffect(() => {
        api.viewNews(id).catch(() => {});
    }, [id]);

    return (
        <main className={styles.page}>
            <Link className={styles.back} to="/news"><ArrowLeft size={15} /> All news</Link>
            {error ? <div className={styles.state}><p>{error}</p><Button onClick={load}>Try again</Button></div> : null}
            {!error && !item ? <p className={styles.state}>Loading post…</p> : null}
            {item ? <NewsItem full item={item} onChanged={load} /> : null}
        </main>
    );
};

export default NewsPost;
