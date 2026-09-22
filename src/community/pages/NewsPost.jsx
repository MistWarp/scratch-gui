import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import api from '../api.js';
import NewsItem from '../components/NewsItem.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import setPageMeta from '../page-meta.js';
import styles from './NewsPost.module.css';

const NewsPost = () => {
    const {text: communityText} = useCommunityText();
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
            .catch(cause => setError(cause.message || communityText('Could not load this post.')));
    }, [id]);
    useEffect(load, [load]);
    useEffect(() => {
        api.viewNews(id).catch(() => {});
    }, [id]);

    return (
        <main className={styles.page}>
            <Link className={styles.back} to="/news"><ArrowLeft size={15} />{communityText('All news')}</Link>
            {error ? <StatusMessage error onRetry={load}>{error}</StatusMessage> : null}
            {!error && !item ? <StatusMessage>{communityText('Loading post…')}</StatusMessage> : null}
            {item ? <NewsItem full item={item} onChanged={load} /> : null}
        </main>
    );
};

export default NewsPost;
