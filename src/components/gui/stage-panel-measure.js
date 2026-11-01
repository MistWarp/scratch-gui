const DEFAULT_STAGE_BORDER_WIDTH = 2;
const DEFAULT_PANEL_CHROME = {paddingLeft: 8, paddingRight: 8, borderExtra: 2};
const DEFAULT_STAGE_OVERHEAD_HEIGHT = 88;
const DEFAULT_RESIZER_WIDTH = 6;

const cachedBorderWidths = new WeakMap();

const getCachedBorderWidth = element => {
    if (!element) return DEFAULT_STAGE_BORDER_WIDTH;

    const cached = cachedBorderWidths.get(element);
    if (typeof cached !== 'undefined') return cached;

    const computedStyle = window.getComputedStyle(element);
    const borderLeft = Number.parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderRight = Number.parseFloat(computedStyle.borderRightWidth) || 0;
    const total = borderLeft + borderRight;
    const result = (!Number.isFinite(total) || total < 0) ? DEFAULT_STAGE_BORDER_WIDTH : total;

    cachedBorderWidths.set(element, result);
    return result;
};

const getStageBorderExtraWidth = panelEl => {
    if (!panelEl) return 0;

    const stageEl = panelEl.querySelector('[class*="stage_stage"]');
    if (!stageEl) return DEFAULT_STAGE_BORDER_WIDTH;

    return getCachedBorderWidth(stageEl);
};

const readPanelChrome = panelEl => {
    const computedStyle = window.getComputedStyle(panelEl);
    return {
        paddingLeft: Number.parseFloat(computedStyle.paddingLeft) || 0,
        paddingRight: Number.parseFloat(computedStyle.paddingRight) || 0,
        borderExtra: getStageBorderExtraWidth(panelEl)
    };
};

const readPanelChromeOrDefault = panelEl => (panelEl ? readPanelChrome(panelEl) : DEFAULT_PANEL_CHROME);

const getEditorContainer = editorEl => (editorEl ? editorEl.parentElement : null);

const hasChatDockAfter = containerEl => {
    const next = containerEl && containerEl.nextElementSibling;
    return Boolean(next && next.hasAttribute('data-chat-dock'));
};

const measureStageOverheadHeight = panelEl => {
    let stageWrapperEl = panelEl.querySelector('[class*="stage-wrapper_stage-wrapper"]');
    if (!stageWrapperEl) {
        const candidates = Array.from(panelEl.querySelectorAll('[class*="stage-wrapper"]'));
        stageWrapperEl = candidates.find(candidate => candidate.querySelector('[class*="stage-header"]'));
    }
    const stageCanvasEl = stageWrapperEl ? stageWrapperEl.querySelector('[class*="stage_stage"]') : null;

    const stageWrapperRect = stageWrapperEl ? stageWrapperEl.getBoundingClientRect() : null;
    const stageCanvasRect = stageCanvasEl ? stageCanvasEl.getBoundingClientRect() : null;
    return (stageWrapperRect && stageCanvasRect && stageCanvasRect.height > 0) ?
        Math.max(0, stageWrapperRect.height - stageCanvasRect.height) :
        DEFAULT_STAGE_OVERHEAD_HEIGHT;
};

const measureResizerWidth = resizerEl => {
    const resizerRect = (resizerEl && typeof resizerEl.getBoundingClientRect === 'function') ?
        resizerEl.getBoundingClientRect() : null;
    return (resizerRect && Number.isFinite(resizerRect.width)) ? resizerRect.width : DEFAULT_RESIZER_WIDTH;
};

const tryCapturePointer = event => {
    const target = event.currentTarget;
    if (!target || typeof target.setPointerCapture !== 'function' || typeof event.pointerId !== 'number') {
        return false;
    }
    try {
        target.setPointerCapture(event.pointerId);
        return true;
    } catch (err) {
        return false;
    }
};

export {
    getEditorContainer,
    hasChatDockAfter,
    measureResizerWidth,
    measureStageOverheadHeight,
    readPanelChrome,
    readPanelChromeOrDefault,
    tryCapturePointer
};
