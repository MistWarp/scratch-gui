import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import {connect} from 'react-redux';
import {showStandardAlert} from '../reducers/alerts';

import {
    downsampleClipIfNeeded,
    encodeAndAddClipToVM,
    encodeClip,
    resampleClip
} from '../lib/audio/audio-util.js';
import {
    buildPeakIndex,
    clipLength,
    fromAudioBuffer,
    fromSamples,
    insertClip,
    isSameClip,
    nearestZeroCrossing,
    peakOf,
    removeRange,
    replaceRange,
    sliceClip
} from '../lib/audio/sound-data.js';
import {
    TOOLS,
    affectedRange,
    applyTool,
    defaultParams,
    getTool,
    nudgeParam,
    parseParam
} from '../lib/audio/sound-tools.js';
import {parseSeconds} from '../lib/audio/sound-time.js';
import SoundEditorComponent from '../components/sound-editor/sound-editor.jsx';
import AudioBufferPlayer from '../lib/audio/audio-buffer-player.js';
import AudioRecorder from '../lib/audio/audio-recorder.js';
import PlaybackMonitor from '../lib/audio/playback-monitor.js';
import {
    clampMarkers,
    nextMarker,
    previousMarker,
    regionAround,
    scaleMarkers,
    spliceMarkers,
    toggleMarker
} from '../lib/audio/sound-markers.js';
import SoundDropWatcher from './sound-drop-watcher.jsx';
import log from '../lib/utils/log.js';

const UNDO_STACK_SIZE = 50;
const UNDO_BYTE_LIMIT = 400 * 1024 * 1024;
const MIN_VIEW_SAMPLES = 64;
const ZOOM_STEP = 2;
const NUDGE_FRACTION = 0.02;
const SNAP_SECONDS = 0.01;
const COMPACT_WIDTH = 500;

let clipboard = null;
let snapEnabled = false;
const markerStore = new Map();

const emptyClip = sampleRate => ({channels: [new Float32Array(0)], sampleRate: sampleRate || 48000});

const loadClip = (audioBuffer, sampleRate) => (audioBuffer ? fromAudioBuffer(audioBuffer) : emptyClip(sampleRate));

const clipBytes = clip => clipLength(clip) * clip.channels.length * 4;

const historyBytes = stack => stack.reduce((total, item) => total + clipBytes(item.clip), 0);

const initialParams = () => TOOLS.reduce((all, tool) => {
    all[tool.id] = defaultParams(tool.id);
    return all;
}, {});

class SoundEditor extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleApply',
            'handleChangeMixSource',
            'handleChangeName',
            'handleChangeOption',
            'handleCopy',
            'handleCopyToNew',
            'handleCut',
            'handleDelete',
            'handleDropHover',
            'handleDropSound',
            'handleKeyPress',
            'handleNextMarker',
            'handleNudgeParam',
            'handlePaste',
            'handlePause',
            'handlePlay',
            'handlePlaybackEnded',
            'handlePlaybackUpdate',
            'handlePreview',
            'handlePreviewEnded',
            'handlePreviousMarker',
            'handleRecord',
            'handleRecordingError',
            'handleRecordingLevel',
            'handleRecordingStarted',
            'handleRedo',
            'handleSeek',
            'handleSelect',
            'handleSelectEnd',
            'handleSelectGroup',
            'handleSelectRegion',
            'handleSelectTool',
            'handleStop',
            'handleSubmitEnd',
            'handleSubmitParam',
            'handleSubmitStart',
            'handleToStart',
            'handleToggleLoop',
            'handleToggleMarker',
            'handleToggleSnap',
            'handleTrim',
            'handleUndo',
            'handleView',
            'handleZoomAround',
            'handleZoomFit',
            'handleZoomIn',
            'handleZoomOut',
            'measure',
            'sampleAtPoint',
            'setRef',
            'setTimeline'
        ]);
        this.monitor = new PlaybackMonitor();
        this.recorder = null;
        this.timeline = null;
        this.clip = loadClip(props.audioBuffer, props.sampleRate);
        this.peakIndex = buildPeakIndex(this.clip);
        this.undoStack = [];
        this.redoStack = [];
        this.editGeneration = 0;
        this.soundGeneration = 0;
        this.busy = false;
        this.shiftAnchor = null;
        this.resumeFrom = null;
        this.peakCache = null;
        this._isMounted = false;
        this.ref = null;
        this.groupChosen = false;
        this.sizeObserver = null;
        this.state = {
            activeGroup: 'volume',
            activeTool: 'gain',
            compact: false,
            busy: false,
            canPaste: clipboard !== null,
            clipVersion: 0,
            cursor: 0,
            dropSample: null,
            loop: false,
            markers: clampMarkers(markerStore.get(props.soundId) || [], clipLength(this.clip)),
            mixSource: '',
            params: initialParams(),
            playhead: null,
            playing: false,
            previewing: false,
            recording: 'idle',
            selection: null,
            snap: snapEnabled,
            viewStart: 0,
            viewLength: Math.max(1, clipLength(this.clip))
        };
    }
    componentDidMount () {
        this._isMounted = true;
        this.player = new AudioBufferPlayer(this.clip);
        document.addEventListener('keydown', this.handleKeyPress);
        this.measure();
        if (typeof ResizeObserver !== 'undefined' && this.ref) {
            this.sizeObserver = new ResizeObserver(this.measure);
            this.sizeObserver.observe(this.ref);
        }
    }
    componentDidUpdate (prevProps) {
        if (prevProps.soundId !== this.props.soundId) {
            this.loadSound();
        }
    }
    componentWillUnmount () {
        this.cancelRecording();
        this._isMounted = false;
        this.editGeneration++;
        this.soundGeneration++;
        this.stopAll();
        document.removeEventListener('keydown', this.handleKeyPress);
        if (this.sizeObserver) this.sizeObserver.disconnect();
    }
    loadSound () {
        this.cancelRecording();
        this.stopAll();
        this.editGeneration++;
        this.soundGeneration++;
        this.busy = false;
        this.undoStack = [];
        this.redoStack = [];
        this.resumeFrom = null;
        this.shiftAnchor = null;
        this.clip = loadClip(this.props.audioBuffer, this.props.sampleRate);
        this.peakIndex = buildPeakIndex(this.clip);
        this.player = new AudioBufferPlayer(this.clip);
        this.setState(state => ({
            busy: false,
            clipVersion: state.clipVersion + 1,
            cursor: 0,
            dropSample: null,
            markers: clampMarkers(markerStore.get(this.props.soundId) || [], clipLength(this.clip)),
            selection: null,
            viewStart: 0,
            viewLength: Math.max(1, clipLength(this.clip))
        }));
    }
    length () {
        return clipLength(this.clip);
    }
    hasSelection () {
        const {selection} = this.state;
        return Boolean(selection && selection.end > selection.start);
    }
    canRemoveSelection () {
        if (!this.hasSelection()) return false;
        const {start, end} = this.state.selection;
        return start > 0 || end < this.length();
    }
    targetRange () {
        if (this.hasSelection()) return [this.state.selection.start, this.state.selection.end];
        return [0, this.length()];
    }
    insertionPoint () {
        return this.hasSelection() ? this.state.selection.start : this.state.cursor;
    }
    clampView (start, length) {
        const total = Math.max(1, this.length());
        const viewLength = Math.max(Math.min(MIN_VIEW_SAMPLES, total), Math.min(total, length));
        const viewStart = Math.max(0, Math.min(total - viewLength, start));
        return {viewStart, viewLength};
    }
    stopPlayback () {
        if (this.player) this.player.stop();
    }
    stopPreview () {
        if (this.previewPlayer) {
            this.previewPlayer.stop();
            this.previewPlayer = null;
        }
    }
    stopAll () {
        this.stopPlayback();
        this.stopPreview();
        this.monitor.reset();
        if (this._isMounted) {
            this.setState({playing: false, previewing: false, playhead: null});
        }
    }
    storeMarkers (markers) {
        if (markers.length) markerStore.set(this.props.soundId, markers);
        else markerStore.delete(this.props.soundId);
    }
    pushUndo (item) {
        this.undoStack.push(item);
        while (this.undoStack.length > 1 &&
            (this.undoStack.length > UNDO_STACK_SIZE || historyBytes(this.undoStack) > UNDO_BYTE_LIMIT)) {
            this.undoStack.shift();
        }
    }
    snapshot () {
        return {
            clip: this.clip,
            selection: this.state.selection,
            cursor: this.state.cursor,
            markers: this.state.markers
        };
    }
    submitClip (newClip, {selection = null, cursor = null, markers = null, history = 'push'} = {}) {
        const editGeneration = ++this.editGeneration;
        this.stopAll();
        const previous = this.snapshot();
        const previousLength = this.length();
        return downsampleClipIfNeeded(newClip, resampleClip)
            .then(prepared => encodeClip(prepared).then(wav => ({prepared, wav})))
            .then(({prepared, wav}) => {
                if (!this._isMounted || editGeneration !== this.editGeneration) return false;
                if (history === 'push') {
                    this.redoStack = [];
                    this.pushUndo(previous);
                }
                const ratio = prepared.sampleRate / newClip.sampleRate;
                const scale = value => Math.round(value * ratio);
                const viewRatio = prepared.sampleRate / previous.clip.sampleRate;
                const scaleView = value => Math.round(value * viewRatio);
                const scaled = selection ? {start: scale(selection.start), end: scale(selection.end)} : null;
                this.clip = prepared;
                this.peakIndex = buildPeakIndex(prepared);
                this.player = new AudioBufferPlayer(prepared);
                this.props.vm.updateSoundBuffer(this.props.soundIndex, this.player.buffer, wav);
                this.resumeFrom = null;
                const total = this.length();
                this.setState(state => {
                    const viewStart = scaleView(state.viewStart);
                    const viewLength = scaleView(state.viewLength);
                    const keepZoom = viewLength < scaleView(previousLength) && viewLength < total;
                    const view = keepZoom ? this.clampView(viewStart, viewLength) :
                        {viewStart: 0, viewLength: Math.max(1, total)};
                    const nextCursor = cursor === null ? state.cursor : cursor;
                    const nextMarkers = clampMarkers(scaleMarkers(markers || state.markers, ratio), total);
                    this.storeMarkers(nextMarkers);
                    return {
                        ...view,
                        clipVersion: state.clipVersion + 1,
                        cursor: Math.min(total, scale(nextCursor)),
                        markers: nextMarkers,
                        selection: scaled && scaled.end > scaled.start ? scaled : null
                    };
                });
                return true;
            })
            .catch(error => {
                log.error(`Encountered error while trying to encode sound update: ${error.message}`);
                return false;
            });
    }
    setBusy (busy) {
        this.busy = busy;
        if (this._isMounted) this.setState({busy});
    }
    runEdit (makeClip) {
        if (this.busy) return Promise.resolve(false);
        const soundGeneration = this.soundGeneration;
        this.setBusy(true);
        return Promise.resolve()
            .then(makeClip)
            .then(result => {
                if (!result || soundGeneration !== this.soundGeneration) return false;
                if (isSameClip(result.clip, this.clip)) return false;
                let markers = result.markers || null;
                if (!markers && result.splice) markers = spliceMarkers(this.state.markers, result.splice);
                return this.submitClip(result.clip, {selection: result.selection, cursor: result.cursor, markers});
            })
            .catch(error => {
                log.error(error);
                return false;
            })
            .then(success => {
                if (soundGeneration === this.soundGeneration) this.setBusy(false);
                return success;
            });
    }
    stepHistory (from, to) {
        if (this.busy || !from.length) return Promise.resolve(false);
        const soundGeneration = this.soundGeneration;
        const item = from[from.length - 1];
        const current = this.snapshot();
        this.setBusy(true);
        return this.submitClip(item.clip, {
            selection: item.selection,
            cursor: item.cursor,
            markers: item.markers,
            history: 'none'
        })
            .then(success => {
                if (soundGeneration !== this.soundGeneration) return false;
                if (success) {
                    from.pop();
                    to.push(current);
                }
                this.setBusy(false);
                return success;
            });
    }
    handlePlay () {
        if (this.state.recording !== 'idle') return;
        this.stopPreview();
        const [start, end] = this.targetRange();
        const fallback = this.hasSelection() ? start : this.state.cursor;
        let from = this.resumeFrom === null ? fallback : this.resumeFrom;
        if (from >= end) from = start;
        this.player.playRange({
            start,
            end,
            from,
            loop: this.state.loop,
            onUpdate: this.handlePlaybackUpdate,
            onEnded: this.handlePlaybackEnded
        });
        this.resumeFrom = null;
        this.setState({playing: true, previewing: false});
    }
    handlePlaybackUpdate (sample, levels) {
        if (!this._isMounted) return;
        this.monitor.update({sample, levels});
        const {viewStart, viewLength} = this.state;
        if (viewLength < this.length() && (sample < viewStart || sample > viewStart + viewLength)) {
            this.setState(this.clampView(sample - (viewLength * 0.1), viewLength));
        }
    }
    handlePlaybackEnded () {
        if (!this._isMounted) return;
        this.resumeFrom = null;
        this.monitor.reset();
        this.setState({playing: false, playhead: null});
    }
    handlePause () {
        const position = this.player.currentSample();
        this.stopPlayback();
        if (position !== null) {
            this.resumeFrom = Math.round(position);
            if (!this.hasSelection()) this.setState({cursor: Math.round(position)});
        }
        this.monitor.reset();
        this.setState({playing: false, playhead: position === null ? null : Math.round(position)});
    }
    handleStop () {
        if (this.state.recording !== 'idle') {
            this.finishRecording();
            return;
        }
        this.resumeFrom = null;
        this.stopAll();
    }
    handleToStart () {
        this.resumeFrom = null;
        const wasPlaying = this.state.playing;
        this.stopAll();
        this.setState({cursor: 0, selection: null, ...this.clampView(0, this.state.viewLength)}, () => {
            if (wasPlaying) this.handlePlay();
        });
    }
    handleToggleLoop () {
        this.setState(state => ({loop: !state.loop}), () => {
            if (this.state.playing) {
                this.resumeFrom = Math.round(this.player.currentSample() || 0);
                this.handlePlay();
            }
        });
    }
    handleSeek (sample) {
        const wasPlaying = this.state.playing;
        this.resumeFrom = null;
        this.stopPreview();
        if (!wasPlaying) this.monitor.reset();
        this.setState({
            cursor: sample,
            selection: null,
            playhead: wasPlaying ? sample : null,
            previewing: false
        }, () => {
            if (wasPlaying) this.handlePlay();
        });
    }
    handleSelect (start, end) {
        this.resumeFrom = null;
        this.shiftAnchor = null;
        if (this.state.playing || this.state.previewing) this.stopAll();
        const total = this.length();
        const a = Math.max(0, Math.min(total, Math.round(start)));
        const b = Math.max(0, Math.min(total, Math.round(end)));
        this.setState({
            selection: b > a ? {start: a, end: b} : null,
            cursor: a,
            playhead: null
        });
    }
    handleView (start, length) {
        this.setState(this.clampView(start, length));
    }
    handleZoomAround (anchor, length, fraction) {
        const view = this.clampView(0, length);
        this.setState(this.clampView(anchor - (fraction * view.viewLength), view.viewLength));
    }
    zoomBy (factor) {
        const {viewStart, viewLength, playhead, selection, cursor} = this.state;
        let anchor = cursor;
        if (playhead !== null) anchor = playhead;
        else if (selection) anchor = (selection.start + selection.end) / 2;
        if (anchor < viewStart || anchor > viewStart + viewLength) anchor = viewStart + (viewLength / 2);
        const fraction = (anchor - viewStart) / Math.max(1, viewLength);
        this.handleZoomAround(anchor, viewLength * factor, fraction);
    }
    handleZoomIn () {
        this.zoomBy(1 / ZOOM_STEP);
    }
    handleZoomOut () {
        this.zoomBy(ZOOM_STEP);
    }
    handleZoomFit () {
        this.setState({viewStart: 0, viewLength: Math.max(1, this.length())});
    }
    secondsToSample (text) {
        const seconds = parseSeconds(text);
        if (seconds === null) return null;
        return Math.max(0, Math.min(this.length(), Math.round(seconds * this.clip.sampleRate)));
    }
    handleSubmitStart (text) {
        const sample = this.secondsToSample(text);
        if (sample === null) return;
        if (this.hasSelection() && sample < this.state.selection.end) {
            this.handleSelect(sample, this.state.selection.end);
        } else {
            this.handleSeek(sample);
        }
    }
    handleSubmitEnd (text) {
        const sample = this.secondsToSample(text);
        if (sample === null) return;
        const start = this.hasSelection() ? this.state.selection.start : this.state.cursor;
        if (sample > start) this.handleSelect(start, sample);
    }
    copySelection () {
        const [start, end] = this.targetRange();
        clipboard = sliceClip(this.clip, start, end);
        this.setState({canPaste: true});
    }
    handleCopy () {
        this.copySelection();
    }
    handleCut () {
        if (!this.canRemoveSelection()) return Promise.resolve(false);
        this.copySelection();
        return this.handleDelete();
    }
    handleDelete () {
        if (!this.canRemoveSelection()) return Promise.resolve(false);
        const {start, end} = this.state.selection;
        return this.runEdit(() => ({
            clip: removeRange(this.clip, start, end),
            selection: null,
            cursor: start,
            splice: {at: start, removed: end - start, inserted: 0}
        }));
    }
    handleTrim () {
        if (!this.canRemoveSelection()) return Promise.resolve(false);
        const {start, end} = this.state.selection;
        return this.runEdit(() => ({
            clip: sliceClip(this.clip, start, end),
            selection: null,
            cursor: 0,
            markers: this.state.markers
                .filter(marker => marker >= start && marker <= end)
                .map(marker => marker - start)
        }));
    }
    insertAtCursor (prepared) {
        const length = clipLength(prepared);
        if (this.hasSelection()) {
            const {start, end} = this.state.selection;
            return {
                clip: replaceRange(this.clip, start, end, prepared),
                selection: {start, end: start + length},
                splice: {at: start, removed: end - start, inserted: length}
            };
        }
        const at = this.state.cursor;
        return {
            clip: insertClip(this.clip, at, prepared),
            selection: {start: at, end: at + length},
            splice: {at, removed: 0, inserted: length}
        };
    }
    matchRate (source) {
        if (source.sampleRate === this.clip.sampleRate) return Promise.resolve(source);
        return resampleClip(source, this.clip.sampleRate);
    }
    handlePaste () {
        if (!clipboard) return Promise.resolve(false);
        const source = clipboard;
        return this.runEdit(() => this.matchRate(source).then(prepared => this.insertAtCursor(prepared)));
    }
    handleCopyToNew () {
        const targetId = this.props.vm.editingTarget && this.props.vm.editingTarget.id;
        const [start, end] = this.targetRange();
        return encodeAndAddClipToVM(this.props.vm, sliceClip(this.clip, start, end), this.props.name, targetId)
            .then(() => true)
            .catch(error => {
                log.error(error);
                this.props.onShowImportError();
                return false;
            });
    }
    handleUndo () {
        return this.stepHistory(this.undoStack, this.redoStack);
    }
    handleRedo () {
        return this.stepHistory(this.redoStack, this.undoStack);
    }
    handleChangeName (name) {
        if (!name.trim()) return;
        this.props.vm.renameSound(this.props.soundIndex, name);
    }
    handleSelectGroup (event) {
        const group = event.currentTarget.getAttribute('data-group');
        this.groupChosen = true;
        this.stopPreview();
        this.setState(state => {
            const current = getTool(state.activeTool);
            if (current && current.group === group) return {activeGroup: group, previewing: false};
            const first = TOOLS.find(tool => tool.group === group);
            return {activeGroup: group, activeTool: first ? first.id : null, previewing: false};
        });
    }
    handleSelectTool (event) {
        this.stopPreview();
        this.setState({activeTool: event.currentTarget.getAttribute('data-tool'), previewing: false});
    }
    setParam (key, value) {
        this.stopPreview();
        this.setState(state => ({
            previewing: false,
            params: {
                ...state.params,
                [state.activeTool]: {...state.params[state.activeTool], [key]: value}
            }
        }));
    }
    handleNudgeParam (key, direction) {
        this.stopPreview();
        this.setState(state => {
            const current = state.params[state.activeTool];
            const value = current ? nudgeParam(state.activeTool, key, current[key], direction) : null;
            if (value === null) return null;
            return {
                previewing: false,
                params: {...state.params, [state.activeTool]: {...current, [key]: value}}
            };
        });
    }
    handleSubmitParam (key, text) {
        const value = parseParam(this.state.activeTool, key, text);
        if (value !== null) this.setParam(key, value);
    }
    handleChangeOption (event) {
        this.setParam(event.currentTarget.getAttribute('data-param'), event.currentTarget.getAttribute('data-value'));
    }
    handleChangeMixSource (event) {
        this.setState({mixSource: event.target.value});
    }
    mixSources () {
        return (this.props.soundNames || [])
            .map((name, index) => ({index: String(index), name}))
            .filter(source => Number(source.index) !== this.props.soundIndex);
    }
    loadSoundClip (index) {
        const buffer = this.props.vm.getSoundBuffer(index);
        if (!buffer) return Promise.reject(new Error('That sound has not loaded'));
        return this.matchRate(fromAudioBuffer(buffer));
    }
    loadMixSource () {
        const sources = this.mixSources();
        if (!sources.length) return Promise.reject(new Error('No sound to mix in'));
        const chosen = sources.find(source => source.index === this.state.mixSource) || sources[0];
        return this.loadSoundClip(Number(chosen.index));
    }
    computeTool () {
        const id = this.state.activeTool;
        const tool = getTool(id);
        if (!tool) return Promise.reject(new Error('No tool selected'));
        const selection = this.hasSelection() ? this.state.selection : null;
        const cursor = this.state.cursor;
        const loadSource = tool.needsSource ? this.loadMixSource() : Promise.resolve(null);
        return loadSource.then(source => applyTool(id, this.clip, {
            selection,
            cursor,
            params: this.state.params[id],
            source
        }).then(result => ({result, selection, cursor})));
    }
    handlePreview () {
        if (this.busy) return Promise.resolve(false);
        this.stopAll();
        this.setBusy(true);
        const generation = this.editGeneration;
        const soundGeneration = this.soundGeneration;
        return this.computeTool()
            .then(({result, selection, cursor}) => {
                if (!this._isMounted || generation !== this.editGeneration) return false;
                const [start, end] = affectedRange(this.state.activeTool, this.clip, selection, cursor, result);
                this.previewPlayer = new AudioBufferPlayer(result.clip);
                this.previewPlayer.playRange({
                    start,
                    end,
                    onUpdate: this.handlePlaybackUpdate,
                    onEnded: this.handlePreviewEnded
                });
                this.setState({previewing: true});
                return true;
            })
            .catch(error => {
                log.error(error);
                return false;
            })
            .then(success => {
                if (soundGeneration === this.soundGeneration) this.setBusy(false);
                return success;
            });
    }
    handlePreviewEnded () {
        this.previewPlayer = null;
        this.monitor.reset();
        if (this._isMounted) this.setState({previewing: false, playhead: null});
    }
    handleApply () {
        return this.runEdit(() => this.computeTool().then(({result}) => result));
    }
    handleRecord () {
        if (this.busy || this.state.recording !== 'idle') return;
        this.stopAll();
        this.setBusy(true);
        this.setState({recording: 'starting'});
        this.recorder = new AudioRecorder();
        this.recorder.startListening(
            this.handleRecordingStarted,
            this.handleRecordingLevel,
            this.handleRecordingError
        );
    }
    handleRecordingStarted () {
        if (!this._isMounted || !this.recorder) return;
        this.recordingStart = Date.now();
        this.recorder.startRecording();
        this.monitor.update({recordingSeconds: 0, levels: [0]});
        this.setState({recording: 'recording'});
    }
    handleRecordingLevel (level) {
        if (!this._isMounted || this.state.recording !== 'recording') return;
        this.monitor.update({recordingSeconds: (Date.now() - this.recordingStart) / 1000, levels: [level]});
    }
    handleRecordingError (error) {
        log.error(error);
        this.cancelRecording();
        if (this._isMounted) this.props.onShowRecordingError();
    }
    cancelRecording () {
        if (!this.recorder) return;
        this.recorder.dispose();
        this.recorder = null;
        this.monitor.reset();
        this.setBusy(false);
        if (this._isMounted) this.setState({recording: 'idle'});
    }
    finishRecording () {
        const recorder = this.recorder;
        if (!recorder) return Promise.resolve(false);
        const wasRecording = this.state.recording === 'recording';
        const recorded = wasRecording ? recorder.stop() : null;
        this.cancelRecording();
        if (!recorded || !recorded.samples.length) return Promise.resolve(false);
        const from = Math.floor(recorded.trimStart * recorded.samples.length);
        const to = Math.ceil(recorded.trimEnd * recorded.samples.length);
        const source = fromSamples(recorded.samples.subarray(from, to), recorded.sampleRate);
        return this.runEdit(() => this.matchRate(source).then(prepared => this.insertAtCursor(prepared)));
    }
    setMarkers (markers) {
        this.storeMarkers(markers);
        this.setState({markers});
    }
    markerPosition () {
        if (this.state.playing && this.monitor.sample !== null) return Math.round(this.monitor.sample);
        return this.hasSelection() ? this.state.selection.start : this.state.cursor;
    }
    handleToggleMarker () {
        this.setMarkers(toggleMarker(this.state.markers, this.markerPosition()));
    }
    handlePreviousMarker () {
        const marker = previousMarker(this.state.markers, this.markerPosition());
        if (marker !== null) this.seekIntoView(marker);
    }
    handleNextMarker () {
        const marker = nextMarker(this.state.markers, this.markerPosition());
        if (marker !== null) this.seekIntoView(marker);
    }
    seekIntoView (sample) {
        const {viewStart, viewLength} = this.state;
        if (sample < viewStart || sample > viewStart + viewLength) {
            this.setState(this.clampView(sample - (viewLength / 2), viewLength));
        }
        this.handleSeek(sample);
    }
    handleSelectRegion (sample) {
        const {start, end} = regionAround(this.state.markers, sample, this.length());
        this.handleSelect(start, end);
    }
    handleToggleSnap () {
        snapEnabled = !this.state.snap;
        this.setState({snap: snapEnabled});
    }
    handleSelectEnd () {
        if (!this.state.snap || !this.hasSelection()) return;
        const radius = Math.round(this.clip.sampleRate * SNAP_SECONDS);
        const start = nearestZeroCrossing(this.clip, this.state.selection.start, radius);
        const end = nearestZeroCrossing(this.clip, this.state.selection.end, radius);
        if (end > start && (start !== this.state.selection.start || end !== this.state.selection.end)) {
            this.setState({selection: {start, end}, cursor: start});
        }
    }
    sampleAtPoint (x, y) {
        return this.timeline ? this.timeline.sampleAtPoint(x, y) : null;
    }
    handleDropHover (sample) {
        if (sample !== this.state.dropSample) this.setState({dropSample: sample});
    }
    handleDropSound (index, sample) {
        this.setState({dropSample: null});
        if (index === this.props.soundIndex) return Promise.resolve(false);
        return this.runEdit(() => this.loadSoundClip(index).then(source => applyTool('mix', this.clip, {
            selection: null,
            cursor: sample,
            params: {db: 0},
            source
        })));
    }
    handleKeyPress (event) {
        if (event.defaultPrevented) return;
        if (!this.props.isActive()) return;
        const target = event.target;
        if (target instanceof Element && (target.isContentEditable || target.closest(
            'input, textarea, select, [contenteditable], .ReactModal__Overlay, .addon-window'
        ))) {
            return;
        }
        if (this.props.isFullScreen) return;
        if (event.ctrlKey && event.altKey) return;
        const mod = event.metaKey || event.ctrlKey;
        const key = event.key;
        const lower = typeof key === 'string' ? key.toLowerCase() : '';
        if (mod && (lower === 'c' || lower === 'x') && String(window.getSelection ? window.getSelection() : '')) {
            return;
        }
        if (mod) {
            if ((lower === 'z' && event.shiftKey) || lower === 'y') {
                event.preventDefault();
                this.handleRedo();
            } else if (lower === 'z') {
                event.preventDefault();
                this.handleUndo();
            } else if (lower === 'c') {
                event.preventDefault();
                this.handleCopy();
            } else if (lower === 'x') {
                event.preventDefault();
                this.handleCut();
            } else if (lower === 'v') {
                event.preventDefault();
                this.handlePaste();
            } else if (lower === 'a') {
                event.preventDefault();
                this.handleSelect(0, this.length());
            } else if (key === 'ArrowLeft') {
                event.preventDefault();
                this.handlePreviousMarker();
            } else if (key === 'ArrowRight') {
                event.preventDefault();
                this.handleNextMarker();
            }
            return;
        }
        if (event.altKey) return;
        if (key === ' ' && target instanceof Element && target.closest('button, a, [role="button"]')) return;
        if (key === ' ') {
            event.preventDefault();
            if (this.state.playing) this.handlePause();
            else this.handlePlay();
        } else if (key === 'Delete' || key === 'Backspace') {
            event.preventDefault();
            if (event.shiftKey) this.handleTrim();
            else this.handleDelete();
        } else if (key === 'Escape') {
            event.preventDefault();
            this.handleStop();
            this.setState({selection: null});
        } else if (key === 'Home') {
            event.preventDefault();
            this.handleToStart();
        } else if (key === 'End') {
            event.preventDefault();
            this.handleSeek(this.length());
        } else if (key === '+' || key === '=') {
            event.preventDefault();
            this.handleZoomIn();
        } else if (key === '-' || key === '_') {
            event.preventDefault();
            this.handleZoomOut();
        } else if (key === '0') {
            event.preventDefault();
            this.handleZoomFit();
        } else if (lower === 'l') {
            event.preventDefault();
            this.handleToggleLoop();
        } else if (lower === 'm') {
            event.preventDefault();
            this.handleToggleMarker();
        } else if (key === '[') {
            event.preventDefault();
            this.handlePreviousMarker();
        } else if (key === ']') {
            event.preventDefault();
            this.handleNextMarker();
        } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
            event.preventDefault();
            this.nudge(key === 'ArrowLeft' ? -1 : 1, event.shiftKey);
        }
    }
    nudge (direction, extend) {
        const step = Math.max(1, Math.round(this.state.viewLength * NUDGE_FRACTION));
        const total = this.length();
        const clamp = value => Math.max(0, Math.min(total, value));
        if (!extend) {
            this.shiftAnchor = null;
            const base = this.hasSelection() ?
                (direction < 0 ? this.state.selection.start : this.state.selection.end) : this.state.cursor;
            this.handleSeek(clamp(base + (direction * step)));
            return;
        }
        let anchor = this.state.cursor;
        let moving = this.state.cursor;
        if (this.hasSelection()) {
            const {start, end} = this.state.selection;
            anchor = this.shiftAnchor === end ? end : start;
            moving = anchor === start ? end : start;
        }
        const next = clamp(moving + (direction * step));
        this.handleSelect(Math.min(anchor, next), Math.max(anchor, next));
        this.shiftAnchor = anchor;
    }
    peak () {
        const [start, end] = this.targetRange();
        const key = `${this.state.clipVersion}:${start}:${end}`;
        if (!this.peakCache || this.peakCache.key !== key) {
            this.peakCache = {key, value: peakOf(this.clip, start, end, this.peakIndex)};
        }
        return this.peakCache.value;
    }
    setRef (element) {
        this.ref = element;
    }
    measure () {
        const width = this.ref ? this.ref.getBoundingClientRect().width : 0;
        const compact = width > 0 && width < COMPACT_WIDTH;
        if (compact === this.state.compact) return;
        this.setState(state => {
            if (compact && !this.groupChosen) return {compact, activeGroup: 'edit', activeTool: null};
            if (!compact && state.activeGroup === 'edit') return {compact, activeGroup: 'volume', activeTool: 'gain'};
            return {compact};
        });
    }
    setTimeline (timeline) {
        this.timeline = timeline;
    }
    render () {
        const total = this.length();
        const sources = this.mixSources();
        const mixSource = sources.some(source => source.index === this.state.mixSource) ?
            this.state.mixSource : (sources[0] ? sources[0].index : '');
        const markerPosition = this.hasSelection() ? this.state.selection.start : this.state.cursor;
        return (<React.Fragment>
            <SoundDropWatcher
                sampleAtPoint={this.sampleAtPoint}
                soundIndex={this.props.soundIndex}
                onDropSound={this.handleDropSound}
                onHover={this.handleDropHover}
            />
            <SoundEditorComponent
                activeGroup={this.state.activeGroup}
                activeTool={this.state.activeTool}
                compact={this.state.compact}
                busy={this.state.busy}
                canNextMarker={nextMarker(this.state.markers, markerPosition) !== null}
                canPaste={this.state.canPaste}
                canPreviousMarker={previousMarker(this.state.markers, markerPosition) !== null}
                canRemove={this.canRemoveSelection()}
                canRedo={this.redoStack.length > 0}
                canUndo={this.undoStack.length > 0}
                canZoomIn={this.state.viewLength > Math.min(MIN_VIEW_SAMPLES, total)}
                canZoomOut={this.state.viewLength < total}
                clip={this.clip}
                clipVersion={this.state.clipVersion}
                cursor={Math.min(this.state.cursor, total)}
                dropSample={this.state.dropSample}
                duration={total / this.clip.sampleRate}
                isStereo={this.clip.channels.length > 1}
                loop={this.state.loop}
                markers={this.state.markers}
                mixSource={mixSource}
                mixSources={sources}
                monitor={this.monitor}
                name={this.props.name}
                peak={this.peak()}
                peakIndex={this.peakIndex}
                playhead={this.state.playhead}
                playing={this.state.playing}
                previewing={this.state.previewing}
                recording={this.state.recording}
                sampleRate={this.clip.sampleRate}
                selection={this.state.selection}
                setRef={this.setRef}
                size={this.props.size}
                snap={this.state.snap}
                theme={this.props.theme}
                timelineRef={this.setTimeline}
                toolParams={this.state.params[this.state.activeTool] || {}}
                viewLength={this.state.viewLength}
                viewStart={this.state.viewStart}
                onApply={this.handleApply}
                onChangeMixSource={this.handleChangeMixSource}
                onChangeName={this.handleChangeName}
                onChangeOption={this.handleChangeOption}
                onCopy={this.handleCopy}
                onCopyToNew={this.handleCopyToNew}
                onCut={this.handleCut}
                onDelete={this.handleDelete}
                onNextMarker={this.handleNextMarker}
                onNudgeParam={this.handleNudgeParam}
                onPaste={this.handlePaste}
                onPause={this.handlePause}
                onPlay={this.handlePlay}
                onPreview={this.handlePreview}
                onPreviousMarker={this.handlePreviousMarker}
                onRecord={this.handleRecord}
                onRedo={this.handleRedo}
                onSeek={this.handleSeek}
                onSelect={this.handleSelect}
                onSelectEnd={this.handleSelectEnd}
                onSelectGroup={this.handleSelectGroup}
                onSelectRegion={this.handleSelectRegion}
                onSelectTool={this.handleSelectTool}
                onStop={this.handleStop}
                onSubmitEnd={this.handleSubmitEnd}
                onSubmitParam={this.handleSubmitParam}
                onSubmitStart={this.handleSubmitStart}
                onToStart={this.handleToStart}
                onToggleLoop={this.handleToggleLoop}
                onToggleMarker={this.handleToggleMarker}
                onToggleSnap={this.handleToggleSnap}
                onTrim={this.handleTrim}
                onUndo={this.handleUndo}
                onView={this.handleView}
                onZoomAround={this.handleZoomAround}
                onZoomFit={this.handleZoomFit}
                onZoomIn={this.handleZoomIn}
                onZoomOut={this.handleZoomOut}
            />
        </React.Fragment>);
    }
}

SoundEditor.propTypes = {
    audioBuffer: PropTypes.shape({
        numberOfChannels: PropTypes.number,
        sampleRate: PropTypes.number,
        getChannelData: PropTypes.func
    }),
    isActive: PropTypes.func,
    isFullScreen: PropTypes.bool,
    name: PropTypes.string.isRequired,
    onShowImportError: PropTypes.func.isRequired,
    onShowRecordingError: PropTypes.func.isRequired,
    sampleRate: PropTypes.number,
    size: PropTypes.number,
    soundId: PropTypes.string,
    soundIndex: PropTypes.number,
    soundNames: PropTypes.arrayOf(PropTypes.string),
    theme: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    vm: PropTypes.instanceOf(VM).isRequired
};

SoundEditor.defaultProps = {
    isActive: () => true,
    size: 0
};

const mapStateToProps = (state, {soundIndex}) => {
    const sprite = state.scratchGui.vm.editingTarget.sprite;
    const index = soundIndex < sprite.sounds.length ? soundIndex : sprite.sounds.length - 1;
    const sound = index >= 0 ? sprite.sounds[index] : null;
    const audioBuffer = sound ? state.scratchGui.vm.getSoundBuffer(index) : null;
    return {
        audioBuffer,
        size: sound && sound.asset && sound.asset.data ? sound.asset.data.byteLength : 0,
        soundId: sound ? sound.soundId : null,
        soundIndex: index,
        soundNames: sprite.sounds.map(item => item.name),
        sampleRate: audioBuffer ? audioBuffer.sampleRate : (sound && sound.rate ? sound.rate : 48000),
        isFullScreen: state.scratchGui.mode.isFullScreen,
        name: sound ? sound.name : '',
        theme: state.scratchGui.theme ? state.scratchGui.theme.theme : null,
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = dispatch => ({
    onShowImportError: () => dispatch(showStandardAlert('assetImportError')),
    onShowRecordingError: () => dispatch(showStandardAlert('recordingError'))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SoundEditor);

export {SoundEditor};
