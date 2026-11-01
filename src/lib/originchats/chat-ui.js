import {isStudentSession} from '../rotur/student-flag.js';
import {local, session} from '../../modules/storage';

const LAYOUT_KEY = 'mw:chat-layout';
const OPEN_KEY = 'mw:chat-open';
const MIN_WIDTH = 280;
const MAX_WIDTH = 560;
const DEFAULT_WIDTH = 340;

const clampWidth = width => Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(width) || DEFAULT_WIDTH)));

const readLayout = () => {
    try {
        const stored = JSON.parse(local.readString(LAYOUT_KEY) || '{}');
        return {
            mode: stored.mode === 'floating' ? 'floating' : 'docked',
            space: stored.space === 'dms' ? 'dms' : 'server',
            width: clampWidth(stored.width),
            floating: stored.floating && typeof stored.floating === 'object' ? stored.floating : null
        };
    } catch (e) {
        return {mode: 'docked', space: 'server', width: DEFAULT_WIDTH, floating: null};
    }
};

const requestedByUrl = () => {
    if (isStudentSession()) return false;
    try {
        const params = new URLSearchParams(window.location.search);
        return params.has('chat') || window.location.hash === '#chat';
    } catch (e) {
        return false;
    }
};

const readOpen = () => {
    if (isStudentSession()) return false;
    if (requestedByUrl()) return true;
    return session.readString(OPEN_KEY) === '1';
};

let state = {...readLayout(), open: readOpen()};
const listeners = new Set();

const persist = () => {
    const layout = {mode: state.mode, space: state.space, width: state.width, floating: state.floating};
    if (local.writeJSON(LAYOUT_KEY, layout)) session.writeString(OPEN_KEY, state.open ? '1' : '0');
};

const update = patch => {
    state = {...state, ...patch};
    persist();
    listeners.forEach(listener => listener(state));
};

const getChatUi = () => state;

const subscribeChatUi = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const offerListeners = new Set();

const subscribeFileOffers = listener => {
    offerListeners.add(listener);
    return () => offerListeners.delete(listener);
};

const offerFiles = files => {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length || !offerListeners.size) return false;
    offerListeners.forEach(listener => listener(list));
    return true;
};

const openChat = () => {
    if (isStudentSession()) return;
    update({open: true});
};
const closeChat = () => update({open: false});
const toggleChat = () => {
    if (isStudentSession()) return;
    update({open: !state.open});
};
const setChatSpace = space => update({space: space === 'dms' ? 'dms' : 'server'});
const setChatMode = mode => update({mode: mode === 'floating' ? 'floating' : 'docked'});
const setChatWidth = width => update({width: clampWidth(width)});
const setFloatingBounds = bounds => update({floating: {...state.floating, ...bounds}});

export {
    MAX_WIDTH,
    MIN_WIDTH,
    clampWidth,
    closeChat,
    getChatUi,
    offerFiles,
    openChat,
    setChatMode,
    setChatSpace,
    setChatWidth,
    setFloatingBounds,
    subscribeChatUi,
    subscribeFileOffers,
    toggleChat
};
