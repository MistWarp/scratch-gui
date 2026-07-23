import React from 'react';
import {ShieldCheck} from 'lucide-react';
import {describePermission, categoryLabel} from '../../lib/rotur/permission-descriptions.js';
import styles from './RoturConsentModal.module.css';

const groupScopes = scopes => {
    const groups = {};
    for (const scope of scopes || []) {
        const label = categoryLabel(scope);
        (groups[label] = groups[label] || []).push(scope);
    }
    return groups;
};

// Trusted consent/confirm UI rendered in the community project page (the parent
// of the project iframe). The sandboxed project cannot read or dismiss this, so
// it can request an action but never approve one on the user's behalf.
const RoturConsentModal = ({type, data, onAllow, onDeny, onShareThis, onShareAll, onShareNo}) => {
    const groups = groupScopes(data.scopes);
    if (type === 'share') {
        return (
            <div
                className={styles.overlay}
                onClick={onShareNo}
            >
                <div
                    className={styles.modal}
                    onClick={event => event.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className={styles.head}>
                        <ShieldCheck size={17} />
                        {'Show activity on your profile?'}
                    </div>
                    <div className={styles.body}>
                        <p className={styles.lead}>
                            {`"${data.name || 'This project'}" wants to show it on your Rotur profile`}
                            {data.username ? ` (@${data.username}).` : '.'}
                        </p>
                        <div className={styles.buttons}>
                            <button
                                className={styles.deny}
                                onClick={onShareNo}
                            >
                                {'Not now'}
                            </button>
                            <button
                                className={styles.allow}
                                onClick={onShareAll}
                            >
                                {'Allow all'}
                            </button>
                            <button
                                className={styles.allow}
                                onClick={onShareThis}
                            >
                                {'Just this project'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div
            className={styles.overlay}
            onClick={onDeny}
        >
            <div
                className={styles.modal}
                onClick={event => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className={styles.head}>
                    <ShieldCheck size={17} />
                    {type === 'confirm' ? 'Confirm Rotur action' : 'Connect to Rotur'}
                </div>
                <div className={styles.body}>
                    {type === 'confirm' ? (
                        <p className={styles.lead}>
                            {'This project wants to '}
                            <b>{data.label}</b>
                            {data.username ? ` as @${data.username}.` : '.'}
                            {' Only allow it if you trust this project.'}
                        </p>
                    ) : (
                        <React.Fragment>
                            <p className={styles.lead}>
                                {`"${data.name || 'This project'}" wants to use your Rotur account`}
                                {data.username ? ` (@${data.username})` : ''}
                                {' to:'}
                            </p>
                            {Object.keys(groups).map(label => (
                                <div
                                    key={label}
                                    className={styles.group}
                                >
                                    <div className={styles.groupLabel}>{label}</div>
                                    <ul className={styles.scopeList}>
                                        {groups[label].map(scope => (
                                            <li key={scope}>{describePermission(scope)}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                            {(data.scopes || []).length === 0 ? (
                                <p className={styles.lead}>{'This only reads your public Rotur info.'}</p>
                            ) : null}
                        </React.Fragment>
                    )}
                    <div className={styles.buttons}>
                        <button
                            className={styles.deny}
                            onClick={onDeny}
                        >
                            {type === 'confirm' ? 'Cancel' : 'Not now'}
                        </button>
                        <button
                            className={styles.allow}
                            onClick={onAllow}
                        >
                            {type === 'confirm' ? 'Allow' : 'Connect'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoturConsentModal;
