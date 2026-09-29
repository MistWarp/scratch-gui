import {
    getCategoryOrder,
    hasCustomCategoryOrder,
    moveCategory,
    resetCategoryOrder,
    setCategoryOrder
} from './mw-category-order';

const DRAG_THRESHOLD = 5;
const TOUCH_HOLD_MS = 320;
const SUPPRESS_MS = 600;
const EDGE_SIZE = 48;
const MAX_SCROLL_STEP = 14;
const SETTLE_MS = 160;
const RESTORE_MS = 1000;

const MENU_SELECTOR = '.scratchCategoryMenu';
const ROW_SELECTOR = '.scratchCategoryMenuRow';
const ITEM_SELECTOR = '.scratchCategoryMenuItem';

const REORDERING_CLASS = 'mwCategoryReordering';
const DRAG_ROW_CLASS = 'mwCategoryDragRow';
const GHOST_CLASS = 'mwCategoryDragGhost';
const GHOST_SETTLING_CLASS = 'mwCategoryDragGhostSettling';
const PRESSED_CLASS = 'mwCategoryPressed';

const getCategoryId = item => {
    const match = /(?:^|\s)scratchCategoryId-(\S+)/.exec(item.className);
    return match ? match[1] : null;
};

const isScrollable = element => {
    const overflow = getComputedStyle(element).overflowY;
    return (overflow === 'auto' || overflow === 'scroll') && element.scrollHeight > element.clientHeight;
};

const findScroller = (menu, root) => {
    let element = menu;
    while (element && element !== root.parentNode) {
        if (isScrollable(element)) return element;
        element = element.parentNode;
    }
    return menu;
};

const showContextMenu = (ScratchBlocks, event, items, rtl) => {
    const {ContextMenu, WidgetDiv} = ScratchBlocks;
    WidgetDiv.show(ContextMenu, rtl, null);
    const menu = ContextMenu.populate_(items.map(item => ({
        ...item,
        callback: () => {
            ContextMenu.hide();
            item.callback();
        }
    })), rtl);
    ContextMenu.position_(menu, event, rtl);
    setTimeout(() => menu.getElement().focus(), 1);
};

const createGhost = (row, rect) => {
    const ghost = document.createElement('div');
    ghost.className = `scratchCategoryMenu ${GHOST_CLASS}`;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    const clone = row.cloneNode(true);
    clone.classList.remove(DRAG_ROW_CLASS);
    ghost.appendChild(clone);
    return ghost;
};

const installCategoryDrag = (workspace, options = {}) => {
    const toolbox = workspace.getToolbox();
    if (!toolbox || !toolbox.HtmlDiv) return () => {};
    const root = toolbox.HtmlDiv;
    const ghostParent = workspace.getInjectionDiv ? workspace.getInjectionDiv() : root.parentNode;

    let pending = null;
    let drag = null;
    let suppressUntil = 0;
    let restoreSelection = null;

    const menuObserver = new MutationObserver(() => {
        if (!restoreSelection) return;
        const {id, until} = restoreSelection;
        if (Date.now() > until) {
            restoreSelection = null;
            return;
        }
        if (!root.querySelector(`.scratchCategoryId-${id}`)) return;
        restoreSelection = null;
        if (toolbox.getSelectedCategoryId() !== id) toolbox.setSelectedCategoryById(id);
    });

    const canDrag = () => Boolean(
        !workspace.options.readOnly &&
        !toolbox.horizontalLayout_ &&
        toolbox.categoryMenu_ &&
        !toolbox.categoryMenu_.secondTable
    );

    const clearPending = () => {
        if (!pending) return;
        clearTimeout(pending.timer);
        pending.item.classList.remove(PRESSED_CLASS);
        pending = null;
    };

    const stopAutoScroll = () => {
        if (drag && drag.raf) {
            cancelAnimationFrame(drag.raf);
            drag.raf = null;
        }
    };

    const clearTransforms = menu => {
        menu.classList.remove(REORDERING_CLASS);
        menu.querySelectorAll(ROW_SELECTOR).forEach(row => {
            row.classList.remove(DRAG_ROW_CLASS);
            row.style.transform = '';
        });
    };

    const layoutRows = () => {
        const {entries, startIndex, targetIndex, height} = drag;
        entries.forEach((entry, index) => {
            if (index === startIndex) return;
            const k = index < startIndex ? index : index - 1;
            const newIndex = k < targetIndex ? k : k + 1;
            const shift = (newIndex - index) * height;
            entry.row.style.transform = shift ? `translateY(${shift}px)` : '';
        });
    };

    const updateDrag = clientY => {
        const {entries, startIndex, scroller, scrollTop, startClientY, height, ghost} = drag;
        drag.lastClientY = clientY;
        const pointerShift = clientY - startClientY;
        ghost.style.transform = `translateY(${pointerShift}px)`;
        const dragged = entries[startIndex];
        const centre = dragged.top + (height / 2) + pointerShift + (scroller.scrollTop - scrollTop);
        let targetIndex = 0;
        entries.forEach((entry, index) => {
            if (index !== startIndex && entry.top + (entry.height / 2) < centre) targetIndex += 1;
        });
        if (targetIndex !== drag.targetIndex) {
            drag.targetIndex = targetIndex;
            layoutRows();
        }
    };

    const autoScrollStep = () => {
        if (!drag) return;
        const {scroller, lastClientY} = drag;
        const rect = scroller.getBoundingClientRect();
        let step = 0;
        if (lastClientY < rect.top + EDGE_SIZE) {
            step = -Math.ceil(((rect.top + EDGE_SIZE) - lastClientY) / EDGE_SIZE * MAX_SCROLL_STEP);
        } else if (lastClientY > rect.bottom - EDGE_SIZE) {
            step = Math.ceil((lastClientY - (rect.bottom - EDGE_SIZE)) / EDGE_SIZE * MAX_SCROLL_STEP);
        }
        const maxScroll = scroller.scrollHeight - scroller.clientHeight;
        const next = Math.max(0, Math.min(maxScroll, scroller.scrollTop + step));
        if (step && next !== scroller.scrollTop) {
            scroller.scrollTop = next;
            updateDrag(lastClientY);
            drag.raf = requestAnimationFrame(autoScrollStep);
        } else {
            drag.raf = null;
        }
    };

    const requestAutoScroll = () => {
        if (drag && !drag.raf) drag.raf = requestAnimationFrame(autoScrollStep);
    };

    const startDrag = (event, item, row) => {
        const menu = row.closest(MENU_SELECTOR);
        if (!menu) return;
        const rows = Array.from(menu.querySelectorAll(ROW_SELECTOR)).filter(candidate => {
            const candidateItem = candidate.querySelector(ITEM_SELECTOR);
            return candidateItem && getCategoryId(candidateItem);
        });
        const startIndex = rows.indexOf(row);
        if (startIndex < 0) return;
        const scroller = findScroller(menu, root);
        const origin = scroller.getBoundingClientRect().top;
        const scrollTop = scroller.scrollTop;
        const entries = rows.map(candidate => {
            const rect = candidate.getBoundingClientRect();
            return {
                row: candidate,
                id: getCategoryId(candidate.querySelector(ITEM_SELECTOR)),
                top: (rect.top - origin) + scrollTop,
                height: rect.height
            };
        });
        const rowRect = row.getBoundingClientRect();
        drag = {
            pointerId: event.pointerId,
            menu,
            scroller,
            scrollTop,
            origin,
            entries,
            startIndex,
            targetIndex: startIndex,
            height: entries[startIndex].height,
            startClientY: event.clientY,
            lastClientY: event.clientY,
            ghost: createGhost(row, rowRect),
            ghostTop: rowRect.top,
            raf: null
        };
        try {
            root.setPointerCapture(event.pointerId);
        } catch (err) {
            drag = null;
            return;
        }
        menu.classList.add(REORDERING_CLASS);
        row.classList.add(DRAG_ROW_CLASS);
        ghostParent.appendChild(drag.ghost);
        document.body.style.cursor = 'grabbing';
        updateDrag(event.clientY);
    };

    const finishDrag = commit => {
        if (!drag) return;
        stopAutoScroll();
        const {menu, entries, startIndex, targetIndex, pointerId, ghost, ghostTop, scroller, origin} = drag;
        const moved = commit && targetIndex !== startIndex;
        drag = null;
        suppressUntil = Date.now() + SUPPRESS_MS;
        document.body.style.cursor = '';
        if (root.hasPointerCapture(pointerId)) root.releasePointerCapture(pointerId);
        const dragged = entries[startIndex];
        const others = entries.filter((entry, index) => index !== startIndex);
        let settleTop = dragged.top;
        if (moved && targetIndex > startIndex) {
            const previous = others[targetIndex - 1];
            settleTop = previous.top + previous.height - dragged.height;
        } else if (moved) {
            settleTop = others[targetIndex].top;
        }
        ghost.classList.add(GHOST_SETTLING_CLASS);
        ghost.style.transform = `translateY(${settleTop + origin - scroller.scrollTop - ghostTop}px)`;
        setTimeout(() => {
            ghost.remove();
            if (!moved && menu.isConnected) clearTransforms(menu);
        }, SETTLE_MS);
        if (!moved) return;
        setTimeout(() => {
            if (menu.isConnected) clearTransforms(menu);
        }, RESTORE_MS);
        const before = others[targetIndex] ? others[targetIndex].id : null;
        const selectedId = toolbox.getSelectedItem() ? toolbox.getSelectedCategoryId() : null;
        restoreSelection = selectedId ? {id: selectedId, until: Date.now() + RESTORE_MS} : null;
        setCategoryOrder(options.vm, moveCategory(
            getCategoryOrder(options.vm),
            entries.map(entry => entry.id),
            dragged.id,
            before
        ), Boolean(options.useProjectOrder && options.useProjectOrder()));
    };

    const onPointerDown = event => {
        if (drag || !event.isPrimary) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (!canDrag()) return;
        const item = event.target.closest(ITEM_SELECTOR);
        if (!item || !root.contains(item) || !getCategoryId(item)) return;
        const row = item.closest(ROW_SELECTOR);
        if (!row) return;
        clearPending();
        pending = {
            pointerId: event.pointerId,
            item,
            row,
            startX: event.clientX,
            startY: event.clientY,
            touch: event.pointerType === 'touch',
            timer: null
        };
        if (pending.touch) {
            pending.timer = setTimeout(() => {
                if (!pending) return;
                const {item: pressedItem, row: pressedRow, startX, startY} = pending;
                clearPending();
                startDrag({pointerId: event.pointerId, clientX: startX, clientY: startY}, pressedItem, pressedRow);
            }, TOUCH_HOLD_MS);
            item.classList.add(PRESSED_CLASS);
        }
    };

    const onPointerMove = event => {
        if (drag) {
            if (event.pointerId !== drag.pointerId) return;
            updateDrag(event.clientY);
            requestAutoScroll();
            return;
        }
        if (!pending || event.pointerId !== pending.pointerId) return;
        const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
        if (distance < DRAG_THRESHOLD) return;
        if (pending.touch) {
            clearPending();
            return;
        }
        const {item, row} = pending;
        clearPending();
        startDrag(event, item, row);
    };

    const onPointerUp = event => {
        if (drag && event.pointerId === drag.pointerId) {
            finishDrag(true);
            return;
        }
        if (pending && event.pointerId === pending.pointerId) clearPending();
    };

    const onPointerCancel = event => {
        if (drag && event.pointerId === drag.pointerId) {
            finishDrag(false);
            return;
        }
        if (pending && event.pointerId === pending.pointerId) clearPending();
    };

    const onLostCapture = event => {
        if (drag && event.pointerId === drag.pointerId) finishDrag(false);
    };

    const onSuppressedSelect = event => {
        if (Date.now() > suppressUntil) return;
        event.stopPropagation();
        event.preventDefault();
    };

    const onTouchMove = event => {
        if (drag) event.preventDefault();
    };

    const onKeyDown = event => {
        if (drag && event.key === 'Escape') {
            event.stopPropagation();
            finishDrag(false);
        }
    };

    const onContextMenu = event => {
        if (drag || (pending && pending.touch)) {
            event.preventDefault();
            return;
        }
        if (!event.target.closest(MENU_SELECTOR) || !canDrag()) return;
        const {getResetLabel, ScratchBlocks} = options;
        if (!getResetLabel || !ScratchBlocks || !ScratchBlocks.ContextMenu || !ScratchBlocks.WidgetDiv) return;
        event.preventDefault();
        event.stopPropagation();
        showContextMenu(ScratchBlocks, event, [{
            text: getResetLabel(),
            enabled: hasCustomCategoryOrder(options.vm),
            callback: () => resetCategoryOrder(options.vm)
        }], workspace.RTL);
    };

    menuObserver.observe(root, {childList: true});
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerCancel);
    root.addEventListener('lostpointercapture', onLostCapture);
    root.addEventListener('touchmove', onTouchMove, {passive: false});
    root.addEventListener('mouseup', onSuppressedSelect, true);
    root.addEventListener('touchend', onSuppressedSelect, true);
    root.addEventListener('click', onSuppressedSelect, true);
    root.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
        finishDrag(false);
        clearPending();
        menuObserver.disconnect();
        root.removeEventListener('pointerdown', onPointerDown);
        root.removeEventListener('pointermove', onPointerMove);
        root.removeEventListener('pointerup', onPointerUp);
        root.removeEventListener('pointercancel', onPointerCancel);
        root.removeEventListener('lostpointercapture', onLostCapture);
        root.removeEventListener('touchmove', onTouchMove, {passive: false});
        root.removeEventListener('mouseup', onSuppressedSelect, true);
        root.removeEventListener('touchend', onSuppressedSelect, true);
        root.removeEventListener('click', onSuppressedSelect, true);
        root.removeEventListener('contextmenu', onContextMenu);
        document.removeEventListener('keydown', onKeyDown, true);
    };
};

export default installCategoryDrag;
