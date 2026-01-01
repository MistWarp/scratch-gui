import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './toggle-buttons.css';

const ToggleButtons = ({buttons, className, disabled}) => (
    <div
        className={classNames(
            className,
            styles.row,
            {
                [styles.disabled]: disabled
            }
        )}
    >
        {buttons.map((button, index) => {
            const Icon = button.icon;
            return (
                <button
                    key={`toggle-${index}`}
                    className={styles.button}
                    title={button.title}
                    aria-label={button.title}
                    aria-pressed={button.isSelected}
                    onClick={button.handleClick}
                    disabled={disabled}
                >
                    {typeof Icon === 'function' ? (
                        <img
                            src={Icon()}
                            className={button.iconClassName}
                            draggable={false}
                            width={20}
                            height={20}
                        />
                    ) : typeof Icon === 'string' ? (
                        <img
                            src={Icon}
                            className={button.iconClassName}
                            draggable={false}
                            width={20}
                            height={20}
                        />
                    ) : Icon ? (
                        <Icon
                            className={button.iconClassName}
                            size={20}
                        />
                    ) : null}
                </button>
            );
        })}
    </div>
);

ToggleButtons.propTypes = {
    buttons: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        handleClick: PropTypes.func.isRequired,
        // string: image URL
        // function: returns image URL (legacy)
        // object: React forwardRef/exotic components (e.g. lucide-react)
        icon: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
        iconClassName: PropTypes.string,
        isSelected: PropTypes.bool
    })),
    className: PropTypes.string,
    disabled: PropTypes.bool
};

ToggleButtons.defaultProps = {
    disabled: false
};

export default ToggleButtons;
