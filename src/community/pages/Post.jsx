import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {useNavigate, useParams} from 'react-router-dom';
import rotur from '../rotur.js';
import {useUser} from '../UserContext.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import SocialPost from '../components/SocialPost.jsx';
import styles from './Post.module.css';

const Post = () => {
    const {text: communityText} = useCommunityText();
    const {id} = useParams();
    const navigate = useNavigate();
    const {user} = useUser();
    const [post, setPost] = useState(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        setPost(null);
        setError('');
        rotur.post(id).then(data => {
            if (!active) return;
            if (!data || !data.id) throw new Error(communityText('Post not found.'));
            setPost(data);
            if (user) {
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
            {post ? <SocialPost initialPost={post} detail onChange={setPost} /> : null}
        </main>
    );
};

export default Post;
