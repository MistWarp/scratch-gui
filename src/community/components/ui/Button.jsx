import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './Button.module.css';

const VARIANTS = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger
};

const Button = ({as: Component, busy, busyLabel, children, className, disabled, type, variant, ...props}) => (
    <Component
        type={Component === 'button' ? type : null}
        className={classNames(styles.button, VARIANTS[variant] || styles.secondary, className)}
        disabled={Component === 'button' ? disabled || busy : null}
        aria-disabled={Component !== 'button' && (disabled || busy) ? true : null}
        aria-busy={busy || null}
        {...props}
    >
        {busy ? <span className={styles.busyIndicator} aria-hidden="true" /> : null}
        {busy && busyLabel ? busyLabel : children}
    </Component>
);

Button.propTypes = {
    as: PropTypes.elementType,
    busy: PropTypes.bool,
    busyLabel: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    type: PropTypes.oneOf(['button', 'reset', 'submit']),
    variant: PropTypes.oneOf(Object.keys(VARIANTS))
};

Button.defaultProps = {
    as: 'button',
    busy: false,
    disabled: false,
    type: 'button',
    variant: 'secondary'
};

export default Button;
