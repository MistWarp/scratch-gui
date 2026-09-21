/* eslint-disable require-atomic-updates */
// Account requests are serialized through apiQueue; permissions belong to this host.
import {CHANNEL, SANDBOX, projectFromURL, publicIdentity, classifyRequest, isEditorDestination} from './protocol.js';
import {loadWorkspace, saveWorkspace, initialPreferences} from './host-storage.js';
import * as identity from '../rotur/identity.js';
import {request, uploadXhr} from '../community/api.js';
import './host.css?global';
import {ROTUR_METHODS} from './rotur-policy.js';

const textElement = (tag, text) => {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
};

export const mountEditorHost = async () => {
    // Never start inside a frame: not nested inside a runtime, and not under
    // another site that could overlay the permission dialogs. The response's
    // frame-ancestors policy says the same where the host honours headers.
    if (window.parent !== window) {
        throw new Error('Open the editor in its own tab.');
    }
    const initialURL = new URL(location.href);
    let projectId = projectFromURL(initialURL);
    let createdId = null;
    let saveApproved = false;
    const roturReadGrants = new Set();
    let port;
    let runningRequests = 0;
    const user = await identity.restore(); // consumes login callback before forwarding the URL
    const account = user?.id || user?.username || 'anonymous';
    let localScope = sessionStorage.getItem('mw:editor-local-scope');
    if (!localScope) {
        localScope = crypto.randomUUID();
        sessionStorage.setItem('mw:editor-local-scope', localScope);
    }
    let scope = `${account}:${projectId || `local-${localScope}`}`;
    const workspace = await loadWorkspace(scope);
    const seed = {...workspace, local: {...initialPreferences(), ...workspace.local}, session: {}};
    const restoreId = Number(initialURL.searchParams.get('restore'));
    if (Number.isSafeInteger(restoreId) && restoreId > 0) {
        const {default: backups} = await import('../api/restore-points.js');
        seed.restore = {id: restoreId, ...await backups.exportRestorePoint(restoreId)};
    }
    const root = document.getElementById('app');
    root.replaceChildren();
    root.className = 'mw-editor-host';
    const frame = document.createElement('iframe');
    frame.title = 'MistWarp editor';
    frame.setAttribute('sandbox', SANDBOX);
    frame.allow = 'autoplay; fullscreen';
    frame.allowFullscreen = true;
    const url = new URL(`${process.env.ROOT || '/'}editor-runtime.html`, location.href);
    url.search = location.search;
    url.searchParams.delete('token');
    url.searchParams.delete('allow_all');
    url.hash = location.hash;
    const scratchRoute = /\/(\d+)\/editor(?:\.html)?\/?$/.exec(location.pathname);
    if (!url.hash && scratchRoute) url.hash = scratchRoute[1];
    frame.src = url.href;
    const reportError = message => {
        let alert = root.querySelector('.mw-editor-host-error');
        if (!alert) {
            alert = textElement('div', '');
            alert.className = 'mw-editor-host-error';
            alert.setAttribute('role', 'alert');
            alert.append(textElement('span', ''));
            const dismiss = textElement('button', 'Dismiss');
            dismiss.type = 'button';
            dismiss.onclick = () => alert.remove();
            alert.append(dismiss);
            root.append(alert);
        }
        alert.querySelector('span').textContent = message;
    };

    let activeDialog = false;
    const consent = (message, action = () => true, label = 'Allow') => new Promise((resolve, reject) => {
        if (activeDialog) return reject(new Error('Finish the open dialog first.'));
        activeDialog = true;
        const backdrop = document.createElement('div');
        backdrop.className = 'mw-editor-host-backdrop';
        const dialog = document.createElement('section');
        dialog.className = 'mw-editor-host-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', 'Editor permission');
        dialog.append(textElement('h2', 'Editor permission'), textElement('p', message));
        const buttons = document.createElement('div');
        const deny = textElement('button', 'Cancel');
        const allow = textElement('button', label);
        deny.type = allow.type = 'button';
        const finish = () => {
            activeDialog = false; backdrop.remove();
        };
        deny.onclick = () => {
            finish(); reject(new Error('Request cancelled.'));
        };
        allow.onclick = async () => {
            allow.disabled = deny.disabled = true;
            try {
                const result = await action(); finish(); resolve(result);
            } catch (error) {
                finish(); reject(error);
            }
        };
        dialog.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !deny.disabled) deny.click();
            if (event.key === 'Tab') {
                event.preventDefault();
                (document.activeElement === allow ? deny : allow).focus();
            }
        });
        buttons.append(deny, allow);
        dialog.append(buttons);
        backdrop.append(dialog);
        root.append(backdrop);
        deny.focus();
    });
    const showIdentity = () => {
        const state = publicIdentity(identity.getState());
        if (port) port.postMessage({kind: 'identity', identity: state});
        return state;
    };
    const signIn = () => consent('Sign in to MistWarp? Your credentials stay outside the editor.',
        async () => {
            await identity.login();
            return showIdentity();
        }, 'Sign in');
    identity.subscribe(() => {
        roturReadGrants.clear();
        saveApproved = false;
        showIdentity();
    });
    const persist = () => saveWorkspace(scope, workspace);

    const handleRequest = async args => {
        const {path, method = 'GET', form, raw = false} = args;
        let body = args.body;
        const accountAtRequest = identity.getState().user?.id || identity.getState().user?.username;
        const kind = classifyRequest(path, method, projectId);
        if (!kind) {
            throw new Error('This account operation is not available to the isolated editor. Open it on MistWarp.');
        }
        if (form && (!Array.isArray(form) || form.length > 24 || !['save'].includes(kind))) {
            throw new Error('Invalid editor upload.');
        }
        if (kind === 'delete-created' && projectId !== createdId) {
            throw new Error('The editor cannot delete this project.');
        }
        if (kind === 'account-read' && path.split('?')[0] === '/me') {
            return {user: publicIdentity(identity.getState()).user};
        }
        if (kind === 'create') {
            body = {title: String(body?.title || 'Untitled').slice(0, 200)};
        }
        if (kind === 'create' || kind === 'remix') {
            await consent(kind === 'create' ? 'Save this workspace as a new MistWarp project?' :
                `Create a remix of project ${projectId}?`);
        } else if (kind === 'save' && !saveApproved) {
            await consent(`Allow this editor session to save changes to project ${projectId}? ` +
                'Extensions in this workspace can also change its contents.');
            saveApproved = true;
        } else if (['publish', 'metadata', 'settings-write', 'delete-created'].includes(kind)) {
            const descriptions = {
                'publish': `Publish project ${projectId} on MistWarp?`,
                'metadata': `Update the title or details of project ${projectId}?`,
                'settings-write': 'Save this editor’s preferences to your MistWarp account?',
                'delete-created': `Remove the empty project ${projectId} after its upload failed?`
            };
            await consent(descriptions[kind]);
        }
        if (accountAtRequest !== (identity.getState().user?.id || identity.getState().user?.username)) {
            saveApproved = false;
            throw new Error('The signed-in account changed. Try the operation again.');
        }
        let result;
        if (form) {
            const upload = new FormData();
            const allowed = new Set(['project', 'extensions', 'workspace', 'git', 'expectedHead', 'expectedEdited',
                'replaceHistory', 'pullId', 'mergeSourceBranch', 'mergeTargetBranch', 'mergeSourceHead',
                'mergeTargetHead', 'restoreCommit', 'restoreMessage', 'mergeTree', 'thumbnail']);
            for (const entry of form) {
                if (!Array.isArray(entry) || entry.length !== 2 || !allowed.has(entry[0])) {
                    throw new Error('Invalid editor upload field.');
                }
                const [name, value] = entry;
                if (value instanceof Blob) upload.append(name, value, value.name || name);
                else if (typeof value === 'string') upload.append(name, value);
                else throw new Error('Invalid editor upload value.');
            }
            result = await uploadXhr(path, upload);
        } else {
            if (kind === 'metadata' && (!body || Object.keys(body).some(key =>
                !['title', 'instructions', 'credits', 'description'].includes(key)))) {
                throw new Error('Use the project page to change sharing or account settings.');
            }
            result = await request(path, {method, body, raw, cache: false});
        }
        if (kind === 'save' && path === `/projects/${projectId}/upload`) createdId = null;
        if (kind === 'create' || kind === 'remix') {
            const id = result.id || result.project?.id;
            if (!id || !/^[a-zA-Z0-9_-]+$/.test(String(id))) {
                throw new Error('The server returned an invalid project ID.');
            }
            projectId = String(id);
            createdId = projectId;
            saveApproved = true;
            scope = `${accountAtRequest || 'anonymous'}:${projectId}`;
            await persist();
            const savedURL = new URL(location.href);
            savedURL.searchParams.delete('restore');
            savedURL.searchParams.delete('starter');
            savedURL.hash = `mw-${projectId}`;
            history.replaceState(null, '', savedURL);
        }
        if (raw) {
            return {body: await result.blob(),
                status: result.status,
                headers: {'Content-Type': result.headers.get('Content-Type') || 'application/octet-stream'}};
        }
        return result;
    };
    let apiQueue = Promise.resolve();
    const openDeviceBackups = async () => {
        if (activeDialog) return;
        activeDialog = true;
        const backdrop = document.createElement('div');
        backdrop.className = 'mw-editor-host-backdrop';
        const dialog = document.createElement('section');
        dialog.className = 'mw-editor-host-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', 'Device backups');
        const close = textElement('button', 'Close');
        close.onclick = () => {
            activeDialog = false; backdrop.remove();
        };
        dialog.append(textElement('h2', 'Device backups'), close);
        backdrop.append(dialog);
        root.append(backdrop);
        close.focus();
        try {
            const {default: backups} = await import('../api/restore-points.js');
            const {restorePoints} = await backups.getAllRestorePoints();
            if (!restorePoints.length) dialog.append(textElement('p', 'No earlier device backups.'));
            for (const backup of restorePoints) {
                const link = textElement('a', `${backup.title} · ${new Date(backup.created * 1000).toLocaleString()}`);
                link.href = `${process.env.ROOT || '/'}editor?restore=${encodeURIComponent(backup.id)}`;
                link.className = 'mw-editor-host-backup';
                dialog.append(link);
            }
        } catch (error) {
            dialog.append(textElement('p', error.message));
        }
    };
    const importBackpack = () => consent(
        'Copy your existing device backpack into this workspace? Its extensions will be able to read the copied items.',
        async () => {
            const {snapshotDatabase} = await import('./storage.js');
            const snapshot = await snapshotDatabase(indexedDB, 'TW_Backpack');
            if (snapshot.stores.length && port) port.postMessage({kind: 'database-import', snapshot});
        }, 'Import');
    const handlers = {
        'request': args => {
            const pending = apiQueue.then(() => handleRequest(args));
            apiQueue = pending.catch(() => {});
            return pending;
        },
        'navigate': async ({path}) => {
            if (typeof path !== 'string') throw new Error('Invalid navigation.');
            const destination = new URL(path, location.href);
            if (destination.origin !== location.origin ||
                !isEditorDestination(destination.pathname) ||
                destination.searchParams.has('token')) throw new Error('Invalid editor destination.');
            await consent(`Leave this editor and open ${destination.pathname}? Save your work before continuing.`,
                () => {
                    location.assign(destination.href);
                }, 'Open');
        },
        'rotur.call': async ({method, args = []}) => {
            if (!Object.prototype.hasOwnProperty.call(ROTUR_METHODS, method) || !Array.isArray(args) ||
                JSON.stringify(args).length > 100000) throw new Error('This Rotur operation is not available.');
            if (!identity.getState().user) throw new Error('Sign in to use Rotur.');
            const accountAtRequest = identity.getState().user.id || identity.getState().user.username;
            const checkAccount = () => {
                if (accountAtRequest !== (identity.getState().user?.id || identity.getState().user?.username)) {
                    throw new Error('The signed-in account changed. Try the operation again.');
                }
            };
            // Bind storage and presence to this workspace, regardless of IDs supplied by project code.
            if (method.startsWith('storage.')) args[0] = `mistwarp:editor:${projectId || localScope}`;
            if (method === 'socket.addActivity') {
                args[0] = {...args[0], id: `mistwarp:editor:${projectId || localScope}`};
            }
            if (method === 'socket.removeActivity') args[0] = `mistwarp:editor:${projectId || localScope}`;
            const {callRotur} = await import('../rotur/extension-bridge.js');
            const {ensureScopes} = await import('../rotur/client.js');
            const repeatable = ['me.get', 'me.checkAuth', 'me.abilities', 'me.badges', 'me.subscription',
                'me.claimTime', 'storage.get', 'storage.set', 'storage.delete', 'socket.addActivity',
                'socket.removeActivity'].includes(method);
            const perform = async () => {
                checkAccount();
                await ensureScopes(ROTUR_METHODS[method]);
                checkAccount();
                return callRotur(method, args);
            };
            if (repeatable && roturReadGrants.has(method)) return perform();
            const result = await consent(`Allow this workspace to use Rotur ${method}` +
                `${repeatable ? ' for this session' : ''}?\n${JSON.stringify(args).slice(0, 1500)}`, perform);
            if (repeatable) roturReadGrants.add(method);
            return result;
        },
        'game.data': async ({id, action, save, item, requestId}) => {
            if (!projectId || String(id) !== projectId) throw new Error('Game data belongs to the open project only.');
            const games = await import('../mistwarp-games/data-client.js');
            if (action === 'load') return games.loadProjectSave(projectId, 'editor');
            if (action === 'save') return games.saveProjectData(projectId, 'editor', save);
            if (action === 'inventory') return games.loadProjectInventory(projectId, 'editor');
            if (action === 'grant') return games.grantProjectItem(projectId, 'editor', item, requestId);
            throw new Error('Unknown editor game-data operation.');
        },
        'backups.open': openDeviceBackups,
        'backpack.import': importBackpack,
        'identity.restore': () => publicIdentity(identity.getState()),
        'identity.login': signIn,
        'identity.logout': () => consent('Sign out of MistWarp?', () => {
            identity.logout();
            saveApproved = false;
            return showIdentity();
        }, 'Sign out'),
        'storage.local': async ({local}) => {
            if (!local || typeof local !== 'object' || Array.isArray(local) ||
                Object.values(local).some(value => typeof value !== 'string') ||
                JSON.stringify(local).length > 5 * 1024 * 1024) throw new Error('Editor storage is full.');
            workspace.local = local;
            await persist();
        },
        'storage.database': async ({snapshot}) => {
            if (!snapshot || typeof snapshot.name !== 'string' || snapshot.name.length > 200 ||
                !Array.isArray(snapshot.stores) || snapshot.stores.length > 64) {
                throw new Error('Invalid editor database.');
            }
            const index = workspace.databases.findIndex(db => db.name === snapshot.name);
            if (index < 0) {
                if (workspace.databases.length >= 32) throw new Error('Too many editor databases.');
                workspace.databases.push(snapshot);
            } else workspace.databases[index] = snapshot;
            await persist();
        },
        'storage.deleteDatabase': async ({name}) => {
            workspace.databases = workspace.databases.filter(db => db.name !== name);
            await persist();
        },
        'storage.error': ({message}) => {
            reportError(`Local backup failed: ${String(message).slice(0, 200)}`);
        }
    };
    window.addEventListener('message', event => {
        if (event.source !== frame.contentWindow || event.origin !== 'null' ||
            event.data?.type !== CHANNEL || event.data?.kind !== 'ready') return;
        if (port) port.close();
        const channel = new MessageChannel();
        port = channel.port1;
        const responsePort = port;
        port.onmessage = async ({data}) => {
            if (!data || !Number.isSafeInteger(data.id) || typeof data.method !== 'string') return;
            const handler = Object.prototype.hasOwnProperty.call(handlers, data.method) ? handlers[data.method] : null;
            if (!handler || runningRequests >= 32) {
                responsePort.postMessage({id: data.id, error: {message: 'Editor request not permitted.'}});
                return;
            }
            runningRequests++;
            try {
                const result = await handler(data.args || {});
                responsePort.postMessage({id: data.id, result});
            } catch (error) {
                responsePort.postMessage({id: data.id,
                    error: {
                        message: String(error.message || error), code: error.code, status: error.status
                    }});
            } finally {
                runningRequests--;
            }
        };
        port.start();
        frame.contentWindow.postMessage({type: CHANNEL,
            kind: 'connect',
            seed: {...seed,
                ...workspace,
                local: {...initialPreferences(), ...workspace.local}},
            identity: publicIdentity(identity.getState())}, '*', [channel.port2]);
    });
    window.addEventListener('beforeunload', event => {
        if (runningRequests) {
            event.preventDefault(); event.returnValue = '';
        }
    });
    root.append(frame);
    if (window.SplashEnd) window.SplashEnd();
};
