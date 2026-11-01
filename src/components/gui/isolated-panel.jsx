import PropTypes from 'prop-types';
import React, {useCallback} from 'react';

import PanelErrorBoundary from '../panel-error-boundary/panel-error-boundary.jsx';

const IsolatedPanel = ({children, closeAction, name, onClose, onClosePanel}) => {
    const handleClose = useCallback(() => {
        if (onClose) {
            onClose();
        } else if (closeAction && onClosePanel) {
            onClosePanel(closeAction);
        }
    }, [closeAction, onClose, onClosePanel]);
    return (
        <PanelErrorBoundary
            name={name}
            onClose={handleClose}
        >
            <React.Suspense fallback={null}>
                {children}
            </React.Suspense>
        </PanelErrorBoundary>
    );
};

IsolatedPanel.propTypes = {
    children: PropTypes.node,
    closeAction: PropTypes.func,
    name: PropTypes.string.isRequired,
    onClose: PropTypes.func,
    onClosePanel: PropTypes.func
};

export default IsolatedPanel;
