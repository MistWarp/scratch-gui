/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';

import styles from './workbench.css';

const MARGIN = 4;

const ContextMenu = ({items, onClose, x, y}) => {
    const ref = useRef(null);
    const [position, setPosition] = useState({left: x, top: y});

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        let left = x;
        let top = y;
        if (left + rect.width + MARGIN > window.innerWidth) left = Math.max(MARGIN, x - rect.width);
        if (top + rect.height + MARGIN > window.innerHeight) top = Math.max(MARGIN, y - rect.height);
        setPosition({left, top});
        const first = node.querySelector('button:not(:disabled)');
        if (first) first.focus();
    }, [x, y]);

    useEffect(() => {
        const handlePointer = event => {
            if (ref.current && !ref.current.contains(event.target)) onClose();
        };
        const handleKey = event => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
            }
        };
        document.addEventListener('pointerdown', handlePointer, true);
        document.addEventListener('keydown', handleKey, true);
        window.addEventListener('blur', onClose);
        window.addEventListener('resize', onClose);
        return () => {
            document.removeEventListener('pointerdown', handlePointer, true);
            document.removeEventListener('keydown', handleKey, true);
            window.removeEventListener('blur', onClose);
            window.removeEventListener('resize', onClose);
        };
    }, [onClose]);

    const handleKeyDown = event => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const buttons = Array.from(ref.current.querySelectorAll('button:not(:disabled)'));
        const index = buttons.indexOf(document.activeElement);
        const next = buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length];
        if (next) next.focus();
    };

    return ReactDOM.createPortal(
        <div
            className={styles.contextMenu}
            ref={ref}
            role="menu"
            style={position}
            onContextMenu={event => event.preventDefault()}
            onKeyDown={handleKeyDown}
        >
            {items.map((item, index) => {
                const Icon = item.icon;
                return (
                    <button
                        className={item.separator ?
                            `${styles.contextMenuItem} ${styles.contextMenuSeparated}` :
                            styles.contextMenuItem}
                        disabled={item.disabled}
                        key={`${item.label}-${index}`}
                        role="menuitem"
                        type="button"
                        onClick={() => {
                            onClose();
                            item.onClick();
                        }}
                    >
                        {Icon ? <Icon size={14} /> : <span className={styles.contextMenuIconSpace} />}
                        <span className={styles.contextMenuLabel}>{item.label}</span>
                        {item.hint ? <span className={styles.contextMenuHint}>{item.hint}</span> : null}
                    </button>
                );
            })}
        </div>,
        document.body
    );
};

ContextMenu.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        disabled: PropTypes.bool,
        hint: PropTypes.string,
        icon: PropTypes.elementType,
        label: PropTypes.string,
        onClick: PropTypes.func,
        separator: PropTypes.bool
    })).isRequired,
    onClose: PropTypes.func.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
};

export default ContextMenu;
