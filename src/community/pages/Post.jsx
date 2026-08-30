import React, {useEffect, useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {useNavigate, useParams} from 'react-router-dom';
import rotur from '../rotur.js';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import SocialPost from '../components/SocialPost.jsx';
import styles from './Post.module.css';

const Post = () => {
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
            if (!data || !data.id) throw new Error('Post not found.');
            setPost(data);
            if (user) {
                rotur.viewPost(id).then(result => {
                    if (active && result && Number.isFinite(result.views)) {
                        setPost(current => (current ? {...current, views: result.views} : current));
                    }
                }).catch(() => {});
            }
        }).catch(cause => {
            if (active) setError(cause.message || 'Could not load this post.');
        });
        return () => {
            active = false;
        };
    }, [attempt, id, user && user.username]);

    return (
        <main className={styles.page}>
            <header className={styles.heading}>
                <button type="button" onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={18} /></button>
                <h1>Post</h1>
            </header>
            {!post && !error ? <p className={styles.status}>Loading post…</p> : null}
            {error ? (
                <div className={styles.status} role="alert">
                    <p>{error}</p>
                    <Button onClick={() => setAttempt(value => value + 1)}>Try again</Button>
                </div>
            ) : null}
            {post ? <SocialPost initialPost={post} detail onChange={setPost} /> : null}
        </main>
    );
};

export default Post;
