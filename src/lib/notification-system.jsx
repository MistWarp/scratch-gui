import React, {useEffect, useRef, useState} from 'react';
import {Info, CheckCircle, TriangleAlert, XCircle} from 'lucide-react';
import PropTypes from 'prop-types';

Notification.propTypes = {
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired,
    onDismiss: PropTypes.func.isRequired,
    duration: PropTypes.number
};

function Notification ({id, message, type, onDismiss, duration}) {
    const timeoutRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => {
            setIsVisible(true);
        });

        if (duration > 0) {
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => {
                    onDismiss(id);
                }, 300);
            }, duration);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [duration, id, onDismiss]);

    const icons = {
        info: Info,
        success: CheckCircle,
        warning: TriangleAlert,
        error: XCircle
    };

    const Icon = icons[type] || icons.info;

    const colors = {
        info: 'var(--status-info, #4c97ff)',
        success: 'var(--status-success, #2f9e5b)',
        warning: 'var(--status-warning, #d98324)',
        error: 'var(--status-danger, #d94747)'
    };

    return (
        <div
            style={{
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'var(--ui-modal-background, #ffffff)',
                color: 'var(--text-primary, #2d3748)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.15))',
                fontFamily: 'inherit',
                fontSize: '13px',
                maxWidth: '400px',
                minWidth: '300px',
                wordWrap: 'break-word',
                opacity: isVisible ? '1' : '0',
                transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                borderLeft: `none`
            }}
            onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                    onDismiss(id);
                }, 300);
            }}
        >
            <span
                style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    color: colors[type]
                }}
            >
                <Icon size={16} />
            </span>
            <span
                style={{
                    flex: 1,
                    lineHeight: '1.4'
                }}
            >
                {message}
            </span>
        </div>
    );
}

export default Notification;
