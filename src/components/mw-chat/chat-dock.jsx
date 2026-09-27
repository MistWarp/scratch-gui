/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import WindowManager from '../../addons/window-system/window-manager';
import {CHAT_URL, fetchServerInfo, getChatConnection, getDirectConnection} from '../../lib/originchats/connection.js';
import {cleanHost} from '../../lib/originchats/embeds.js';
import {captureScript, renderScriptSvg} from '../../lib/originchats/script-image.js';
import {chatDragActive, startLiveDrag} from '../../lib/originchats/script-drag.js';
import {placeInViewport} from '../../lib/backpack/code-payload.js';
import {
    MAX_WIDTH,
    MIN_WIDTH,
    closeChat,
    getChatUi,
    offerFiles,
    setChatMode,
    setChatSpace,
    setChatWidth,
    setFloatingBounds,
    subscribeChatUi
} from '../../lib/originchats/chat-ui.js';
import {openRoturLoginModal} from '../../reducers/modals.js';
import {ChatActions} from './chat-actions.js';
import ChatPane from './chat-pane.jsx';
import styles from './chat-pane.css';

const WINDOW_ID = 'mw-chat-window';
const DOCK_MIN_VIEWPORT = 1000;

const messages = defineMessages({
    windowTitle: {
        defaultMessage: 'Chat',
        description: 'Title of the floating chat window in the editor',
        id: 'mw.chat.windowTitle'
    },
    resize: {
        defaultMessage: 'Resize chat',
        description: 'Accessible label for the handle that resizes the docked chat pane',
        id: 'mw.chat.resize'
    }
});

const useStore = (subscribe, read) => {
    const [value, setValue] = useState(read);
    useEffect(() => {
        setValue(read());
        return subscribe(setValue);
    }, [subscribe, read]);
    return value;
};

const connection = getChatConnection();
const subscribeConnection = listener => connection.subscribe(listener);
const readConnection = () => connection.getState();
const direct = getDirectConnection();
const subscribeDirect = listener => direct.subscribe(listener);
const readDirect = () => direct.getState();

const useViewportWidth = () => {
    const [width, setWidth] = useState(() => window.innerWidth);
    useEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    return width;
};

const notifyLayout = () => requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

const FloatingChat = ({children, title}) => {
    const [container, setContainer] = useState(null);
    useEffect(() => {
        const bounds = getChatUi().floating || {};
        const width = bounds.width || 380;
        const height = bounds.height || 560;
        const win = WindowManager.createWindow({
            id: WINDOW_ID,
            title,
            width,
            height,
            minWidth: MIN_WIDTH,
            minHeight: 320,
            x: Number.isFinite(bounds.x) ? bounds.x : Math.max(16, window.innerWidth - width - 24),
            y: Number.isFinite(bounds.y) ? bounds.y : 72,
            modal: false,
            resizable: true,
            minimizable: false,
            maximizable: false,
            onClose: closeChat,
            onMove: (x, y) => setFloatingBounds({x, y}),
            onResize: (w, h) => setFloatingBounds({width: w, height: h})
        });
        const element = document.createElement('div');
        element.className = styles.windowContent;
        win.setContent(element);
        if (typeof win.fitToViewport === 'function') win.fitToViewport();
        win.show();
        setContainer(element);
        return () => {
            setContainer(null);
            win.destroy(false);
        };
    }, [title]);
    return container ? ReactDOM.createPortal(children, container) : null;
};

FloatingChat.propTypes = {
    children: PropTypes.node,
    title: PropTypes.string.isRequired
};

const DockedChat = ({children, intl, width}) => {
    const [dragWidth, setDragWidth] = useState(null);
    const dragRef = useRef(null);
    const layoutFrame = useRef(null);
    const current = dragWidth === null ? width : dragWidth;

    useEffect(() => {
        notifyLayout();
        return () => {
            cancelAnimationFrame(layoutFrame.current);
            notifyLayout();
        };
    }, []);

    useEffect(() => {
        if (layoutFrame.current) return;
        layoutFrame.current = requestAnimationFrame(() => {
            layoutFrame.current = null;
            window.dispatchEvent(new Event('resize'));
        });
    }, [current]);

    const onPointerDown = event => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {startX: event.clientX, startWidth: width};
        setDragWidth(width);
    };
    const onPointerMove = event => {
        if (!dragRef.current) return;
        const rtl = document.documentElement.dir === 'rtl';
        const delta = (dragRef.current.startX - event.clientX) * (rtl ? -1 : 1);
        setDragWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startWidth + delta)));
    };
    const onPointerUp = () => {
        if (!dragRef.current) return;
        dragRef.current = null;
        setChatWidth(dragWidth);
        setDragWidth(null);
    };
    const onKeyDown = event => {
        const step = event.shiftKey ? 40 : 16;
        if (event.key === 'ArrowLeft') setChatWidth(width + step);
        else if (event.key === 'ArrowRight') setChatWidth(width - step);
        else return;
        event.preventDefault();
    };

    return (
        <aside
            className={styles.dock}
            style={{width: current}}
            data-chat-dock
        >
            <div
                className={styles.resizer}
                role="separator"
                aria-orientation="vertical"
                aria-label={intl.formatMessage(messages.resize)}
                aria-valuemin={MIN_WIDTH}
                aria-valuemax={MAX_WIDTH}
                aria-valuenow={current}
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
                onDoubleClick={() => setChatWidth(340)}
            />
            {children}
        </aside>
    );
};

DockedChat.propTypes = {
    children: PropTypes.node,
    intl: intlShape.isRequired,
    width: PropTypes.number.isRequired
};

const DMS_USED_KEY = 'mw:chat-dms';
const HOME_SERVER = cleanHost(CHAT_URL);

const readDmsUsed = () => {
    try {
        return localStorage.getItem(DMS_USED_KEY) === '1';
    } catch (e) {
        return false;
    }
};

const rememberDms = () => {
    try {
        localStorage.setItem(DMS_USED_KEY, '1');
    } catch (e) {
        return null;
    }
};

const readInviteParam = () => {
    try {
        const code = new URLSearchParams(window.location.search).get('chat-invite');
        return code && /^[A-Za-z0-9_-]{4,64}$/.test(code) ? code : null;
    } catch (e) {
        return null;
    }
};

const pointInside = (element, point) => {
    if (!element || !point) return false;
    const rect = element.getBoundingClientRect();
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
};

const ChatDock = ({intl, isRtl, onOpenLogin, username, vm, workspaceMetrics}) => {
    const ui = useStore(subscribeChatUi, getChatUi);
    const serverState = useStore(subscribeConnection, readConnection);
    const directState = useStore(subscribeDirect, readDirect);
    const viewport = useViewportWidth();
    const [info, setInfo] = useState(null);
    const [inviteCode, setInviteCode] = useState(readInviteParam);
    const [dmsUsed, setDmsUsed] = useState(readDmsUsed);
    const paneRef = useRef(null);
    const pendingDirect = useRef(null);
    const metricsRef = useRef(workspaceMetrics);
    metricsRef.current = workspaceMetrics;
    const space = ui.space;

    useEffect(() => {
        connection.setViewing(ui.open && space === 'server');
        direct.setViewing(ui.open && space === 'dms');
    }, [ui.open, space]);

    useEffect(() => {
        if (space === 'dms' && !dmsUsed) {
            rememberDms();
            setDmsUsed(true);
        }
    }, [space, dmsUsed]);

    useEffect(() => {
        if (!ui.open || !username || info) return;
        let alive = true;
        fetchServerInfo(CHAT_URL)
            .then(data => alive && setInfo(data))
            .catch(() => null);
        return () => {
            alive = false;
        };
    }, [ui.open, username, info]);

    useEffect(() => {
        if (!username) {
            if (connection.getState().status !== 'idle' || connection.getState().membership !== 'unknown') {
                connection.disconnect({keepMembership: false});
            }
            if (direct.getState().status !== 'idle') direct.disconnect({keepMembership: false});
            return;
        }
        if (!ui.open || serverState.status !== 'idle') return;
        if (serverState.membership === 'unknown') connection.checkMembership(username);
        else if (serverState.membership === 'member') connection.connect();
    }, [ui.open, username, serverState.status, serverState.membership]);

    useEffect(() => {
        if (!username || !ui.open || directState.status !== 'idle') return;
        if (space === 'dms' || dmsUsed) direct.connect();
    }, [ui.open, username, directState.status, space, dmsUsed]);

    useEffect(() => {
        [connection, direct].forEach(item => {
            const me = item.getState().me;
            if (me && username && me.username.toLowerCase() !== username.toLowerCase()) {
                item.disconnect({keepMembership: false});
            }
        });
    }, [serverState.me, directState.me, username]);

    useEffect(() => {
        if (directState.status !== 'ready' || !pendingDirect.current) return;
        direct.openDirect(pendingDirect.current);
        pendingDirect.current = null;
    }, [directState.status]);

    const chattingIn = useCallback(() => {
        const current = getChatUi();
        const state = current.space === 'dms' ? direct.getState() : connection.getState();
        return current.open && state.status === 'ready' && Boolean(state.active);
    }, []);

    useEffect(() => {
        if (!vm) return;
        let point = null;
        const onMove = event => {
            point = {x: event.clientX, y: event.clientY};
        };
        const onEnd = (blocks, topBlockId) => {
            const dropped = !chatDragActive() && chattingIn() && pointInside(paneRef.current, point);
            if (!dropped) return;
            const captured = captureScript(topBlockId);
            if (!captured) return;
            let payload;
            try {
                payload = vm.exportStandaloneBlocks(blocks);
            } catch (e) {
                return;
            }
            renderScriptSvg(captured, payload)
                .then(svg => {
                    const file = new File([svg], 'script.svg', {type: 'image/svg+xml'});
                    file.mwScript = true;
                    offerFiles([file]);
                })
                .catch(() => null);
        };
        vm.on('BLOCK_DRAG_END', onEnd);
        document.addEventListener('pointermove', onMove, true);
        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('touchmove', onMove, true);
        return () => {
            vm.removeListener('BLOCK_DRAG_END', onEnd);
            document.removeEventListener('pointermove', onMove, true);
            document.removeEventListener('mousemove', onMove, true);
            document.removeEventListener('touchmove', onMove, true);
        };
    }, [vm, chattingIn]);

    const leave = useCallback(() => {
        connection.disconnect();
        closeChat();
    }, []);

    const joinServer = useCallback(access => {
        setInviteCode(null);
        connection.join(access || {});
    }, []);

    const retryServer = useCallback(() => {
        if (connection.getState().membership === 'unknown') {
            connection.patch({status: 'idle', error: null});
        } else {
            connection.reconnect();
        }
    }, []);

    const openDirect = useCallback(name => {
        setChatSpace('dms');
        if (direct.getState().status === 'ready') direct.openDirect(name);
        else pendingDirect.current = name;
    }, []);

    const addScript = useCallback(async payload => {
        const target = vm && vm.editingTarget;
        if (!target) return false;
        try {
            const copy = JSON.parse(JSON.stringify(payload));
            const metrics = metricsRef.current && metricsRef.current.targets[target.id];
            placeInViewport(copy, metrics, isRtl);
            await vm.shareBlocksToTarget(copy, target.id);
            if (vm.editingTarget && vm.editingTarget.id === target.id) vm.refreshWorkspace();
            return true;
        } catch (e) {
            return false;
        }
    }, [vm, isRtl]);

    const actions = useMemo(() => ({
        addScript,
        canAddScript: Boolean(vm),
        homeServer: HOME_SERVER,
        homeMembership: serverState.membership,
        joinHomeServer: code => {
            setChatSpace('server');
            const current = connection.getState();
            if (current.membership === 'member' && current.status !== 'idle') return;
            joinServer(code ? {invite: code} : {});
        },
        openDirect,
        startScriptDrag: (payload, event, image) => startLiveDrag(vm, payload, event, image)
    }), [addScript, vm, serverState.membership, joinServer, openDirect]);

    if (!ui.open || !username) return null;

    const floating = ui.mode === 'floating' || viewport < DOCK_MIN_VIEWPORT;
    const pane = (
        <ChatActions.Provider value={actions}>
            <ChatPane
                canDock={viewport >= DOCK_MIN_VIEWPORT}
                direct={{connection: direct, state: directState}}
                floating={floating}
                info={info}
                inviteCode={inviteCode}
                paneRef={paneRef}
                server={{connection, state: serverState}}
                space={space}
                username={username}
                onClose={closeChat}
                onDirect={openDirect}
                onJoinServer={joinServer}
                onLeave={leave}
                onRetryServer={retryServer}
                onSignIn={onOpenLogin}
                onSpace={setChatSpace}
                onToggleMode={() => setChatMode(floating ? 'docked' : 'floating')}
            />
        </ChatActions.Provider>
    );

    if (floating) {
        return <FloatingChat title={intl.formatMessage(messages.windowTitle)}>{pane}</FloatingChat>;
    }
    return (
        <DockedChat
            intl={intl}
            width={ui.width}
        >{pane}</DockedChat>
    );
};

ChatDock.propTypes = {
    intl: intlShape.isRequired,
    isRtl: PropTypes.bool,
    onOpenLogin: PropTypes.func.isRequired,
    username: PropTypes.string,
    vm: PropTypes.object,
    workspaceMetrics: PropTypes.object
};

export default injectIntl(connect(
    state => ({
        isRtl: state.locales.isRtl,
        username: state.scratchGui.rotur.username,
        vm: state.scratchGui.vm,
        workspaceMetrics: state.scratchGui.workspaceMetrics
    }),
    dispatch => ({
        onOpenLogin: () => dispatch(openRoturLoginModal())
    })
)(ChatDock));
