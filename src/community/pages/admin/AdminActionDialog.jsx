import React from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {AlertTriangle} from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import styles from '../Admin.module.css';

const AdminActionDialog = ({dialog, busy, error, onChange, onCancel, onConfirm}) => {
    const {text: communityText} = useCommunityText();
    if (!dialog) return null;
    return (
        <ConfirmModal
            icon={dialog.icon || AlertTriangle}
            title={dialog.title}
            destructive={Boolean(dialog.danger)}
            busy={busy}
            busyLabel={communityText('Working…')}
            confirmLabel={dialog.action}
            error={error}
            onCancel={onCancel}
            onConfirm={onConfirm}
        >
            {dialog.description ? <p>{dialog.description}</p> : null}
            {(dialog.fields || []).map(field => (
                <label key={field.key} className={styles.field}>
                    <span>{field.label}</span>
                    {field.multiline ? (
                        <textarea
                            className={styles.textarea}
                            maxLength={field.maxLength || 1000}
                            value={field.value}
                            onChange={event => onChange(field.key, event.target.value)}
                        />
                    ) : (
                        <input
                            className={styles.input}
                            maxLength={field.maxLength || 100}
                            value={field.value}
                            onChange={event => onChange(field.key, event.target.value)}
                        />
                    )}
                </label>
            ))}
        </ConfirmModal>
    );
};

export default AdminActionDialog;
