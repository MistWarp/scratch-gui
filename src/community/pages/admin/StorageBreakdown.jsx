/* eslint-disable max-len */
import React from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {formatBytes} from '../../format';
import styles from '../Admin.module.css';
import {percent} from './admin-format.js';

const STORAGE_LABELS = {
    assets: 'Assets',
    history: 'Project history',
    projectData: 'Project data',
    database: 'Database',
    cache: 'Cache',
    thumbnails: 'Thumbnails',
    other: 'Other'
};

const StorageBreakdown = ({title, icon: Icon, data, detail}) => {
    const {text: communityText} = useCommunityText();
    const types = data && data.types ? data.types : {};
    const total = Number(data && data.bytes) || 0;
    const rows = Object.entries(types)
        .filter(([, bytes]) => Number(bytes) > 0)
        .sort((a, b) => Number(b[1]) - Number(a[1]));
    return (
        <article className={styles.storagePanel}>
            <header className={styles.storageHeader}>
                <span className={styles.storageIcon}><Icon size={18} /></span>
                <div><h4>{title}</h4><strong>{formatBytes(total)}</strong></div>
                {detail ? <span>{detail}</span> : null}
            </header>
            <div className={styles.storageBar} aria-label={communityText('{value1} composition', {value1: title})}>
                {rows.map(([type, bytes]) => (
                    <span
                        key={type}
                        className={styles[`storageType${type[0].toUpperCase()}${type.slice(1)}`] || styles.storageTypeOther}
                        style={{width: `${(Number(bytes) / total) * 100}%`}}
                        title={`${STORAGE_LABELS[type] || type}: ${percent(bytes, total)}`}
                    />
                ))}
            </div>
            <div className={styles.storageTypes}>
                {rows.length ? rows.map(([type, bytes]) => (
                    <div key={type}>
                        <span className={styles.storageTypeName}>{STORAGE_LABELS[type] || type}</span>
                        <strong>{percent(bytes, total)}</strong>
                        <small>{formatBytes(bytes)}</small>
                    </div>
                )) : <p>{communityText('No data stored.')}</p>}
            </div>
        </article>
    );
};

export default StorageBreakdown;
