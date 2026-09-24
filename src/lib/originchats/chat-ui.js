const LAYOUT_KEY = 'mw:chat-layout';
const OPEN_KEY = 'mw:chat-open';
const MIN_WIDTH = 280;
const MAX_WIDTH = 560;
const DEFAULT_WIDTH = 340;

const clampWidth = width => Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(width) || DEFAULT_WIDTH)));

const readLayout = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}');
        return {
            mode: stored.mode === 'floating' ? 'floating' : 'docked',
            width: clampWidth(stored.width),
            floating: stored.floating && typeof stored.floating === 'object' ? stored.floating : null
        };
    } catch (e) {
        return {mode: 'docked', width: DEFAULT_WIDTH, floating: null};
    }
};

const requestedByUrl = () => {
    try {
        const params = new URLSearchParams(window.location.search);
        return params.has('chat') || window.location.hash === '#chat';
    } catch (e) {
        return false;
    }
};

const readOpen = () => {
    if (requestedByUrl()) return true;
    try {
        return sessionStorage.getItem(OPEN_KEY) === '1';
    } catch (e) {
        return false;
    }
};

let state = {...readLayout(), open: readOpen()};
const listeners = new Set();

const persist = () => {
    try {
        const layout = {mode: state.mode, width: state.width, floating: state.floating};
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
        sessionStorage.setItem(OPEN_KEY, state.open ? '1' : '0');
    } catch (e) {
        return null;
    }
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

const openChat = () => update({open: true});
const closeChat = () => update({open: false});
const toggleChat = () => update({open: !state.open});
const setChatMode = mode => update({mode: mode === 'floating' ? 'floating' : 'docked'});
const setChatWidth = width => update({width: clampWidth(width)});
const setFloatingBounds = bounds => update({floating: {...state.floating, ...bounds}});

export {
    MAX_WIDTH,
    MIN_WIDTH,
    clampWidth,
    closeChat,
    getChatUi,
    openChat,
    setChatMode,
    setChatWidth,
    setFloatingBounds,
    subscribeChatUi,
    toggleChat
};
