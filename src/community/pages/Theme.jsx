/* eslint-disable react/jsx-no-bind, max-len */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {BookmarkPlus, Check, Download, Heart, Palette, Pencil, Trash2} from 'lucide-react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import api from '../api.js';
import ExploreNav from '../components/ExploreNav.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import {useUser} from '../UserContext.jsx';
import {CustomTheme, customThemeManager} from '../../lib/themes/custom-themes.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import {sameUser} from '../format.js';
import styles from './Theme.module.css';

const savedThemeMatches = (localTheme, remoteTheme) => {
    if (localTheme.sourceId) return localTheme.sourceId === remoteTheme.id;
    const sameName = localTheme.name?.trim().toLowerCase() === remoteTheme.name?.trim().toLowerCase();
    const sameAuthor = localTheme.author?.trim().toLowerCase() === remoteTheme.owner?.trim().toLowerCase();
    return Boolean(sameName && sameAuthor);
};
const themeReturnContext = state => {
    const returnTo = state?.themeReturnTo;
    const safePath = typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//');
    const safeLabel = safePath && typeof state.themeReturnLabel === 'string' && state.themeReturnLabel.trim();
    return {
        label: safeLabel ? state.themeReturnLabel : 'All themes',
        to: safePath ? returnTo : '/themes'
    };
};
const nextThemeRating = (current, result) => {
    const resultLikes = Number(result.likes);
    const changed = Boolean(result.liked) !== Boolean(current.liked);
    const fallbackLikes = Math.max(0, (Number(current.likes) || 0) + (changed ? (result.liked ? 1 : -1) : 0));
    return {
        ...current,
        liked: Boolean(result.liked),
        likes: Number.isFinite(resultLikes) ? Math.max(0, resultLikes) : fallbackLikes
    };
};

const Theme = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnContext = themeReturnContext(location.state);
    const {user} = useUser();
    const [theme, setTheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busyAction, setBusyAction] = useState('');
    const busy = Boolean(busyAction);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [saved, setSaved] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const previewFrame = useRef(null);
    const actionInFlight = useRef(false);
    const mounted = useRef(true);
    const releaseAction = () => {
        actionInFlight.current = false;
    };
    const previewTheme = useMemo(() => (
        theme ? JSON.stringify({inlineCustomTheme: theme.theme}) : ''
    ), [theme]);
    const sendThemeToPreview = useCallback(() => {
        const frame = previewFrame.current;
        if (!frame || !frame.contentWindow || !previewTheme) return;
        frame.contentWindow.postMessage({
            type: 'mw:apply-theme',
            theme: previewTheme,
            customThemes: ''
        }, '*');
    }, [previewTheme]);

    useEffect(() => {
        sendThemeToPreview();
    }, [sendThemeToPreview]);

    useEffect(() => {
        if (!theme) return;
        const syncSaved = () => setSaved(customThemeManager.getAllThemes()
            .some(localTheme => savedThemeMatches(localTheme, theme)));
        syncSaved();
        return customThemeManager.subscribe(syncSaved);
    }, [theme?.id]);

    useEffect(() => () => {
        mounted.current = false;
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        api.getTheme(id)
            .then(data => active && setTheme(data.theme ? {
                ...data.theme,
                isOwner: Boolean(user && sameUser(user.username, data.theme.owner))
            } : null))
            .catch(requestError => active && setError(requestError.message || 'Could not load this theme.'))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [id, user?.username]);

    const run = async (actionName, action) => {
        if (actionInFlight.current) return;
        actionInFlight.current = true;
        setBusyAction(actionName);
        setError('');
        setNotice('');
        try {
            await action();
        } catch (actionError) {
            if (mounted.current) setError(actionError.message || 'The theme action failed.');
        } finally {
            releaseAction();
            if (mounted.current) setBusyAction('');
        }
    };
    const download = async () => (await api.downloadTheme(theme.id, {track: Boolean(user)})).theme;
    const apply = () => run('apply', async () => {
        const downloaded = await download();
        if (!mounted.current) return;
        applyTheme(CustomTheme.import(downloaded));
        setNotice(`Applied "${theme.name}".`);
    });
    const save = () => run('save', async () => {
        const downloaded = await download();
        if (!mounted.current) return;
        const stored = customThemeManager.addFromExportData(downloaded, {
            name: theme.name,
            description: theme.description,
            author: theme.owner,
            sourceId: theme.id
        });
        if (!mounted.current) return;
        setSaved(true);
        setNotice(`"${stored.name}" is now in your local theme library.`);
    });
    const like = () => run('like', async () => {
        const result = await api.likeTheme(theme.id);
        if (mounted.current) {
            setTheme(current => nextThemeRating(current, result));
        }
    });
    const remove = () => run('delete', async () => {
        await api.deleteTheme(theme.id);
        if (mounted.current) navigate('/mystuff?section=themes');
    });
    const openEdit = () => {
        setError('');
        setEditName(theme.name);
        setEditDescription(theme.description || '');
        setEditOpen(true);
    };
    const openDelete = () => {
        setError('');
        setDeleteOpen(true);
    };
    const updateDetails = () => run('edit', async () => {
        const nextName = editName.trim();
        const nextDescription = editDescription.trim();
        await api.updateTheme(theme.id, {name: nextName, description: nextDescription});
        if (!mounted.current) return;
        setTheme(current => ({...current, name: nextName, description: nextDescription}));
        setEditOpen(false);
        setNotice('Theme details updated.');
    });
    const closeDelete = () => {
        setDeleteOpen(false);
        setError('');
    };
    const closeEdit = () => {
        setEditOpen(false);
        setError('');
    };

    return (
        <main className={styles.page}>
            <ExploreNav active="themes" />
            {loading ? <p className={styles.status}>Loading theme…</p> : error && !theme ? <div className={styles.status}><p>{error}</p><Link to={returnContext.to}>{returnContext.label}</Link></div> : theme ? (
                <React.Fragment>
                    <Link className={styles.back} to={returnContext.to}>← {returnContext.label}</Link>
                    <div className={styles.layout}>
                        <section className={styles.previewCard}>
                            <iframe
                                ref={previewFrame}
                                className={styles.previewFrame}
                                src="/?mw_theme_preview=1"
                                title={`${theme.name} theme preview`}
                                onLoad={sendThemeToPreview}
                                sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                            />
                        </section>
                        <aside className={styles.info}>
                            <h1>{theme.name}</h1>
                            <Link className={styles.creator} to={`/users/${encodeURIComponent(theme.owner)}`}><Avatar size={32} username={theme.owner} /><span>by <strong>{theme.owner}</strong></span></Link>
                            <p className={styles.description}>{theme.description || 'No description provided.'}</p>
                            <div className={styles.stats}><span><Heart size={15} /> {theme.likes || 0} likes</span><span><Download size={15} /> {theme.downloads || 0} downloads</span></div>
                            {error && !deleteOpen && !editOpen ? <p className={styles.error} role="alert">{error}</p> : null}
                            {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
                            <div className={styles.actions}>
                                <Button busy={busyAction === 'apply'} busyLabel="Applying…" disabled={busy} variant="primary" onClick={apply}><Palette size={16} /> Apply theme</Button>
                                <Button busy={busyAction === 'save'} busyLabel="Saving…" disabled={busy || saved} variant="secondary" onClick={save}>{saved ? <Check size={16} /> : <BookmarkPlus size={16} />} {saved ? 'Saved to My Stuff' : 'Save to My Stuff'}</Button>
                                {user ? <Button busy={busyAction === 'like'} busyLabel="Updating…" disabled={busy} variant="secondary" onClick={like}><Heart fill={theme.liked ? 'currentColor' : 'none'} size={16} /> {theme.liked ? 'Unlike' : 'Like'}</Button> : null}
                                {theme.isOwner ? <Button disabled={busy} variant="secondary" onClick={openEdit}><Pencil size={16} /> Edit details</Button> : null}
                                {theme.isOwner ? <Button disabled={busy} variant="danger" onClick={openDelete}><Trash2 size={16} /> Delete</Button> : null}
                            </div>
                            <p className={styles.help}>Saved themes are available in <Link to="/mystuff?section=themes">My Stuff</Link>. You can switch themes at any time.</p>
                        </aside>
                    </div>
                    {deleteOpen ? (
                        <Modal
                            title="Delete theme?"
                            icon={Trash2}
                            dismissDisabled={busy}
                            onClose={closeDelete}
                            onDismiss={closeDelete}
                            actions={(
                                <React.Fragment>
                                    <Button disabled={busy} variant="secondary" onClick={closeDelete}>Cancel</Button>
                                    <Button busy={busyAction === 'delete'} busyLabel="Deleting…" disabled={busy} variant="danger" onClick={remove}>Delete theme</Button>
                                </React.Fragment>
                            )}
                        >
                            <p>{`"${theme.name}" will be removed from WarpTheme. This cannot be undone.`}</p>
                            {error ? <p className={styles.error} role="alert">{error}</p> : null}
                        </Modal>
                    ) : null}
                    {editOpen ? (
                        <Modal
                            title="Edit theme details"
                            icon={Pencil}
                            dismissDisabled={busy}
                            onClose={closeEdit}
                            onDismiss={closeEdit}
                            actions={(
                                <React.Fragment>
                                    <Button disabled={busy} variant="secondary" onClick={closeEdit}>Cancel</Button>
                                    <Button busy={busyAction === 'edit'} busyLabel="Saving…" disabled={busy || !editName.trim()} variant="primary" onClick={updateDetails}>Save changes</Button>
                                </React.Fragment>
                            )}
                        >
                            <div className={styles.editFields}>
                                <label>Name<input maxLength="100" value={editName} onChange={event => setEditName(event.target.value)} /></label>
                                <label>Description<textarea maxLength="500" value={editDescription} onChange={event => setEditDescription(event.target.value)} /></label>
                            </div>
                            {error ? <p className={styles.error} role="alert">{error}</p> : null}
                        </Modal>
                    ) : null}
                </React.Fragment>
            ) : null}
        </main>
    );
};

export {nextThemeRating, savedThemeMatches, themeReturnContext};
export default Theme;
