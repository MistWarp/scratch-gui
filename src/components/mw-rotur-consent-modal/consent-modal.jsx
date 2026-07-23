import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import Modal from '../../containers/windowed-modal.jsx';
import {describePermission, categoryLabel} from '../../lib/rotur/permission-descriptions.js';
import styles from '../tw-security-manager-modal/security-manager-modal.css';

const groupScopes = scopes => {
    const groups = {};
    for (const scope of scopes) {
        const label = categoryLabel(scope);
        (groups[label] = groups[label] || []).push(scope);
    }
    return groups;
};

const RoturConsentModal = props => {
    const {type, data} = props;
    const groups = groupScopes(data.scopes || []);
    if (type === 'share') {
        return (
            <Modal
                className={styles.modalContent}
                onRequestClose={props.onShareNo}
                contentLabel="Rotur"
                id="roturconsentmodal"
            >
                <Box className={styles.body}>
                    <h2>{'Show activity on your profile?'}</h2>
                    <p>
                        {`"${data.name || 'This project'}" wants to show that you're using it on your Rotur profile`}
                        {data.username ? ` (@${data.username}).` : '.'}
                    </p>
                    <Box className={styles.buttons}>
                        <button
                            className={styles.denyButton}
                            onClick={props.onShareNo}
                        >
                            {'Not now'}
                        </button>
                        <button
                            className={styles.allowButton}
                            onClick={props.onShareAll}
                        >
                            {'Allow all projects'}
                        </button>
                        <button
                            className={styles.allowButton}
                            onClick={props.onShareThis}
                        >
                            {'Just this project'}
                        </button>
                    </Box>
                </Box>
            </Modal>
        );
    }
    return (
        <Modal
            className={styles.modalContent}
            onRequestClose={props.onDenied}
            contentLabel="Rotur"
            id="roturconsentmodal"
        >
            <Box className={styles.body}>
                {type === 'confirm' ? (
                    <React.Fragment>
                        <h2>{'Confirm Rotur action'}</h2>
                        <p>
                            {'This project wants to '}
                            <b>{data.label}</b>
                            {data.username ? ` as @${data.username}.` : '.'}
                        </p>
                        <p>{'Only allow this if you trust the project.'}</p>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <h2>{'Connect to Rotur'}</h2>
                        <p>
                            {`"${data.name || 'This project'}" wants to use your Rotur account`}
                            {data.username ? ` (@${data.username})` : ''}
                            {' to:'}
                        </p>
                        {Object.keys(groups).map(label => (
                            <div key={label}>
                                <b>{label}</b>
                                <ul>
                                    {groups[label].map(scope => (
                                        <li key={scope}>{describePermission(scope)}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        {(data.scopes || []).length === 0 ? (
                            <p>{'This just lets the project read your public Rotur info.'}</p>
                        ) : null}
                    </React.Fragment>
                )}

                <Box className={styles.buttons}>
                    <button
                        className={styles.denyButton}
                        onClick={props.onDenied}
                    >
                        {type === 'confirm' ? 'Cancel' : 'Not now'}
                    </button>
                    <button
                        className={styles.allowButton}
                        onClick={props.onAllowed}
                    >
                        {type === 'confirm' ? 'Allow' : 'Connect'}
                    </button>
                </Box>
            </Box>
        </Modal>
    );
};

RoturConsentModal.propTypes = {
    type: PropTypes.oneOf(['consent', 'confirm', 'share']).isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    data: PropTypes.object.isRequired,
    onAllowed: PropTypes.func,
    onDenied: PropTypes.func,
    onShareThis: PropTypes.func,
    onShareAll: PropTypes.func,
    onShareNo: PropTypes.func
};

export default RoturConsentModal;
