import classNames from 'classnames';
import {Check, ChevronDown} from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import Dropdown, {DropdownItem} from './Dropdown.jsx';
import styles from './SelectMenu.module.css';

const SelectMenu = ({
    options, value, onChange, ariaLabel, disabled, className, menuClassName, align, width, compact
}) => {
    const selected = options.find(option => option.value === value) || options[0];

    return (
        <Dropdown
            align={align}
            className={classNames(styles.wrap, className)}
            menuClassName={classNames(styles.menu, menuClassName)}
            width={width}
            renderTrigger={({open, toggle}) => (
                <button
                    type="button"
                    className={classNames(styles.trigger, {[styles.compact]: compact})}
                    disabled={disabled}
                    aria-label={ariaLabel}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={toggle}
                >
                    <span className={styles.label}>{selected ? selected.label : ''}</span>
                    <ChevronDown size={15} aria-hidden="true" />
                </button>
            )}
        >
            {({close}) => options.map(option => (
                <DropdownItem
                    key={option.value}
                    className={styles.option}
                    aria-checked={option.value === value}
                    role="menuitemradio"
                    onClick={() => {
                        onChange(option.value);
                        close();
                    }}
                >
                    <span className={styles.check}>
                        {option.value === value ? <Check size={14} aria-hidden="true" /> : null}
                    </span>
                    <span>{option.label}</span>
                </DropdownItem>
            ))}
        </Dropdown>
    );
};

SelectMenu.propTypes = {
    align: PropTypes.oneOf(['left', 'right']),
    ariaLabel: PropTypes.string.isRequired,
    className: PropTypes.string,
    compact: PropTypes.bool,
    disabled: PropTypes.bool,
    menuClassName: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired
    })).isRequired,
    value: PropTypes.string.isRequired,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

SelectMenu.defaultProps = {
    align: 'left',
    compact: false,
    disabled: false
};

export default SelectMenu;
