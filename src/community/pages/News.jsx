import React, {useEffect, useRef, useState, useCallback} from 'react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import NewsItem from '../components/NewsItem.jsx';
import Button from '../components/ui/Button.jsx';
import useLatest from '../use-latest.js';
import styles from './News.module.css';

const newsPollReady = (category, options) =>
    category !== 'poll' || options.filter(option => option.trim()).length >= 2;

const newsLinkReady = (label, url) => {
    const trimmedLabel = label.trim();
    const trimmedUrl = url.trim();
    if (!trimmedLabel && !trimmedUrl) return true;
    return Boolean(trimmedLabel) && (/^https:\/\/\S+$/i.test(trimmedUrl) || /^\/(?!\/)/.test(trimmedUrl));
};

const News = () => {
    const {user} = useUser();
    const viewerName = (user && user.username) || '';
    const [items, setItems] = useState(null);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [category, setCategory] = useState('update');
    const [linkLabel, setLinkLabel] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const beginLoad = useLatest();
    const submitInFlight = useRef(false);
    const releaseSubmit = () => {
        submitInFlight.current = false;
    };

    const load = useCallback((reset = true) => {
        const fresh = beginLoad();
        if (reset) setItems(null);
        setLoadFailed(false);
        api.news()
            .then(fresh(data => setItems(data.news || [])))
            .catch(fresh(() => setLoadFailed(true)));
    }, [beginLoad, viewerName]);

    useEffect(load, [load]);

    const submit = async event => {
        event.preventDefault();
        const options = pollOptions.map(option => option.trim()).filter(Boolean);
        if (!title.trim() || !body.trim() || submitInFlight.current) return;
        if (!newsPollReady(category, pollOptions)) {
            setError('Add at least two poll options.');
            return;
        }
        if (!newsLinkReady(linkLabel, linkUrl)) {
            setError('Add both a button label and a valid https:// or internal / link.');
            return;
        }
        submitInFlight.current = true;
        setBusy(true);
        setError(null);
        try {
            await api.postNews({
                title: title.trim(),
                body: body.trim(),
                category,
                linkLabel: linkLabel.trim(),
                linkUrl: linkUrl.trim(),
                options
            });
            setTitle('');
            setBody('');
            setCategory('update');
            setLinkLabel('');
            setLinkUrl('');
            setPollOptions(['', '']);
            load(false);
        } catch (e) {
            setError(e.message || 'Could not post update.');
        } finally {
            releaseSubmit();
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
                        disabled={busy}
                        maxLength={120}
                        onChange={e => setTitle(e.target.value)}
                    />
                    <textarea
                        className={styles.bodyInput}
                        placeholder="What changed?"
                        value={body}
                        disabled={busy}
                        maxLength={5000}
                        onChange={e => setBody(e.target.value)}
                    />
                    <div className={styles.composerRow}>
                        <label>
                            <span>Post type</span>
                            <select
                                value={category}
                                disabled={busy}
                                onChange={event => setCategory(event.target.value)}
                            >
                                <option value="update">Update</option>
                                <option value="release">Release</option>
                                <option value="event">Event</option>
                                <option value="poll">Poll</option>
                                <option value="general">General</option>
                            </select>
                        </label>
                        <label>
                            <span>Button label</span>
                            <input
                                value={linkLabel}
                                disabled={busy}
                                maxLength={60}
                                placeholder="Read more"
                                onChange={event => setLinkLabel(event.target.value)}
                            />
                        </label>
                        <label>
                            <span>Button link</span>
                            <input
                                value={linkUrl}
                                disabled={busy}
                                maxLength={500}
                                placeholder="https:// or /project/..."
                                onChange={event => setLinkUrl(event.target.value)}
                            />
                        </label>
                    </div>
                    {category === 'poll' ? (
                        <fieldset className={styles.pollEditor} disabled={busy}>
                            <legend>Poll options</legend>
                            {pollOptions.map((option, index) => (
                                <div key={index}>
                                    <input
                                        value={option}
                                        maxLength={120}
                                        placeholder={`Option ${index + 1}`}
                                        onChange={event => setPollOptions(current => current.map(
                                            (value, optionIndex) => (optionIndex === index ? event.target.value : value)
                                        ))}
                                    />
                                    {pollOptions.length > 2 ? (
                                        <button
                                            type="button"
                                            onClick={() => setPollOptions(current => current.filter(
                                                (value, optionIndex) => optionIndex !== index
                                            ))}
                                        >Remove</button>
                                    ) : null}
                                </div>
                            ))}
                            {pollOptions.length < 6 ? (
                                <button
                                    type="button"
                                    onClick={() => setPollOptions(current => [...current, ''])}
                                >Add option</button>
                            ) : null}
                        </fieldset>
                    ) : null}
                    {error ? <div className={styles.error}>{error}</div> : null}
                    <Button
                        variant="primary"
                        className={styles.submit}
                        type="submit"
                        disabled={busy || !title.trim() || !body.trim()}
                        busy={busy}
                        busyLabel="Posting…"
                    >Post update</Button>
                </form>
            ) : null}

            {loadFailed ? (
                <p className={styles.status}>
                    Couldn&apos;t load.{' '}
                    <Button onClick={() => load(true)}>Try again</Button>
                </p>
            ) : items === null ? (
                <p className={styles.status}>Loading…</p>
            ) : items.length ? (
                <div className={styles.list}>
                    {items.map(item => (
                        <NewsItem
                            key={item.id}
                            item={item}
                            onChanged={() => load(false)}
                        />
                    ))}
                </div>
            ) : (
                <p className={styles.status}>No updates posted yet.</p>
            )}
        </main>
    );
};

export {newsPollReady, newsLinkReady};
export default News;
