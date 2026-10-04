import PropTypes from 'prop-types';
import React from 'react';
import {useCommunityIntl} from '../i18n.jsx';
import {locales} from '../locale';

// Ids for a tab and the panel it shows, so a consumer can render
// <div {...tabPanelProps(idPrefix, value)}> for the active section.
const tabId = (idPrefix, key) => `${idPrefix}-tab-${key}`;
const panelIdFor = (idPrefix, key) => `${idPrefix}-panel-${key}`;
export const tabPanelProps = (idPrefix, key) => ({
    'role': 'tabpanel',
    'id': panelIdFor(idPrefix, key),
    'aria-labelledby': tabId(idPrefix, key),
    'tabIndex': 0
});

// variant="buttons" is for controls that only filter or sort the content below:
// a group of pressed/unpressed buttons rather than tabs that switch panels.
const SectionTabs = ({
    items, value, onChange, className, itemClassName, activeClassName, ariaLabel, variant, idPrefix, panelId
}) => {
    const {text, locale} = useCommunityIntl();
    const rtl = locales[locale]?.rtl;
    const moveFocus = (event, index) => {
        let nextIndex;
        const count = items.length;
        if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) nextIndex = (index + 1) % count;
        else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) nextIndex = (index - 1 + count) % count;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = items.length - 1;
        else return;
        event.preventDefault();
        const next = items[nextIndex];
        onChange(next.key);
        event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[nextIndex].focus();
    };

    if (variant === 'buttons') {
        return (
            <div className={className} aria-label={text(ariaLabel)} role="group">
                {items.map(item => {
                    const active = value === item.key;
                    const classes = [itemClassName, active ? activeClassName : ''].filter(Boolean).join(' ');
                    return (
                        <button
                            key={item.key}
                            type="button"
                            aria-pressed={active}
                            className={classes || null}
                            onClick={() => onChange(item.key)}
                        >
                            {typeof item.label === 'string' ? text(item.label) : item.label}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <nav className={className} aria-label={text(ariaLabel)} role="tablist">
            {items.map((item, index) => {
                const active = value === item.key;
                const classes = [itemClassName, active ? activeClassName : ''].filter(Boolean).join(' ');
                // Only the active tab's panel is rendered, so only it points at one.
                let controls = null;
                if (active) controls = panelId || (idPrefix ? panelIdFor(idPrefix, item.key) : null);
                return (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        id={idPrefix ? tabId(idPrefix, item.key) : null}
                        aria-controls={controls}
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
    ariaLabel: PropTypes.string.isRequired,
    variant: PropTypes.oneOf(['tabs', 'buttons']),
    idPrefix: PropTypes.string,
    panelId: PropTypes.string
};

SectionTabs.defaultProps = {
    className: '',
    itemClassName: '',
    activeClassName: '',
    variant: 'tabs',
    idPrefix: '',
    panelId: ''
};

export default SectionTabs;
