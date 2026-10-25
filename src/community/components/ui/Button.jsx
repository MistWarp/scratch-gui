import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './Button.module.css';

const VARIANTS = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger
};

const Button = ({as: Component, busy, busyLabel, children, className, disabled, size, type, variant, ...props}) => (
    <Component
        type={Component === 'button' ? type : null}
        className={classNames(
            styles.button,
            VARIANTS[variant] || styles.secondary,
            {[styles.small]: size === 'small'},
            className
        )}
        disabled={Component === 'button' ? disabled || busy : null}
        aria-disabled={Component !== 'button' && (disabled || busy) ? true : null}
        aria-busy={busy || null}
        {...props}
    >
        <span
            className={classNames(styles.busyIndicator, {[styles.idle]: !busy})}
            aria-hidden="true"
        />
        {busyLabel ? (
            <>
                <span className={classNames(styles.content, {[styles.idle]: busy})}>{children}</span>
                {busy ? <span className={styles.content}>{busyLabel}</span> : null}
            </>
        ) : children}
    </Component>
);

Button.propTypes = {
    as: PropTypes.elementType,
    busy: PropTypes.bool,
    busyLabel: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    size: PropTypes.oneOf(['default', 'small']),
    type: PropTypes.oneOf(['button', 'reset', 'submit']),
    variant: PropTypes.oneOf(Object.keys(VARIANTS))
};

Button.defaultProps = {
    as: 'button',
    busy: false,
    disabled: false,
    size: 'default',
    type: 'button',
    variant: 'secondary'
};

export default Button;
