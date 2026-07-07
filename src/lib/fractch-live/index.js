import {
    hotPatchProject,
    parseProjectBuffer,
    softReload
} from './hot-patcher';

const STATUS_ID = 'mw-fractch-live-status';

const getQuery = () => {
    try {
        return new URLSearchParams(window.location.search);
    } catch (e) {
        return new URLSearchParams();
    }
};

const deriveSocketUrl = (projectUrl, liveParam) => {
    if (!projectUrl) return null;
    if (liveParam && liveParam !== '1' && liveParam !== 'true') return liveParam;
    try {
        const url = new URL(projectUrl, window.location.href);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.pathname = '/live';
        url.search = '';
        url.hash = '';
        return url.toString();
    } catch (e) {
        return null;
    }
};

const getStatusElement = () => {
    let el = document.getElementById(STATUS_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = STATUS_ID;
    el.style.position = 'fixed';
    el.style.right = '12px';
    el.style.bottom = '12px';
    el.style.zIndex = '99999';
    el.style.maxWidth = '360px';
    el.style.padding = '8px 10px';
    el.style.borderRadius = '6px';
    el.style.background = 'rgba(20, 24, 30, 0.88)';
    el.style.color = '#fff';
    el.style.font = '12px/1.35 sans-serif';
    el.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.25)';
    el.style.pointerEvents = 'none';
    el.style.opacity = '0';
    el.style.transition = 'opacity 120ms ease';
    document.body.appendChild(el);
    return el;
};

let statusTimer = null;
const showStatus = (message, isError = false) => {
    const el = getStatusElement();
    el.textContent = message;
    el.style.background = isError ? 'rgba(152, 38, 38, 0.92)' : 'rgba(20, 24, 30, 0.88)';
    el.style.opacity = '1';
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
        el.style.opacity = '0';
    }, isError ? 6000 : 2600);
};

const fetchProjectSb3 = async url => {
    const response = await fetch(url, {cache: 'no-store'});
    if (!response.ok) {
        throw new Error(`fetch ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const project = await parseProjectBuffer(buffer);
    return {buffer, project};
};

const fetchProjectJson = async url => {
    const response = await fetch(url, {cache: 'no-store'});
    if (!response.ok) {
        throw new Error(`fetch ${response.status} ${response.statusText}`);
    }
    return response.json();
};

const waitForProject = vm => new Promise(resolve => {
    const ready = () => vm && vm.runtime && Array.isArray(vm.runtime.targets) && vm.runtime.targets.length > 0;
    if (ready()) {
        resolve();
        return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
        if (ready() || Date.now() - started > 10000) {
            clearInterval(timer);
            resolve();
        }
    }, 100);
});

const startFractchLiveReload = vm => {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return null;
    const query = getQuery();
    const projectUrl = query.get('project_url');
    const liveParam = query.get('fractch_live');
    if (!projectUrl || !liveParam) return null;

    const socketUrl = deriveSocketUrl(projectUrl, liveParam);
    if (!socketUrl) return null;

    let previousProject = null;
    let disposed = false;
    let applying = false;
    let queued = null;
    const socket = new WebSocket(socketUrl);

    const setBaseline = async url => {
        try {
            const result = await fetchProjectSb3(url);
            if (!disposed) previousProject = result.project;
        } catch (e) {
            console.warn('[fractch-live] failed to set baseline', e);
        }
    };

    waitForProject(vm).then(() => {
        if (!disposed) setBaseline(projectUrl);
    });

    const applyUpdate = async data => {
        if (applying) {
            queued = data;
            return;
        }
        applying = true;
        try {
            await waitForProject(vm);
            const manifestUrl = data.manifestUrl || null;
            const fallbackUrl = data.projectUrl || projectUrl;
            const project = manifestUrl ?
                await fetchProjectJson(manifestUrl) :
                (await fetchProjectSb3(fallbackUrl)).project;
            const loadFallback = async () => (await fetchProjectSb3(fallbackUrl)).buffer;
            let result;
            if (previousProject) {
                result = await hotPatchProject({
                    vm,
                    previousProject,
                    nextProject: project,
                    loadFallback
                });
            } else {
                const buffer = await loadFallback();
                await softReload(vm, buffer);
                result = {mode: 'reload', message: 'soft reload: baseline not ready'};
            }
            // eslint-disable-next-line require-atomic-updates
            previousProject = project;
            showStatus(`[fractch] ${result.message || result.mode}`);
            console.log('[fractch-live]', result.message || result.mode);
        } catch (e) {
            console.error('[fractch-live] reload failed', e);
            showStatus(`[fractch] reload failed: ${e && e.message ? e.message : e}`, true);
        } finally {
            // eslint-disable-next-line require-atomic-updates
            applying = false;
            if (queued) {
                const next = queued;
                queued = null;
                applyUpdate(next);
            }
        }
    };

    socket.addEventListener('open', () => {
        showStatus('[fractch] live reload connected');
    });
    socket.addEventListener('message', event => {
        let data = {};
        try {
            data = JSON.parse(event.data || '{}');
        } catch (e) {
            data = {};
        }
        if (data.type === 'packed') applyUpdate(data);
    });
    socket.addEventListener('close', () => {
        if (!disposed) showStatus('[fractch] live reload disconnected', true);
    });
    socket.addEventListener('error', () => {
        if (!disposed) showStatus('[fractch] live reload disconnected', true);
    });

    return () => {
        disposed = true;
        socket.close();
    };
};

export default startFractchLiveReload;
