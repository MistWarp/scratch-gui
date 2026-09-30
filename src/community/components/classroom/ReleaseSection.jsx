import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {Link2, Printer, UserRoundCheck, X} from 'lucide-react';
import api from '../../api';
import {formatDateTime} from '../../format.js';
import Button from '../ui/Button.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import Notice from '../ui/Notice.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import {CopyButton} from './ClassSettings.jsx';
import styles from '../../pages/Classroom.module.css';

const ReleaseSection = ({classId, onChange, release, student}) => {
    const {text: communityText} = useCommunityText();
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [confirming, setConfirming] = useState(false);
    const name = student.displayName;
    const create = async () => {
        if (busy) return;
        setBusy('create');
        setError('');
        try {
            const data = await api.classroom.releaseStudent(classId, student.id);
            onChange(data.claim);
        } catch (e) {
            setError(e.message || communityText('Could not create the link.'));
        } finally {
            setBusy('');
            setConfirming(false);
        }
    };
    const cancel = async () => {
        if (busy) return;
        setBusy('cancel');
        setError('');
        try {
            await api.classroom.cancelRelease(classId, student.id);
            onChange(null);
        } catch (e) {
            setError(e.message || communityText('Could not cancel the link.'));
        } finally {
            setBusy('');
        }
    };
    const print = () => {
        const printable = window.open('', '_blank', 'noopener');
        if (!printable) return;
        printable.document.write(`<title>${communityText('Move to their own account')}</title><p style="font:16px sans-serif">${communityText('Open this link and sign in with a Rotur account to move the projects of {value1} out of the class.', {value1: name})}</p><p style="font:bold 22px monospace">${release.url}</p><p style="font:14px sans-serif">${communityText('The link works until {value1}.', {value1: formatDateTime(release.expiresAt)})}</p>`);
        printable.document.close();
        printable.focus();
        printable.print();
    };
    return (
        <section className={styles.card} aria-labelledby="classroom-release-heading">
            <SectionHeading as="h3" id="classroom-release-heading" icon={UserRoundCheck} title={communityText('Move to their own account')} />
            <ul className={styles.plainList}>
                <li>{communityText('The projects of {value1} move to a Rotur account of their choice.', {value1: name})}</li>
                <li>{communityText('The school keeps a copy of every project that was turned in.')}</li>
                <li>{communityText('The class account is removed once the move is complete.')}</li>
                <li>{communityText('The link works for 14 days and can be used once.')}</li>
            </ul>
            {release ? (
                <React.Fragment>
                    <div className={styles.codeLink}>
                        <a href={release.url} target="_blank" rel="noreferrer">{release.url}</a>
                        <CopyButton label={communityText('Copy link')} value={release.url} />
                    </div>
                    <p className={styles.hint}>{communityText('The link works until {value1}.', {value1: formatDateTime(release.expiresAt)})}</p>
                    <div className={styles.cardActions}>
                        <Button onClick={print}>
                            <Printer size={15} aria-hidden="true" />
                            {communityText('Print')}
                        </Button>
                        <Button variant="danger" onClick={cancel} busy={busy === 'cancel'} busyLabel={communityText('Cancelling…')}>
                            <X size={15} aria-hidden="true" />
                            {communityText('Cancel link')}
                        </Button>
                    </div>
                </React.Fragment>
            ) : (
                <div className={styles.cardActions}>
                    <Button variant="primary" onClick={() => setConfirming(true)}>
                        <Link2 size={15} aria-hidden="true" />
                        {communityText('Create link')}
                    </Button>
                </div>
            )}
            {error ? <Notice variant="error">{error}</Notice> : null}
            {confirming ? (
                <ConfirmModal
                    title={communityText('Create a move link for {value1}?', {value1: name})}
                    icon={Link2}
                    confirmLabel={communityText('Create link')}
                    busy={busy === 'create'}
                    onCancel={() => setConfirming(false)}
                    onConfirm={create}
                >
                    {communityText('Give the link to {value1} if they are 13 or over, or to their parent or guardian if they are younger, because Rotur accounts are for people aged 13 and over. Whoever opens it and signs in with Rotur receives the projects.', {value1: name})}
                </ConfirmModal>
            ) : null}
        </section>
    );
};

ReleaseSection.propTypes = {
    classId: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    release: PropTypes.shape({
        code: PropTypes.string,
        expiresAt: PropTypes.number,
        url: PropTypes.string
    }),
    student: PropTypes.object.isRequired
};

ReleaseSection.defaultProps = {
    release: null
};

export default ReleaseSection;
