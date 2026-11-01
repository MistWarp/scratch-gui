import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import Loader from '../loader/loader.jsx';
import Alerts from '../../containers/alerts.jsx';
import UpdateToast from '../update-toast/update-toast.jsx';
import {isBrowserSupported} from '../../lib/utils/tw-environment-support-prober.js';
import {closeConnectionModal, closeDebuggerModal} from '../../reducers/modals.js';
import {closeCollaborationModal} from '../../reducers/collaboration';
import IsolatedPanel from './isolated-panel.jsx';
import styles from './gui.css';
import {getGuiComponents} from './gui-components';

const EditorOverlays = ({
    alertsVisible,
    connectionModalVisible,
    isCreating,
    isRtl,
    isTelemetryEnabled,
    loading,
    telemetryModalVisible,
    vm,
    onClickDesktopSettings,
    onClosePanel,
    onRequestCloseTelemetryModal,
    onShowPrivacyPolicy,
    onTelemetryModalCancel,
    onTelemetryModalOptIn,
    onTelemetryModalOptOut
}) => {
    const {
        TWDebugger,
        TelemetryModal,
        CollabLoader,
        BrowserModal,
        ConnectionModal,
        CollaborationContainer
    } = getGuiComponents();
    return (
        <React.Fragment>
            <IsolatedPanel
                name="Debugger"
                closeAction={closeDebuggerModal}
                onClosePanel={onClosePanel}
            >
                <TWDebugger />
            </IsolatedPanel>
            {telemetryModalVisible ? (
                <TelemetryModal
                    isRtl={isRtl}
                    isTelemetryEnabled={isTelemetryEnabled}
                    onCancel={onTelemetryModalCancel}
                    onOptIn={onTelemetryModalOptIn}
                    onOptOut={onTelemetryModalOptOut}
                    onRequestClose={onRequestCloseTelemetryModal}
                    onShowPrivacyPolicy={onShowPrivacyPolicy}
                />
            ) : null}
            {loading ? (
                <Loader isFullScreen />
            ) : null}
            {isCreating ? (
                <Loader
                    isFullScreen
                    messageId="gui.loader.creating"
                />
            ) : null}
            <CollabLoader />
            {isBrowserSupported() ? null : (
                <BrowserModal
                    isRtl={isRtl}
                    onClickDesktopSettings={onClickDesktopSettings}
                />
            )}
            {alertsVisible ? (
                <Alerts className={styles.alertsContainer} />
            ) : null}
            <UpdateToast />
            {connectionModalVisible ? (
                <IsolatedPanel
                    name="Connection"
                    closeAction={closeConnectionModal}
                    onClosePanel={onClosePanel}
                >
                    <ConnectionModal
                        vm={vm}
                    />
                </IsolatedPanel>
            ) : null}
            <IsolatedPanel
                name="Collaboration"
                closeAction={closeCollaborationModal}
                onClosePanel={onClosePanel}
            >
                <CollaborationContainer />
            </IsolatedPanel>
        </React.Fragment>
    );
};

EditorOverlays.propTypes = {
    alertsVisible: PropTypes.bool,
    connectionModalVisible: PropTypes.bool,
    isCreating: PropTypes.bool,
    isRtl: PropTypes.bool,
    isTelemetryEnabled: PropTypes.bool,
    loading: PropTypes.bool,
    telemetryModalVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    onClickDesktopSettings: PropTypes.func,
    onClosePanel: PropTypes.func,
    onRequestCloseTelemetryModal: PropTypes.func,
    onShowPrivacyPolicy: PropTypes.func,
    onTelemetryModalCancel: PropTypes.func,
    onTelemetryModalOptIn: PropTypes.func,
    onTelemetryModalOptOut: PropTypes.func
};

export default EditorOverlays;
