import React from 'react';
import {ShieldCheck} from 'lucide-react';
import {describePermission, categoryLabel} from '../../lib/rotur/permission-descriptions.js';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
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
    if (type === 'share') {
        return (
            <Modal
                icon={ShieldCheck}
                title="Show activity on your profile?"
                onDismiss={onShareNo}
                actions={
                    <React.Fragment>
                        <Button onClick={onShareNo}>Not now</Button>
                        <Button onClick={onShareAll}>Allow all</Button>
                        <Button
                            variant="primary"
                            onClick={onShareThis}
                        >Just this project</Button>
                    </React.Fragment>
                }
            >
                <p className={styles.lead}>
                    {`"${data.name || 'This project'}" wants to show it on your Rotur profile`}
                    {data.username ? ` (@${data.username}).` : '.'}
                </p>
            </Modal>
        );
    }
    const groups = groupScopes(data.scopes);
    return (
        <Modal
            icon={ShieldCheck}
            title={type === 'confirm' ? 'Confirm Rotur action' : 'Connect to Rotur'}
            onDismiss={onDeny}
            actions={
                <React.Fragment>
                    <Button onClick={onDeny}>
                        {type === 'confirm' ? 'Cancel' : 'Not now'}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onAllow}
                    >
                        {type === 'confirm' ? 'Allow' : 'Connect'}
                    </Button>
                </React.Fragment>
            }
        >
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
        </Modal>
    );
};

export default RoturConsentModal;
