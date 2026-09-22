import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useState, useEffect, useRef} from 'react';
import {Flag} from 'lucide-react';
import api from '../api';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import Notice from './ui/Notice.jsx';
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

const ReportModal = ({type, target, context, targetUser, onClose}) => {
    const {text: communityText} = useCommunityText();
    const reasonLabels = {
        'Inappropriate or explicit content': communityText('Inappropriate or explicit content'),
        'Harassment or bullying': communityText('Harassment or bullying'),
        'Spam or misleading': communityText('Spam or misleading'),
        'Hateful or abusive behaviour': communityText('Hateful or abusive behaviour'),
        'Dangerous or illegal activity': communityText('Dangerous or illegal activity'),
        'Copyright or credit problem': communityText('Copyright or credit problem'),
        'Something else': communityText('Something else')
    };
    const titles = {
        project: communityText('Report this project'),
        user: communityText('Report this user'),
        comment: communityText('Report this comment'),
        bounty: communityText('Report this bounty')
    };
    const [category, setCategory] = useState(REASONS[0]);
    const [details, setDetails] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const firstRef = useRef(null);
    const submitLocks = useRef(new Set());
    const requestKey = `${type}\u0000${target}\u0000${context || ''}`;
    const currentRequestKey = useRef(requestKey);
    currentRequestKey.current = requestKey;

    useEffect(() => {
        if (firstRef.current) firstRef.current.focus();
        setCategory(REASONS[0]);
        setDetails('');
        setBusy(false);
        setError('');
        setSent(false);
    }, [requestKey]);

    const submit = async () => {
        if (submitLocks.current.has(requestKey)) return;
        submitLocks.current.add(requestKey);
        setBusy(true);
        setError('');
        const reason = details.trim() ? `${category}: ${details.trim()}` : category;
        try {
            await api.report(type, target, reason, context, targetUser);
            if (currentRequestKey.current === requestKey) setSent(true);
        } catch (e) {
            if (currentRequestKey.current === requestKey) {
                setError(e.message || communityText('Could not send the report.'));
            }
        } finally {
            submitLocks.current.delete(requestKey);
            if (currentRequestKey.current === requestKey) setBusy(false);
        }
    };

    return (
        <Modal
            icon={Flag}
            title={titles[type] || communityText('Report this content')}
            onClose={onClose}
            dismissDisabled={busy}
            actions={sent ? (
                <Button
                    variant="primary"
                    onClick={onClose}
                >{communityText('Done')}</Button>
            ) : (
                <React.Fragment>
                    <Button onClick={onClose} disabled={busy}>{communityText('Cancel')}</Button>
                    <Button
                        variant="primary"
                        busy={busy}
                        busyLabel={communityText('Sending…')}
                        onClick={submit}
                    >{communityText('Send report')}</Button>
                </React.Fragment>
            )}
        >
            {sent ? (
                <p className={styles.sent}>{communityText('Thanks. Your report was sent to the moderators.')}</p>
            ) : (
                <React.Fragment>
                    <label className={styles.label}>{communityText('What is wrong?')}</label>
                    <select
                        ref={firstRef}
                        className={styles.select}
                        value={category}
                        disabled={busy}
                        onChange={e => setCategory(e.target.value)}
                    >
                        {REASONS.map(reason => (
                            <option
                                key={reason}
                                value={reason}
                            >{reasonLabels[reason] || reason}</option>
                        ))}
                    </select>
                    <label className={styles.label}>{communityText('Details (optional)')}</label>
                    <textarea
                        className={styles.textarea}
                        value={details}
                        disabled={busy}
                        maxLength={1000}
                        placeholder={communityText('Add anything that helps a moderator understand the problem.')}
                        onChange={e => setDetails(e.target.value)}
                    />
                    {error ? <Notice variant="error">{error}</Notice> : null}
                </React.Fragment>
            )}
        </Modal>
    );
};

export default ReportModal;
