import React from 'react';
import {X} from 'lucide-react';
import useEscape from '../../use-escape.js';
import styles from './Modal.module.css';

const Modal = ({icon: Icon, title, onClose, onDismiss, actions, children}) => {
    const dismiss = onDismiss || onClose;
    useEscape(dismiss);
    return (
        <div
            className={styles.overlay}
            onClick={dismiss}
        >
            <div
                className={styles.modal}
                onClick={event => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className={styles.head}>
                    <span className={styles.title}>
                        {Icon ? <Icon size={17} /> : null}
                        {title}
                    </span>
                    {onClose ? (
                        <button
                            className={styles.close}
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    ) : null}
                </div>
                <div className={styles.body}>
                    {children}
                    {actions ? <div className={styles.actions}>{actions}</div> : null}
                </div>
            </div>
        </div>
    );
};

export default Modal;
