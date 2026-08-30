import React, {useEffect, useRef, useState, useCallback} from 'react';
import PropTypes from 'prop-types';
import {Archive, ArchiveRestore, Eye, Heart, Pencil, Plus} from 'lucide-react';
import {Link} from 'react-router-dom';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import {formatDate} from '../format.js';
import Avatar from '../components/Avatar.jsx';
import NewsItem from '../components/NewsItem.jsx';
import Button from '../components/ui/Button.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import Markdown from '../components/Markdown.jsx';
import UserLink from '../components/UserLink.jsx';
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

const News = ({manager = false}) => {
    const {user} = useUser();
    const viewerName = (user && user.username) || '';
    const [items, setItems] = useState(null);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [category, setCategory] = useState('update');
    const [linkLabel, setLinkLabel] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [editingId, setEditingId] = useState('');
    const [preview, setPreview] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [composing, setComposing] = useState(false);
    const beginLoad = useLatest();
    const submitInFlight = useRef(false);
    const releaseSubmit = () => {
        submitInFlight.current = false;
    };
    const resetComposer = () => {
        setTitle('');
        setBody('');
        setCategory('update');
        setLinkLabel('');
        setLinkUrl('');
        setPollOptions(['', '']);
        setEditingId('');
        setComposing(false);
        setPreview(false);
        setError(null);
    };
    const edit = item => {
        setTitle(item.title || '');
        setBody(item.body || '');
        setCategory(item.category || 'update');
        setLinkLabel(item.link?.label || '');
        setLinkUrl(item.link?.url || '');
        setPollOptions(item.poll?.options?.map(option => option.text) || ['', '']);
        setEditingId(item.id);
        setComposing(true);
        setPreview(false);
        setError(null);
        window.scrollTo({top: 0, behavior: 'smooth'});
    };
    const load = useCallback((reset = true) => {
        const fresh = beginLoad();
        if (reset) setItems(null);
        setLoadFailed(false);
        api.news()
            .then(fresh(data => setItems(data.news || [])))
            .catch(fresh(() => setLoadFailed(true)));
    }, [beginLoad, viewerName]);

    const archive = async item => {
        setError(null);
        try {
            await api.updateNews(item.id, {
                title: item.title,
                body: item.body,
                category: item.category || 'update',
                linkLabel: item.link?.label || '',
                linkUrl: item.link?.url || '',
                options: item.poll?.options?.map(option => option.text) || [],
                archived: !item.archived
            });
            load(false);
        } catch (cause) {
            setError(cause.message || 'Could not update this post.');
        }
    };

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
            const payload = {
                title: title.trim(),
                body: body.trim(),
                category,
                linkLabel: linkLabel.trim(),
                linkUrl: linkUrl.trim(),
                options
            };
            if (editingId) await api.updateNews(editingId, payload);
            else await api.postNews(payload);
            resetComposer();
            load(false);
        } catch (e) {
            setError(e.message || `Could not ${editingId ? 'save' : 'post'} update.`);
        } finally {
            releaseSubmit();
            setBusy(false);
        }
    };

    const visibleItems = (items || []).filter(item => (
        manager ? showArchived || !item.archived : !item.archived
    ));
    const startPost = () => {
        resetComposer();
        setComposing(true);
    };

    if (manager && (!user || !user.isAdmin)) {
        return (
            <main className={styles.page}>
                <p className={styles.status}>You do not have access to news management.</p>
            </main>
        );
    }

    return (
        <main className={`${styles.page} ${manager ? styles.manager : styles.blog}`}>
            <header className={styles.pageHead}>
                <div>
                    <h1>{manager ? 'Manage news' : 'News'}</h1>
                    <p>{manager ? 'Write, update, and review the performance of MistWarp posts.' :
                        'Product updates, releases, and notes from MistWarp.'}</p>
                </div>
                <div className={styles.headActions}>
                    {manager ? (
                        <Button variant="primary" onClick={startPost}>
                            <Plus size={15} /> New post
                        </Button>
                    ) : null}
                    {user && user.isAdmin ? (
                        <Link className={styles.manageLink} to={manager ? '/news' : '/news/manage'}>
                            {manager ? 'View blog' : 'Manage posts'}
                        </Link>
                    ) : null}
                </div>
            </header>

            {manager && composing ? (
                <form
                    className={styles.composer}
                    onSubmit={submit}
                >
                    <div className={styles.composerHead}>
                        <strong>{editingId ? 'Edit blog post' : 'New blog post'}</strong>
                        <div>
                            <button
                                type="button"
                                className={!preview ? styles.modeActive : ''}
                                onClick={() => setPreview(false)}
                            >Write</button>
                            <button
                                type="button"
                                className={preview ? styles.modeActive : ''}
                                onClick={() => setPreview(true)}
                            >Preview</button>
                        </div>
                    </div>
                    <input
                        className={styles.titleInput}
                        placeholder="Update title"
                        value={title}
                        disabled={busy}
                        maxLength={120}
                        onChange={e => setTitle(e.target.value)}
                    />
                    {preview ? (
                        <Markdown className={styles.preview}>{body || '*Nothing to preview yet.*'}</Markdown>
                    ) : (
                        <textarea
                            className={styles.bodyInput}
                            placeholder="Write in Markdown…"
                            value={body}
                            disabled={busy}
                            maxLength={20000}
                            onChange={e => setBody(e.target.value)}
                        />
                    )}
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
                    <div className={styles.composerActions}>
                        <Button type="button" onClick={resetComposer} disabled={busy}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            className={styles.submit}
                            type="submit"
                            disabled={busy || !title.trim() || !body.trim()}
                            busy={busy}
                            busyLabel={editingId ? 'Saving…' : 'Posting…'}
                        >{editingId ? 'Save changes' : 'Publish post'}</Button>
                    </div>
                </form>
            ) : null}

            {loadFailed ? (
                <p className={styles.status}>
                    Couldn&apos;t load.{' '}
                    <Button onClick={() => load(true)}>Try again</Button>
                </p>
            ) : items === null ? (
                <p className={styles.status}>Loading…</p>
            ) : visibleItems.length ? (
                <>
                    {manager ? (
                        <label className={styles.archiveToggle}>
                            <input
                                type="checkbox"
                                checked={showArchived}
                                onChange={event => setShowArchived(event.target.checked)}
                            />
                            Show archived posts
                        </label>
                    ) : null}
                    {manager ? (
                        <div className={styles.managerTable} role="table" aria-label="News posts">
                            <div className={styles.managerTableHead} role="row">
                                <span>Post</span><span>Published</span><span>Performance</span><span>Actions</span>
                            </div>
                            {visibleItems.map(item => (
                                <div className={styles.managerRow} role="row" key={item.id}>
                                    <div className={styles.managerPost} role="cell">
                                        <Link to={`/news/${item.id}`}>{item.title}</Link>
                                        <UserLink username={item.author}>
                                            <Avatar username={item.author} size={21} /> {item.author}
                                        </UserLink>
                                        {item.archived ? <span className={styles.archivedBadge}>Archived</span> : null}
                                    </div>
                                    <span className={styles.managerDate} role="cell">
                                        {formatDate(item.created)}
                                    </span>
                                    <div className={styles.managerPerformance} role="cell">
                                        <span><Eye size={14} />{(item.views || 0).toLocaleString()}</span>
                                        <span>
                                            <Heart size={14} />
                                            {(item.reactionCounts?.heart || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className={styles.managerActions} role="cell">
                                        <IconButton label={`Edit ${item.title}`} onClick={() => edit(item)}>
                                            <Pencil size={15} />
                                        </IconButton>
                                        <IconButton
                                            label={`${item.archived ? 'Restore' : 'Archive'} ${item.title}`}
                                            onClick={() => archive(item)}
                                        >
                                            {item.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                                        </IconButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`${styles.list} ${styles.blogList}`}>
                            {visibleItems.map(item => (
                                <NewsItem
                                    key={item.id}
                                    compact
                                    item={item}
                                    onChanged={() => load(false)}
                                />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <p className={styles.status}>No updates posted yet.</p>
            )}
        </main>
    );
};

News.propTypes = {
    manager: PropTypes.bool
};

export {newsPollReady, newsLinkReady};
export default News;
