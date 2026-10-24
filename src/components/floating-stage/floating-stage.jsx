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
import FullscreenAPI from '../../lib/api/fullscreen';

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

const measure = element => {
    if (!element) return {width: 0, height: 0};
    return {width: element.clientWidth, height: element.clientHeight};
};

const notifyResize = () => window.dispatchEvent(new Event('resize'));

const FloatingStage = ({customStageSize, intl, isRendererSupported, onFullScreen, onOpenVariableManager, vm}) => {
    const [layout, setLayout] = useState(readLayout);
    const [host, setHost] = useState({width: 0, height: 0});
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
        setHost(measure(parent));
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => setHost(measure(parent)));
        observer.observe(parent);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const frame = requestAnimationFrame(notifyResize);
        return () => cancelAnimationFrame(frame);
    }, [stageWidth, layout.collapsed, layout.corner, layout.dx, layout.dy]);

    const box = drag ? {left: drag.left, top: drag.top} : boxFor({layout, host, size});

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
        const ySign = isBottom(layoutRef.current.corner) ? -1 : 1;
        const widthFor = moveEvent => {
            const byX = xSign * (moveEvent.clientX - start.x);
            const byY = (ySign * (moveEvent.clientY - start.y)) / aspect;
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

    const gripCorner = `${isBottom(layout.corner) ? 'top' : 'bottom'}-${isRight(layout.corner) ? 'left' : 'right'}`;

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
                    {FullscreenAPI.available() ? (
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
                    ) : null}
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
                className={styles.stageArea}
                hidden={layout.collapsed}
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
    onFullScreen: PropTypes.func.isRequired,
    onOpenVariableManager: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    customStageSize: state.scratchGui.customStageSize
});

const mapDispatchToProps = dispatch => ({
    onFullScreen: () => dispatch(setFullScreen(true)),
    onOpenVariableManager: () => dispatch(openVariableManagerModal())
});

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(FloatingStage));
