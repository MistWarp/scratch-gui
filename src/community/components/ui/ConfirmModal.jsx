import PropTypes from 'prop-types';
import React from 'react';
import {AlertTriangle} from 'lucide-react';

import {useCommunityIntl} from '../../i18n.jsx';
import Button from './Button.jsx';
import Modal from './Modal.jsx';
import Notice from './Notice.jsx';

const ConfirmModal = ({
    busy, busyLabel, cancelLabel, children, confirmLabel, destructive, error, icon, onCancel, onConfirm, title
}) => {
    const {text: communityText} = useCommunityIntl();
    return (
        <Modal
            title={title}
            icon={icon || (destructive ? AlertTriangle : null)}
            onClose={onCancel}
            dismissDisabled={busy}
            actions={(
                <React.Fragment>
                    <Button onClick={onCancel} disabled={busy}>{cancelLabel || communityText('Cancel')}</Button>
                    <Button
                        variant={destructive ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        busy={busy}
                        busyLabel={busyLabel}
                        autoFocus={!destructive}
                    >
                        {confirmLabel || communityText('Confirm')}
                    </Button>
                </React.Fragment>
            )}
        >
            {typeof children === 'string' ? <p>{children}</p> : children}
            {error ? <Notice variant="error">{error}</Notice> : null}
        </Modal>
    );
};

ConfirmModal.propTypes = {
    busy: PropTypes.bool,
    busyLabel: PropTypes.node,
    cancelLabel: PropTypes.node,
    children: PropTypes.node,
    confirmLabel: PropTypes.node,
    destructive: PropTypes.bool,
    error: PropTypes.node,
    icon: PropTypes.elementType,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.node.isRequired
};

ConfirmModal.defaultProps = {
    busy: false,
    destructive: false
};

export default ConfirmModal;
