import {getCommunityLocale} from '../locale.js';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {Activity, History, LifeBuoy, RefreshCw} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import {useCommunityIntl} from '../i18n.jsx';
import {safeDate} from '../format.js';
import useLatest from '../use-latest.js';
import styles from './InfoPage.module.css';

const STATUS_BASE = process.env.MW_STATUS_URL || '';

export const statusDate = value => safeDate(value);

const Status = () => {
    const {text: communityText} = useCommunityIntl();
    const {t} = useCommunityIntl();
    const [status, setStatus] = useState(null);
    const [history, setHistory] = useState([]);
    const [failed, setFailed] = useState(false);
    const [historyFailed, setHistoryFailed] = useState(false);
    const [loading, setLoading] = useState(false);
    const beginLoad = useLatest();
    const check = useCallback(() => {
        const fresh = beginLoad();
        setFailed(false);
        setHistoryFailed(false);
        setLoading(true);
        Promise.allSettled([
            fetch(`${STATUS_BASE}/v1/status`).then(response => (response.ok ? response.json() : Promise.reject(new Error('status failed')))),
            fetch(`${STATUS_BASE}/v1/history?hours=168`).then(response => (response.ok ? response.json() : Promise.reject(new Error('history failed'))))
        ]).then(fresh(([statusResult, historyResult]) => {
            if (statusResult.status === 'fulfilled') {
                setStatus(statusResult.value);
            } else {
                setStatus(null);
                setFailed(true);
            }
            if (historyResult.status === 'fulfilled') {
                setHistory(historyResult.value.buckets || []);
            } else {
                setHistory([]);
                setHistoryFailed(true);
            }
            setLoading(false);
        }));
    }, [beginLoad]);
    useEffect(check, [check]);
    const uptimeByService = useMemo(() => {
        const totals = {};
        history.forEach(bucket => {
            const entry = totals[bucket.service] || {uptime: 0, samples: 0};
            entry.uptime += Number(bucket.uptime) * Number(bucket.samples);
            entry.samples += Number(bucket.samples);
            totals[bucket.service] = entry;
        });
        return Object.keys(totals).reduce((result, service) => ({
            ...result,
            [service]: totals[service].samples ? totals[service].uptime / totals[service].samples : 0
        }), {});
    }, [history]);
    const label = value => t(`status.${['operational', 'degraded', 'unavailable'].includes(value) ? value : 'unknown'}`);
    const statusClass = value => (value === 'operational' ? styles.statusOk : value === 'degraded' ? styles.statusWarn : value === 'unavailable' ? styles.statusBad : styles.statusChecking);
    const serviceDetail = service => {
        const latency = communityText('{ms} ms', {ms: service.latencyMs});
        const uptime = historyFailed ?
            communityText('History unavailable') :
            `${t('status.history')} ${uptimeByService[service.service]?.toFixed(2) || '0.00'}%`;
        return `${latency} · ${uptime}`;
    };
    return (
        <main className={styles.page}>
            <PageHeader icon={Activity} title={t('status.title')} lead={t('status.lead')} />
            <section className={styles.section} aria-live="polite" aria-busy={loading}>
                {loading && !status ? <StatusMessage compact>{t('status.loading')}</StatusMessage> : null}
                {failed ? <Notice variant="error">{t('status.failed')}</Notice> : null}
                {(status?.services || []).map(service => (
                    <div className={styles.statusRow} key={service.service}>
                        <span><strong>{service.name}</strong><small>{serviceDetail(service)}</small></span>
                        <span className={statusClass(service.status)}>{label(service.status)}</span>
                    </div>
                ))}
                <div className={styles.actions}>
                    <Button onClick={check} busy={loading} busyLabel={communityText('Checking…')}>
                        <RefreshCw size={16} aria-hidden="true" />
                        {t('status.retry')}
                    </Button>
                    {statusDate(status?.generatedAt) ? <time dateTime={statusDate(status.generatedAt).toISOString()}>{communityText('Updated {date}', {date: statusDate(status.generatedAt).toLocaleString(getCommunityLocale())})}</time> : null}
                </div>
            </section>
            <section className={styles.section}>
                <SectionHeading icon={History} title={t('status.incidents')} />
                {status && !status.incidents?.length ? <p>{t('status.noIncidents')}</p> : null}
                {(status?.incidents || []).map(incident => <article className={styles.incident} key={incident.id}><div><strong>{incident.title}</strong><span className={statusClass(incident.status === 'resolved' ? 'operational' : 'unavailable')}>{incident.status}</span></div><p>{incident.body}</p>{statusDate(incident.createdAt) ? <time dateTime={statusDate(incident.createdAt).toISOString()}>{statusDate(incident.createdAt).toLocaleString(getCommunityLocale())}</time> : null}</article>)}
            </section>
            <section className={styles.section}>
                <SectionHeading icon={LifeBuoy} title={communityText('Still having trouble?')} />
                <p>{communityText('This monitor cannot detect browser-specific problems. If a problem continues, contact support.')}</p>
                <p><Link to="/support">{communityText('Open the support page')}</Link></p>
            </section>
        </main>
    );
};

export default Status;
