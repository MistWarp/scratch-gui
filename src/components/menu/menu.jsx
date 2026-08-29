import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {ArrowLeft} from 'lucide-react';

import styles from './menu.css';

const menuFocusIndex = (key, currentIndex, itemCount) => {
    if (!itemCount) return -1;
    if (key === 'ArrowDown') return currentIndex < 0 ? 0 : (currentIndex + 1) % itemCount;
    if (key === 'ArrowUp') return currentIndex < 0 ? itemCount - 1 : (currentIndex - 1 + itemCount) % itemCount;
    if (key === 'Home') return 0;
    if (key === 'End') return itemCount - 1;
    return null;
};

const handleMenuKeyDown = event => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    if (event.target.closest('[role="menu"]') !== event.currentTarget) return;
    const items = Array.from(event.currentTarget.querySelectorAll(
        '[role="menuitem"]:not([aria-disabled="true"])'
    )).filter(item => item.closest('[role="menu"]') === event.currentTarget);
    const currentItem = event.target.closest('[role="menuitem"]');
    const nextIndex = menuFocusIndex(event.key, items.indexOf(currentItem), items.length);
    if (nextIndex < 0) return;
    event.preventDefault();
    items[nextIndex].focus();
};

const MenuComponent = ({
    className = '',
    children,
    componentRef,
    place = 'right'
}) => (
    <ul
        role="menu"
        className={classNames(
            styles.menu,
            className,
            {
                [styles.left]: place === 'left',
                [styles.right]: place === 'right'
            }
        )}
        ref={componentRef}
        onKeyDown={handleMenuKeyDown}
    >
        {children}
    </ul>
);

MenuComponent.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    componentRef: PropTypes.func,
    place: PropTypes.oneOf(['left', 'right'])
};


const stopPropagation = event => event.stopPropagation();

const Submenu = ({backLabel, children, className, onBack, place, ...props}) => (
    <div
        className={classNames(
            styles.submenu,
            className,
            {
                [styles.left]: place === 'left',
                [styles.right]: place === 'right'
            }
        )}
        onClick={stopPropagation}
    >
        <MenuComponent
            place={place}
            {...props}
        >
            {onBack ? (
                <MenuItem
                    className={styles.submenuBack}
                    onClick={onBack}
                >
                    <ArrowLeft />
                    {backLabel}
                </MenuItem>
            ) : null}
            {children}
        </MenuComponent>
    </div>
);

Submenu.propTypes = {
    backLabel: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
    onBack: PropTypes.func,
    place: PropTypes.oneOf(['left', 'right'])
};

const MenuItem = ({
    children,
    className,
    disabled = false,
    expanded = false,
    onClick,
    shortcut,
    title
}) => {
    const handleKeyDown = e => {
        if (e.currentTarget !== e.target || disabled || !onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(e);
        }
    };
    return (
        <li
            className={classNames(
                styles.menuItem,
                {[styles.hoverable]: !disabled},
                className,
                {
                    [styles.expanded]: expanded,
                    [styles.disabled]: disabled
                }
            )}
            aria-disabled={disabled || null}
            onClick={disabled ? null : onClick}
            /* eslint-disable-next-line react/jsx-no-bind */
            onKeyDown={handleKeyDown}
            role="menuitem"
            tabIndex={!disabled && onClick ? 0 : -1}
            title={title}
        >
            {children}
            {shortcut && <span className={styles.shortcut}>{shortcut}</span>}
        </li>
    );
};

MenuItem.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    expanded: PropTypes.bool,
    onClick: PropTypes.func,
    shortcut: PropTypes.string,
    title: PropTypes.string
};


const addDividerClassToFirstChild = (child, id) => (
    child && React.cloneElement(child, {
        className: classNames(
            child.className,
            {[styles.menuSection]: id === 0}
        ),
        key: id
    })
);

const MenuSection = ({children}) => (
    <React.Fragment>{
        React.Children.map(children, addDividerClassToFirstChild)
    }</React.Fragment>
);

MenuSection.propTypes = {
    children: PropTypes.node
};

export {
    MenuComponent as default,
    menuFocusIndex,
    MenuItem,
    MenuSection,
    Submenu
};
