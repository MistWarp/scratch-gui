import React from 'react';
import ReactDOM from 'react-dom';

import FractchTerminal from '../../components/mw-fractch-workspace/fractch-terminal.jsx';
import WindowManager from '../../addons/window-system/window-manager';
import {applyFractchWorkspace, getPendingMerge, prepareFractchWorkspace} from '../git/browser-git';

let terminalWindow = null;
let container = null;

const openFractchTerminalWindow = ({vm}) => {
    if (terminalWindow) {
        terminalWindow.show().bringToFront();
        return;
    }

    container = document.createElement('div');
    container.style.cssText = 'height: 100%; display: flex; flex-direction: column; min-height: 0;';

    terminalWindow = WindowManager.createWindow({
        id: 'mw-fractch-terminal-window',
        title: 'Terminal',
        width: 640,
        height: 380,
        minWidth: 360,
        minHeight: 200,
        className: 'mw-fractch-terminal-window',
        onClose: () => {
            if (container) ReactDOM.unmountComponentAtNode(container);
            terminalWindow = null;
            container = null;
        }
    });

    terminalWindow.setContent(container);

    // The shell works on the fractch worktree, so make sure the project has been written to it.
    const ready = getPendingMerge() ? Promise.resolve() : prepareFractchWorkspace(vm);
    const handleWorktreeChanged = () => applyFractchWorkspace(vm);

    ready.then(() => {
        if (!container) return;
        ReactDOM.render(
            React.createElement(FractchTerminal, {
                onWorktreeChanged: handleWorktreeChanged,
                style: {flex: '1 1 auto', minHeight: 0, padding: '0.35rem 0.5rem 0'}
            }),
            container
        );
    });

    terminalWindow.center();
    terminalWindow.show();
};

export default openFractchTerminalWindow;
