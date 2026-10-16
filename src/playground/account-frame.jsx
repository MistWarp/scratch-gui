import React from 'react';
import ReactDOM from 'react-dom';
import * as identity from '../lib/rotur/identity.js';
import {request} from '../lib/community/api.js';
import {callRotur} from '../lib/rotur/extension-bridge.js';
import {CHANNEL} from '../lib/account/protocol.js';
import {isEditorOrigin} from '../lib/account/origins.js';
import {createFrameServer} from '../lib/account/frame-server.js';
import {createProjectRotur} from '../lib/account/frame-project-rotur.js';
import FramePrompt from '../components/account-frame/frame-prompt.jsx';
import {applyThemeVisuals, detectTheme} from '../lib/themes/themePersistance.js';

const ports = new Set();
const broadcast = message => {
    for (const port of ports) {
        try {
            port.postMessage(message);
        } catch (e) {
            ports.delete(port);
        }
    }
};

const root = document.getElementById('app');
let promptQueueOpen = false;

const prompt = (type, data) => new Promise(resolve => {
    promptQueueOpen = true;
    broadcast({kind: 'show'});
    const finish = answer => {
        ReactDOM.unmountComponentAtNode(root);
        promptQueueOpen = false;
        broadcast({kind: 'hide'});
        resolve(answer);
    };
    ReactDOM.render(React.createElement(FramePrompt, {type, data, onAnswer: finish}), root);
});

const getUsername = () => {
    const user = identity.getState().user;
    return user && user.username ? String(user.username) : '';
};

const startFrame = () => {
    applyThemeVisuals(detectTheme());
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    const server = createFrameServer({
        identity,
        createEditorSession: async () => {
            await identity.ensureMistSession();
            return request('/auth/editor-session', {method: 'POST', cache: false});
        },
        callRotur,
        projectRotur: createProjectRotur({prompt, getUsername})
    });
    window.addEventListener('message', event => {
        const data = event.data;
        if (event.source !== window.parent || !isEditorOrigin(event.origin) || !data ||
            data.type !== CHANNEL || data.kind !== 'connect' || !event.ports[0]) return;
        const port = event.ports[0];
        ports.add(port);
        server.serve(port);
        if (promptQueueOpen) port.postMessage({kind: 'show'});
    });
    identity.restore();
};

const startSignIn = async () => {
    root.textContent = 'Signing in to MistWarp…';
    const user = identity.getState().user || await identity.restore();
    if (user) {
        root.textContent = 'You are signed in. You can close this window.';
        window.close();
        return;
    }
    try {
        await identity.login();
        root.textContent = 'You are signed in. You can close this window.';
        window.close();
    } catch (error) {
        root.textContent = (error && error.message) || 'Sign-in did not finish. Close this window and try again.';
    }
};

if (new URLSearchParams(location.search).has('signin')) {
    startSignIn();
} else if (window.parent === window) {
    root.textContent = 'This page connects the MistWarp editor to your account.';
} else {
    startFrame();
}
