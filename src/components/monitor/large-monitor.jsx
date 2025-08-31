import React from 'react';
import PropTypes from 'prop-types';
import styles from './monitor.css';

const formatValue = value => {
    // Avoid rendering objects directly as React children which throws.
    if (value === null || value === undefined) return String(value);
    if (Array.isArray(value)) return '[Array]';
    if (typeof value === 'object') return '[Object]';
    return value;
};

const LargeMonitor = ({categoryColor, value}) => (
    <div className={styles.largeMonitor}>
        <div
            className={styles.largeValue}
            style={{
                background: categoryColor.background,
                color: categoryColor.text
            }}
        >
            {formatValue(value)}
        </div>
    </div>
);

LargeMonitor.propTypes = {
    categoryColor: PropTypes.shape({
        background: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
    }).isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.object
    ])
};

export default LargeMonitor;
