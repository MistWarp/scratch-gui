import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './Button.module.css';

const VARIANTS = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger
};

const Button = ({busy, busyLabel, children, className, disabled, type, variant, ...props}) => (
    <button
        type={type}
        className={classNames(styles.button, VARIANTS[variant] || styles.secondary, className)}
        disabled={disabled || busy}
        aria-busy={busy || null}
        {...props}
    >
        {busy ? <span className={styles.busyIndicator} aria-hidden="true" /> : null}
        {busy && busyLabel ? busyLabel : children}
    </button>
);

Button.propTypes = {
    busy: PropTypes.bool,
    busyLabel: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    type: PropTypes.oneOf(['button', 'reset', 'submit']),
    variant: PropTypes.oneOf(Object.keys(VARIANTS))
};

Button.defaultProps = {
    busy: false,
    disabled: false,
    type: 'button',
    variant: 'secondary'
};

export default Button;
