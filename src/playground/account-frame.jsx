import React from 'react';
import ReactDOM from 'react-dom';
import * as identity from '../lib/rotur/identity.js';
import {request, storeSession} from '../lib/community/api.js';
import {callRotur} from '../lib/rotur/extension-bridge.js';
import {ensureScopes, getRotur} from '../lib/rotur/client.js';
import {signMessage} from '../lib/originchats/signing.js';
import {createFrameChat} from '../lib/account/frame-chat.js';
import {CHANNEL, PROMPT_LIFETIME} from '../lib/account/protocol.js';
import {ACCOUNT_ORIGIN, isEditorOrigin} from '../lib/account/origins.js';
import {
    createFrameServer, createSerialLock, createStorageStore, mintEditorSession
} from '../lib/account/frame-server.js';
import {createProjectRotur} from '../lib/account/frame-project-rotur.js';
import {createEditorData} from '../lib/account/frame-editor-data.js';
import FramePrompt, {supportsVisibilityCheck} from '../components/account-frame/frame-prompt.jsx';
import {applyThemeVisuals, detectTheme} from '../lib/themes/themePersistance.js';

const REVIEW_CHANNEL = 'mw:account-review';
const RESTORE_WAIT = 10000;
const REVIEW_WAIT = 5000;
const EDITOR_SESSION_KEY = 'mw:editor-session';
const PROMPT_TYPES = ['consent', 'confirm', 'share', 'signout'];
const ANSWERS = [true, false, 'block', 'this', 'all'];
const API_BASE = process.env.MW_API_BASE || 'https://api.mistwarp.org/v1';
const TOKEN_CHECK_TIMEOUT = 10000;
const root = document.getElementById('app');
const ports = new Map();
let promptOpen = false;

const broadcast = message => {
    for (const port of ports.keys()) {
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

const openReviewWindow = (id, attempt) => {
    const left = Math.max(0, (screen.width - 480) / 2);
    const top = Math.max(0, (screen.height - 640) / 2);
    return window.open(`${location.origin}/account-frame.html?review=${id}`, `mw-account-review-${id}-${attempt}`,
        `popup,width=480,height=640,left=${left},top=${top}`);
};

const fromReviewWindow = (event, reviewWindow) => Boolean(reviewWindow) && event.source === reviewWindow &&
    event.origin === location.origin && event.data && event.data.type === REVIEW_CHANNEL;

const showPrompt = (type, data, lifetime) => new Promise(resolve => {
    promptOpen = true;
    broadcast({kind: 'show'});
    const reviewId = randomId();
    const review = !supportsVisibilityCheck();
    let reviewWindow = null;
    let attempts = 0;
    let timer = null;
    let settled = false;
    let onReviewMessage = null;
    const finish = answer => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('message', onReviewMessage);
        if (reviewWindow && !reviewWindow.closed) reviewWindow.close();
        ReactDOM.unmountComponentAtNode(root);
        promptOpen = false;
        broadcast({kind: 'hide'});
        resolve(answer);
    };
    onReviewMessage = event => {
        if (!fromReviewWindow(event, reviewWindow) || event.data.id !== reviewId) return;
        if (event.data.kind === 'request') {
            reviewWindow.postMessage({type: REVIEW_CHANNEL, kind: 'prompt', id: reviewId, prompt: type, data},
                location.origin);
        }
        if (event.data.kind === 'answer') finish(ANSWERS.includes(event.data.answer) ? event.data.answer : false);
    };
    timer = setTimeout(() => finish(false), lifetime);
    const render = reviewError => {
        ReactDOM.render(React.createElement(FramePrompt, {
            key: reviewId,
            type,
            data,
            mode: review ? 'review' : 'inline',
            reviewError,
            onAnswer: finish,
            onReview: () => {
                if (reviewWindow && !reviewWindow.closed) reviewWindow.close();
                attempts += 1;
                reviewWindow = openReviewWindow(reviewId, attempts);
                if (!reviewWindow) render('Allow pop-ups for this site, then try again.');
            }
        }), root);
    };
    if (review) window.addEventListener('message', onReviewMessage);
    render('');
});

let promptQueue = Promise.resolve();

const prompt = (type, data, lifetime = PROMPT_LIFETIME) => {
    const deadline = Date.now() + Math.min(lifetime, PROMPT_LIFETIME);
    const run = promptQueue.then(() => {
        const remaining = deadline - Date.now();
        return remaining > 0 ? showPrompt(type, data, remaining) : false;
    });
    promptQueue = run.catch(() => null);
    return run;
};

const lockEditorSession = navigator.locks && typeof navigator.locks.request === 'function' ?
    task => navigator.locks.request(EDITOR_SESSION_KEY, () => task()) :
    createSerialLock();

const editorTokenRejected = async token => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TOKEN_CHECK_TIMEOUT);
    try {
        const response = await fetch(`${API_BASE}/me`, {
            headers: {Authorization: `Bearer ${token}`},
            cache: 'no-store',
            signal: controller.signal
        });
        return response.status === 401;
    } catch (e) {
        return false;
    } finally {
        clearTimeout(timer);
    }
};

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
        createEditorSession: () => mintEditorSession({
            ensureMistSession: identity.ensureMistSession,
            dropMistSession: () => storeSession(null),
            mint: () => request('/auth/editor-session', {method: 'POST', cache: false, timeoutMs: 20000})
        }),
        mistSession: identity.getMistSession,
        tokenRejected: editorTokenRejected,
        store: createStorageStore(() => localStorage, EDITOR_SESSION_KEY),
        lock: lockEditorSession,
        callRotur,
        projectRotur: createProjectRotur({prompt, getUsername}),
        confirmSignOut: username => prompt('signout', {username}),
        editorData: createEditorData(),
        chat: createFrameChat({ensureScopes, getRotur, signMessage})
    });
    const restored = Promise.race([
        Promise.resolve(identity.restore()).catch(() => null),
        new Promise(resolve => setTimeout(resolve, RESTORE_WAIT))
    ]);
    window.addEventListener('message', event => {
        const data = event.data;
        if (event.source !== window.parent || !isEditorOrigin(event.origin) || !data ||
            data.type !== CHANNEL || data.kind !== 'connect' || !event.ports[0]) return;
        const port = event.ports[0];
        restored.then(() => {
            for (const [oldPort, unsubscribe] of ports) {
                unsubscribe();
                oldPort.close();
            }
            ports.clear();
            ports.set(port, server.serve(port));
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

const GRANTS = {
    signing: ['signing:keys']
};

const startGrant = async name => {
    applyThemeVisuals(detectTheme());
    root.textContent = 'Checking your MistWarp account…';
    const user = identity.getState().user || await identity.restore().catch(() => null);
    if (!user) {
        root.textContent = 'Sign in to MistWarp first, then try again from the editor.';
        return;
    }
    if (await ensureScopes(GRANTS[name]).catch(() => false)) {
        window.close();
        return;
    }
    root.textContent = '';
    let answered = false;
    ReactDOM.render(React.createElement(FramePrompt, {
        type: 'grant',
        data: {username: user.username},
        mode: 'window',
        onAnswer: answer => {
            if (answered) return;
            answered = true;
            if (answer !== true) {
                window.close();
                return;
            }
            ensureScopes(GRANTS[name], {prompt: true})
                .catch(() => false)
                .then(() => window.close());
        }
    }), root);
};

const startReview = id => {
    applyThemeVisuals(detectTheme());
    const opener = window.opener;
    const ended = setTimeout(() => {
        root.textContent = 'This request has ended. You can close this window.';
    }, REVIEW_WAIT);
    window.addEventListener('message', event => {
        const message = event.data;
        if (event.source !== opener || event.origin !== location.origin || !message ||
            message.type !== REVIEW_CHANNEL || message.id !== id || message.kind !== 'prompt' ||
            !PROMPT_TYPES.includes(message.prompt) || !message.data || typeof message.data !== 'object') return;
        clearTimeout(ended);
        ReactDOM.render(React.createElement(FramePrompt, {
            type: message.prompt,
            data: message.data,
            mode: 'window',
            onAnswer: answer => {
                opener.postMessage({type: REVIEW_CHANNEL, kind: 'answer', id, answer}, location.origin);
                window.close();
            }
        }), root);
    });
    opener.postMessage({type: REVIEW_CHANNEL, kind: 'request', id}, location.origin);
};

const params = new URLSearchParams(location.search);
const topLevel = window.top === window;
if (location.origin !== ACCOUNT_ORIGIN) {
    root.textContent = 'This page only works on the MistWarp site.';
} else if (params.has('signin') && topLevel && window.opener) {
    startSignIn();
} else if (Object.prototype.hasOwnProperty.call(GRANTS, params.get('grant') || '') && topLevel && window.opener) {
    startGrant(params.get('grant'));
} else if (/^[0-9a-f]{32}$/.test(params.get('review') || '') && topLevel && window.opener) {
    startReview(params.get('review'));
} else if (topLevel) {
    root.textContent = 'This page connects the MistWarp editor to your account.';
} else {
    startFrame();
}
