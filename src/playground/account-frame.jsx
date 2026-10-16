import React from 'react';
import ReactDOM from 'react-dom';
import * as identity from '../lib/rotur/identity.js';
import {request} from '../lib/community/api.js';
import {callRotur} from '../lib/rotur/extension-bridge.js';
import {CHANNEL, CALL_TIMEOUT} from '../lib/account/protocol.js';
import {ACCOUNT_ORIGIN, isEditorOrigin} from '../lib/account/origins.js';
import {createFrameServer} from '../lib/account/frame-server.js';
import {createProjectRotur} from '../lib/account/frame-project-rotur.js';
import FramePrompt, {supportsVisibilityCheck} from '../components/account-frame/frame-prompt.jsx';
import {applyThemeVisuals, detectTheme} from '../lib/themes/themePersistance.js';

const REVIEW_CHANNEL = 'mw:account-review';
const PROMPT_TIMEOUT = CALL_TIMEOUT - 30000;
const root = document.getElementById('app');
const ports = new Set();
let promptOpen = false;

const broadcast = message => {
    for (const port of ports) {
        try {
            port.postMessage(message);
        } catch (e) {
            ports.delete(port);
        }
    }
};

const randomId = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
};

const openReviewWindow = id => {
    const left = Math.max(0, (screen.width - 480) / 2);
    const top = Math.max(0, (screen.height - 640) / 2);
    return window.open(`${location.origin}/account-frame.html?review=${id}`, `mw-account-review-${id}`,
        `popup,width=480,height=640,left=${left},top=${top}`);
};

const prompt = (type, data) => new Promise(resolve => {
    promptOpen = true;
    broadcast({kind: 'show'});
    const reviewId = randomId();
    const review = supportsVisibilityCheck() ? null : new BroadcastChannel(REVIEW_CHANNEL);
    let reviewWindow = null;
    let timer = null;
    let settled = false;
    const finish = answer => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (review) review.close();
        if (reviewWindow && !reviewWindow.closed) reviewWindow.close();
        ReactDOM.unmountComponentAtNode(root);
        promptOpen = false;
        broadcast({kind: 'hide'});
        resolve(answer);
    };
    timer = setTimeout(() => finish(false), PROMPT_TIMEOUT);
    const render = reviewError => {
        ReactDOM.render(React.createElement(FramePrompt, {
            type,
            data,
            mode: review ? 'review' : 'inline',
            reviewError,
            onAnswer: finish,
            onReview: () => {
                reviewWindow = openReviewWindow(reviewId);
                if (!reviewWindow) render('Allow pop-ups for this site, then try again.');
            }
        }), root);
    };
    if (review) {
        review.onmessage = ({data: message}) => {
            if (!message || message.id !== reviewId) return;
            if (message.kind === 'request') review.postMessage({kind: 'prompt', id: reviewId, type, data});
            if (message.kind === 'answer') finish(message.answer);
        };
    }
    render('');
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
    const restored = Promise.resolve(identity.restore()).catch(() => null);
    window.addEventListener('message', event => {
        const data = event.data;
        if (event.source !== window.parent || !isEditorOrigin(event.origin) || !data ||
            data.type !== CHANNEL || data.kind !== 'connect' || !event.ports[0]) return;
        const port = event.ports[0];
        restored.then(() => {
            ports.add(port);
            server.serve(port);
            if (promptOpen) port.postMessage({kind: 'show'});
        });
    });
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

const startReview = id => {
    applyThemeVisuals(detectTheme());
    const review = new BroadcastChannel(REVIEW_CHANNEL);
    review.onmessage = ({data: message}) => {
        if (!message || message.id !== id || message.kind !== 'prompt') return;
        ReactDOM.render(React.createElement(FramePrompt, {
            type: message.type,
            data: message.data,
            mode: 'window',
            onAnswer: answer => {
                review.postMessage({kind: 'answer', id, answer});
                window.close();
            }
        }), root);
    };
    review.postMessage({kind: 'request', id});
};

const params = new URLSearchParams(location.search);
const topLevel = window.top === window;
if (location.origin !== ACCOUNT_ORIGIN) {
    root.textContent = 'This page only works on the MistWarp site.';
} else if (params.has('signin') && topLevel && window.opener) {
    startSignIn();
} else if (/^[0-9a-f]{32}$/.test(params.get('review') || '') && topLevel && window.opener) {
    startReview(params.get('review'));
} else if (topLevel) {
    root.textContent = 'This page connects the MistWarp editor to your account.';
} else {
    startFrame();
}
