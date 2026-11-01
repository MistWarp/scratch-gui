import {FIXED_WIDTH} from '../../lib/constants/layout-constants';
import {
    HIDE_STAGE_DRAG_SLOP,
    MIN_STAGE_PANEL_WIDTH,
    MIN_TARGET_PANE_HEIGHT,
    SMALL_STAGE_WIDTH,
    STAGE_PANEL_CHROME_WIDTH,
    STAGE_RESIZER_WIDTH,
    minEditorPaneWidth
} from './page';

const AUTO_SMALL_STAGE_INNER_WIDTH = Math.round(FIXED_WIDTH);
const STAGE_CANVAS_BORDER = 2;
const KEYBOARD_STEP = 24;
const KEYBOARD_LARGE_STEP = 80;
const DEFAULT_ASPECT_RATIO = 4 / 3;

const widthOrNative = (projectStageWidth: number): number => projectStageWidth || FIXED_WIDTH;

export interface PanelChrome {
    paddingLeft: number;
    paddingRight: number;
    borderExtra: number;
}

export interface ProjectStageSize {
    width: number;
    height: number;
}

export interface StagePanelStyle {
    width: string;
    flexBasis: string;
    flexGrow?: number;
    flexShrink: number;
}

export interface StageDragMeasurements {
    chrome: PanelChrome;
    containerWidth: number;
    chatDocked: boolean;
    resizerWidth: number;
    panelHeight: number;
    stageOverheadHeight: number;
    projectStageSize: ProjectStageSize | null | undefined;
}

export interface StageDragBounds {
    minWidth: number;
    maxWidth: number;
}

export const maxStagePanelWidth = (
    containerWidth: number,
    chatDocked: boolean,
    resizerWidth: number = STAGE_RESIZER_WIDTH
): number => containerWidth - minEditorPaneWidth(chatDocked) - resizerWidth;

export const canFitStagePanel = (availableWidth: number): boolean => availableWidth >= MIN_STAGE_PANEL_WIDTH;

export const stageInnerWidth = (outerWidth: number, {paddingLeft, paddingRight, borderExtra}: PanelChrome): number => (
    Math.max(0, outerWidth - paddingLeft - paddingRight - borderExtra)
);

export const stageContentWidthForPanel = (
    outerWidth: number,
    {paddingLeft, paddingRight, borderExtra}: PanelChrome
): number => Math.max(0, outerWidth - paddingLeft - paddingRight - borderExtra - STAGE_CANVAS_BORDER);

export const stagePanelOuterWidth = (
    contentWidth: number,
    {paddingLeft, paddingRight, borderExtra}: PanelChrome
): number => contentWidth + STAGE_CANVAS_BORDER + paddingLeft + paddingRight + borderExtra;

export type StageSizeMode = 'large' | 'small' | 'full' | 'hidden';

export const getStageContentWidthForMode = (stageSizeMode: StageSizeMode): number | null => {
    if (stageSizeMode === 'small') return SMALL_STAGE_WIDTH;
    if (stageSizeMode === 'large') return FIXED_WIDTH;
    return null;
};

export const isSmallStageWidth = (stageContainerWidth: number, projectStageWidth: number): boolean => (
    stageContainerWidth < Math.min(AUTO_SMALL_STAGE_INNER_WIDTH, widthOrNative(projectStageWidth))
);

export const getKeyboardStagePanelWidth = (
    currentWidth: number,
    direction: number,
    largeStep: boolean
): {panelWidth: number; containerWidth: number} => {
    const step = largeStep ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
    const panelWidth = Math.max(MIN_STAGE_PANEL_WIDTH, currentWidth + (direction * step));
    return {
        panelWidth,
        containerWidth: Math.max(0, panelWidth - STAGE_PANEL_CHROME_WIDTH)
    };
};

export const getStageDragBounds = ({
    chrome,
    containerWidth,
    chatDocked,
    resizerWidth,
    panelHeight,
    stageOverheadHeight,
    projectStageSize
}: StageDragMeasurements): StageDragBounds => {
    const {paddingLeft, paddingRight, borderExtra} = chrome;
    const minWidth = Math.max(0, SMALL_STAGE_WIDTH + paddingLeft + paddingRight + borderExtra);
    const maxWidthByEditor = Math.max(minWidth, maxStagePanelWidth(containerWidth, chatDocked, resizerWidth));
    const maxStageCanvasHeight = Math.max(0, panelHeight - MIN_TARGET_PANE_HEIGHT - stageOverheadHeight);
    const widthPerHeight = (projectStageSize && projectStageSize.height > 0) ?
        (projectStageSize.width / projectStageSize.height) :
        DEFAULT_ASPECT_RATIO;
    const maxInnerWidthByHeight = (maxStageCanvasHeight * widthPerHeight) + STAGE_CANVAS_BORDER;
    const maxWidthByHeight = Math.max(
        minWidth,
        maxInnerWidthByHeight + paddingLeft + paddingRight + borderExtra
    );
    return {
        minWidth,
        maxWidth: Math.min(maxWidthByEditor, maxWidthByHeight)
    };
};

export const shouldHideStageOnDrag = (rawWidth: number, minWidth: number): boolean => (
    rawWidth < minWidth - HIDE_STAGE_DRAG_SLOP
);

export const getStagePanelStyle = (panelWidth: number | null, isStageHidden: boolean): StagePanelStyle | null => {
    if (isStageHidden) {
        return {
            width: 'auto',
            flexBasis: 'auto',
            flexGrow: 0,
            flexShrink: 0
        };
    }
    if (!panelWidth) return null;
    return {
        width: `${String(panelWidth)}px`,
        flexBasis: `${String(panelWidth)}px`,
        flexShrink: 0
    };
};

export const getPlayerStageWidth = (windowWidth: number, projectStageWidth: number): number => (
    Math.min(windowWidth, widthOrNative(projectStageWidth) + STAGE_CANVAS_BORDER)
);

export const getMobileStageWidth = (availableWidth: number): number => (
    Math.min(FIXED_WIDTH + STAGE_CANVAS_BORDER, availableWidth)
);
