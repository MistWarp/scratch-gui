import PropTypes from 'prop-types';
import React from 'react';
import {useCommunityIntl} from '../i18n.jsx';
import {locales} from '../locale';

const SectionTabs = ({items, value, onChange, className, itemClassName, activeClassName, ariaLabel}) => {
    const {text, locale} = useCommunityIntl();
    const rtl = locales[locale]?.rtl;
    const moveFocus = (event, index) => {
        let nextIndex;
        if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) nextIndex = (index + 1) % items.length;
        else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) nextIndex = (index - 1 + items.length) % items.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = items.length - 1;
        else return;
        event.preventDefault();
        const next = items[nextIndex];
        onChange(next.key);
        event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[nextIndex].focus();
    };

    return (
        <nav className={className} aria-label={text(ariaLabel)} role="tablist">
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
                        {typeof item.label === 'string' ? text(item.label) : item.label}
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
