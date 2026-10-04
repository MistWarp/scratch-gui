/* eslint-disable max-len */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {LogIn, Star} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api from '../../api';
import {timeAgo, formatPlaytime} from '../../format';
import useLatest from '../../use-latest.js';
import Avatar from '../../components/Avatar.jsx';
import RichText from '../../components/RichText.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Notice from '../../components/ui/Notice.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {reviewPayload, updateReviewSummary} from './project-helpers.js';
import styles from '../Project.module.css';

const ReviewStars = ({rating, onChange}) => {
    const {text: communityText} = useCommunityText();
    return (
        <div className={onChange ? styles.reviewStarPicker : styles.reviewStars} aria-label={communityText('{value1} out of 5 stars', {value1: rating})}>
            {[1, 2, 3, 4, 5].map(value => {
                if (onChange) {
                    return (
                        <button key={value} type="button" aria-label={communityText('{value1} stars', {value1: value})} onClick={() => onChange(value)}>
                            <Star size={20} fill={value <= rating ? 'currentColor' : 'none'} />
                        </button>
                    );
                }
                return <Star key={value} size={15} fill={value <= rating ? 'currentColor' : 'none'} />;
            })}
        </div>
    );
};

const ReviewPanel = ({id, user, login, ownsProject}) => {
    const {text: communityText} = useCommunityText();
    const viewerName = (user && user.username) || '';
    const reviewContext = `${id}\u0000${viewerName}`;
    const reviewContextRef = useRef(reviewContext);
    reviewContextRef.current = reviewContext;
    const [reviews, setReviews] = useState(null);
    const [summary, setSummary] = useState({average: 0, count: 0});
    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState('');
    const [hasReview, setHasReview] = useState(false);
    const [status, setStatus] = useState('');
    const [loadError, setLoadError] = useState(false);
    const [busy, setBusy] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const actionLocks = useRef(new Set());
    const beginLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        setReviews(null);
        setLoadError(false);
        api.reviews(id)
            .then(fresh(data => {
                setReviews(data.reviews || []);
                setSummary({average: Number(data.average) || 0, count: Number(data.count) || 0});
                const mine = data.myReview && data.myReview._id ? data.myReview : null;
                setHasReview(Boolean(mine));
                setRating(mine ? Number(mine.rating) : 0);
                setMessage(mine ? mine.message || '' : '');
            }))
            .catch(fresh(() => setLoadError(true)));
    }, [beginLoad, id, viewerName]);

    useEffect(() => {
        actionLocks.current.clear();
        setBusy('');
        setStatus('');
        setDeleteConfirm(false);
        load();
    }, [load]);

    const submit = async event => {
        event.preventDefault();
        const actionContext = reviewContextRef.current;
        if (actionLocks.current.has(actionContext)) return;
        if (!user) {
            login();
            return;
        }
        if (!rating) {
            setStatus(communityText('Choose a star rating first.'));
            return;
        }
        actionLocks.current.add(actionContext);
        setBusy('save');
        setStatus('');
        try {
            const data = await api.saveReview(id, reviewPayload(rating, message));
            if (reviewContextRef.current !== actionContext) return;
            const previousRating = hasReview ? Number(
                (reviews || []).find(review =>
                    String(review.author).toLowerCase() === viewerName.toLowerCase())?.rating || rating
            ) : 0;
            setSummary(current => updateReviewSummary(current, previousRating, rating));
            setReviews(current => {
                const withoutMine = (current || []).filter(review =>
                    String(review.author).toLowerCase() !== viewerName.toLowerCase());
                return [data.review, ...withoutMine];
            });
            setHasReview(true);
            setStatus(communityText('Review saved.'));
        } catch (e) {
            if (reviewContextRef.current === actionContext) {
                setStatus(e.message || communityText('Could not save your review.'));
            }
        } finally {
            actionLocks.current.delete(actionContext);
            if (reviewContextRef.current === actionContext) setBusy('');
        }
    };

    const remove = async () => {
        const actionContext = reviewContextRef.current;
        if (actionLocks.current.has(actionContext)) return;
        actionLocks.current.add(actionContext);
        setBusy('delete');
        setStatus('');
        try {
            await api.deleteReview(id);
            if (reviewContextRef.current !== actionContext) return;
            const previousRating = Number(
                (reviews || []).find(review =>
                    String(review.author).toLowerCase() === viewerName.toLowerCase())?.rating || rating
            );
            setSummary(current => updateReviewSummary(current, previousRating, 0));
            setReviews(current => (current || []).filter(review =>
                String(review.author).toLowerCase() !== viewerName.toLowerCase()));
            setRating(0);
            setMessage('');
            setHasReview(false);
            setStatus(communityText('Review deleted.'));
            setDeleteConfirm(false);
        } catch (e) {
            if (reviewContextRef.current === actionContext) {
                setStatus(e.message || communityText('Could not delete your review.'));
            }
        } finally {
            actionLocks.current.delete(actionContext);
            if (reviewContextRef.current === actionContext) setBusy('');
        }
    };

    return (
        <div className={styles.reviewPanel}>
            <div className={styles.reviewSummary}>
                <strong>{summary.count ? summary.average.toFixed(1) : '0.0'}</strong>
                <div>
                    <ReviewStars rating={Math.round(summary.average)} />
                    <span>{summary.count} {summary.count === 1 ? communityText('review') : communityText('reviews')}</span>
                </div>
            </div>
            {!ownsProject ? (
                <form className={styles.reviewForm} onSubmit={submit}>
                    <div>
                        <h3>{hasReview ? communityText('Your review') : communityText('Review this project')}</h3>
                        <ReviewStars rating={rating} onChange={busy ? null : setRating} />
                    </div>
                    <textarea value={message} disabled={Boolean(busy)} maxLength={2000} placeholder={communityText('What worked well? What should change?')} onChange={event => setMessage(event.target.value)} />
                    <div className={styles.reviewActions}>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={busy === 'delete'}
                            busy={busy === 'save'}
                            busyLabel={communityText('Saving…')}
                        >
                            {user ? <Star size={15} /> : <LogIn size={15} />}
                            {user ? communityText('Save review') : communityText('Sign in to review')}
                        </Button>
                        {hasReview ? (
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={Boolean(busy)}
                                onClick={() => {
                                    setStatus('');
                                    setDeleteConfirm(true);
                                }}
                            >{communityText('Delete')}</Button>
                        ) : null}
                        {status ? <span>{status}</span> : null}
                    </div>
                </form>
            ) : <Notice variant="info">{communityText('You cannot review your own project.')}</Notice>}
            {!reviews && !loadError ? <StatusMessage compact>{communityText('Loading reviews…')}</StatusMessage> : null}
            {loadError ? <StatusMessage error compact onRetry={load}>{communityText('Could not load reviews.')}</StatusMessage> : null}
            {reviews && !reviews.length ? (
                <EmptyState icon={Star} title={communityText('No reviews yet')}>
                    {communityText('Reviews from players will appear here.')}
                </EmptyState>
            ) : null}
            {reviews && reviews.map(review => (
                <article key={review._id} className={styles.reviewCard}>
                    <Link to={`/users/${review.author}`}><Avatar username={review.author} size={34} /></Link>
                    <div>
                        <header>
                            <Link to={`/users/${review.author}`}>{review.author}</Link>
                            {Number.isFinite(review.playtimeMs) && review.playtimeMs > 0 ? (
                                <span className={styles.reviewPlaytime}>{formatPlaytime(review.playtimeMs)}</span>
                            ) : null}
                            <span>{timeAgo(review.edited || review.created)}</span>
                        </header>
                        <ReviewStars rating={review.rating} />
                        {review.message ? <p><RichText text={review.message} /></p> : null}
                    </div>
                </article>
            ))}
            {deleteConfirm ? (
                <ConfirmModal
                    destructive
                    title={communityText('Delete your review?')}
                    confirmLabel={communityText('Delete review')}
                    busy={Boolean(busy)}
                    busyLabel={communityText('Deleting…')}
                    error={status}
                    onConfirm={remove}
                    onCancel={() => setDeleteConfirm(false)}
                >{communityText('Your rating and review text will be removed.')}</ConfirmModal>
            ) : null}
        </div>
    );
};

export default ReviewPanel;
