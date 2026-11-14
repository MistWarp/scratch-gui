import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import {clipLength, computePeaks, levelOf} from '../../lib/audio/sound-data.js';
import {formatSeconds} from '../../lib/audio/sound-time.js';
import styles from './sound-timeline.css';

const TICK_STEPS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
const MIN_TICK_SPACING = 72;
const HANDLE_SLOP = 7;
const CLICK_SLOP = 3;

const readColor = (element, name, fallback) => {
    const value = getComputedStyle(element)
        .getPropertyValue(name)
        .trim();
    return value || fallback;
};

const prepareCanvas = (canvas, width, height) => {
    const ratio = window.devicePixelRatio || 1;
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    return context;
};

const drawChannel = (context, channel, start, length, width, top, height, color, level) => {
    const middle = top + (height / 2);
    const scale = (height / 2) * 0.94;
    context.fillStyle = color;
    context.strokeStyle = color;
    const columns = Math.max(1, Math.floor(width));
    if (length / columns <= 1.5) {
        context.beginPath();
        const first = Math.max(0, Math.floor(start));
        const last = Math.min(channel.length - 1, Math.ceil(start + length));
        for (let i = first; i <= last; i++) {
            const x = ((i - start) / length) * width;
            const y = middle - (channel[i] * scale);
            if (i === first) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.lineWidth = 1.25;
        context.stroke();
        return;
    }
    const {min, max} = computePeaks(channel, start, start + length, columns, level);
    const columnWidth = width / columns;
    for (let x = 0; x < columns; x++) {
        const yTop = middle - (Math.min(1, max[x]) * scale);
        const yBottom = middle - (Math.max(-1, min[x]) * scale);
        context.fillRect(x * columnWidth, yTop, Math.max(1, columnWidth), Math.max(1, yBottom - yTop));
    }
};

const chooseTickStep = (secondsVisible, width) => {
    for (const step of TICK_STEPS) {
        if ((step / secondsVisible) * width >= MIN_TICK_SPACING) return step;
    }
    return TICK_STEPS[TICK_STEPS.length - 1];
};

class SoundTimeline extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleLanePointerDown',
            'handleLanePointerMove',
            'handleLanePointerUp',
            'handleOverviewPointerDown',
            'handleOverviewPointerMove',
            'handleOverviewPointerUp',
            'handleWheel',
            'handleResize',
            'setRoot',
            'setLanes',
            'setLaneCanvas',
            'setOverviewCanvas'
        ]);
        this.state = {width: 0, laneHeight: 0};
        this.drag = null;
        this.overviewDrag = null;
        this.pointers = new Map();
        this.pinch = null;
    }
    componentDidMount () {
        if (typeof ResizeObserver !== 'undefined' && this.lanes) {
            this.resizeObserver = new ResizeObserver(this.handleResize);
            this.resizeObserver.observe(this.lanes);
        }
        this.handleResize();
        if (this.root) this.root.addEventListener('wheel', this.handleWheel, {passive: false});
        this.drawAll();
    }
    componentDidUpdate (prevProps, prevState) {
        const p = this.props;
        const changedView = prevProps.viewStart !== p.viewStart || prevProps.viewLength !== p.viewLength;
        const changedClip = prevProps.clipVersion !== p.clipVersion || prevProps.clip !== p.clip;
        const changedSize = prevState.width !== this.state.width || prevState.laneHeight !== this.state.laneHeight;
        if (changedClip || changedSize || prevProps.theme !== p.theme) {
            this.drawAll();
        } else if (changedView) {
            this.drawLanes();
        }
    }
    componentWillUnmount () {
        if (this.resizeObserver) this.resizeObserver.disconnect();
        if (this.root) this.root.removeEventListener('wheel', this.handleWheel);
    }
    handleResize () {
        if (!this.lanes) return;
        const rect = this.lanes.getBoundingClientRect();
        const width = Math.round(rect.width);
        const laneHeight = Math.round(rect.height);
        if (width !== this.state.width || laneHeight !== this.state.laneHeight) {
            this.setState({width, laneHeight});
        }
    }
    drawAll () {
        this.drawOverview();
        this.drawLanes();
    }
    drawOverview () {
        const canvas = this.overviewCanvas;
        const {clip} = this.props;
        const width = this.state.width;
        if (!canvas || !width) return;
        const height = canvas.clientHeight || 28;
        const context = prepareCanvas(canvas, width, height);
        if (!context) return;
        const length = clipLength(clip);
        if (!length) return;
        const color = readColor(this.root, '--sound-wave', '#855cd6');
        context.globalAlpha = 0.55;
        drawChannel(context, clip.channels[0], 0, length, width, 0, height, color, levelOf(this.props.peakIndex, 0));
        context.globalAlpha = 1;
    }
    drawLanes () {
        const canvas = this.laneCanvas;
        const {clip, viewStart, viewLength} = this.props;
        const {width, laneHeight} = this.state;
        if (!canvas || !width || !laneHeight) return;
        const context = prepareCanvas(canvas, width, laneHeight);
        if (!context) return;
        const channelCount = clip.channels.length;
        const laneSize = laneHeight / channelCount;
        const wave = readColor(this.root, '--sound-wave', '#855cd6');
        const axis = readColor(this.root, '--sound-axis', 'rgba(0, 0, 0, 0.12)');
        clip.channels.forEach((channel, c) => {
            const top = c * laneSize;
            context.fillStyle = axis;
            context.fillRect(0, Math.round(top + (laneSize / 2)), width, 1);
            if (c > 0) context.fillRect(0, Math.round(top), width, 1);
            drawChannel(
                context, channel, viewStart, Math.max(1, viewLength), width, top, laneSize, wave,
                levelOf(this.props.peakIndex, c)
            );
        });
    }
    sampleAt (clientX) {
        const rect = this.lanes.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const sample = this.props.viewStart + ((x / Math.max(1, rect.width)) * this.props.viewLength);
        return Math.max(0, Math.min(clipLength(this.props.clip), Math.round(sample)));
    }
    xOf (sample) {
        const {viewStart, viewLength} = this.props;
        return ((sample - viewStart) / Math.max(1, viewLength)) * this.state.width;
    }
    handleLanePointerDown (event) {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        event.preventDefault();
        this.lanes.setPointerCapture(event.pointerId);
        this.pointers.set(event.pointerId, event.clientX);
        if (this.pointers.size === 2) {
            const [a, b] = Array.from(this.pointers.values());
            this.drag = null;
            const rect = this.lanes.getBoundingClientRect();
            const middle = (a + b) / 2;
            this.pinch = {
                distance: Math.max(1, Math.abs(a - b)),
                center: this.sampleAt(middle),
                fraction: Math.max(0, Math.min(1, (middle - rect.left) / Math.max(1, rect.width))),
                viewLength: this.props.viewLength
            };
            return;
        }
        const {selection} = this.props;
        const rect = this.lanes.getBoundingClientRect();
        const x = event.clientX - rect.left;
        let edge = null;
        if (selection) {
            if (Math.abs(x - this.xOf(selection.start)) <= HANDLE_SLOP) edge = 'start';
            else if (Math.abs(x - this.xOf(selection.end)) <= HANDLE_SLOP) edge = 'end';
        }
        const sample = this.sampleAt(event.clientX);
        if (edge) {
            const fixed = edge === 'start' ? selection.end : selection.start;
            this.drag = {mode: 'edge', fixed, startX: event.clientX};
        } else if (event.shiftKey) {
            const anchor = selection ? (sample < selection.start ? selection.end : selection.start) :
                this.props.cursor;
            this.drag = {mode: 'select', anchor, startX: event.clientX, moved: true};
            this.props.onSelect(Math.min(anchor, sample), Math.max(anchor, sample));
        } else {
            this.drag = {mode: 'select', anchor: sample, startX: event.clientX, moved: false};
        }
    }
    handleLanePointerMove (event) {
        if (this.pointers.has(event.pointerId)) this.pointers.set(event.pointerId, event.clientX);
        if (this.pinch && this.pointers.size === 2) {
            const [a, b] = Array.from(this.pointers.values());
            const distance = Math.max(1, Math.abs(a - b));
            const length = this.pinch.viewLength * (this.pinch.distance / distance);
            this.props.onZoomAround(this.pinch.center, length, this.pinch.fraction);
            return;
        }
        if (!this.drag) {
            if (this.props.selection && this.lanes) {
                const rect = this.lanes.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const near = Math.abs(x - this.xOf(this.props.selection.start)) <= HANDLE_SLOP ||
                    Math.abs(x - this.xOf(this.props.selection.end)) <= HANDLE_SLOP;
                this.lanes.style.cursor = near ? 'ew-resize' : '';
            }
            return;
        }
        const sample = this.sampleAt(event.clientX);
        if (this.drag.mode === 'edge') {
            this.props.onSelect(Math.min(this.drag.fixed, sample), Math.max(this.drag.fixed, sample));
            return;
        }
        if (!this.drag.moved && Math.abs(event.clientX - this.drag.startX) < CLICK_SLOP) return;
        this.drag.moved = true;
        this.props.onSelect(Math.min(this.drag.anchor, sample), Math.max(this.drag.anchor, sample));
    }
    handleLanePointerUp (event) {
        this.pointers.delete(event.pointerId);
        if (this.pinch) {
            if (this.pointers.size < 2) this.pinch = null;
            return;
        }
        const drag = this.drag;
        this.drag = null;
        if (!drag) return;
        if (drag.mode === 'select' && !drag.moved) {
            this.props.onSeek(this.sampleAt(event.clientX));
        }
    }
    handleOverviewPointerDown (event) {
        event.preventDefault();
        this.overviewCanvas.parentElement.setPointerCapture(event.pointerId);
        this.overviewDrag = true;
        this.panOverviewTo(event.clientX);
    }
    handleOverviewPointerMove (event) {
        if (this.overviewDrag) this.panOverviewTo(event.clientX);
    }
    handleOverviewPointerUp () {
        this.overviewDrag = false;
    }
    panOverviewTo (clientX) {
        const rect = this.overviewCanvas.getBoundingClientRect();
        const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
        const center = fraction * clipLength(this.props.clip);
        this.props.onView(center - (this.props.viewLength / 2), this.props.viewLength);
    }
    handleWheel (event) {
        if (!this.lanes) return;
        const {viewStart, viewLength} = this.props;
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const rect = this.lanes.getBoundingClientRect();
            const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
            const anchor = viewStart + (fraction * viewLength);
            const pixels = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
            this.props.onZoomAround(anchor, viewLength * Math.exp(pixels * 0.0025), fraction);
            return;
        }
        const total = clipLength(this.props.clip);
        if (viewLength >= total) return;
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (!delta) return;
        event.preventDefault();
        const pixels = event.deltaMode === 1 ? delta * 16 : delta;
        this.props.onView(viewStart + ((pixels / Math.max(1, this.state.width)) * viewLength), viewLength);
    }
    setRoot (element) {
        this.root = element;
    }
    setLanes (element) {
        this.lanes = element;
    }
    setLaneCanvas (element) {
        this.laneCanvas = element;
    }
    setOverviewCanvas (element) {
        this.overviewCanvas = element;
    }
    renderRuler () {
        const {clip, viewStart, viewLength} = this.props;
        const width = this.state.width;
        if (!width) return null;
        const rate = clip.sampleRate;
        const key = `${viewStart}:${viewLength}:${width}:${rate}`;
        if (this.rulerCache && this.rulerCache.key === key) return this.rulerCache.ticks;
        const startSeconds = viewStart / rate;
        const secondsVisible = Math.max(1 / rate, viewLength / rate);
        const step = chooseTickStep(secondsVisible, width);
        const decimals = step >= 1 ? 0 : (String(step).split('.')[1] || '').length;
        const ticks = [];
        const first = Math.ceil(startSeconds / step) * step;
        for (let t = first; t <= startSeconds + secondsVisible + 1e-9; t += step) {
            const x = ((t - startSeconds) / secondsVisible) * width;
            ticks.push(
                <span
                    key={t.toFixed(4)}
                    className={styles.tick}
                    style={{transform: `translateX(${x}px)`}}
                >
                    {formatSeconds(t, decimals)}
                </span>
            );
        }
        this.rulerCache = {key, ticks};
        return ticks;
    }
    renderMarker (sample, className) {
        if (sample === null || typeof sample !== 'number') return null;
        const x = this.xOf(sample);
        if (x < -1 || x > this.state.width + 1) return null;
        return (
            <div
                className={className}
                style={{transform: `translateX(${x}px)`}}
            />
        );
    }
    render () {
        const {clip, viewStart, viewLength, selection, cursor, playhead, channelLabels} = this.props;
        const total = Math.max(1, clipLength(clip));
        const width = this.state.width;
        let selectionBox = null;
        if (selection && selection.end > selection.start && width) {
            const left = Math.max(0, this.xOf(selection.start));
            const right = Math.min(width, this.xOf(selection.end));
            if (right > 0 && left < width) {
                selectionBox = (
                    <div
                        className={styles.selection}
                        style={{transform: `translateX(${left}px)`, width: `${Math.max(1, right - left)}px`}}
                    >
                        <span className={classNames(styles.handle, styles.handleStart)} />
                        <span className={classNames(styles.handle, styles.handleEnd)} />
                    </div>
                );
            }
        }
        const viewportLeft = (viewStart / total) * 100;
        const viewportWidth = Math.min(100, (viewLength / total) * 100);
        const overviewSelection = selection && selection.end > selection.start ? (
            <div
                className={styles.overviewSelection}
                style={{
                    left: `${(selection.start / total) * 100}%`,
                    width: `${((selection.end - selection.start) / total) * 100}%`
                }}
            />
        ) : null;
        return (
            <div
                className={classNames(styles.timeline, {[styles.withLabels]: clip.channels.length > 1})}
                ref={this.setRoot}
            >
                <div
                    className={styles.overview}
                    onPointerDown={this.handleOverviewPointerDown}
                    onPointerMove={this.handleOverviewPointerMove}
                    onPointerUp={this.handleOverviewPointerUp}
                    onPointerCancel={this.handleOverviewPointerUp}
                >
                    <canvas
                        className={styles.overviewCanvas}
                        ref={this.setOverviewCanvas}
                    />
                    {overviewSelection}
                    {viewportWidth < 100 ? (
                        <div
                            className={styles.viewport}
                            style={{left: `${viewportLeft}%`, width: `${Math.max(1, viewportWidth)}%`}}
                        />
                    ) : null}
                </div>
                <div
                    className={styles.ruler}
                    aria-hidden="true"
                >
                    {this.renderRuler()}
                </div>
                <div className={styles.laneArea}>
                    {clip.channels.length > 1 ? (
                        <div
                            className={styles.channelLabels}
                            aria-hidden="true"
                        >
                            {clip.channels.map((channel, c) => (
                                <span key={c}>{channelLabels[c] || String(c + 1)}</span>
                            ))}
                        </div>
                    ) : null}
                    <div
                        className={styles.lanes}
                        ref={this.setLanes}
                        role="group"
                        tabIndex={0}
                        aria-label={this.props.label}
                        aria-describedby={this.props.describedBy}
                        onPointerDown={this.handleLanePointerDown}
                        onPointerMove={this.handleLanePointerMove}
                        onPointerUp={this.handleLanePointerUp}
                        onPointerCancel={this.handleLanePointerUp}
                    >
                        <canvas
                            className={styles.laneCanvas}
                            ref={this.setLaneCanvas}
                        />
                        {selectionBox}
                        {selection ? null : this.renderMarker(cursor, styles.cursor)}
                        {this.renderMarker(playhead, styles.playhead)}
                    </div>
                </div>
            </div>
        );
    }
}

SoundTimeline.propTypes = {
    channelLabels: PropTypes.arrayOf(PropTypes.string),
    clip: PropTypes.shape({
        channels: PropTypes.arrayOf(PropTypes.instanceOf(Float32Array)),
        sampleRate: PropTypes.number
    }).isRequired,
    clipVersion: PropTypes.number,
    cursor: PropTypes.number,
    onSeek: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onView: PropTypes.func.isRequired,
    describedBy: PropTypes.string,
    label: PropTypes.string,
    onZoomAround: PropTypes.func.isRequired,
    peakIndex: PropTypes.shape({
        blockSize: PropTypes.number,
        channels: PropTypes.arrayOf(PropTypes.object)
    }),
    playhead: PropTypes.number,
    selection: PropTypes.shape({
        start: PropTypes.number,
        end: PropTypes.number
    }),
    theme: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    viewLength: PropTypes.number.isRequired,
    viewStart: PropTypes.number.isRequired
};

SoundTimeline.defaultProps = {
    channelLabels: []
};

export default SoundTimeline;
