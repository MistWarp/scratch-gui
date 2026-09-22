import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
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
const RoturConsentModal = ({type, data, onAllow, onBlock, onDeny, onShareThis, onShareAll, onShareNo}) => {
    const {text: communityText} = useCommunityText();
    const payment = type === 'confirm' && data.confirmation && data.confirmation.type === 'payment';
    const projectName = data.name || communityText('This project');
    if (type === 'share') {
        return (
            <Modal
                icon={ShieldCheck}
                title={communityText('Show activity on your profile?')}
                onDismiss={onShareNo}
                actions={
                    <React.Fragment>
                        <Button variant="danger" onClick={onBlock}>{communityText('Block this project')}</Button>
                        <Button onClick={onShareNo}>{communityText('Not now')}</Button>
                        <Button onClick={onShareAll}>{communityText('Allow all')}</Button>
                        <Button
                            variant="primary"
                            onClick={onShareThis}
                        >{communityText('Just this project')}</Button>
                    </React.Fragment>
                }
            >
                <p className={styles.lead}>
                    {data.username ?
                        communityText('"{value1}" (@{value2}) wants to show it on your Rotur profile.', {
                            value1: projectName, value2: data.username
                        }) :
                        communityText('"{value1}" wants to show it on your Rotur profile.', {value1: projectName})}
                </p>
            </Modal>
        );
    }
    const groups = groupScopes(data.scopes);
    let confirmLead = null;
    if (payment) {
        confirmLead = communityText('Allow payment of {value1} credits to @{value2}?', {
            value1: data.confirmation.amount, value2: data.confirmation.recipient
        });
    } else if (type === 'confirm') {
        confirmLead = data.username ?
            communityText('Allow this project to {value1} as @{value2}?', {value1: data.label, value2: data.username}) :
            communityText('Allow this project to {value1}?', {value1: data.label});
    }
    return (
        <Modal
            icon={ShieldCheck}
            title={type === 'confirm' ?
                (payment ? communityText('Confirm payment') : communityText('Confirm account action')) :
                communityText('Connect to Rotur')}
            onDismiss={onDeny}
            actions={
                <React.Fragment>
                    <Button variant="danger" onClick={onBlock}>{communityText('Block this project')}</Button>
                    <Button onClick={onDeny}>
                        {type === 'confirm' ? communityText('Cancel') : communityText('Not now')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onAllow}
                    >
                        {payment ?
                            communityText('Allow payment') :
                            (type === 'confirm' ? communityText('Allow once') : communityText('Connect'))}
                    </Button>
                </React.Fragment>
            }
        >
            {type === 'confirm' ? (
                <React.Fragment>
                    <p className={styles.lead}>{confirmLead}</p>
                    {payment ? null : (
                        <p className={styles.lead}>
                            {communityText(
                                'This action will happen once. It does not give the project ongoing approval.'
                            )}
                        </p>
                    )}
                </React.Fragment>
            ) : (
                <React.Fragment>
                    <p className={styles.lead}>
                        {data.username ?
                            communityText('"{value1}" (@{value2}) wants to use your Rotur account to:', {
                                value1: projectName, value2: data.username
                            }) :
                            communityText('"{value1}" wants to use your Rotur account to:', {value1: projectName})}
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
                        <p className={styles.lead}>{communityText('This only reads your public Rotur info.')}</p>
                    ) : null}
                </React.Fragment>
            )}
        </Modal>
    );
};

export default RoturConsentModal;
