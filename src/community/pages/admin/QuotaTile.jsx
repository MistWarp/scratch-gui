/* eslint-disable max-len */
import React from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {AlertTriangle, HardDrive} from 'lucide-react';
import {formatBytes} from '../../format';
import styles from '../Admin.module.css';

const QuotaTile = ({quota}) => {
    const {text: communityText} = useCommunityText();
    const pct = (quota.used / quota.limit) * 100;
    return (
        <div className={styles.statTile}>
            <div className={styles.statTileTop}>
                <span className={styles.statIcon}><HardDrive size={18} /></span>
                <span className={styles.statLabel}>{communityText('Storage')}</span>
            </div>
            <span className={styles.statValue}>{formatBytes(quota.used)}</span>
            <span className={styles.statDetail}>{communityText('of {value1} used', {value1: formatBytes(quota.limit)})}</span>
            <div className={styles.quotaBarBg}>
                <div
                    className={styles.quotaBarFill}
                    style={{width: `${Math.min(100, pct)}%`}}
                />
            </div>
            <span className={pct >= 80 ? styles.quotaWarnText : styles.quotaPctText}>
                {pct >= 80 ? <AlertTriangle size={14} /> : null}{communityText('{value1}% full', {value1: Math.round(pct)})}</span>
        </div>
    );
};

export default QuotaTile;
