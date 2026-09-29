import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {percentOf} from '../../classroom.js';
import styles from './UsageMeter.module.css';

const UsageMeter = ({className, label, total, used, valueLabel}) => {
    const percent = percentOf(used, total);
    return (
        <div className={classNames(styles.meter, className)}>
            <div className={styles.top}>
                <span className={styles.label}>{label}</span>
                <span className={styles.value}>{valueLabel}</span>
            </div>
            <div
                className={styles.track}
                role="progressbar"
                aria-label={typeof label === 'string' ? label : null}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(percent)}
            >
                <div
                    className={classNames(styles.fill, {[styles.high]: percent >= 90})}
                    style={{width: `${percent}%`}}
                />
            </div>
        </div>
    );
};

UsageMeter.propTypes = {
    className: PropTypes.string,
    label: PropTypes.node.isRequired,
    total: PropTypes.number.isRequired,
    used: PropTypes.number.isRequired,
    valueLabel: PropTypes.node.isRequired
};

export default UsageMeter;
