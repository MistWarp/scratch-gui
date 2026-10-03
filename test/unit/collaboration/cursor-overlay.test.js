import {EventEmitter} from 'events';
import CursorOverlay from '../../../src/lib/collaboration/cursor-overlay.js';

const makePresence = () => {
    const presence = new EventEmitter();
    presence.off = presence.removeListener;
    presence.sendCursor = jest.fn();
    presence.sendCursorLeave = jest.fn();
    presence.sendCursorChat = jest.fn();
    return presence;
};

const makeWorkspace = () => {
    const container = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);
    document.body.appendChild(container);
    const listeners = new Set();
    return {
        container,
        scale: 1,
        metrics: {viewLeft: 0, viewTop: 0},
        getParentSvg: () => svg,
        getMetrics () {
            return this.metrics;
        },
        addChangeListener: fn => listeners.add(fn),
        removeChangeListener: fn => listeners.delete(fn),
        fireChange: () => listeners.forEach(fn => fn({})),
        listenerCount: () => listeners.size
    };
};

const makeVM = editingTarget => {
    const vm = new EventEmitter();
    vm.editingTarget = editingTarget;
    return vm;
};

const sprite = (id, name) => ({id, getName: () => name, isStage: false});

const remoteCursor = overlay => overlay.layer.querySelector('.collaboration-remote-cursor');

const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

describe('CursorOverlay', () => {
    let presence;
    let workspace;
    let vm;
    let overlay;

    beforeEach(() => {
        presence = makePresence();
        workspace = makeWorkspace();
        vm = makeVM(sprite('s1', 'Sprite1'));
        overlay = new CursorOverlay({vm, presence, getUsername: id => ({a: 'Alice'}[id] || '')});
        overlay.attach(workspace);
    });

    afterEach(() => {
        overlay.destroy();
        workspace.container.remove();
    });

    test('a chat that arrives before any cursor position stays hidden', () => {
        presence.emit('cursor-chat', 'a', 'hello');
        expect(remoteCursor(overlay).style.display).toBe('none');

        presence.emit('cursor-move', 'a', {x: 10, y: 20, targetId: 's1'});
        const cursor = remoteCursor(overlay);
        expect(cursor.style.display).toBe('block');
        expect(cursor.style.left).toBe('10px');
        expect(cursor.textContent).toContain('Alice');
        expect(cursor.textContent).toContain('hello');
    });

    test('departed users lose their cursor element', () => {
        presence.emit('cursor-move', 'a', {x: 1, y: 1, targetId: 's1'});
        expect(remoteCursor(overlay)).not.toBeNull();
        presence.emit('user-gone', 'a');
        expect(remoteCursor(overlay)).toBeNull();
    });

    test('our cursor is not re-broadcast after the pointer leaves the workspace', () => {
        workspace.container.dispatchEvent(new MouseEvent('mousemove', {clientX: 5, clientY: 5}));
        expect(presence.sendCursor).toHaveBeenCalledTimes(1);

        workspace.container.dispatchEvent(new MouseEvent('mouseleave'));
        expect(presence.sendCursorLeave).toHaveBeenCalledTimes(1);

        // e.g. a remote edit being applied fires a workspace change
        workspace.fireChange();
        expect(presence.sendCursor).toHaveBeenCalledTimes(1);
    });

    test('"/" opens cursor chat only while the pointer is over the workspace', () => {
        const slash = () => {
            const event = new KeyboardEvent('keydown', {key: '/', cancelable: true});
            window.dispatchEvent(event);
            return event.defaultPrevented;
        };
        expect(slash()).toBe(false);
        expect(overlay.isChatting).toBe(false);

        workspace.container.dispatchEvent(new MouseEvent('mousemove', {clientX: 5, clientY: 5}));
        expect(slash()).toBe(true);
        expect(overlay.isChatting).toBe(true);
        expect(overlay.chatInput.style.display).toBe('block');
        expect(overlay.chatInput.getAttribute('aria-label')).toBeTruthy();
    });

    test('switching sprites re-checks which remote cursors belong here', async () => {
        presence.emit('cursor-move', 'a', {x: 1, y: 1, targetId: 's1', targetName: 'Sprite1'});
        expect(remoteCursor(overlay).style.display).toBe('block');

        vm.editingTarget = sprite('s2', 'Sprite2');
        vm.emit('workspaceUpdate', {});
        await nextFrame();
        expect(remoteCursor(overlay).style.display).toBe('none');
    });

    test('detaching removes the layer, listeners and an open chat bubble', () => {
        workspace.container.dispatchEvent(new MouseEvent('mousemove', {clientX: 5, clientY: 5}));
        window.dispatchEvent(new KeyboardEvent('keydown', {key: '/', cancelable: true}));
        expect(overlay.isChatting).toBe(true);

        overlay.detach();
        expect(workspace.container.querySelector('.collaboration-cursor-layer')).toBeNull();
        expect(workspace.listenerCount()).toBe(0);
        expect(vm.listenerCount('workspaceUpdate')).toBe(0);
        expect(presence.sendCursorChat).toHaveBeenLastCalledWith(null);

        // Stale DOM events no longer reach the presence channel.
        presence.sendCursor.mockClear();
        workspace.container.dispatchEvent(new MouseEvent('mousemove', {clientX: 5, clientY: 5}));
        expect(presence.sendCursor).not.toHaveBeenCalled();
    });
});
