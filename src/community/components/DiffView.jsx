import React from 'react';
import styles from './DiffView.module.css';

const lineClass = line => {
    if (line.startsWith('+') && !line.startsWith('+++')) return styles.add;
    if (line.startsWith('-') && !line.startsWith('---')) return styles.del;
    if (line.startsWith('@@')) return styles.hunk;
    if (line.startsWith('diff ') || line.startsWith('index ') ||
        line.startsWith('+++') || line.startsWith('---')) return styles.meta;
    return styles.ctx;
};

const DiffView = ({diff}) => {
    if (diff === null || typeof diff === 'undefined') {
        return <p className={styles.empty}>Loading diff…</p>;
    }
    if (!diff) {
        return <p className={styles.empty}>No changes.</p>;
    }
    const lines = diff.split('\n');
    return (
        <pre className={styles.diff}>
            {lines.map((line, i) => (
                <div
                    key={i}
                    className={lineClass(line)}
                >{line || ' '}</div>
            ))}
        </pre>
    );
};

export default DiffView;
