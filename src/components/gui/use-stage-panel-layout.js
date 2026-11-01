import {useCallback, useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';

import {STAGE_SIZE_MODES} from '../../lib/constants/layout-constants';
import {
    canFitStagePanel,
    getKeyboardStagePanelWidth,
    getStageContentWidthForMode,
    isNarrowLayoutWidth,
    isSmallStageWidth,
    maxStagePanelWidth,
    MIN_STAGE_PANEL_WIDTH,
    stageContentWidthForPanel,
    stageInnerWidth,
    stagePanelOuterWidth
} from '../../modules/editor-layout';
import {
    getEditorContainer,
    hasChatDockAfter,
    readPanelChrome,
    readPanelChromeOrDefault
} from './stage-panel-measure.js';
import useStagePanelDrag from './use-stage-panel-drag.js';

const useWindowResizeOnStageWidthChange = stageContainerWidth => {
    const stageResizeRafRef = useRef(null);
    const lastResizeWidthRef = useRef(null);
    useEffect(() => {
        if (typeof stageContainerWidth !== 'number') return;

        const rounded = Math.round(stageContainerWidth);
        if (lastResizeWidthRef.current === rounded) return;

        lastResizeWidthRef.current = rounded;

        if (stageResizeRafRef.current) return;
        stageResizeRafRef.current = requestAnimationFrame(() => {
            stageResizeRafRef.current = null;
            window.dispatchEvent(new Event('resize'));
        });
        return () => {
            if (stageResizeRafRef.current) {
                cancelAnimationFrame(stageResizeRafRef.current);
                stageResizeRafRef.current = null;
            }
        };
    }, [stageContainerWidth]);
};

const useStagePanelLayout = ({
    customStageSize,
    isFullScreen,
    onSetStageSize,
    stageSizeMode,
    stageSizeRequestId
}) => {
    const editorWrapperRef = useRef(null);
    const stageAndTargetWrapperRef = useRef(null);
    const measureRafRef = useRef(null);
    const syncingModeRef = useRef(false);
    const prevStageSizeModeRef = useRef(null);
    const prevCustomStageSizeRef = useRef(customStageSize);
    const lastSyncedWidthRef = useRef(null);
    const autoHiddenRef = useRef(false);
    const [stagePanelWidth, setStagePanelWidth] = useState(null);
    const [stageContainerWidth, setStageContainerWidth] = useState(null);
    const [isNarrowLayout, setIsNarrowLayout] = useState(false);

    const isStageHidden = stageSizeMode === STAGE_SIZE_MODES.hidden && !isFullScreen;
    const preferredPanelWidthRef = useRef(null);
    const isStageHiddenRef = useRef(isStageHidden);
    isStageHiddenRef.current = isStageHidden;

    const handleStagePanelResizeDoubleClick = useCallback(() => {
        preferredPanelWidthRef.current = null;
        setStagePanelWidth(null);
        setStageContainerWidth(null);
        if (isStageHiddenRef.current && typeof onSetStageSize === 'function') {
            onSetStageSize(STAGE_SIZE_MODES.full);
        }
    }, [onSetStageSize]);

    const handleStagePanelResizeKeyDown = useCallback(event => {
        if (event.key === 'Home') {
            event.preventDefault();
            handleStagePanelResizeDoubleClick();
            return;
        }
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        const currentWidth = stagePanelWidth || preferredPanelWidthRef.current || MIN_STAGE_PANEL_WIDTH;
        const next = getKeyboardStagePanelWidth(currentWidth, direction, event.shiftKey);
        preferredPanelWidthRef.current = next.panelWidth;
        setStagePanelWidth(next.panelWidth);
        setStageContainerWidth(next.containerWidth);
        if (isStageHiddenRef.current && typeof onSetStageSize === 'function') {
            onSetStageSize(STAGE_SIZE_MODES.small);
        }
    }, [handleStagePanelResizeDoubleClick, onSetStageSize, stagePanelWidth]);

    const measureStageContainerWidth = useCallback(() => {
        if (measureRafRef.current) return;

        measureRafRef.current = requestAnimationFrame(() => {
            measureRafRef.current = null;

            const el = stageAndTargetWrapperRef.current;
            if (!el) return;

            const rect = el.getBoundingClientRect();
            if (!Number.isFinite(rect.width)) return;

            const innerWidth = stageInnerWidth(rect.width, readPanelChrome(el));

            setStageContainerWidth(prev => {
                if (typeof prev === 'number' && Math.abs(prev - innerWidth) < 2) {
                    return prev;
                }
                return innerWidth;
            });
        });
    }, []);

    useWindowResizeOnStageWidthChange(stageContainerWidth);

    const handleDragStart = useCallback(innerWidth => {
        setStageContainerWidth(Math.round(innerWidth));
    }, []);

    const handleDragHide = useCallback(() => {
        if (isStageHiddenRef.current) return;
        isStageHiddenRef.current = true;
        syncingModeRef.current = true;
        onSetStageSize(STAGE_SIZE_MODES.hidden);
    }, [onSetStageSize]);

    const handleDragShow = useCallback(() => {
        if (!isStageHiddenRef.current) return;
        isStageHiddenRef.current = false;
        autoHiddenRef.current = false;
        syncingModeRef.current = true;
        onSetStageSize(STAGE_SIZE_MODES.small);
    }, [onSetStageSize]);

    const handleDragResize = useCallback((panelWidth, innerWidth) => {
        preferredPanelWidthRef.current = panelWidth;
        ReactDOM.unstable_batchedUpdates(() => {
            setStagePanelWidth(panelWidth);
            setStageContainerWidth(prev => {
                if (typeof prev === 'number' && Math.abs(prev - innerWidth) < 0.5) {
                    return prev;
                }
                return innerWidth;
            });
        });
    }, []);

    const handleStagePanelResizePointerDown = useStagePanelDrag({
        canHideStage: typeof onSetStageSize === 'function',
        customStageSize,
        editorWrapperRef,
        stageAndTargetWrapperRef,
        onDragHide: handleDragHide,
        onDragResize: handleDragResize,
        onDragShow: handleDragShow,
        onDragStart: handleDragStart
    });

    const setStageWidth = useCallback(contentWidth => {
        if (contentWidth === null) {
            setStagePanelWidth(null);
            setStageContainerWidth(null);
            return;
        }

        let outerWidth = stagePanelOuterWidth(contentWidth, readPanelChromeOrDefault(stageAndTargetWrapperRef.current));

        const containerEl = getEditorContainer(editorWrapperRef.current);
        const containerWidth = containerEl ?
            containerEl.getBoundingClientRect().width :
            window.innerWidth;
        const maxOuterWidth = maxStagePanelWidth(containerWidth, hasChatDockAfter(containerEl));
        if (Number.isFinite(maxOuterWidth) && maxOuterWidth > 0) {
            outerWidth = Math.min(outerWidth, maxOuterWidth);
        }

        setStagePanelWidth(outerWidth);
        setStageContainerWidth(contentWidth + 2);
    }, []);

    useEffect(() => {
        if (prevStageSizeModeRef.current === null) {
            prevStageSizeModeRef.current = stageSizeRequestId;
            return;
        }
        if (prevStageSizeModeRef.current === stageSizeRequestId) return;
        prevStageSizeModeRef.current = stageSizeRequestId;

        if (isFullScreen) return;
        if (syncingModeRef.current) {
            syncingModeRef.current = false;
            return;
        }

        if (stageSizeMode === STAGE_SIZE_MODES.hidden) {
            return;
        }
        setStageWidth(getStageContentWidthForMode(stageSizeMode));
    }, [stageSizeMode, stageSizeRequestId, isFullScreen, setStageWidth]);

    useEffect(() => {
        const previousSize = prevCustomStageSizeRef.current;
        prevCustomStageSizeRef.current = customStageSize;

        if (previousSize.width === customStageSize.width &&
            previousSize.height === customStageSize.height) return;
        if (isFullScreen || stageSizeMode !== STAGE_SIZE_MODES.full) return;
        if (preferredPanelWidthRef.current !== null) return;

        setStageWidth(null);
    }, [
        customStageSize,
        isFullScreen,
        stageSizeMode,
        setStageWidth
    ]);

    useEffect(() => {
        if (stageContainerWidth === lastSyncedWidthRef.current) return;
        lastSyncedWidthRef.current = stageContainerWidth;

        if (isFullScreen) return;
        if (stageSizeMode === STAGE_SIZE_MODES.hidden) return;
        if (typeof stageContainerWidth !== 'number') return;
        if (typeof onSetStageSize !== 'function') return;

        const isSmall = isSmallStageWidth(stageContainerWidth, customStageSize && customStageSize.width);

        if (isSmall && stageSizeMode !== STAGE_SIZE_MODES.small) {
            syncingModeRef.current = true;
            onSetStageSize(STAGE_SIZE_MODES.small);
        } else if (!isSmall && stageSizeMode === STAGE_SIZE_MODES.small) {
            syncingModeRef.current = true;
            onSetStageSize(STAGE_SIZE_MODES.full);
        }
    }, [
        stageContainerWidth,
        isFullScreen,
        onSetStageSize,
        stageSizeMode,
        customStageSize
    ]);

    useEffect(() => {
        const containerEl = getEditorContainer(editorWrapperRef.current);
        if (!containerEl || typeof ResizeObserver === 'undefined') return;

        const fit = () => {
            if (isFullScreen || typeof onSetStageSize !== 'function') return;

            const measuredWidth = containerEl.getBoundingClientRect().width;
            if (!Number.isFinite(measuredWidth) || measuredWidth <= 0) return;

            const containerWidth = Math.min(measuredWidth, window.innerWidth);
            setIsNarrowLayout(isNarrowLayoutWidth(containerWidth));
            const available = maxStagePanelWidth(containerWidth, hasChatDockAfter(containerEl));

            if (!canFitStagePanel(available)) {
                if (!isStageHiddenRef.current) {
                    autoHiddenRef.current = true;
                    isStageHiddenRef.current = true;
                    syncingModeRef.current = true;
                    onSetStageSize(STAGE_SIZE_MODES.hidden);
                }
                return;
            }

            if (isStageHiddenRef.current) {
                if (!autoHiddenRef.current) return;
                autoHiddenRef.current = false;
                isStageHiddenRef.current = false;
                onSetStageSize(STAGE_SIZE_MODES.small);
                return;
            }

            const stageEl = stageAndTargetWrapperRef.current;
            if (!stageEl) return;

            const outerWidth = stageEl.getBoundingClientRect().width;
            if (!Number.isFinite(outerWidth) || outerWidth <= 0) return;

            const preferred = preferredPanelWidthRef.current;
            const target = Math.min(
                typeof preferred === 'number' ? preferred : outerWidth,
                available
            );
            if (Math.abs(outerWidth - target) <= 1) return;

            setStageWidth(stageContentWidthForPanel(target, readPanelChrome(stageEl)));
        };

        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(containerEl);
        window.addEventListener('resize', fit);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', fit);
        };
    }, [isFullScreen, onSetStageSize, setStageWidth]);

    useEffect(() => {
        measureStageContainerWidth();
        const el = stageAndTargetWrapperRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => {
            measureStageContainerWidth();
        });
        observer.observe(el);
        return () => {
            observer.disconnect();
            if (measureRafRef.current) {
                cancelAnimationFrame(measureRafRef.current);
                measureRafRef.current = null;
            }
        };
    }, [measureStageContainerWidth]);

    return {
        editorWrapperRef,
        handleStagePanelResizeDoubleClick,
        handleStagePanelResizeKeyDown,
        handleStagePanelResizePointerDown,
        isNarrowLayout,
        isStageHidden,
        stageAndTargetWrapperRef,
        stageContainerWidth,
        stagePanelWidth
    };
};

export default useStagePanelLayout;
