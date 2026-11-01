import {describe, expect, test} from '@jest/globals';
import {
    MIN_EDITOR_PANE_WIDTH,
    MIN_EDITOR_PANE_WIDTH_WITH_CHAT,
    MIN_STAGE_PANEL_WIDTH,
    canFitStagePanel,
    getKeyboardStagePanelWidth,
    getMinEditorHeight,
    getMobileStageWidth,
    getPageMinDimensions,
    getPlayerStageWidth,
    getStageContentWidthForMode,
    getStageDragBounds,
    getStagePanelStyle,
    getUnconstrainedEditorWidth,
    isNarrowLayoutWidth,
    isSmallStageWidth,
    maxStagePanelWidth,
    minEditorPaneWidth,
    shouldHideStageOnDrag,
    stageContentWidthForPanel,
    stageInnerWidth,
    stagePanelOuterWidth
} from '../../../src/modules/editor-layout';

const chrome = {paddingLeft: 8, paddingRight: 8, borderExtra: 2};

describe('editor page layout', () => {
    test('the editor asks for a usable height without exceeding the window', () => {
        expect(getMinEditorHeight(900)).toBe(640);
        expect(getMinEditorHeight(560)).toBe(560);
        expect(getMinEditorHeight(300)).toBe(480);
        expect(getMinEditorHeight(0)).toBe(640);
    });

    test('the editor pane can be narrower beside the chat dock', () => {
        expect(minEditorPaneWidth(false)).toBe(MIN_EDITOR_PANE_WIDTH);
        expect(minEditorPaneWidth(true)).toBe(MIN_EDITOR_PANE_WIDTH_WITH_CHAT);
    });

    test('narrow layouts start below 900 pixels', () => {
        expect(isNarrowLayoutWidth(899)).toBe(true);
        expect(isNarrowLayoutWidth(900)).toBe(false);
    });

    test('page minimum size depends on the stage and layout', () => {
        expect(getPageMinDimensions({isNarrowLayout: true, isStageHidden: false, viewportHeight: 800}))
            .toEqual({minWidth: 0, minHeight: 0});
        expect(getPageMinDimensions({isNarrowLayout: false, isStageHidden: true, viewportHeight: 800}))
            .toEqual({minWidth: 614, minHeight: 640});
        expect(getPageMinDimensions({isNarrowLayout: false, isStageHidden: false, viewportHeight: 500}))
            .toEqual({minWidth: 598 + 258 + 6 + 16, minHeight: 500});
    });

    test('the unconstrained breakpoint grows with wide project stages', () => {
        expect(getUnconstrainedEditorWidth(480)).toBe(1096);
        expect(getUnconstrainedEditorWidth(640)).toBe(1256);
        expect(getUnconstrainedEditorWidth(320)).toBe(1096);
    });
});

describe('stage panel sizing', () => {
    test('the stage panel never takes the editor pane minimum', () => {
        expect(maxStagePanelWidth(1280, false)).toBe(1280 - 598 - 6);
        expect(maxStagePanelWidth(1280, true, 10)).toBe(1280 - 460 - 10);
        expect(canFitStagePanel(MIN_STAGE_PANEL_WIDTH)).toBe(true);
        expect(canFitStagePanel(MIN_STAGE_PANEL_WIDTH - 1)).toBe(false);
    });

    test('panel widths convert between outer and content widths', () => {
        expect(stageInnerWidth(500, chrome)).toBe(482);
        expect(stageInnerWidth(10, chrome)).toBe(0);
        expect(stageContentWidthForPanel(500, chrome)).toBe(480);
        expect(stagePanelOuterWidth(480, chrome)).toBe(500);
    });

    test('fixed stage modes map to content widths', () => {
        expect(getStageContentWidthForMode('small')).toBe(240);
        expect(getStageContentWidthForMode('large')).toBe(480);
        expect(getStageContentWidthForMode('full')).toBeNull();
    });

    test('a stage narrower than the project switches to small mode', () => {
        expect(isSmallStageWidth(479, 0)).toBe(true);
        expect(isSmallStageWidth(480, 480)).toBe(false);
        expect(isSmallStageWidth(300, 320)).toBe(true);
        expect(isSmallStageWidth(320, 320)).toBe(false);
    });

    test('keyboard resizing steps and never goes below the minimum', () => {
        expect(getKeyboardStagePanelWidth(400, 1, false)).toEqual({panelWidth: 424, containerWidth: 406});
        expect(getKeyboardStagePanelWidth(400, -1, true)).toEqual({panelWidth: 320, containerWidth: 302});
        expect(getKeyboardStagePanelWidth(260, -1, true).panelWidth).toBe(MIN_STAGE_PANEL_WIDTH);
    });

    test('drag bounds respect the editor width and the target pane height', () => {
        const bounds = getStageDragBounds({
            chrome,
            containerWidth: 1280,
            chatDocked: false,
            resizerWidth: 6,
            panelHeight: 700,
            stageOverheadHeight: 88,
            projectStageSize: {width: 480, height: 360}
        });
        expect(bounds.minWidth).toBe(258);
        expect(bounds.maxWidth).toBe(Math.min(1280 - 598 - 6, ((700 - 180 - 88) * (4 / 3)) + 2 + 18));
        expect(shouldHideStageOnDrag(bounds.minWidth - 81, bounds.minWidth)).toBe(true);
        expect(shouldHideStageOnDrag(bounds.minWidth - 80, bounds.minWidth)).toBe(false);
    });

    test('panel style collapses when the stage is hidden', () => {
        expect(getStagePanelStyle(400, true)).toEqual({width: 'auto', flexBasis: 'auto', flexGrow: 0, flexShrink: 0});
        expect(getStagePanelStyle(null, false)).toBeNull();
        expect(getStagePanelStyle(400, false)).toEqual({width: '400px', flexBasis: '400px', flexShrink: 0});
    });

    test('player and phone stages fit the available width', () => {
        expect(getPlayerStageWidth(1280, 480)).toBe(482);
        expect(getPlayerStageWidth(300, 480)).toBe(300);
        expect(getPlayerStageWidth(1280, 0)).toBe(482);
        expect(getMobileStageWidth(1000)).toBe(482);
        expect(getMobileStageWidth(300)).toBe(300);
    });
});
