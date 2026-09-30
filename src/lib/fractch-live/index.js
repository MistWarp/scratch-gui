import {isStudentSession} from '../rotur/student-flag.js';
import {getFractchClient} from '../code-mode/fractch-client.js';
import {getTextController} from '../code-mode/text-controller.js';
import {ask, confirmBackupFailure, confirmImpact} from '../code-mode/code-dialogs.js';
import {revealInCode} from '../../reducers/editor-tab.js';
import {setLiveProblems} from '../../reducers/extension-dev.js';
import {createLiveSync, messages, parseProjectBuffer} from './live-sync.js';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

const loopbackUrl = (value, protocols) => {
    try {
        const url = new URL(value, window.location.href);
        return protocols.includes(url.protocol) && LOOPBACK.has(url.hostname) ? url.toString() : null;
    } catch (e) {
        return null;
    }
};

const socketUrlFor = (projectUrl, liveParam) => {
    if (liveParam !== '1' && liveParam !== 'true') return loopbackUrl(liveParam, ['ws:', 'wss:']);
    const url = loopbackUrl(projectUrl, ['http:', 'https:']);
    if (!url) return null;
    const derived = new URL(url);
    derived.protocol = derived.protocol === 'https:' ? 'wss:' : 'ws:';
    derived.pathname = '/live';
    derived.search = '';
    derived.hash = '';
    return derived.toString();
};

class NotLoopbackError extends Error {
    constructor (url) {
        super(url);
        this.url = url;
    }
}

const fetchChecked = async (value, read) => {
    const url = loopbackUrl(value, ['http:', 'https:']);
    if (!url) throw new NotLoopbackError(value);
    const response = await fetch(url, {cache: 'no-store'});
    if (!response.ok) throw new Error(`fetch ${response.status} ${response.statusText}`);
    return read(response);
};

const fetchSb3 = url => fetchChecked(url, response => response.arrayBuffer());

const waitForProject = vm => new Promise(resolve => {
    const ready = () => vm.runtime.targets.length > 0;
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

const startFractchLiveReload = (vm, {dispatch, intl}) => {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined' || isStudentSession()) return null;
    let query;
    try {
        query = new URLSearchParams(window.location.search);
    } catch (e) {
        return null;
    }
    const projectUrl = query.get('project_url');
    const liveParam = query.get('fractch_live');
    if (!projectUrl || !liveParam) return null;
    const socketUrl = socketUrlFor(projectUrl, liveParam);
    if (!socketUrl) {
        dispatch(setLiveProblems({project: [intl.formatMessage(messages.notLoopback, {url: liveParam})]}));
        return null;
    }

    const live = createLiveSync({
        vm,
        client: getFractchClient(),
        controller: getTextController(vm),
        intl,
        dispatchProblems: problems => dispatch(setLiveProblems(problems)),
        ask: config => ask(dispatch, config),
        reveal: targetId => dispatch(revealInCode({kind: 'target', targetId})),
        confirmImpact: impact => confirmImpact(dispatch, intl, impact),
        confirmBackupFailure: error => confirmBackupFailure(dispatch, intl, error)
    });

    let disposed = false;
    let running = Promise.resolve();
    const report = error => dispatch(setLiveProblems({project: [error instanceof NotLoopbackError ?
        intl.formatMessage(messages.notLoopback, {url: error.url}) :
        (error && error.message) || String(error)]}));

    const enqueue = task => {
        running = running.then(() => (disposed ? null : task())).catch(report);
    };

    enqueue(async () => {
        await waitForProject(vm);
        await live.prime(await parseProjectBuffer(await fetchSb3(projectUrl)));
    });

    const socket = new WebSocket(socketUrl);
    socket.addEventListener('message', event => {
        let data = {};
        try {
            data = JSON.parse(event.data || '{}');
        } catch (e) {
            return;
        }
        if (data.type !== 'packed') return;
        enqueue(async () => {
            const project = data.manifestUrl ?
                await fetchChecked(data.manifestUrl, response => response.json()) :
                await parseProjectBuffer(await fetchSb3(data.projectUrl || projectUrl));
            await live.sync(project, {
                loadProject: async () => vm.loadProject(await fetchSb3(data.projectUrl || projectUrl),
                    {skipGitImport: true})
            });
        });
    });

    return () => {
        disposed = true;
        socket.close();
    };
};

export default startFractchLiveReload;
export {socketUrlFor};
