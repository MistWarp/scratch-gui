import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Check, Library, Plus} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import styles from './CollectionSaveModal.module.css';

const CollectionSaveModal = ({project, onClose}) => {
    const {user} = useUser();
    const viewerName = (user && user.username) || '';
    const actionContext = `${viewerName}\u0000${project.id}`;
    const actionContextRef = useRef(actionContext);
    actionContextRef.current = actionContext;
    const [collections, setCollections] = useState(null);
    const [title, setTitle] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [loadAttempt, setLoadAttempt] = useState(0);
    const actionLocks = useRef(new Set());
    const canSave = project.shared || project.visibility === 'public' || project.visibility === 'unlisted';

    useEffect(() => {
        let active = true;
        setCollections(null);
        setTitle('');
        setVisibility('public');
        setError('');
        setStatus('');
        setBusy('');
        api.mySpaces()
            .then(data => {
                if (active) {
                    setCollections((data.spaces || [])
                        .filter(space => space.kind === 'collection' && space.canManage));
                }
            })
            .catch(e => {
                if (active) setError(e.message || 'Could not load your collections.');
            });
        return () => {
            active = false;
        };
    }, [actionContext, loadAttempt]);

    const savedIds = useMemo(() => new Set((collections || [])
        .filter(collection => (collection.projectIds || []).includes(project.id))
        .map(collection => collection._id)), [collections, project.id]);

    const toggle = async collection => {
        const context = actionContextRef.current;
        const actionKey = `${context}\u0000action`;
        if (!canSave || actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        const saved = savedIds.has(collection._id);
        setBusy(collection._id);
        setError('');
        setStatus('');
        try {
            const data = saved ?
                await api.removeSpaceProject(collection._id, project.id) :
                await api.addSpaceProject(collection._id, project.id);
            if (actionContextRef.current !== context) return;
            setCollections(current => current.map(item => (
                item._id === collection._id ? data.space : item
            )));
            setStatus(saved ? `Removed from ${collection.title}.` : `Saved to ${collection.title}.`);
        } catch (e) {
            if (actionContextRef.current === context) {
                setError(e.message || 'Could not update this collection.');
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (actionContextRef.current === context) setBusy('');
        }
    };

    const create = async event => {
        event.preventDefault();
        const name = title.trim();
        const context = actionContextRef.current;
        const actionKey = `${context}\u0000action`;
        if (!name || actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setBusy('new');
        setError('');
        setStatus('');
        try {
            const created = await api.createSpace({
                title: name,
                description: '',
                kind: 'collection',
                visibility,
                openSubmissions: false
            });
            if (actionContextRef.current !== context) return;
            const collection = created.space;
            setCollections(current => [collection, ...(current || [])]);
            setTitle('');
            if (canSave) {
                try {
                    const added = await api.addSpaceProject(collection._id, project.id);
                    if (actionContextRef.current !== context) return;
                    setCollections(current => current.map(item => (
                        item._id === collection._id ? added.space : item
                    )));
                } catch (e) {
                    if (actionContextRef.current === context) {
                        setError(
                            `Created ${collection.title}, but could not save this project. ${e.message || ''}`.trim()
                        );
                    }
                    return;
                }
            }
            setStatus(canSave ? `Created ${collection.title} and saved this project.` : `Created ${collection.title}.`);
        } catch (e) {
            if (actionContextRef.current === context) {
                setError(e.message || 'Could not create the collection.');
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (actionContextRef.current === context) setBusy('');
        }
    };

    return (
        <Modal
            icon={Library}
            title="Save to a collection"
            onClose={onClose}
            dismissDisabled={Boolean(busy)}
        >
            {!canSave ? (
                <p className={styles.notice}>
                    Share this project or make it unlisted before adding it to a collection.
                </p>
            ) : null}
            <form className={styles.create} onSubmit={create}>
                <label>
                    <span>New collection</span>
                    <input
                        value={title}
                        disabled={Boolean(busy)}
                        maxLength={100}
                        placeholder="Collection name"
                        onChange={event => setTitle(event.target.value)}
                    />
                </label>
                <div className={styles.createActions}>
                    <select
                        value={visibility}
                        disabled={Boolean(busy)}
                        onChange={event => setVisibility(event.target.value)}
                        aria-label="Collection visibility"
                    >
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="private">Private</option>
                    </select>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={!title.trim() || Boolean(busy)}
                        busy={busy === 'new'}
                        busyLabel="Creating…"
                    >
                        <Plus size={15} />
                        {canSave ? 'Create and save' : 'Create collection'}
                    </Button>
                </div>
            </form>
            <div className={styles.divider} />
            <div className={styles.heading}>
                <strong>Your collections</strong>
                <span>{collections ? collections.length : ''}</span>
            </div>
            {collections === null && !error ? <p className={styles.empty}>Loading collections…</p> : null}
            {collections && !collections.length ? (
                <p className={styles.empty}>You do not have any collections yet.</p>
            ) : null}
            {collections && collections.length ? (
                <div className={styles.list}>
                    {collections.map(collection => {
                        const saved = savedIds.has(collection._id);
                        return (
                            <button
                                key={collection._id}
                                type="button"
                                className={saved ? styles.collectionSaved : styles.collection}
                                disabled={!canSave || Boolean(busy)}
                                onClick={() => toggle(collection)}
                            >
                                <span>
                                    <strong>{collection.title}</strong>
                                    <small>{collection.visibility}</small>
                                </span>
                                <span className={styles.saveState}>
                                    {busy === collection._id ?
                                        'Saving…' : saved ? <><Check size={15} /> Saved</> : 'Save'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
            {error ? (
                <p className={styles.error} role="alert">
                    {error}
                    {collections === null ? (
                        <>
                            {' '}
                            <Button
                                variant="secondary"
                                onClick={() => setLoadAttempt(attempt => attempt + 1)}
                            >
                                Try again
                            </Button>
                        </>
                    ) : null}
                </p>
            ) : null}
            {status ? <p className={styles.status} aria-live="polite">{status}</p> : null}
        </Modal>
    );
};

CollectionSaveModal.propTypes = {
    project: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default CollectionSaveModal;
