import {FIXED_WIDTH, UNCONSTRAINED_NON_STAGE_WIDTH} from '../../lib/constants/layout-constants';

export const MIN_EDITOR_PANE_WIDTH = 598;
export const MIN_EDITOR_PANE_WIDTH_WITH_CHAT = 460;
export const MIN_TARGET_PANE_HEIGHT = 180;
export const HIDE_STAGE_DRAG_SLOP = 80;
export const NARROW_LAYOUT_WIDTH = 900;
export const PREFERRED_MIN_EDITOR_HEIGHT = 640;
export const MIN_EDITOR_HEIGHT = 480;
export const STAGE_RESIZER_WIDTH = 6;
export const SMALL_STAGE_WIDTH = FIXED_WIDTH * 0.5;
export const STAGE_PANEL_CHROME_WIDTH = 18;
export const MIN_STAGE_PANEL_WIDTH = SMALL_STAGE_WIDTH + STAGE_PANEL_CHROME_WIDTH;

const PAGE_HORIZONTAL_PADDING = 16;

export interface PageMinDimensions {
    minWidth: number;
    minHeight: number;
}

export const getMinEditorHeight = (viewportHeight: number): number => Math.max(
    MIN_EDITOR_HEIGHT,
    Math.min(PREFERRED_MIN_EDITOR_HEIGHT, viewportHeight || PREFERRED_MIN_EDITOR_HEIGHT)
);

export const minEditorPaneWidth = (chatDocked: boolean): number => (
    chatDocked ? MIN_EDITOR_PANE_WIDTH_WITH_CHAT : MIN_EDITOR_PANE_WIDTH
);

export const isNarrowLayoutWidth = (containerWidth: number): boolean => containerWidth < NARROW_LAYOUT_WIDTH;

export const getPageMinDimensions = ({isNarrowLayout, isStageHidden, viewportHeight}: {
    isNarrowLayout: boolean;
    isStageHidden: boolean;
    viewportHeight: number;
}): PageMinDimensions => {
    if (isNarrowLayout) {
        return {
            minWidth: 0,
            minHeight: 0
        };
    }
    const minHeight = getMinEditorHeight(viewportHeight);
    if (isStageHidden) {
        return {
            minWidth: MIN_EDITOR_PANE_WIDTH + PAGE_HORIZONTAL_PADDING,
            minHeight
        };
    }
    return {
        minWidth: MIN_EDITOR_PANE_WIDTH + MIN_STAGE_PANEL_WIDTH + STAGE_RESIZER_WIDTH + PAGE_HORIZONTAL_PADDING,
        minHeight
    };
};

export const getUnconstrainedEditorWidth = (projectStageWidth: number): number => (
    UNCONSTRAINED_NON_STAGE_WIDTH +
    FIXED_WIDTH +
    Math.max(0, projectStageWidth - FIXED_WIDTH)
);
