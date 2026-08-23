import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './button.css';

const ButtonComponent = ({
    className,
    disabled,
    href,
    iconClassName,
    iconElem,
    iconSrc,
    onClick,
    type,
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
    type: PropTypes.oneOf(['button', 'reset', 'submit'])
};

ButtonComponent.defaultProps = {
    disabled: false,
    type: 'button'
};

export default ButtonComponent;
