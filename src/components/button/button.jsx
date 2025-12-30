import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './button.css';

const ButtonComponent = ({
    className,
    disabled,
    iconClassName,
    iconElem,
    iconSrc,
    onClick,
    children,
    ...props
}) => {

    if (disabled) {
        onClick = function () {};
    }

    const Icon = iconElem;
    const iconClass = classNames(iconClassName, styles.icon);

    return (
        <span
            className={classNames(
                styles.outlinedButton,
                className
            )}
            role="button"
            onClick={onClick}
            {...props}
        >
            {Icon ? <Icon className={iconClass} size={20} /> : (
                iconSrc ? <img className={iconClass} src={iconSrc} alt="" /> : null
            )}
            <div className={styles.content}>{children}</div>
        </span>
    );
};

ButtonComponent.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    iconClassName: PropTypes.string,
    iconSrc: PropTypes.string,
    iconHeight: PropTypes.number,
    iconWidth: PropTypes.number,
    iconElem: PropTypes.elementType,
    onClick: PropTypes.func
};

export default ButtonComponent;
