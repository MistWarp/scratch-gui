import React, {useState, useEffect, useRef} from 'react';
import {Flag, X} from 'lucide-react';
import api from '../api';
import styles from './ReportModal.module.css';

const REASONS = [
    'Inappropriate or explicit content',
    'Harassment or bullying',
    'Spam or misleading',
    'Hateful or abusive behaviour',
    'Dangerous or illegal activity',
    'Copyright or credit problem',
    'Something else'
];

const NOUNS = {
    project: 'project',
    user: 'user',
    comment: 'comment'
};

const ReportModal = ({type, target, context, onClose}) => {
    const [category, setCategory] = useState(REASONS[0]);
    const [details, setDetails] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const firstRef = useRef(null);

    useEffect(() => {
        if (firstRef.current) firstRef.current.focus();
        const onKey = event => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const submit = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        const reason = details.trim() ? `${category}: ${details.trim()}` : category;
        try {
            await api.report(type, target, reason, context);
            setSent(true);
        } catch (e) {
            setError(e.message || 'Could not send the report.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className={styles.overlay}
            onClick={onClose}
        >
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.head}>
                    <span className={styles.title}>
                        <Flag size={16} />
                        {`Report this ${NOUNS[type] || 'content'}`}
                    </span>
                    <button
                        className={styles.close}
                        aria-label="Close"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>
                {sent ? (
                    <div className={styles.body}>
                        <p className={styles.sent}>Thanks. Your report was sent to the moderators.</p>
                        <div className={styles.actions}>
                            <button
                                className={styles.primary}
                                onClick={onClose}
                            >Done</button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.body}>
                        <label className={styles.label}>What is wrong?</label>
                        <select
                            ref={firstRef}
                            className={styles.select}
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                        >
                            {REASONS.map(reason => (
                                <option
                                    key={reason}
                                    value={reason}
                                >{reason}</option>
                            ))}
                        </select>
                        <label className={styles.label}>Details (optional)</label>
                        <textarea
                            className={styles.textarea}
                            value={details}
                            maxLength={1000}
                            placeholder="Add anything that helps a moderator understand the problem."
                            onChange={e => setDetails(e.target.value)}
                        />
                        {error ? <div className={styles.error}>{error}</div> : null}
                        <div className={styles.actions}>
                            <button
                                className={styles.cancel}
                                onClick={onClose}
                            >Cancel</button>
                            <button
                                className={styles.primary}
                                disabled={busy}
                                onClick={submit}
                            >{busy ? 'Sending…' : 'Send report'}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
