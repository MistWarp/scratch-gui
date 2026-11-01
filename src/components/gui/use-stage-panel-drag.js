import {useCallback, useEffect, useRef} from 'react';

import listenForStagePanelDrag from '../../lib/utils/stage-panel-drag.js';
import {beginLiveResize} from '../../lib/mw-live-resize.js';
import {getStageDragBounds, shouldHideStageOnDrag, stageInnerWidth} from '../../modules/editor-layout';
import {
    getEditorContainer,
    hasChatDockAfter,
    measureResizerWidth,
    measureStageOverheadHeight,
    readPanelChrome,
    tryCapturePointer
} from './stage-panel-measure.js';

const useStagePanelDrag = ({
    canHideStage,
    customStageSize,
    editorWrapperRef,
    stageAndTargetWrapperRef,
    onDragHide,
    onDragResize,
    onDragShow,
    onDragStart
}) => {
    const stagePanelResizeCleanupRef = useRef(null);

    useEffect(() => () => {
        if (stagePanelResizeCleanupRef.current) stagePanelResizeCleanupRef.current();
    }, []);

    const handleStagePanelResizePointerDown = useCallback(e => {
        if (typeof e.button !== 'undefined' && e.button !== 0) return;
        e.preventDefault();

        if (stagePanelResizeCleanupRef.current) stagePanelResizeCleanupRef.current();

        const el = stageAndTargetWrapperRef.current;
        if (!el) return;
        const editorEl = editorWrapperRef.current;
        const startRect = el.getBoundingClientRect();
        const chrome = readPanelChrome(el);
        const editorRect = editorEl ? editorEl.getBoundingClientRect() : null;
        const startX = (typeof e.clientX === 'number') ? e.clientX : 0;
        const startWidth = startRect.width;

        onDragStart(stageInnerWidth(startWidth, chrome));

        tryCapturePointer(e);

        const containerEl = getEditorContainer(editorEl);
        const containerRect = containerEl ? containerEl.getBoundingClientRect() : null;
        const containerWidth = (containerRect && Number.isFinite(containerRect.width)) ?
            containerRect.width :
            window.innerWidth;

        const panelHeight = startRect.height > 0 ?
            startRect.height :
            ((editorRect && editorRect.height > 0) ? editorRect.height : window.innerHeight);

        const {minWidth, maxWidth} = getStageDragBounds({
            chrome,
            containerWidth,
            chatDocked: hasChatDockAfter(containerEl),
            resizerWidth: measureResizerWidth(e.currentTarget),
            panelHeight,
            stageOverheadHeight: measureStageOverheadHeight(el),
            projectStageSize: customStageSize
        });

        const stageIsLeft = editorRect ? (startRect.left < editorRect.left) : false;
        const directionFactor = stageIsLeft ? 1 : -1;

        let moveRaf = null;
        let latestX = startX;
        const applyMove = () => {
            const dx = latestX - startX;
            const rawWidth = startWidth + (dx * directionFactor);

            if (canHideStage) {
                if (shouldHideStageOnDrag(rawWidth, minWidth)) {
                    onDragHide();
                    return;
                }
                onDragShow();
            }

            const nextWidth = Math.min(maxWidth, Math.max(minWidth, rawWidth));
            onDragResize(nextWidth, stageInnerWidth(nextWidth, chrome));
        };
        const onMove = ev => {
            if (typeof ev.clientX === 'number') latestX = ev.clientX;
            if (moveRaf) return;
            moveRaf = requestAnimationFrame(() => {
                moveRaf = null;
                applyMove();
            });
        };

        const endLiveResize = beginLiveResize();
        const flushPendingMove = () => {
            if (!moveRaf) return;
            cancelAnimationFrame(moveRaf);
            moveRaf = null;
            applyMove();
        };
        const finishResize = () => {
            flushPendingMove();
            endLiveResize();
            stagePanelResizeCleanupRef.current = null;
        };
        const removeListeners = listenForStagePanelDrag(onMove, finishResize);
        stagePanelResizeCleanupRef.current = () => {
            if (moveRaf) {
                cancelAnimationFrame(moveRaf);
                moveRaf = null;
            }
            endLiveResize();
            removeListeners();
            stagePanelResizeCleanupRef.current = null;
        };
    }, [
        canHideStage,
        customStageSize,
        editorWrapperRef,
        stageAndTargetWrapperRef,
        onDragHide,
        onDragResize,
        onDragShow,
        onDragStart
    ]);

    return handleStagePanelResizePointerDown;
};

export default useStagePanelDrag;
