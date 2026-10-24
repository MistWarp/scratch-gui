import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft, Check, Share2} from 'lucide-react';
import api from '../api.js';
import {formatDate} from '../format.js';
import {imageFor} from '../news-excerpt.js';
import NewsItem from '../components/NewsItem.jsx';
import {AuthorLink, NEWS_KINDS, NewsCover, kindOf, usePlaces} from '../components/NewsParts.jsx';
import Button from '../components/ui/Button.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import setPageMeta from '../page-meta.js';
import styles from './NewsPost.module.css';

const ShareButton = ({title}) => {
    const {text: communityText} = useCommunityText();
    const [copied, setCopied] = useState(false);
    const share = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({title, url});
                return;
            } catch (e) {
                if (e && e.name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            window.prompt(communityText('Copy this link'), url); // eslint-disable-line no-alert
        }
    };
    return (
        <Button
            size="small"
            onClick={share}
        >
            {copied ? <Check
                size={15}
                aria-hidden="true"
            /> : <Share2
                size={15}
                aria-hidden="true"
            />}
            {copied ? communityText('Link copied') : communityText('Share')}
        </Button>
    );
};

ShareButton.propTypes = {
    title: PropTypes.string.isRequired
};

const NewsPost = () => {
    const {text: communityText} = useCommunityText();
    const {id} = useParams();
    const [item, setItem] = useState(null);
    const [error, setError] = useState('');
    const [all, setAll] = useState(null);
    const load = useCallback(() => {
        setError('');
        api.newsItem(id)
            .then(data => {
                setItem(data.item);
                setPageMeta({title: data.item.title});
            })
            .catch(cause => setError(cause.message || communityText('Could not load this post.')));
    }, [id]);
    useEffect(() => {
        setItem(null);
        load();
    }, [load]);
    useEffect(() => {
        api.viewNews(id).catch(() => {});
    }, [id]);
    useEffect(() => {
        let active = true;
        api.news()
            .then(data => active && setAll((data.news || []).filter(post => !post.archived)))
            .catch(() => active && setAll([]));
        return () => {
            active = false;
        };
    }, []);

    // Only a linked project's or space's picture goes on top; an image in the
    // post already shows in the body.
    const coverSource = useMemo(() => (item && !imageFor(item) ? [item] : null), [item]);
    const places = usePlaces(coverSource);
    const index = all && item ? all.findIndex(post => post.id === item.id) : -1;
    const newer = index > 0 ? all[index - 1] : null;
    const older = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

    return (
        <main className={styles.page}>
            <Link
                className={styles.back}
                to="/news"
            >
                <ArrowLeft
                    size={15}
                    aria-hidden="true"
                />
                {communityText('All news')}
            </Link>
            {error ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={load}
                >{error}</StatusMessage>
            ) : null}
            {!error && !item ? (
                <div
                    className={styles.skeleton}
                    aria-hidden="true"
                >
                    <span />
                    <span />
                    <span />
                </div>
            ) : null}
            {item ? (
                <article className={styles.article}>
                    <header className={styles.header}>
                        <h1>{item.title}</h1>
                        <div className={styles.byline}>
                            <AuthorLink username={item.author} />
                            <span>{formatDate(item.created)}</span>
                            {item.updated ? (
                                <span>{communityText('Updated {value1}', {value1: formatDate(item.updated)})}</span>
                            ) : null}
                            <span>{communityText(NEWS_KINDS[kindOf(item)].label)}</span>
                            <span className={styles.share}><ShareButton title={item.title} /></span>
                        </div>
                    </header>
                    {coverSource ? (
                        <NewsCover
                            className={styles.cover}
                            item={item}
                            places={places}
                        />
                    ) : null}
                    <NewsItem
                        full
                        bare
                        item={item}
                        onChanged={load}
                    />
                </article>
            ) : null}
            {item && (newer || older) ? (
                <nav
                    className={styles.pager}
                    aria-label={communityText('More news')}
                >
                    {older ? (
                        <Link
                            className={styles.older}
                            to={`/news/${older.id}`}
                        >
                            <span>{communityText('Previous post')}</span>
                            <strong>{older.title}</strong>
                        </Link>
                    ) : <span />}
                    {newer ? (
                        <Link
                            className={styles.newer}
                            to={`/news/${newer.id}`}
                        >
                            <span>{communityText('Next post')}</span>
                            <strong>{newer.title}</strong>
                        </Link>
                    ) : null}
                </nav>
            ) : null}
        </main>
    );
};

export default NewsPost;
