/* eslint-disable max-len */
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {Puzzle} from 'lucide-react';
import api from '../../api';
import UnderlineTabs from '../../components/UnderlineTabs.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Notice from '../../components/ui/Notice.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import styles from '../Admin.module.css';
import AdminActionDialog from './AdminActionDialog.jsx';

const ExtensionManager = () => {
    const {text: communityText} = useCommunityText();
    const [data, setData] = useState(null);
    const [tab, setTab] = useState('untrusted');
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [source, setSource] = useState(null);
    const [blockedUrl, setBlockedUrl] = useState('');
    const [query, setQuery] = useState('');
    const [dialog, setDialog] = useState(null);
    const [dialogBusy, setDialogBusy] = useState(false);
    const [dialogError, setDialogError] = useState('');
    const policyInFlight = useRef(false);

    const load = useCallback(() => {
        setError('');
        return api.admin.extensions()
            .then(setData)
            .catch(e => setError(e.message || 'Could not load extensions.'));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const applyPolicy = async (hash, status) => {
        if (policyInFlight.current) return;
        const releasePolicy = () => {
            policyInFlight.current = false;
        };
        policyInFlight.current = true;
        setDialogBusy(true);
        setDialogError('');
        try {
            const result = await api.admin.setExtensionPolicy(hash, status);
            setNote(result.affected ?
                communityText('Made {value1} affected projects private and notified their owners.', {value1: result.affected}) :
                communityText('Extension policy updated.'));
            setSource(null);
            setDialog(null);
            setData(current => ({
                ...current,
                extensions: (current.extensions || []).map(extension => {
                    if (extension.hash === hash) return {...extension, status};
                    return extension;
                })
            }));
        } catch (e) {
            if (dialog) setDialogError(e.message || 'Could not update extension policy.');
            else setError(e.message || 'Could not update extension policy.');
        } finally {
            releasePolicy();
            setDialogBusy(false);
        }
    };

    const setPolicy = (hash, status) => {
        if (status === 'blocked') {
            setDialogError('');
            setDialog({
                kind: 'hash',
                hash,
                status,
                title: communityText('Block extension?'),
                description: communityText('This makes every project using the extension private and notifies its owner.'),
                action: communityText('Block extension'),
                danger: true,
                icon: Puzzle
            });
            return;
        }
        applyPolicy(hash, status);
    };

    const applyUrlPolicy = async (url, blocked) => {
        if (policyInFlight.current) return;
        const releasePolicy = () => {
            policyInFlight.current = false;
        };
        policyInFlight.current = true;
        setDialogBusy(true);
        setDialogError('');
        try {
            const result = await api.admin.setExtensionUrlPolicy(url, blocked);
            setNote(result.affected ?
                communityText('Made {value1} affected projects private and notified their owners.', {value1: result.affected}) :
                communityText('URL policy updated.'));
            setBlockedUrl('');
            setDialog(null);
            setData(current => ({
                ...current,
                blockedUrls: blocked ?
                    [...new Set([...(current.blockedUrls || []), url])] :
                    (current.blockedUrls || []).filter(blockedEntry => blockedEntry !== url)
            }));
        } catch (e) {
            if (dialog) setDialogError(e.message || 'Could not update URL policy.');
            else setError(e.message || 'Could not update URL policy.');
        } finally {
            releasePolicy();
            setDialogBusy(false);
        }
    };

    const setUrlPolicy = (url, blocked) => {
        if (blocked) {
            setDialogError('');
            setDialog({
                kind: 'url',
                url,
                blocked,
                title: communityText('Block extension URL?'),
                description: communityText('This makes every project using the URL private and notifies its owner.'),
                action: communityText('Block URL'),
                danger: true,
                icon: Puzzle
            });
            return;
        }
        applyUrlPolicy(url, blocked);
    };

    const confirmPolicy = () => {
        if (!dialog) return;
        if (dialog.kind === 'hash') return applyPolicy(dialog.hash, dialog.status);
        return applyUrlPolicy(dialog.url, dialog.blocked);
    };

    const viewSource = async hash => {
        try {
            setError('');
            setSource({hash, text: communityText('Loading…')});
            setSource({hash, text: await api.admin.extensionSource(hash)});
        } catch (e) {
            setSource(null);
            setError(e.message || 'Could not load extension source.');
        }
    };

    if (!data) {
        return (
            <div>
                <SectionHeading icon={Puzzle} title={communityText('Extensions')} />
                {error ? <StatusMessage error onRetry={load}>{error}</StatusMessage> : <StatusMessage />}
            </div>
        );
    }

    const allExtensions = data.extensions || [];
    const search = query.trim().toLowerCase();
    const extensions = allExtensions.filter(extension => {
        if (extension.status !== tab) return false;
        if (!search) return true;
        const metadata = extension.metadata || {};
        return [
            extension.hash,
            ...(extension.urls || []),
            metadata.name,
            metadata.id,
            metadata.description,
            metadata.author,
            metadata.license
        ].some(value => typeof value === 'string' && value.toLowerCase().includes(search));
    });
    const tabs = [
        {key: 'untrusted', label: communityText('To be verified')},
        {key: 'ignored', label: communityText('Ignored')},
        {key: 'trusted', label: communityText('Trusted')},
        {key: 'blocked', label: communityText('Blocked')}
    ].map(item => ({
        key: item.key,
        label: (
            <React.Fragment>
                {item.label}
                <b>{allExtensions.filter(extension => extension.status === item.key).length}</b>
            </React.Fragment>
        )
    }));

    return (
        <div>
            <AdminActionDialog
                dialog={dialog}
                busy={dialogBusy}
                error={dialogError}
                onChange={() => {}}
                onCancel={() => {
                    if (!policyInFlight.current) setDialog(null);
                }}
                onConfirm={confirmPolicy}
            />
            <SectionHeading icon={Puzzle} title={communityText('Extensions')} />
            <input
                type="search"
                className={`${styles.input} ${styles.extensionSearch}`}
                placeholder={communityText('Search extensions')}
                aria-label={communityText('Search extensions')}
                value={query}
                onChange={e => setQuery(e.target.value)}
            />
            <UnderlineTabs
                className={styles.tabs}
                items={tabs}
                value={tab}
                onChange={setTab}
                ariaLabel="Extension status"
                variant="buttons"
            />
            <div className={styles.addAdmin}>
                <input
                    className={styles.input}
                    placeholder={communityText('Block an extension URL')}
                    value={blockedUrl}
                    onChange={e => setBlockedUrl(e.target.value)}
                />
                <Button
                    variant="danger"
                    onClick={() => blockedUrl.trim() && setUrlPolicy(blockedUrl.trim(), true)}
                >{communityText('Block URL')}</Button>
            </div>
            {error ? <Notice variant="error" className={styles.notice}>{error}</Notice> : null}
            {note ? <Notice variant="success" className={styles.notice}>{note}</Notice> : null}
            {extensions.length ? (
                <div className={styles.list}>
                    {extensions.map(extension => (
                        <div
                            key={extension.hash}
                            className={styles.extensionRow}
                        >
                            <div className={styles.row}>
                                <div className={styles.rowInfo}>
                                    {extension.metadata && extension.metadata.name ? (
                                        <span className={styles.rowTitle}>{extension.metadata.name}</span>
                                    ) : null}
                                    {extension.metadata && extension.metadata.id ? (
                                        <span className={styles.rowMeta}>{communityText('ID: {value1}', {value1: extension.metadata.id})}</span>
                                    ) : null}
                                    {extension.metadata && extension.metadata.description ? (
                                        <span className={styles.rowMeta}>{extension.metadata.description}</span>
                                    ) : null}
                                    {extension.metadata && extension.metadata.author ? (
                                        <span className={styles.rowMeta}>{communityText('By: {value1}', {value1: extension.metadata.author})}</span>
                                    ) : null}
                                    {extension.metadata && extension.metadata.license ? (
                                        <span className={styles.rowMeta}>
                                            {communityText('License: {value1}', {value1: extension.metadata.license})}
                                        </span>
                                    ) : null}
                                    <span className={styles.extensionHash}>{extension.hash}</span>
                                    <span className={styles.rowMeta}>
                                        {communityText('Used in {value1, plural, one {# project} other {# projects}}', {value1: extension.projectCount})}
                                    </span>
                                    {extension.urls.map(url => (
                                        <span
                                            key={url}
                                            className={styles.extensionUrl}
                                        >
                                            {url}
                                            {!extension.gallery && /^https?:\/\//.test(url) ? (
                                                <button
                                                    className={styles.linkButton}
                                                    onClick={() => setUrlPolicy(url, true)}
                                                >{communityText('Block URL')}</button>
                                            ) : null}
                                        </span>
                                    ))}
                                </div>
                                <div className={styles.rowActions}>
                                    {extension.sourceAvailable ? (
                                        <Button onClick={() => viewSource(extension.hash)}>{communityText('View source')}</Button>
                                    ) : null}
                                    {!extension.gallery && tab !== 'trusted' ? (
                                        <Button onClick={() => setPolicy(extension.hash, 'trusted')}>{communityText('Trust')}</Button>
                                    ) : !extension.gallery ? (
                                        <Button onClick={() => setPolicy(extension.hash, 'untrusted')}>{communityText('Untrust')}</Button>
                                    ) : null}
                                    {tab === 'untrusted' ? (
                                        <Button onClick={() => setPolicy(extension.hash, 'ignored')}>{communityText('Ignore')}</Button>
                                    ) : tab === 'ignored' ? (
                                        <Button onClick={() => setPolicy(extension.hash, 'untrusted')}>{communityText('Review again')}</Button>
                                    ) : null}
                                    {!extension.gallery && tab !== 'blocked' ? (
                                        <Button variant="danger" onClick={() => setPolicy(extension.hash, 'blocked')}>{communityText('Block hash')}</Button>
                                    ) : !extension.gallery ? (
                                        <Button onClick={() => setPolicy(extension.hash, 'untrusted')}>{communityText('Unblock')}</Button>
                                    ) : null}
                                </div>
                            </div>
                            {source && source.hash === extension.hash ? (
                                <pre className={styles.extensionSource}>{source.text}</pre>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState compact icon={Puzzle} title={communityText('No extensions')}>
                    {search ?
                        communityText('No matching extensions.') :
                        (tab === 'untrusted' ? communityText('No extensions to verify.') : communityText('No {value1} extension hashes.', {value1: tab}))}
                </EmptyState>
            )}
            {tab === 'blocked' && data.blockedUrls && data.blockedUrls.length ? (
                <div className={styles.list}>
                    {data.blockedUrls.map(url => (
                        <div
                            key={url}
                            className={styles.row}
                        >
                            <span className={styles.extensionUrl}>{url}</span>
                            <Button onClick={() => setUrlPolicy(url, false)}>{communityText('Unblock URL')}</Button>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

export default ExtensionManager;
