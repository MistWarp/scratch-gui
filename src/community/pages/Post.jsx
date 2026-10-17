import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {useNavigate, useParams} from 'react-router-dom';
import rotur from '../rotur.js';
import setPageMeta from '../page-meta.js';
import {useUser} from '../UserContext.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import SocialPost from '../components/SocialPost.jsx';
import {Placeholder, ThreadAncestors, ThreadReplies, isPlaceholder} from '../components/PostThread.jsx';
import styles from './Post.module.css';

const Post = () => {
    const {text: communityText} = useCommunityText();
    const {id} = useParams();
    const navigate = useNavigate();
    const {user} = useUser();
    const [post, setPost] = useState(null);
    const [thread, setThread] = useState(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        setPost(null);
        setThread(null);
    }, [id]);

    useEffect(() => {
        let active = true;
        setError('');
        rotur.thread(id).catch(cause => {
            if (cause && cause.status === 404) throw cause;
            return null;
        }).then(data => {
            if (!active) return null;
            if (data) {
                setThread(data);
                return data.post;
            }
            setThread(null);
            return rotur.post(id);
        }).then(data => {
            if (!active) return;
            if (!data || !data.id) throw new Error(communityText('Post not found.'));
            setPost(data);
            if (user && !isPlaceholder(data)) {
                rotur.viewPost(id).then(result => {
                    if (active && result && Number.isFinite(result.views)) {
                        setPost(current => (current ? {...current, views: result.views} : current));
                    }
                }).catch(() => {});
            }
        }).catch(cause => {
            if (active) setError(cause.message || communityText('Could not load this post.'));
        });
        return () => {
            active = false;
        };
    }, [attempt, id, user && user.username]);

    useEffect(() => {
        if (!post || isPlaceholder(post)) return;
        setPageMeta({title: communityText('Post by {value1}', {value1: post.user}), description: post.content});
    }, [communityText, post]);

    return (
        <main className={styles.page}>
            <header className={styles.heading}>
                <IconButton label={communityText('Go back')} onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                </IconButton>
                <h1>{communityText('Post')}</h1>
            </header>
            {!post && !error ? <StatusMessage>{communityText('Loading post…')}</StatusMessage> : null}
            {error ? (
                <StatusMessage error onRetry={() => setAttempt(value => value + 1)}>{error}</StatusMessage>
            ) : null}
            {thread ? <ThreadAncestors ancestors={thread.ancestors} /> : null}
            {post && isPlaceholder(post) ? <Placeholder item={post} /> : null}
            {post && !isPlaceholder(post) ? (
                <SocialPost
                    initialPost={post}
                    detail
                    hideReplies={Boolean(thread)}
                    showReplyContext={!thread}
                    onChange={setPost}
                />
            ) : null}
            {post && thread ? (
                <ThreadReplies
                    key={post.id}
                    post={post}
                    replies={thread.replies}
                    onReplied={() => setPost(current => ({
                        ...current,
                        reply_count: (Number(current.reply_count) || 0) + 1
                    }))}
                />
            ) : null}
        </main>
    );
};

export default Post;
