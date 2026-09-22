import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './button.css';

const variantClassNames = {
    primary: styles.variantPrimary,
    secondary: styles.variantSecondary,
    danger: styles.variantDanger
};

const sizeClassNames = {
    small: styles.sizeSmall,
    medium: styles.sizeMedium
};

const ButtonComponent = ({
    className,
    disabled,
    href,
    iconClassName,
    iconElem,
    iconSrc,
    onClick,
    size,
    type,
    variant,
    children,
    ...props
}) => {
    const Icon = iconElem;
    const iconClass = classNames(iconClassName, styles.icon);
    const content = (
        <React.Fragment>
            {Icon ? <Icon
                className={iconClass}
                size={20}
            /> : (
                iconSrc ? <img
                    className={iconClass}
                    src={iconSrc}
                    alt=""
                /> : null
            )}
            <span className={styles.content}>{children}</span>
        </React.Fragment>
    );
    const controlClassName = classNames(
        styles.outlinedButton,
        variant ? styles.variantButton : null,
        variant ? variantClassNames[variant] : null,
        variant ? sizeClassNames[size] : null,
        className
    );

    if (href) {
        return (
            <a
                className={controlClassName}
                href={disabled ? null : href}
                aria-disabled={disabled}
                onClick={disabled ? null : onClick}
                {...props}
            >
                {content}
            </a>
        );
    }

    return (
        <button
            className={controlClassName}
            type={type}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {content}
        </button>
    );
};

ButtonComponent.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    href: PropTypes.string,
    iconClassName: PropTypes.string,
    iconSrc: PropTypes.string,
    iconElem: PropTypes.elementType,
    onClick: PropTypes.func,
    size: PropTypes.oneOf(['small', 'medium']),
    type: PropTypes.oneOf(['button', 'reset', 'submit']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'danger'])
};

ButtonComponent.defaultProps = {
    disabled: false,
    size: 'medium',
    type: 'button'
};

export default ButtonComponent;
