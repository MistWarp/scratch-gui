import React from 'react';
import PropTypes from 'prop-types';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {RotateCcw, X} from 'lucide-react';
import styles from './recovery-prompt.css';

const messages = defineMessages({
    dismiss: {
        defaultMessage: 'Dismiss',
        description: 'Accessible label of the button that hides the offer to restore unsaved work',
        id: 'mw.recoveryPrompt.dismiss'
    }
});

// Small, non-blocking offer to reopen work an earlier session backed up on
// this device but never saved. See tw-restore-point-manager.jsx.
const RecoveryPrompt = ({created, disabled, intl, title, onDismiss, onRestore, onViewAll}) => (
    <aside
        aria-labelledby="mw-recovery-prompt-title"
        className={styles.prompt}
        role="region"
    >
        <RotateCcw
            aria-hidden="true"
            className={styles.icon}
            size={18}
        />
        <div className={styles.text}>
            <strong id="mw-recovery-prompt-title">
                <FormattedMessage
                    defaultMessage="Restore unsaved work from {time}?"
                    // eslint-disable-next-line max-len
                    description="Offer shown when the editor opens and a device backup holds work from an earlier visit that was never saved. {time} is a date and time."
                    id="mw.recoveryPrompt.title"
                    values={{
                        time: intl.formatDate(created, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                        })
                    }}
                />
            </strong>
            <span>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="“{projectTitle}” was backed up on this device but not saved. Your current project is kept in Device backups first."
                    // eslint-disable-next-line max-len
                    description="Details under the offer to restore unsaved work. {projectTitle} is the project name. Device backups is the name of a window in the File menu."
                    id="mw.recoveryPrompt.description"
                    values={{projectTitle: title}}
                />
            </span>
            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.primary}
                    disabled={disabled}
                    onClick={onRestore}
                >
                    <FormattedMessage
                        defaultMessage="Restore"
                        description="Button that reopens unsaved work from a device backup"
                        id="mw.recoveryPrompt.restore"
                    />
                </button>
                <button
                    type="button"
                    className={styles.secondary}
                    onClick={onViewAll}
                >
                    <FormattedMessage
                        defaultMessage="See all backups"
                        description="Button that opens the list of device backups"
                        id="mw.recoveryPrompt.viewAll"
                    />
                </button>
            </div>
        </div>
        <button
            type="button"
            aria-label={intl.formatMessage(messages.dismiss)}
            className={styles.close}
            onClick={onDismiss}
            title={intl.formatMessage(messages.dismiss)}
        >
            <X size={16} />
        </button>
    </aside>
);

RecoveryPrompt.propTypes = {
    created: PropTypes.number.isRequired,
    disabled: PropTypes.bool,
    intl: intlShape,
    title: PropTypes.string,
    onDismiss: PropTypes.func.isRequired,
    onRestore: PropTypes.func.isRequired,
    onViewAll: PropTypes.func.isRequired
};

export default injectIntl(RecoveryPrompt);
