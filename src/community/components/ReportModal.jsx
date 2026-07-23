import React, {useState, useEffect, useRef} from 'react';
import {Flag} from 'lucide-react';
import api from '../api';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
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
    }, []);

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
        <Modal
            icon={Flag}
            title={`Report this ${NOUNS[type] || 'content'}`}
            onClose={onClose}
            actions={sent ? (
                <Button
                    variant="primary"
                    onClick={onClose}
                >Done</Button>
            ) : (
                <React.Fragment>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        disabled={busy}
                        onClick={submit}
                    >{busy ? 'Sending…' : 'Send report'}</Button>
                </React.Fragment>
            )}
        >
            {sent ? (
                <p className={styles.sent}>Thanks. Your report was sent to the moderators.</p>
            ) : (
                <React.Fragment>
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
                </React.Fragment>
            )}
        </Modal>
    );
};

export default ReportModal;
