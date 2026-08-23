import PropTypes from 'prop-types';
import React from 'react';

const SectionTabs = ({items, value, onChange, className, itemClassName, activeClassName, ariaLabel}) => {
    const moveFocus = (event, index) => {
        let nextIndex;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = items.length - 1;
        else return;
        event.preventDefault();
        const next = items[nextIndex];
        onChange(next.key);
        event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[nextIndex].focus();
    };

    return (
        <nav className={className} aria-label={ariaLabel} role="tablist">
            {items.map((item, index) => {
                const active = value === item.key;
                const classes = [itemClassName, active ? activeClassName : ''].filter(Boolean).join(' ');
                return (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        tabIndex={active ? 0 : -1}
                        className={classes || null}
                        onClick={() => onChange(item.key)}
                        onKeyDown={event => moveFocus(event, index)}
                    >
                        {item.label}
                    </button>
                );
            })}
        </nav>
    );
};

SectionTabs.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired
    })).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string,
    itemClassName: PropTypes.string,
    activeClassName: PropTypes.string,
    ariaLabel: PropTypes.string.isRequired
};

SectionTabs.defaultProps = {
    className: '',
    itemClassName: '',
    activeClassName: ''
};

export default SectionTabs;
