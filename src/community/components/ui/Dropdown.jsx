import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';

import useEscape from '../../use-escape.js';
import Layer from './Layer.jsx';
import styles from './Dropdown.module.css';

const SHEET_QUERY = '(max-width: 620px)';
const opensAsSheet = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
    window.matchMedia(SHEET_QUERY).matches;

const Dropdown = ({renderTrigger, children, align, className, menuClassName, portal, width}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const menuRef = useRef(null);
    const triggerRef = useRef(null);
    const close = useCallback((restoreFocus = true) => {
        setOpen(false);
        if (restoreFocus && triggerRef.current) {
            triggerRef.current.focus();
        }
    }, []);
    const toggle = useCallback(() => {
        setOpen(state => {
            if (!state) triggerRef.current = document.activeElement;
            return !state;
        });
    }, []);

    useEffect(() => {
        const onDown = event => {
            if (ref.current && !ref.current.contains(event.target) &&
                !(menuRef.current && menuRef.current.contains(event.target))) {
                close(false);
            }
        };
        window.addEventListener('mousedown', onDown);
        return () => window.removeEventListener('mousedown', onDown);
    }, [close]);

    useEffect(() => {
        if (!open || !menuRef.current) return;
        const firstItem = menuRef.current.querySelector('button:not(:disabled), a[href]');
        if (firstItem) firstItem.focus();
    }, [open]);

    useEscape(open ? close : null);

    const handleMenuKeyDown = event => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const items = Array.from(menuRef.current.querySelectorAll('button:not(:disabled), a[href]'));
        if (!items.length) return;
        const currentIndex = items.indexOf(document.activeElement);
        let nextIndex;
        if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = items.length - 1;
        else if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length;
        else nextIndex = (currentIndex <= 0 ? items.length : currentIndex) - 1;
        event.preventDefault();
        items[nextIndex].focus();
    };

    const narrow = open && opensAsSheet();
    const sheet = Boolean(portal && narrow);
    const leaveSheet = event => {
        const next = event.relatedTarget;
        if (!next || (menuRef.current && menuRef.current.contains(next)) ||
            (ref.current && ref.current.contains(next))) return;
        close(false);
    };
    const menu = open ? (
        <div
            ref={menuRef}
            role="menu"
            className={classNames(align === 'left' ? styles.menuLeft : styles.menu, menuClassName, {
                [styles.layered]: sheet
            })}
            style={width && !narrow ? {width} : null}
            onKeyDown={handleMenuKeyDown}
            onBlur={sheet ? leaveSheet : null}
        >
            {typeof children === 'function' ? children({close}) : children}
        </div>
    ) : null;

    return (
        <div
            className={classNames(styles.wrap, className)}
            ref={ref}
        >
            {renderTrigger({open, toggle, close})}
            {sheet ? <Layer>{menu}</Layer> : menu}
        </div>
    );
};

Dropdown.propTypes = {
    align: PropTypes.oneOf(['left', 'right']),
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
    className: PropTypes.string,
    menuClassName: PropTypes.string,
    portal: PropTypes.bool,
    renderTrigger: PropTypes.func.isRequired,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

Dropdown.defaultProps = {
    align: 'right'
};

const DropdownItem = ({danger, className, ...props}) => (
    <button
        type="button"
        role="menuitem"
        className={classNames(styles.item, className, {[styles.itemDanger]: danger})}
        {...props}
    />
);

DropdownItem.propTypes = {
    className: PropTypes.string,
    danger: PropTypes.bool
};

DropdownItem.defaultProps = {
    danger: false
};

export {Dropdown, DropdownItem};
export default Dropdown;
