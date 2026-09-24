/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import WindowManager from '../../addons/window-system/window-manager';
import {getChatConnection} from '../../lib/originchats/connection.js';
import {
    MAX_WIDTH,
    MIN_WIDTH,
    closeChat,
    getChatUi,
    setChatMode,
    setChatWidth,
    setFloatingBounds,
    subscribeChatUi
} from '../../lib/originchats/chat-ui.js';
import {openRoturLoginModal} from '../../reducers/modals.js';
import ChatPane, {VARIANTS} from './chat-pane.jsx';
import styles from './chat-pane.css';

const WINDOW_ID = 'mw-chat-window';
const readVariant = () => {
    const requested = new URLSearchParams(window.location.search).get('chat-variant');
    if (VARIANTS.includes(requested)) localStorage.setItem('mw:chat-variant', requested);
    const value = localStorage.getItem('mw:chat-variant');
    return VARIANTS.includes(value) ? value : VARIANTS[0];
};
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

    useEffect(() => {
        notifyLayout();
        return notifyLayout;
    }, []);

    useEffect(() => {
        if (dragWidth === null) notifyLayout();
    }, [width, dragWidth]);

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

    const current = dragWidth === null ? width : dragWidth;
    return (
        <aside
            className={styles.dock}
            style={{width: current}}
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

const ChatDock = ({intl, onOpenLogin, username}) => {
    const ui = useStore(subscribeChatUi, getChatUi);
    const state = useStore(subscribeConnection, readConnection);
    const viewport = useViewportWidth();

    useEffect(() => {
        connection.setViewing(ui.open);
    }, [ui.open]);

    useEffect(() => {
        if (!username) {
            if (connection.getState().status !== 'idle') connection.disconnect();
            return;
        }
        if (ui.open && state.status === 'idle') connection.connect();
    }, [ui.open, username, state.status]);

    useEffect(() => {
        const me = state.me && state.me.username;
        if (me && username && me.toLowerCase() !== username.toLowerCase()) connection.reconnect();
    }, [state.me, username]);

    const leave = useCallback(() => {
        connection.disconnect();
        closeChat();
    }, []);

    if (!ui.open || !username) return null;

    const floating = ui.mode === 'floating' || viewport < DOCK_MIN_VIEWPORT;
    const pane = (
        <ChatPane
            connection={connection}
            state={state}
            variant={readVariant()}
            floating={floating}
            canDock={viewport >= DOCK_MIN_VIEWPORT}
            onClose={closeChat}
            onLeave={leave}
            onSignIn={onOpenLogin}
            onToggleMode={() => setChatMode(floating ? 'docked' : 'floating')}
        />
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
    onOpenLogin: PropTypes.func.isRequired,
    username: PropTypes.string
};

export default injectIntl(connect(
    state => ({
        username: state.scratchGui.rotur.username
    }),
    dispatch => ({
        onOpenLogin: () => dispatch(openRoturLoginModal())
    })
)(ChatDock));
