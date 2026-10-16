/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {MoreHorizontal} from 'lucide-react';

import styles from './extension-dev.css';

const ActionMenu = props => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const rootRef = useRef(null);
    const buttonRef = useRef(null);
    const listRef = useRef(null);

    useLayoutEffect(() => {
        if (!open) {
            setPosition(null);
            return;
        }
        const button = buttonRef.current;
        const list = listRef.current;
        if (!button || !list) return;
        const view = button.ownerDocument.defaultView || window;
        const rect = button.getBoundingClientRect();
        const height = list.offsetHeight;
        const width = list.offsetWidth;
        const gap = 4;
        const below = rect.bottom + gap + height <= view.innerHeight - gap;
        const top = below ? rect.bottom + gap : Math.max(gap, rect.top - gap - height);
        const left = Math.min(Math.max(gap, rect.right - width), view.innerWidth - width - gap);
        setPosition({top, left});
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const doc = rootRef.current ? rootRef.current.ownerDocument : document;
        const onDown = event => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
        };
        const onKey = event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
            }
        };
        const view = doc.defaultView || window;
        const close = () => setOpen(false);
        doc.addEventListener('pointerdown', onDown, true);
        doc.addEventListener('keydown', onKey);
        doc.addEventListener('scroll', close, true);
        view.addEventListener('resize', close);
        return () => {
            doc.removeEventListener('pointerdown', onDown, true);
            doc.removeEventListener('keydown', onKey);
            doc.removeEventListener('scroll', close, true);
            view.removeEventListener('resize', close);
        };
    }, [open]);

    const items = props.items.filter(Boolean);
    if (!items.length) return null;

    const onToggle = event => {
        event.stopPropagation();
        setOpen(!open);
    };
    const onItem = event => {
        event.stopPropagation();
        const item = items.find(candidate => candidate.id === event.currentTarget.dataset.id);
        setOpen(false);
        if (item) item.onClick();
    };

    return (
        <div
            className={styles.actionMenu}
            ref={rootRef}
        >
            <button
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label={props.label}
                className={styles.iconButton}
                ref={buttonRef}
                title={props.label}
                type="button"
                onClick={onToggle}
            >
                <MoreHorizontal size={16} />
            </button>
            {open ? (
                <div
                    className={styles.actionMenuList}
                    ref={listRef}
                    role="menu"
                    style={position ?
                        {top: `${position.top}px`, left: `${position.left}px`} :
                        {visibility: 'hidden', top: 0, left: 0}}
                >
                    {items.map(item => {
                        const Icon = item.icon;
                        return (
                            <button
                                className={item.danger ?
                                    `${styles.actionMenuItem} ${styles.danger}` :
                                    styles.actionMenuItem}
                                data-id={item.id}
                                disabled={item.disabled}
                                key={item.id}
                                role="menuitem"
                                title={item.title}
                                type="button"
                                onClick={onItem}
                            >
                                {Icon ? <Icon size={15} /> : null}
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};

ActionMenu.propTypes = {
    items: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.bool, PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired,
        icon: PropTypes.elementType,
        danger: PropTypes.bool,
        disabled: PropTypes.bool,
        title: PropTypes.string,
        onClick: PropTypes.func.isRequired
    })])).isRequired,
    label: PropTypes.string.isRequired
};

export default ActionMenu;
