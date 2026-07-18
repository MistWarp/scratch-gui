import React, {useEffect, useRef, useState} from 'react';
import {Globe, Link as LinkIcon, Lock, ChevronDown, Check} from 'lucide-react';
import styles from './VisibilityMenu.module.css';

const OPTIONS = [
    {value: 'public', label: 'Shared', icon: Globe},
    {value: 'unlisted', label: 'Unlisted', icon: LinkIcon},
    {value: 'private', label: 'Unshared', icon: Lock}
];

const VisibilityMenu = ({value, onChange}) => {
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
    const current = OPTIONS.find(option => option.value === value) || OPTIONS[0];
    const CurrentIcon = current.icon;
    return (
        <div
            className={styles.wrap}
            ref={ref}
        >
            <button
                type="button"
                className={styles.button}
                onClick={() => setOpen(state => !state)}
                aria-label="Project visibility"
            >
                <CurrentIcon size={16} />
                {current.label}
                <ChevronDown size={15} />
            </button>
            {open ? (
                <div className={styles.menu}>
                    {OPTIONS.map(option => {
                        const OptionIcon = option.icon;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    if (option.value !== value) onChange(option.value);
                                }}
                            >
                                <OptionIcon size={15} />
                                {option.label}
                                {option.value === value ? (
                                    <Check
                                        size={14}
                                        className={styles.check}
                                    />
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};

export default VisibilityMenu;
