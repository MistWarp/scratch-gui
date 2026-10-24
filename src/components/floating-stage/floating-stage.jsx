import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import VM from 'scratch-vm';
import {ChevronDown, ChevronUp, Database, GripVertical, Maximize} from 'lucide-react';

import Controls from '../../containers/controls.jsx';
import Stage from '../../containers/stage.jsx';
import ScreenshotButton from '../mw-stage-controls/screenshot-button.jsx';
import {STAGE_SIZE_MODES} from '../../lib/constants/layout-constants';
import {
    MAX_WIDTH,
    MIN_WIDTH,
    boxFor,
    fitWidth,
    isBottom,
    isRight,
    nextCorner,
    readLayout,
    snapToCorner,
    writeLayout
} from '../../lib/floating-stage-layout.js';
import {setFullScreen} from '../../reducers/mode';
import {openVariableManagerModal} from '../../reducers/modals';

import styles from './floating-stage.css';

const messages = defineMessages({
    stage: {
        defaultMessage: 'Stage',
        description: 'Accessible name of the floating stage window in Code mode',
        id: 'mw.floatingStage.label'
    },
    move: {
        defaultMessage: 'Move stage',
        description: 'Handle that drags the floating stage window in Code mode. Arrow keys move it to another corner.',
        id: 'mw.floatingStage.move'
    },
    resize: {
        defaultMessage: 'Resize stage',
        description: 'Corner handle that resizes the floating stage window in Code mode',
        id: 'mw.floatingStage.resize'
    },
    collapse: {
        defaultMessage: 'Hide stage',
        description: 'Button that collapses the floating stage window to its controls in Code mode',
        id: 'mw.floatingStage.collapse'
    },
    expand: {
        defaultMessage: 'Show stage',
        description: 'Button that expands the collapsed floating stage window in Code mode',
        id: 'mw.floatingStage.expand'
    },
    variables: {
        defaultMessage: 'Variable manager',
        description: 'Button on the floating stage window that opens the variable manager',
        id: 'mw.floatingStage.variables'
    },
    fullScreen: {
        defaultMessage: 'Full screen',
        description: 'Button on the floating stage window that shows the stage full screen',
        id: 'mw.floatingStage.fullScreen'
    }
});

const HEADER_HEIGHT = 44;
const STAGE_PADDING = 6;
const STAGE_BORDER = 2;
const WINDOW_BORDER = 2;
const RESIZE_STEP = 20;

const TOP_REGION = 160;

const measure = element => {
    if (!element) return {width: 0, height: 0, insets: null};
    const box = element.getBoundingClientRect();
    const insets = {top: 0, right: 0, bottom: 0, left: 0};
    for (const strip of element.querySelectorAll('[data-floating-stage-avoid="top"]')) {
        const rect = strip.getBoundingClientRect();
        if (rect.height && rect.top - box.top < TOP_REGION) insets.top = Math.max(insets.top, rect.bottom - box.top);
    }
    const panel = element.querySelector('[data-mw-region="panel"]');
    if (panel) {
        const rect = panel.getBoundingClientRect();
        if (rect.height) insets.bottom = Math.max(0, box.bottom - rect.top);
    }
    const explorer = element.querySelector('[data-mw-region="explorer"]');
    if (explorer && getComputedStyle(explorer).position !== 'absolute') {
        const rect = explorer.getBoundingClientRect();
        const onLeft = rect.left - box.left < box.right - rect.right;
        if (rect.width && onLeft) insets.left = Math.max(0, rect.right - box.left);
        else if (rect.width) insets.right = Math.max(0, box.right - rect.left);
    }
    return {width: element.clientWidth, height: element.clientHeight, insets};
};

const sameHost = (a, b) => a.width === b.width && a.height === b.height &&
    JSON.stringify(a.insets) === JSON.stringify(b.insets);

const insideEditor = node => {
    const element = node && node.nodeType === 1 ? node : node && node.parentElement;
    return Boolean(element && element.closest('.cm-editor'));
};

const notifyResize = () => window.dispatchEvent(new Event('resize'));

const FloatingStage = ({
    customStageSize,
    intl,
    isRendererSupported,
    isRtl,
    onFullScreen,
    onOpenVariableManager,
    vm
}) => {
    const [layout, setLayout] = useState(() => readLayout(isRtl));
    const [host, setHost] = useState({width: 0, height: 0, insets: null});
    const [drag, setDrag] = useState(null);
    const rootRef = useRef(null);
    const layoutRef = useRef(layout);
    layoutRef.current = layout;

    const aspect = customStageSize.height / customStageSize.width;
    const chromeWidth = WINDOW_BORDER + (STAGE_PADDING * 2) + STAGE_BORDER;
    const chromeHeight = HEADER_HEIGHT + WINDOW_BORDER + STAGE_PADDING + STAGE_BORDER - (chromeWidth * aspect);
    const width = host.width ? fitWidth({width: layout.width, host, aspect, chromeHeight, chromeWidth}) :
        layout.width;
    const stageWidth = Math.max(0, width - chromeWidth);
    const height = layout.collapsed ? HEADER_HEIGHT + WINDOW_BORDER :
        Math.round(HEADER_HEIGHT + WINDOW_BORDER + STAGE_PADDING + STAGE_BORDER + (stageWidth * aspect));
    const size = {width, height};

    const update = useCallback(patch => {
        setLayout(previous => {
            const next = {...previous, ...patch};
            writeLayout(next);
            return next;
        });
    }, []);

    useLayoutEffect(() => {
        const parent = rootRef.current && rootRef.current.parentElement;
        if (!parent) return;
        let frame = null;
        let observed = [];
        const watch = {resize: null};
        const measureNow = () => {
            frame = null;
            const next = measure(parent);
            setHost(previous => (sameHost(previous, next) ? previous : next));
            if (!watch.resize) return;
            const elements = [parent, ...parent.querySelectorAll(
                '[data-floating-stage-avoid], [data-mw-region="panel"], [data-mw-region="explorer"]'
            )];
            for (const element of observed) {
                if (!elements.includes(element)) watch.resize.unobserve(element);
            }
            for (const element of elements) {
                if (!observed.includes(element)) watch.resize.observe(element);
            }
            observed = elements;
        };
        const schedule = () => {
            if (frame === null) frame = requestAnimationFrame(measureNow);
        };
        watch.resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
        measureNow();
        const mutationObserver = typeof MutationObserver === 'undefined' ? null : new MutationObserver(records => {
            const own = rootRef.current;
            if (records.some(record => !insideEditor(record.target) && !(own && own.contains(record.target)))) {
                schedule();
            }
        });
        if (mutationObserver) mutationObserver.observe(parent, {childList: true, subtree: true});
        window.addEventListener('resize', schedule);
        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
            if (watch.resize) watch.resize.disconnect();
            if (mutationObserver) mutationObserver.disconnect();
            window.removeEventListener('resize', schedule);
        };
    }, []);

    const box = drag ? {left: drag.left, top: drag.top} : boxFor({layout, host, size});

    useEffect(() => {
        if (drag) return;
        const frame = requestAnimationFrame(notifyResize);
        return () => cancelAnimationFrame(frame);
    }, [stageWidth, layout.collapsed, box.left, box.top, host.width, host.height, Boolean(drag)]);

    const handleMovePointerDown = useCallback(event => {
        if (event.button !== 0) return;
        const fromHandle = event.target === event.currentTarget ||
            event.target.closest(`.${styles.moveHandle}`) ||
            event.target.closest(`.${styles.dragArea}`);
        if (!fromHandle) return;
        event.preventDefault();
        const start = {x: event.clientX, y: event.clientY, left: box.left, top: box.top};
        const target = event.currentTarget;
        target.setPointerCapture(event.pointerId);
        setDrag({left: start.left, top: start.top});
        const handleMove = moveEvent => {
            setDrag({left: start.left + moveEvent.clientX - start.x, top: start.top + moveEvent.clientY - start.y});
        };
        const handleUp = upEvent => {
            target.removeEventListener('pointermove', handleMove);
            target.removeEventListener('pointerup', handleUp);
            target.removeEventListener('pointercancel', handleUp);
            setDrag(null);
            update(snapToCorner({
                left: start.left + upEvent.clientX - start.x,
                top: start.top + upEvent.clientY - start.y,
                host,
                size
            }));
        };
        target.addEventListener('pointermove', handleMove);
        target.addEventListener('pointerup', handleUp);
        target.addEventListener('pointercancel', handleUp);
    }, [box.left, box.top, host, size.width, size.height, update]);

    const handleMoveKeyDown = useCallback(event => {
        const corner = nextCorner(layoutRef.current.corner, event.key);
        if (corner === layoutRef.current.corner) return;
        event.preventDefault();
        update({corner});
    }, [update]);

    const handleResizePointerDown = useCallback(event => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const target = event.currentTarget;
        target.setPointerCapture(event.pointerId);
        const start = {x: event.clientX, y: event.clientY, width};
        const xSign = isRight(layoutRef.current.corner) ? -1 : 1;
        const followsY = !isBottom(layoutRef.current.corner);
        const widthFor = moveEvent => {
            const byX = xSign * (moveEvent.clientX - start.x);
            const byY = followsY ? (moveEvent.clientY - start.y) / aspect : 0;
            const delta = Math.abs(byX) >= Math.abs(byY) ? byX : byY;
            return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, start.width + delta));
        };
        const handleMove = moveEvent => {
            setLayout(previous => ({...previous, width: widthFor(moveEvent)}));
        };
        const handleUp = upEvent => {
            target.removeEventListener('pointermove', handleMove);
            target.removeEventListener('pointerup', handleUp);
            target.removeEventListener('pointercancel', handleUp);
            update({width: fitWidth({width: widthFor(upEvent), host, aspect, chromeHeight, chromeWidth})});
        };
        target.addEventListener('pointermove', handleMove);
        target.addEventListener('pointerup', handleUp);
        target.addEventListener('pointercancel', handleUp);
    }, [aspect, chromeHeight, chromeWidth, host, update, width]);

    const handleResizeKeyDown = useCallback(event => {
        const grow = {ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1}[event.key];
        if (!grow) return;
        event.preventDefault();
        const towardsLeft = isRight(layoutRef.current.corner) ? -1 : 1;
        const step = ['ArrowLeft', 'ArrowRight'].includes(event.key) ? grow * towardsLeft : grow;
        update({width: fitWidth({width: width + (step * RESIZE_STEP), host, aspect, chromeHeight, chromeWidth})});
    }, [aspect, chromeHeight, chromeWidth, host, update, width]);

    const handleToggleCollapsed = useCallback(() => {
        update({collapsed: !layoutRef.current.collapsed});
    }, [update]);

    const gripCorner = `bottom-${isRight(layout.corner) ? 'left' : 'right'}`;

    return (
        <section
            aria-label={intl.formatMessage(messages.stage)}
            className={classNames(styles.window, {
                [styles.dragging]: Boolean(drag),
                [styles.collapsed]: layout.collapsed
            })}
            ref={rootRef}
            style={{left: `${box.left}px`, top: `${box.top}px`, width: `${width}px`}}
        >
            <div
                className={styles.header}
                onPointerDown={handleMovePointerDown}
            >
                <button
                    aria-label={intl.formatMessage(messages.move)}
                    className={classNames(styles.headerButton, styles.moveHandle)}
                    title={intl.formatMessage(messages.move)}
                    type="button"
                    onKeyDown={handleMoveKeyDown}
                >
                    <GripVertical
                        aria-hidden="true"
                        size={16}
                    />
                </button>
                <div className={styles.controls}>
                    <Controls vm={vm} />
                </div>
                <div className={styles.dragArea} />
                <div className={styles.actions}>
                    <button
                        aria-label={intl.formatMessage(messages.variables)}
                        className={styles.headerButton}
                        title={intl.formatMessage(messages.variables)}
                        type="button"
                        onClick={onOpenVariableManager}
                    >
                        <Database
                            aria-hidden="true"
                            size={16}
                        />
                    </button>
                    <ScreenshotButton
                        buttonClassName={styles.headerButton}
                        buttonIconClassName={styles.headerIcon}
                        vm={vm}
                    />
                    <button
                        aria-label={intl.formatMessage(messages.fullScreen)}
                        className={styles.headerButton}
                        title={intl.formatMessage(messages.fullScreen)}
                        type="button"
                        onClick={onFullScreen}
                    >
                        <Maximize
                            aria-hidden="true"
                            size={16}
                        />
                    </button>
                    <button
                        aria-expanded={!layout.collapsed}
                        aria-label={intl.formatMessage(layout.collapsed ? messages.expand : messages.collapse)}
                        className={styles.headerButton}
                        title={intl.formatMessage(layout.collapsed ? messages.expand : messages.collapse)}
                        type="button"
                        onClick={handleToggleCollapsed}
                    >
                        {layout.collapsed ? (
                            <ChevronDown
                                aria-hidden="true"
                                size={16}
                            />
                        ) : (
                            <ChevronUp
                                aria-hidden="true"
                                size={16}
                            />
                        )}
                    </button>
                </div>
            </div>
            <div
                aria-hidden={layout.collapsed}
                className={classNames(styles.stageArea, {[styles.stageAreaHidden]: layout.collapsed})}
            >
                {isRendererSupported ? (
                    <Stage
                        stageContainerWidth={stageWidth}
                        stageSize={STAGE_SIZE_MODES.full}
                        vm={vm}
                    />
                ) : null}
            </div>
            {layout.collapsed ? null : (
                <div
                    aria-label={intl.formatMessage(messages.resize)}
                    aria-orientation="vertical"
                    aria-valuemax={MAX_WIDTH}
                    aria-valuemin={MIN_WIDTH}
                    aria-valuenow={width}
                    className={classNames(styles.resizeGrip, styles[gripCorner])}
                    role="separator"
                    tabIndex={0}
                    title={intl.formatMessage(messages.resize)}
                    onKeyDown={handleResizeKeyDown}
                    onPointerDown={handleResizePointerDown}
                />
            )}
        </section>
    );
};

FloatingStage.propTypes = {
    customStageSize: PropTypes.shape({
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired
    }).isRequired,
    intl: intlShape.isRequired,
    isRendererSupported: PropTypes.bool.isRequired,
    isRtl: PropTypes.bool,
    onFullScreen: PropTypes.func.isRequired,
    onOpenVariableManager: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    customStageSize: state.scratchGui.customStageSize,
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = dispatch => ({
    onFullScreen: () => dispatch(setFullScreen(true)),
    onOpenVariableManager: () => dispatch(openVariableManagerModal())
});

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(FloatingStage));
