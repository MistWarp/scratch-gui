/* eslint-disable max-len */
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {AlertTriangle} from 'lucide-react';
import api from '../../api';
import UnderlineTabs from '../../components/UnderlineTabs.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Notice from '../../components/ui/Notice.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {timeAgo, formatDateTime} from '../../format';
import copyText from '../../copy-text.js';
import styles from '../Admin.module.css';
import AdminActionDialog from './AdminActionDialog.jsx';

const ErrorManager = () => {
    const {text: communityText} = useCommunityText();
    const [data, setData] = useState(null);
    const [show, setShow] = useState('open');
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [busy, setBusy] = useState('');
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
    const [responseJson, setResponseJson] = useState('');
    const [copied, setCopied] = useState(false);
    const mutationInFlight = useRef(false);
    const loadVersion = useRef(0);
    const finishMutation = () => {
        mutationInFlight.current = false;
        setBusy('');
    };

    const load = useCallback(nextShow => {
        const version = ++loadVersion.current;
        setError('');
        return api.admin.siteErrors(nextShow || show)
            .then(result => {
                if (version !== loadVersion.current) return;
                setData(result);
                setResponseJson(JSON.stringify(result, null, 2));
                setCopied(false);
            })
            .catch(e => {
                if (version === loadVersion.current) setError(e.message || 'Could not load errors.');
            });
    }, [show]);

    useEffect(() => {
        load(show);
    }, [show, load]);

    const setResolved = async (id, resolved) => {
        if (mutationInFlight.current) return;
        mutationInFlight.current = true;
        setBusy(id);
        setError('');
        try {
            await api.admin.resolveSiteError(id, resolved);
            setData(current => {
                if (!current) return current;
                const remaining = (current.errors || []).filter(item => item._id !== id);
                const updated = (current.errors || []).map(item => {
                    if (item._id === id) return {...item, resolved};
                    return item;
                });
                return {
                    ...current,
                    errors: show === 'open' ? remaining : updated,
                    openCount: resolved ?
                        Math.max(0, Number(current.openCount || 1) - 1) :
                        Number(current.openCount || 0) + 1
                };
            });
            window.dispatchEvent(new Event('mw:errors-updated'));
        } catch (e) {
            setError(e.message || 'Could not update that error.');
        } finally {
            finishMutation();
        }
    };

    const remove = async id => {
        if (mutationInFlight.current) return;
        mutationInFlight.current = true;
        setBusy(id);
        setError('');
        try {
            await api.admin.deleteSiteError(id);
            setData(current => {
                if (!current) return current;
                return {
                    ...current,
                    errors: (current.errors || []).filter(item => item._id !== id)
                };
            });
            if (expanded === id) setExpanded(null);
            window.dispatchEvent(new Event('mw:errors-updated'));
        } catch (e) {
            setError(e.message || 'Could not delete that error.');
        } finally {
            finishMutation();
        }
    };

    const removeAll = async () => {
        if (mutationInFlight.current) return;
        mutationInFlight.current = true;
        setBusy('all');
        setError('');
        try {
            await api.admin.deleteAllSiteErrors();
            ++loadVersion.current;
            setData(current => ({...current, errors: [], openCount: 0}));
            setResponseJson('');
            setCopied(false);
            setExpanded(null);
            setConfirmDeleteAll(false);
            window.dispatchEvent(new Event('mw:errors-updated'));
            await load(show);
        } catch (e) {
            setError(e.message || 'Could not delete all errors.');
        } finally {
            finishMutation();
        }
    };

    const copyResponse = async () => {
        setError('');
        try {
            await copyText(responseJson);
            setCopied(true);
        } catch (e) {
            setCopied(false);
            setError(e.message || 'Could not copy the response.');
        }
    };

    if (!data) {
        return (
            <div>
                <SectionHeading icon={AlertTriangle} title={communityText('Errors')} />
                {error ? <StatusMessage error onRetry={() => load(show)}>{error}</StatusMessage> : <StatusMessage />}
            </div>
        );
    }

    const search = query.trim().toLowerCase();
    const errors = (data.errors || []).filter(item => {
        if (!search) return true;
        return [
            item.message,
            item.stack,
            item.url,
            item.username,
            item.userAgent,
            item.projectId,
            item.kind,
            item.viewport,
            item.appVersion
        ].some(value => typeof value === 'string' && value.toLowerCase().includes(search));
    });

    return (
        <div>
            <SectionHeading icon={AlertTriangle} title={communityText('Errors')} />
            <AdminActionDialog
                dialog={confirmDeleteAll ? {
                    title: communityText('Delete all errors?'),
                    description: communityText('This permanently deletes all stored errors, including resolved errors and errors outside the current filter.'),
                    action: communityText('Delete all errors'),
                    danger: true
                } : null}
                busy={Boolean(busy)}
                error={error}
                onCancel={() => {
                    if (!mutationInFlight.current) setConfirmDeleteAll(false);
                }}
                onConfirm={removeAll}
            />
            <div className={styles.errorActions}>
                <Button disabled={!responseJson || Boolean(busy)} onClick={copyResponse}>
                    {copied ? communityText('Copied JSON') : communityText('Copy response JSON')}
                </Button>
                <Button
                    variant="danger"
                    disabled={Boolean(busy)}
                    onClick={() => {
                        setError('');
                        setConfirmDeleteAll(true);
                    }}
                >{communityText('Delete all errors')}</Button>
            </div>
            <input
                type="search"
                className={`${styles.input} ${styles.extensionSearch}`}
                placeholder={communityText('Search errors')}
                aria-label={communityText('Search errors')}
                value={query}
                onChange={e => setQuery(e.target.value)}
            />
            <UnderlineTabs
                className={styles.tabs}
                items={[
                    {key: 'open', label: <React.Fragment>{communityText('Open')}<b>{data.openCount || 0}</b></React.Fragment>},
                    {key: 'resolved', label: 'Resolved'},
                    {key: 'all', label: 'All'}
                ]}
                value={show}
                onChange={value => {
                    if (busy) return;
                    setShow(value);
                    setExpanded(null);
                }}
                ariaLabel="Error status"
                variant="buttons"
            />
            {error ? <Notice variant="error" className={styles.notice}>{error}</Notice> : null}
            {errors.length ? (
                <div className={styles.list}>
                    {errors.map(item => {
                        const id = item._id;
                        const isOpen = expanded === id;
                        return (
                            <div
                                key={id}
                                className={styles.extensionRow}
                            >
                                <div className={styles.row}>
                                    <div className={styles.rowInfo}>
                                        <span className={styles.rowTitle}>{item.message || communityText('Unknown error')}</span>
                                        <span className={styles.rowMeta}>
                                            {`${item.kind || 'uncaught'}${item.username ? ` · @${item.username}` : ' · anonymous'}${timeAgo(item.created) ? ` · ${timeAgo(item.created)} ago` : ''}`}
                                        </span>
                                        {item.url ? (
                                            <span className={styles.extensionUrl}>{item.url}</span>
                                        ) : null}
                                    </div>
                                    <div className={styles.rowActions}>
                                        <Button onClick={() => setExpanded(isOpen ? null : id)}>
                                            {isOpen ? communityText('Hide trace') : communityText('View trace')}
                                        </Button>
                                        {item.resolved ? (
                                            <Button disabled={Boolean(busy)} onClick={() => setResolved(id, false)}>{communityText('Reopen')}</Button>
                                        ) : (
                                            <Button disabled={Boolean(busy)} onClick={() => setResolved(id, true)}>{communityText('Resolve')}</Button>
                                        )}
                                        <Button variant="danger" disabled={Boolean(busy)} onClick={() => remove(id)}>{communityText('Delete')}</Button>
                                    </div>
                                </div>
                                {isOpen ? (
                                    <div>
                                        <span className={styles.rowMeta}>
                                            {[
                                                item.projectId ? `Project: ${item.projectId}` : null,
                                                item.viewport ? `Viewport: ${item.viewport}` : null,
                                                item.appVersion ? `Version: ${item.appVersion}` : null,
                                                item.created ? formatDateTime(item.created, 'Date unavailable') : null
                                            ].filter(Boolean).join(' · ')}
                                        </span>
                                        {item.userAgent ? (
                                            <span className={styles.rowMeta}>{item.userAgent}</span>
                                        ) : null}
                                        {item.stack ? (
                                            <pre className={styles.extensionSource}>{item.stack}</pre>
                                        ) : (
                                            <p className={styles.status}>{communityText('No stack trace was captured.')}</p>
                                        )}
                                        {item.componentStack ? (
                                            <pre className={styles.extensionSource}>{item.componentStack}</pre>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState compact icon={AlertTriangle} title={communityText('No errors')}>
                    {search ? communityText('No matching errors.') : communityText('No errors here.')}
                </EmptyState>
            )}
        </div>
    );
};

export default ErrorManager;
