import React from 'react';
import ReactDOM from 'react-dom';

import WindowManager from '../../addons/window-system/window-manager';
import CommunityScope from './community-scope.jsx';

const openWindows = new Map();

const openMistWarpCommunityWindow = ({id, title, initialPath, element, width = 940, height = 640}) => {
    const existing = openWindows.get(id);
    if (existing) {
        existing.show().bringToFront();
        return existing;
    }

    const container = document.createElement('div');
    container.style.cssText = 'height: 100%; display: flex; flex-direction: column; min-height: 0; overflow: auto;';

    const win = WindowManager.createWindow({
        id,
        title,
        width,
        height,
        minWidth: 480,
        minHeight: 400,
        onClose: () => {
            ReactDOM.unmountComponentAtNode(container);
            openWindows.delete(id);
        }
    });

    win.setContent(container);
    ReactDOM.render(
        <CommunityScope
            initialPath={initialPath}
            linksInNewTab
        >
            {element}
        </CommunityScope>,
        container
    );
    win.center();
    win.show();
    openWindows.set(id, win);
    return win;
};

export default openMistWarpCommunityWindow;
