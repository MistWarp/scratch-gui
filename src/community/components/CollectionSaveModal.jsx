import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Check, Library, Plus} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import Notice from './ui/Notice.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './CollectionSaveModal.module.css';

const CollectionSaveModal = ({project, onClose}) => {
    const {text: communityText} = useCommunityText();
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
    const visibilityLabels = {
        public: communityText('Public'),
        unlisted: communityText('Unlisted'),
        private: communityText('Private')
    };

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
                if (active) setError(e.message || communityText('Could not load your collections.'));
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
            setStatus(saved ?
                communityText('Removed from {value1}.', {value1: collection.title}) :
                communityText('Saved to {value1}.', {value1: collection.title}));
        } catch (e) {
            if (actionContextRef.current === context) {
                setError(e.message || communityText('Could not update this collection.'));
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
                        const detail = e.message || '';
                        setError(`${communityText('Created {value1}, but could not save this project.', {
                            value1: collection.title
                        })} ${detail}`.trim());
                    }
                    return;
                }
            }
            setStatus(canSave ?
                communityText('Created {value1} and saved this project.', {value1: collection.title}) :
                communityText('Created {value1}.', {value1: collection.title}));
        } catch (e) {
            if (actionContextRef.current === context) {
                setError(e.message || communityText('Could not create the collection.'));
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (actionContextRef.current === context) setBusy('');
        }
    };

    let listBody = null;
    if (collections === null && !error) {
        listBody = <StatusMessage compact>{communityText('Loading collections…')}</StatusMessage>;
    } else if (collections === null && error) {
        listBody = (
            <StatusMessage compact error onRetry={() => setLoadAttempt(attempt => attempt + 1)}>
                {error}
            </StatusMessage>
        );
    } else if (collections && !collections.length) {
        listBody = (
            <EmptyState compact icon={Library} title={communityText('No collections yet')}>
                {communityText('You do not have any collections yet.')}
            </EmptyState>
        );
    } else if (collections && collections.length) {
        listBody = (
            <div className={styles.list}>
                {collections.map(collection => {
                    const saved = savedIds.has(collection._id);
                    let state = communityText('Save');
                    if (busy === collection._id) state = communityText('Saving…');
                    else if (saved) state = <><Check size={15} />{communityText('Saved')}</>;
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
                                <small>{visibilityLabels[collection.visibility] || collection.visibility}</small>
                            </span>
                            <span className={styles.saveState}>{state}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <Modal
            icon={Library}
            title={communityText('Save to a collection')}
            onClose={onClose}
            dismissDisabled={Boolean(busy)}
        >
            {!canSave ? (
                <Notice variant="warning">
                    {communityText('Share this project or make it unlisted before adding it to a collection.')}
                </Notice>
            ) : null}
            <form className={styles.create} onSubmit={create}>
                <label>
                    <span>{communityText('New collection')}</span>
                    <input
                        value={title}
                        disabled={Boolean(busy)}
                        maxLength={100}
                        placeholder={communityText('Collection name')}
                        onChange={event => setTitle(event.target.value)}
                    />
                </label>
                <div className={styles.createActions}>
                    <select
                        value={visibility}
                        disabled={Boolean(busy)}
                        onChange={event => setVisibility(event.target.value)}
                        aria-label={communityText('Collection visibility')}
                    >
                        <option value="public">{communityText('Public')}</option>
                        <option value="unlisted">{communityText('Unlisted')}</option>
                        <option value="private">{communityText('Private')}</option>
                    </select>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={!title.trim() || Boolean(busy)}
                        busy={busy === 'new'}
                        busyLabel={communityText('Creating…')}
                    >
                        <Plus size={15} />
                        {canSave ? communityText('Create and save') : communityText('Create collection')}
                    </Button>
                </div>
            </form>
            <div className={styles.divider} />
            <SectionHeading
                as="h3"
                icon={Library}
                title={communityText('Your collections')}
                count={collections ? collections.length : null}
            />
            {listBody}
            {error && collections !== null ? <Notice variant="error">{error}</Notice> : null}
            {status ? <Notice variant="success">{status}</Notice> : null}
        </Modal>
    );
};

CollectionSaveModal.propTypes = {
    project: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default CollectionSaveModal;
