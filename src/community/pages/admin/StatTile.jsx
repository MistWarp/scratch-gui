import React from 'react';
import styles from '../Admin.module.css';

const StatTile = ({label, value, detail, icon: Icon, prominent = false}) => (
    <div className={`${styles.statTile} ${prominent ? styles.statTileProminent : ''}`}>
        <div className={styles.statTileTop}>
            {Icon ? <span className={styles.statIcon}><Icon size={18} /></span> : null}
            <span className={styles.statLabel}>{label}</span>
        </div>
        <span className={styles.statValue}>{value}</span>
        {detail ? <span className={styles.statDetail}>{detail}</span> : null}
    </div>
);

export default StatTile;
