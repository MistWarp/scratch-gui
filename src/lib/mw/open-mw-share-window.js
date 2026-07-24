import React from 'react';
import ReactDOM from 'react-dom';

import ShareWindow from '../../components/mw-share-modal/share-window.jsx';
import WindowManager from '../../addons/window-system/window-manager';
import {openProjectMetadataModal} from '../../reducers/modals';

let shareWindow = null;
let container = null;

const openMistWarpShareWindow = ({vm, initialTitle, initialError, action = 'save', onPublished}) => {
    if (shareWindow) {
        shareWindow.show().bringToFront();
        return;
    }

    container = document.createElement('div');
    container.style.cssText = 'height: 100%; display: flex; flex-direction: column; min-height: 0;';

    const cleanup = () => {
        if (container) {
            ReactDOM.unmountComponentAtNode(container);
        }
        if (shareWindow) {
            shareWindow.close();
        }
        shareWindow = null;
        container = null;
    };

    shareWindow = WindowManager.createWindow({
        id: 'mw-share-window',
        title: action === 'remix' ? 'Remix to MistWarp' :
            action === 'update' ? 'Update MistWarp project' : 'Save to MistWarp',
        width: 460,
        height: 380,
        minWidth: 360,
        minHeight: 300,
        className: 'mw-share-window',
        onClose: () => {
            if (container) {
                ReactDOM.unmountComponentAtNode(container);
            }
            shareWindow = null;
            container = null;
        }
    });

    shareWindow.setContent(container);

    ReactDOM.render(
        React.createElement(ShareWindow, {
            vm,
            initialTitle,
            initialError,
            action,
            onClose: cleanup,
            onReviewStorage: () => {
                cleanup();
                if (window.ReduxStore) {
                    window.ReduxStore.dispatch(openProjectMetadataModal('optimiser'));
                }
            },
            onPublished: result => {
                if (typeof onPublished === 'function') {
                    onPublished(result);
                }
            }
        }),
        container
    );

    shareWindow.center();
    shareWindow.show();
};

export default openMistWarpShareWindow;
