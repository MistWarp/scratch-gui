import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useState, useEffect, useRef} from 'react';
import {Flag} from 'lucide-react';
import api from '../api';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import Notice from './ui/Notice.jsx';
import styles from './ReportModal.module.css';

// Rotur's report categories. MistWarp files every report with Rotur too, and
// the urgent ones go to Rotur's safety team as soon as they're sent.
const REASONS = [
    {id: 'spam', category: 'spam', label: 'Spam or misleading'},
    {id: 'harassment', category: 'harassment', label: 'Harassment or bullying'},
    {id: 'hate', category: 'hate', label: 'Hate against people for who they are'},
    {id: 'sexual', category: 'sexual', label: 'Sexual or explicit content'},
    {id: 'violence', category: 'violence', label: 'Violence or gore'},
    {id: 'scam', category: 'scam', label: 'A scam'},
    {id: 'copyright', category: 'other', label: 'Copyright or credit problem'},
    {id: 'other', category: 'other', label: 'Something else'}
];
const URGENT_REASONS = [
    {id: 'csea', category: 'csea', label: 'Sexual content involving a child'},
    {id: 'threat_to_life', category: 'threat_to_life', label: "A threat to someone's life"},
    {id: 'self_harm', category: 'self_harm', label: 'Encouraging suicide or self-harm'},
    {id: 'terrorism', category: 'terrorism', label: 'Terrorism'}
];
const ALL_REASONS = REASONS.concat(URGENT_REASONS);
let nextReportId = 0;

const ReportModal = ({type, target, context, targetUser, onClose}) => {
    const {text: communityText} = useCommunityText();
    const reasonLabels = {
        'Spam or misleading': communityText('Spam or misleading'),
        'Harassment or bullying': communityText('Harassment or bullying'),
        'Hate against people for who they are': communityText('Hate against people for who they are'),
        'Sexual or explicit content': communityText('Sexual or explicit content'),
        'Violence or gore': communityText('Violence or gore'),
        'A scam': communityText('A scam'),
        'Copyright or credit problem': communityText('Copyright or credit problem'),
        'Something else': communityText('Something else'),
        'Sexual content involving a child': communityText('Sexual content involving a child'),
        "A threat to someone's life": communityText("A threat to someone's life"),
        'Encouraging suicide or self-harm': communityText('Encouraging suicide or self-harm'),
        'Terrorism': communityText('Terrorism')
    };
    const titles = {
        project: communityText('Report this project'),
        user: communityText('Report this user'),
        comment: communityText('Report this comment'),
        bounty: communityText('Report this bounty')
    };
    const [reasonId, setReasonId] = useState(REASONS[0].id);
    const chosen = ALL_REASONS.find(item => item.id === reasonId) || REASONS[0];
    const urgent = URGENT_REASONS.includes(chosen);
    const [details, setDetails] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const firstRef = useRef(null);
    const submitLocks = useRef(new Set());
    const fieldId = useRef(`community-report-${++nextReportId}`).current;
    const requestKey = `${type}\u0000${target}\u0000${context || ''}`;
    const currentRequestKey = useRef(requestKey);
    currentRequestKey.current = requestKey;

    useEffect(() => {
        if (firstRef.current) firstRef.current.focus();
        setReasonId(REASONS[0].id);
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
        const reason = details.trim() ? `${chosen.label}: ${details.trim()}` : chosen.label;
        try {
            await api.report(type, target, reason, context, targetUser, chosen.category);
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
                    <label
                        className={styles.label}
                        htmlFor={`${fieldId}-reason`}
                    >{communityText('What is wrong?')}</label>
                    <select
                        ref={firstRef}
                        id={`${fieldId}-reason`}
                        className={styles.select}
                        value={reasonId}
                        disabled={busy}
                        onChange={e => setReasonId(e.target.value)}
                    >
                        {REASONS.map(reason => (
                            <option
                                key={reason.id}
                                value={reason.id}
                            >{reasonLabels[reason.label]}</option>
                        ))}
                        <optgroup label={communityText('Urgent')}>
                            {URGENT_REASONS.map(reason => (
                                <option
                                    key={reason.id}
                                    value={reason.id}
                                >{reasonLabels[reason.label]}</option>
                            ))}
                        </optgroup>
                    </select>
                    {urgent ? (
                        <Notice variant="warning">
                            {communityText(
                                // eslint-disable-next-line max-len
                                'Rotur\'s safety team sees this report straight away. If someone is in danger right now, contact your local emergency services.'
                            )}
                        </Notice>
                    ) : null}
                    <label
                        className={styles.label}
                        htmlFor={`${fieldId}-details`}
                    >{communityText('Details (optional)')}</label>
                    <textarea
                        id={`${fieldId}-details`}
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
