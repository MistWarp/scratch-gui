import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useRef} from 'react';
import {X} from 'lucide-react';
import useEscape from '../../use-escape.js';
import styles from './Modal.module.css';

let nextModalId = 0;

const Modal = ({actions, children, className, dismissDisabled, icon: Icon, onClose, onDismiss, title}) => {
    const dismiss = onDismiss || onClose;
    const activeDismiss = dismissDisabled ? null : dismiss;
    const modalRef = useRef(null);
    const bodyRef = useRef(null);
    const closeRef = useRef(null);
    const titleId = useRef(`community-modal-title-${++nextModalId}`).current;
    useEscape(activeDismiss);

    useEffect(() => {
        const previousFocus = document.activeElement;
        const bodyControl = bodyRef.current && bodyRef.current.querySelector(
            '[autofocus], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), ' +
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        const initialFocus = bodyControl ||
            (closeRef.current && !closeRef.current.disabled ? closeRef.current : modalRef.current);
        if (initialFocus) initialFocus.focus();

        return () => {
            if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
        };
    }, []);

    return (
        <div
            className={styles.overlay}
            onClick={activeDismiss}
        >
            <div
                ref={modalRef}
                className={classNames(styles.modal, className)}
                onClick={event => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex="-1"
            >
                <div className={styles.head}>
                    <span id={titleId} className={styles.title}>
                        {Icon ? <Icon size={17} /> : null}
                        {title}
                    </span>
                    {onClose ? (
                        <button
                            ref={closeRef}
                            className={styles.close}
                            onClick={onClose}
                            disabled={dismissDisabled}
                            aria-label="Close"
                            type="button"
                        >
                            <X size={18} />
                        </button>
                    ) : null}
                </div>
                <div ref={bodyRef} className={styles.body}>
                    {children}
                    {actions ? <div className={styles.actions}>{actions}</div> : null}
                </div>
            </div>
        </div>
    );
};

Modal.propTypes = {
    actions: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
    dismissDisabled: PropTypes.bool,
    icon: PropTypes.elementType,
    onClose: PropTypes.func,
    onDismiss: PropTypes.func,
    title: PropTypes.node.isRequired
};

export default Modal;
