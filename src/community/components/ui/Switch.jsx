import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './Switch.module.css';

const SwitchInput = ({ariaLabel, checked, disabled, onChange}) => (
    <React.Fragment>
        <input
            className={styles.input}
            type="checkbox"
            aria-label={ariaLabel}
            checked={checked}
            disabled={disabled}
            onChange={event => onChange(event.target.checked)}
        />
        <span className={styles.track} aria-hidden="true">
            <span className={styles.thumb} />
        </span>
    </React.Fragment>
);

SwitchInput.propTypes = {
    ariaLabel: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired
};

const Switch = ({ariaLabel, checked, className, disabled, onChange}) => (
    <label className={classNames(styles.control, className, {[styles.disabled]: disabled})}>
        <SwitchInput
            ariaLabel={ariaLabel}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
        />
    </label>
);

Switch.propTypes = {
    ariaLabel: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired
};

const SwitchRow = ({checked, className, description, disabled, label, onChange}) => (
    <label className={classNames(styles.row, className, {[styles.disabled]: disabled})}>
        <span className={styles.copy}>
            <span className={styles.label}>{label}</span>
            {description ? <span className={styles.description}>{description}</span> : null}
        </span>
        <SwitchInput
            ariaLabel={typeof label === 'string' ? label : 'Toggle setting'}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
        />
    </label>
);

SwitchRow.propTypes = {
    checked: PropTypes.bool.isRequired,
    className: PropTypes.string,
    description: PropTypes.node,
    disabled: PropTypes.bool,
    label: PropTypes.node.isRequired,
    onChange: PropTypes.func.isRequired
};

export {Switch, SwitchRow};
