import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';
import Alert from '../../containers/alert.jsx';

import styles from './alerts.css';

/**
 * A stable key per alert, so closing one does not remount the ones after it.
 * Extension alerts have no alertId, and an alert may be shown twice.
 * @param {Array.<object>} alertsList The alerts.
 * @returns {Array.<string>} One key per alert.
 */
const alertKeys = alertsList => {
    const seen = {};
    return alertsList.map(a => {
        const base = a.alertId || `extension-${a.extensionId}`;
        seen[base] = (seen[base] || 0) + 1;
        return seen[base] > 1 ? `${base}-${seen[base]}` : base;
    });
};

const AlertsComponent = ({
    alertsList,
    className,
    onCloseAlert
}) => {
    const keys = alertKeys(alertsList);
    return (
        <Box
            bounds="parent"
            className={className}
        >
            {/* Stays mounted so new alerts are announced. Warnings are
                announced at once instead (see alert.jsx). */}
            <Box
                aria-live="polite"
                className={styles.alertsInnerContainer}
            >
                {alertsList.map((a, index) => (
                    <Alert
                        closeButton={a.closeButton}
                        content={a.content}
                        extensionId={a.extensionId}
                        extensionName={a.extensionName}
                        iconSpinner={a.iconSpinner}
                        iconURL={a.iconURL}
                        index={index}
                        key={keys[index]}
                        level={a.level}
                        message={a.message}
                        showDownload={a.showDownload}
                        showReconnect={a.showReconnect}
                        showSaveNow={a.showSaveNow}
                        onCloseAlert={onCloseAlert}
                    />
                ))}
            </Box>
        </Box>
    );
};

AlertsComponent.propTypes = {
    alertsList: PropTypes.arrayOf(PropTypes.object),
    className: PropTypes.string,
    onCloseAlert: PropTypes.func
};

export default AlertsComponent;
