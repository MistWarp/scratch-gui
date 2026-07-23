import React, {useEffect, useRef, useState} from 'react';
import styles from './Dropdown.module.css';

const Dropdown = ({renderTrigger, children, align = 'right', width}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const onDown = event => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };
        window.addEventListener('mousedown', onDown);
        return () => window.removeEventListener('mousedown', onDown);
    }, []);
    const close = () => setOpen(false);
    return (
        <div
            className={styles.wrap}
            ref={ref}
        >
            {renderTrigger({open, toggle: () => setOpen(state => !state)})}
            {open ? (
                <div
                    className={align === 'left' ? styles.menuLeft : styles.menu}
                    style={width ? {width} : null}
                >
                    {typeof children === 'function' ? children({close}) : children}
                </div>
            ) : null}
        </div>
    );
};

const DropdownItem = ({danger = false, className = '', ...props}) => (
    <button
        type="button"
        className={`${styles.item}${danger ? ` ${styles.itemDanger}` : ''}${className ? ` ${className}` : ''}`}
        {...props}
    />
);

export {Dropdown, DropdownItem};
export default Dropdown;
