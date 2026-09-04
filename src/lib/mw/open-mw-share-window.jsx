/* eslint-disable react/jsx-filename-extension, react/jsx-no-literals */
import React from 'react';
import ReactDOM from 'react-dom';

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
        height: 430,
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

    // Split ShareWindow (+ git/diff/sable deps) out of the editor initial
    // bundle. Window opens immediately with a loader, content hydrates async.
    ReactDOM.render(<div style={{padding: 16}}>Loading…</div>, container);
    import(
        /* webpackChunkName: "mw-share-window" */
        '../../components/mw-share-modal/share-window.jsx'
    ).then(({default: ShareWindow}) => {
        // Window may have closed while chunk loaded.
        if (!shareWindow || !container) return;
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
    }).catch(() => {
        if (!shareWindow || !container) return;
        ReactDOM.render(
            <div style={{padding: 16}}>{'Could not load save dialog. Check connection, retry.'}</div>,
            container
        );
    });

    shareWindow.center();
    shareWindow.show();
};

export default openMistWarpShareWindow;
