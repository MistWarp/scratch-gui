import React from 'react';
import styles from './Button.module.css';

const VARIANTS = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger
};

const Button = ({variant = 'secondary', className = '', ...props}) => (
    <button
        type="button"
        className={`${styles.button} ${VARIANTS[variant] || styles.secondary}${className ? ` ${className}` : ''}`}
        {...props}
    />
);

export default Button;
