/* eslint-disable max-len */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Package, Play} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api, {embedUrl} from '../../api';
import {timeAgo} from '../../format';
import useLatest from '../../use-latest.js';
import RichText from '../../components/RichText.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Notice from '../../components/ui/Notice.jsx';
import SelectMenu from '../../components/ui/SelectMenu.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {releasePayload} from './project-helpers.js';
import styles from '../Project.module.css';

const ReleaseList = ({id, isOwner, viewerName}) => {
    const {text: communityText} = useCommunityText();
    const actionContext = `${id}\u0000${viewerName}`;
    const actionContextRef = useRef(actionContext);
    actionContextRef.current = actionContext;
    const [releases, setReleases] = useState(null);
    const [form, setForm] = useState({version: '', channel: 'stable', notes: ''});
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState(false);
    const [busy, setBusy] = useState(false);
    const actionLocks = useRef(new Set());
    const beginLoad = useLatest();
    const updateForm = (field, value) => setForm(current => ({...current, [field]: value}));

    const load = useCallback(() => {
        const fresh = beginLoad();
        setReleases(null);
        setLoadError(false);
        api.releases(id)
            .then(fresh(data => setReleases(data.releases || [])))
            .catch(fresh(() => setLoadError(true)));
    }, [beginLoad, id, viewerName]);

    useEffect(() => {
        actionLocks.current.clear();
        setForm({version: '', channel: 'stable', notes: ''});
        setError('');
        setBusy(false);
        load();
    }, [load]);

    const create = async event => {
        event.preventDefault();
        const context = actionContextRef.current;
        if (actionLocks.current.has(context)) return;
        const payload = releasePayload(form);
        if (!payload.version) {
            setError(communityText('Enter a version before publishing.'));
            return;
        }
        actionLocks.current.add(context);
        setBusy(true);
        setError('');
        try {
            const data = await api.createRelease(id, payload);
            if (actionContextRef.current !== context) return;
            setForm({version: '', channel: 'stable', notes: ''});
            setReleases(current => [data.release, ...(current || []).filter(item => item._id !== data.release._id)]);
        } catch (e) {
            if (actionContextRef.current === context) {
                setError(e.message || communityText('Could not create the release.'));
            }
        } finally {
            actionLocks.current.delete(context);
            if (actionContextRef.current === context) setBusy(false);
        }
    };

    return (
        <div className={styles.toolPanel}>
            {isOwner ? (
                <form className={styles.inlineForm} onSubmit={create}>
                    <h3>{communityText('Publish a release')}</h3>
                    <div className={styles.inlineFields}>
                        <input value={form.version} disabled={busy} required maxLength={50} placeholder={communityText('Version, such as 1.2.0')} onChange={event => updateForm('version', event.target.value)} />
                        <SelectMenu
                            options={[
                                {value: 'stable', label: communityText('Stable')},
                                {value: 'beta', label: communityText('Beta')},
                                {value: 'development', label: communityText('Development')}
                            ]}
                            value={form.channel}
                            disabled={busy}
                            onChange={value => updateForm('channel', value)}
                            ariaLabel={communityText('Release channel')}
                        />
                    </div>
                    <textarea value={form.notes} disabled={busy} placeholder={communityText('What changed?')} onChange={event => updateForm('notes', event.target.value)} />
                    <Button type="submit" variant="primary" busy={busy} busyLabel={communityText('Publishing…')}>
                        <Package size={15} />{communityText('Publish release')}</Button>
                    {error ? <Notice variant="error">{error}</Notice> : null}
                </form>
            ) : null}
            {!releases && !loadError ? <StatusMessage>{communityText('Loading releases…')}</StatusMessage> : null}
            {loadError ? <StatusMessage error onRetry={load}>{communityText('Could not load releases.')}</StatusMessage> : null}
            {releases && !releases.length ? (
                <EmptyState icon={Package} title={communityText('No releases yet')}>
                    {communityText('Published releases will appear here.')}
                </EmptyState>
            ) : null}
            {releases && releases.map(release => (
                <article className={styles.release} key={release._id}>
                    <div><strong>{release.version}</strong> <span className={styles.releaseChannel}>{release.channel}</span></div>
                    <span className={styles.muted}>{timeAgo(release.created)}</span>
                    {release.notes ? <RichText text={release.notes} /> : null}
                    {release.jsonUrl ? (
                        <Button
                            as="a"
                            variant="primary"
                            className={styles.releasePlay}
                            href={embedUrl({id, projectJsonUrl: release.jsonUrl, assetsBase: release.assetsBase})}
                        >
                            <Play size={15} />{communityText('Play this release')}</Button>
                    ) : null}
                </article>
            ))}
        </div>
    );
};

export default ReleaseList;
