import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {
    ArrowDownToLine,
    ArrowUpToLine,
    AudioLines,
    Bot,
    ChevronsLeft,
    ChevronsRight,
    ClipboardPaste,
    Copy,
    CopyPlus,
    Crop,
    Flag,
    Gauge,
    Layers,
    Magnet,
    Maximize2,
    Mic,
    Minus,
    MoveHorizontal,
    Music2,
    Pause,
    Play,
    Plus,
    Redo2,
    Repeat,
    Rewind,
    Scissors,
    SkipBack,
    Square,
    SquareSplitHorizontal,
    Trash2,
    TrendingDown,
    TrendingUp,
    Undo2,
    Volume2,
    VolumeX,
    Waves,
    ZoomIn,
    ZoomOut
} from 'lucide-react';

import Input from '../forms/input.jsx';
import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import SoundTimeline from './sound-timeline.jsx';
import {LevelMeter, PlaybackClock} from './sound-readouts.jsx';
import PlaybackMonitor from '../../lib/audio/playback-monitor.js';
import {SOUND_BYTE_LIMIT} from '../../lib/audio/audio-util.js';
import {TOOL_GROUPS, TOOLS, getTool} from '../../lib/audio/sound-tools.js';
import {formatClock} from '../../lib/audio/sound-time.js';
import {gainToDb} from '../../lib/audio/sound-data.js';
import {formatBytes} from '../../lib/utils/bytes.js';

import styles from './sound-editor.css';

const BufferedInput = BufferedInputHOC(Input);

/* eslint-disable max-len */
const messages = defineMessages({
    sound: {id: 'gui.soundEditor.sound', description: 'Label for the name of the sound', defaultMessage: 'Sound'},
    play: {id: 'gui.soundEditor.play', description: 'Title of the button to start playing the sound', defaultMessage: 'Play'},
    pause: {id: 'mw.soundEditor.pause', description: 'Title of the button to pause the sound in the sound editor', defaultMessage: 'Pause'},
    stop: {id: 'gui.soundEditor.stop', description: 'Title of the button to stop the sound', defaultMessage: 'Stop'},
    toStart: {id: 'mw.soundEditor.toStart', description: 'Title of the button that moves the cursor to the start of the sound', defaultMessage: 'Go to start'},
    record: {id: 'mw.soundEditor.record', description: 'Title of the button that records from the microphone into the sound at the cursor', defaultMessage: 'Record at the cursor'},
    stopRecording: {id: 'mw.soundEditor.stopRecording', description: 'Title of the button that ends a microphone recording in the sound editor', defaultMessage: 'Stop recording'},
    recordingHint: {id: 'mw.soundEditor.recordingHint', description: 'Shown while the sound editor is recording from the microphone', defaultMessage: 'Recording. Press Stop to add it to the sound.'},
    snap: {id: 'mw.soundEditor.snap', description: 'Title of the toggle that moves selection edges to the nearest zero crossing', defaultMessage: 'Snap the selection to zero crossings, which avoids clicks'},
    addMarker: {id: 'mw.soundEditor.addMarker', description: 'Title of the button that adds a marker at the cursor in the sound editor', defaultMessage: 'Add a marker at the cursor'},
    removeMarker: {id: 'mw.soundEditor.removeMarker', description: 'Title of the button that removes the marker at the cursor in the sound editor', defaultMessage: 'Remove this marker'},
    previousMarker: {id: 'mw.soundEditor.previousMarker', description: 'Title of the button that moves the cursor to the previous marker', defaultMessage: 'Go to the previous marker'},
    nextMarker: {id: 'mw.soundEditor.nextMarker', description: 'Title of the button that moves the cursor to the next marker', defaultMessage: 'Go to the next marker'},
    marker: {id: 'mw.soundEditor.marker', description: 'Accessible label of a marker on the sound editor ruler', defaultMessage: 'Marker at {time}'},
    loop: {id: 'mw.soundEditor.loop', description: 'Title of the button that toggles looping playback in the sound editor', defaultMessage: 'Loop playback'},
    copy: {id: 'gui.soundEditor.copy', description: 'Title of the button to copy the sound', defaultMessage: 'Copy'},
    cut: {id: 'mw.soundEditor.cut', description: 'Title of the button that cuts the selected audio', defaultMessage: 'Cut'},
    paste: {id: 'gui.soundEditor.paste', description: 'Title of the button to paste the sound', defaultMessage: 'Paste'},
    copyToNew: {id: 'gui.soundEditor.copyToNew', description: 'Title of the button to copy the selection into a new sound', defaultMessage: 'Copy to New'},
    delete: {id: 'gui.soundEditor.delete', description: 'Title of the button to delete the sound', defaultMessage: 'Delete'},
    trim: {id: 'mw.soundEditor.trim', description: 'Title of the button that keeps only the selected audio', defaultMessage: 'Trim to selection'},
    undo: {id: 'gui.soundEditor.undo', description: 'Title of the button to undo', defaultMessage: 'Undo'},
    redo: {id: 'gui.soundEditor.redo', description: 'Title of the button to redo', defaultMessage: 'Redo'},
    zoomIn: {id: 'mw.soundEditor.zoomIn', description: 'Title of the zoom in button in the sound editor', defaultMessage: 'Zoom in'},
    zoomOut: {id: 'mw.soundEditor.zoomOut', description: 'Title of the zoom out button in the sound editor', defaultMessage: 'Zoom out'},
    zoomFit: {id: 'mw.soundEditor.zoomFit', description: 'Title of the button that zooms the sound editor to show the whole sound', defaultMessage: 'Show the whole sound'},
    start: {id: 'mw.soundEditor.selectionStart', description: 'Label for the selection start time field in the sound editor', defaultMessage: 'Start'},
    end: {id: 'mw.soundEditor.selectionEnd', description: 'Label for the selection end time field in the sound editor', defaultMessage: 'End'},
    length: {id: 'mw.soundEditor.selectionLength', description: 'Label for the selection length in the sound editor', defaultMessage: 'Length'},
    stereo: {id: 'tw.stereo', description: "Refers to a 'Stereo Sound' (2 channels)", defaultMessage: 'Stereo'},
    mono: {id: 'tw.mono', description: "Refers to a 'Mono Sound' (1 channel)", defaultMessage: 'Mono'},
    left: {id: 'mw.soundEditor.leftChannel', description: 'Short label for the left channel lane of a stereo sound', defaultMessage: 'L'},
    right: {id: 'mw.soundEditor.rightChannel', description: 'Short label for the right channel lane of a stereo sound', defaultMessage: 'R'},
    tools: {id: 'mw.soundEditor.tools', description: 'Accessible label for the group of sound editing tools', defaultMessage: 'Sound tools'},
    groupEdit: {id: 'mw.soundEditor.group.edit', description: 'Tab of cut, copy, paste and marker actions in the sound editor on small screens', defaultMessage: 'Edit'},
    trimShort: {id: 'mw.soundEditor.short.trim', description: 'Short label of the button that keeps only the selected audio', defaultMessage: 'Trim'},
    snapShort: {id: 'mw.soundEditor.short.snap', description: 'Short label of the toggle that moves selection edges to the nearest zero crossing', defaultMessage: 'Snap'},
    markerShort: {id: 'mw.soundEditor.short.marker', description: 'Short label of the button that adds or removes a marker at the cursor', defaultMessage: 'Marker'},
    previousShort: {id: 'mw.soundEditor.short.previousMarker', description: 'Short label of the button that moves the cursor to the previous marker', defaultMessage: 'Previous'},
    nextShort: {id: 'mw.soundEditor.short.nextMarker', description: 'Short label of the button that moves the cursor to the next marker', defaultMessage: 'Next'},
    peakLabel: {id: 'mw.soundEditor.peakLabel', description: 'Label above the loudest level of the sound or selection', defaultMessage: 'Peak'},
    peakValue: {id: 'mw.soundEditor.peakValue', description: 'The loudest level of the sound or selection in decibels', defaultMessage: '{value} dB'},
    tooLoud: {id: 'mw.soundEditor.tooLoud', description: 'Short warning shown instead of the peak label when the sound is loud enough to distort', defaultMessage: 'Too loud'},
    decrease: {id: 'mw.soundEditor.decrease', description: 'Label of the minus button beside a sound tool setting, for example Decrease Delay', defaultMessage: 'Decrease {name}'},
    increase: {id: 'mw.soundEditor.increase', description: 'Label of the plus button beside a sound tool setting, for example Increase Delay', defaultMessage: 'Increase {name}'},
    groupVolume: {id: 'mw.soundEditor.group.volume', description: 'Tab of volume tools in the sound editor', defaultMessage: 'Volume'},
    groupTime: {id: 'mw.soundEditor.group.time', description: 'Tab of time and speed tools in the sound editor', defaultMessage: 'Time'},
    groupEffects: {id: 'mw.soundEditor.group.effects', description: 'Tab of audio effects in the sound editor', defaultMessage: 'Effects'},
    groupMix: {id: 'mw.soundEditor.group.mix', description: 'Tab for mixing another sound into this one', defaultMessage: 'Mix'},
    gain: {id: 'mw.soundEditor.tool.gain', description: 'Sound editor tool that makes audio louder or quieter by an amount in decibels', defaultMessage: 'Gain'},
    normalize: {id: 'mw.soundEditor.tool.normalize', description: 'Sound editor tool that raises the volume until the loudest point reaches a level', defaultMessage: 'Normalize'},
    fadeIn: {id: 'gui.soundEditor.fadeIn', description: 'Title of the button to apply the fade in effect', defaultMessage: 'Fade in'},
    fadeOut: {id: 'gui.soundEditor.fadeOut', description: 'Title of the button to apply the fade out effect', defaultMessage: 'Fade out'},
    silence: {id: 'gui.soundEditor.mute', description: 'Title of the button to apply the mute effect', defaultMessage: 'Mute'},
    speed: {id: 'mw.soundEditor.tool.speed', description: 'Sound editor tool that speeds up or slows down audio, which also changes its pitch', defaultMessage: 'Speed'},
    stretch: {id: 'mw.soundEditor.tool.stretch', description: 'Sound editor tool that makes audio longer or shorter without changing its pitch', defaultMessage: 'Stretch'},
    pitch: {id: 'mw.soundEditor.tool.pitch', description: 'Sound editor tool that raises or lowers the pitch without changing the length', defaultMessage: 'Pitch'},
    reverse: {id: 'gui.soundEditor.reverse', description: 'Title of the button to apply the reverse effect', defaultMessage: 'Reverse'},
    insertSilence: {id: 'mw.soundEditor.tool.insertSilence', description: 'Sound editor tool that inserts silence at the cursor', defaultMessage: 'Insert silence'},
    echo: {id: 'gui.soundEditor.echo', description: 'Title of the button to apply the echo effect', defaultMessage: 'Echo'},
    reverb: {id: 'mw.soundEditor.tool.reverb', description: 'Sound editor tool that adds room reverb', defaultMessage: 'Reverb'},
    robot: {id: 'gui.soundEditor.robot', description: 'Title of the button to apply the robot effect', defaultMessage: 'Robot'},
    lowpass: {id: 'mw.soundEditor.tool.lowpass', description: 'Sound editor tool that removes high frequencies (low-pass filter)', defaultMessage: 'Muffle'},
    highpass: {id: 'mw.soundEditor.tool.highpass', description: 'Sound editor tool that removes low frequencies (high-pass filter)', defaultMessage: 'Thin out'},
    mix: {id: 'mw.soundEditor.tool.mix', description: 'Sound editor tool that layers another sound on top of this one', defaultMessage: 'Mix in a sound'},
    paramDb: {id: 'mw.soundEditor.param.db', description: 'Slider label for a volume change in decibels', defaultMessage: 'Amount'},
    paramTarget: {id: 'mw.soundEditor.param.target', description: 'Slider label for the loudest level normalize should reach', defaultMessage: 'Loudest point'},
    paramShape: {id: 'mw.soundEditor.param.shape', description: 'Label for choosing the shape of a fade', defaultMessage: 'Shape'},
    shapeLinear: {id: 'mw.soundEditor.param.shapeLinear', description: 'Fade shape option that changes volume at a constant rate', defaultMessage: 'Straight'},
    shapeSmooth: {id: 'mw.soundEditor.param.shapeSmooth', description: 'Fade shape option that eases in and out', defaultMessage: 'Smooth'},
    paramPercent: {id: 'mw.soundEditor.param.percent', description: 'Slider label for playback speed as a percentage', defaultMessage: 'Speed'},
    paramLength: {id: 'mw.soundEditor.param.length', description: 'Slider label for the new length of stretched audio as a percentage', defaultMessage: 'Length'},
    paramSemitones: {id: 'mw.soundEditor.param.semitones', description: 'Slider label for a pitch change in semitones', defaultMessage: 'Semitones'},
    paramSeconds: {id: 'mw.soundEditor.param.seconds', description: 'Slider label for how many seconds of silence to insert', defaultMessage: 'Duration'},
    paramDelay: {id: 'mw.soundEditor.param.delay', description: 'Slider label for the time between echoes', defaultMessage: 'Delay'},
    paramFeedback: {id: 'mw.soundEditor.param.feedback', description: 'Slider label for how strongly each echo repeats', defaultMessage: 'Repeats'},
    paramSize: {id: 'mw.soundEditor.param.size', description: 'Slider label for the length of a reverb tail', defaultMessage: 'Room size'},
    paramMix: {id: 'mw.soundEditor.param.mix', description: 'Slider label for how much reverb is mixed in', defaultMessage: 'Amount'},
    paramFrequency: {id: 'mw.soundEditor.param.frequency', description: 'Slider label for a filter cutoff frequency', defaultMessage: 'Cutoff'},
    paramSourceDb: {id: 'mw.soundEditor.param.sourceDb', description: 'Slider label for the volume of the sound being mixed in', defaultMessage: 'Volume'},
    source: {id: 'mw.soundEditor.param.source', description: 'Label for choosing which sound to mix in', defaultMessage: 'Sound'},
    noSources: {id: 'mw.soundEditor.noSources', description: 'Shown in the mix tool when the sprite has no other sounds', defaultMessage: 'Add another sound to this sprite to mix it in.'},
    preview: {id: 'mw.soundEditor.preview', description: 'Button that plays an effect without applying it', defaultMessage: 'Preview'},
    apply: {id: 'mw.soundEditor.apply', description: 'Button that applies an effect to the sound', defaultMessage: 'Apply'},
    appliesSelection: {id: 'mw.soundEditor.appliesSelection', description: 'Hint that an effect changes only the selected audio', defaultMessage: 'Applies to the selection.'},
    appliesWhole: {id: 'mw.soundEditor.appliesWhole', description: 'Hint that an effect changes the whole sound because nothing is selected', defaultMessage: 'Applies to the whole sound. Drag on the waveform to pick a part.'},
    appliesCursor: {id: 'mw.soundEditor.appliesCursor', description: 'Hint that a tool works at the cursor position', defaultMessage: 'Goes in at the cursor.'},
    mixDragHint: {id: 'mw.soundEditor.mixDragHint', description: 'Hint in the mix tool about dragging a sound from the list', defaultMessage: 'Goes in at the cursor. You can also drag a sound from the list onto the waveform.'},
    peak: {id: 'mw.soundEditor.peak', description: 'Shows the loudest level of the sound or selection in decibels', defaultMessage: 'Peak {value} dB'},
    clipping: {id: 'mw.soundEditor.clipping', description: 'Warning that the sound is louder than can be saved and will distort', defaultMessage: 'Too loud, will distort'},
    waveform: {id: 'mw.soundEditor.waveform', description: 'Accessible label for the waveform in the sound editor', defaultMessage: 'Waveform'},
    waveformKeys: {id: 'mw.soundEditor.waveformKeys', description: 'Accessible hint for using the sound editor waveform with a keyboard', defaultMessage: 'Use the arrow keys to move the cursor, hold Shift with them to select, and press Space to play or pause.'},
    sampleRate: {id: 'mw.soundEditor.sampleRate', description: 'Sample rate of the sound in kilohertz, for example 48 kHz', defaultMessage: '{rate} kHz'},
    level: {id: 'mw.soundEditor.level', description: 'Accessible label for the playback level meter', defaultMessage: 'Level'},
    describeSilence: {id: 'mw.soundEditor.describe.silence', description: 'Explains the mute tool in the sound editor', defaultMessage: 'Replaces the audio with silence.'},
    describeReverse: {id: 'mw.soundEditor.describe.reverse', description: 'Explains the reverse tool in the sound editor', defaultMessage: 'Plays the audio backwards.'},
    describeRobot: {id: 'mw.soundEditor.describe.robot', description: 'Explains the robot tool in the sound editor', defaultMessage: 'Makes voices sound like a robot.'}
});
/* eslint-enable max-len */

const DESCRIPTIONS = {
    silence: messages.describeSilence,
    reverse: messages.describeReverse,
    robot: messages.describeRobot
};

const TOOL_ICONS = {
    gain: Volume2,
    normalize: AudioLines,
    fadeIn: TrendingUp,
    fadeOut: TrendingDown,
    silence: VolumeX,
    speed: Gauge,
    stretch: MoveHorizontal,
    pitch: Music2,
    reverse: Rewind,
    insertSilence: SquareSplitHorizontal,
    echo: Repeat,
    reverb: Waves,
    robot: Bot,
    lowpass: ArrowDownToLine,
    highpass: ArrowUpToLine,
    mix: Layers
};

const GROUP_MESSAGES = {
    edit: messages.groupEdit,
    volume: messages.groupVolume,
    time: messages.groupTime,
    effects: messages.groupEffects,
    mix: messages.groupMix
};

const PARAM_MESSAGES = {
    gain: {db: messages.paramDb},
    normalize: {db: messages.paramTarget},
    fadeIn: {shape: messages.paramShape},
    fadeOut: {shape: messages.paramShape},
    speed: {percent: messages.paramPercent},
    stretch: {percent: messages.paramLength},
    pitch: {semitones: messages.paramSemitones},
    insertSilence: {seconds: messages.paramSeconds},
    echo: {delay: messages.paramDelay, feedback: messages.paramFeedback},
    reverb: {size: messages.paramSize, mix: messages.paramMix},
    lowpass: {frequency: messages.paramFrequency},
    highpass: {frequency: messages.paramFrequency},
    mix: {db: messages.paramSourceDb}
};

const OPTION_MESSAGES = {
    linear: messages.shapeLinear,
    smooth: messages.shapeSmooth
};

const PlainInput = props => <input {...props} />;
const BufferedField = BufferedInputHOC(PlainInput);

const REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 90;

const formatParam = (param, value) => {
    const decimals = param.step < 1 ? Math.max(0, Math.ceil(-Math.log10(param.step))) : 0;
    const number = Number(value).toFixed(decimals);
    const signed = (param.unit === 'dB' || param.signed) && Number(value) > 0 ? `+${number}` : number;
    return param.unit ? `${signed} ${param.unit}` : signed;
};

const selectAll = event => event.target.select();

const useRepeat = (action, disabled) => {
    const timer = React.useRef(null);
    const latest = React.useRef({action, disabled});
    latest.current = {action, disabled};
    const stop = React.useCallback(() => {
        if (timer.current === null) return;
        clearTimeout(timer.current);
        timer.current = null;
    }, []);
    const start = React.useCallback(event => {
        if (event.button) return;
        stop();
        latest.current.action();
        const repeat = () => {
            timer.current = null;
            if (latest.current.disabled) return;
            latest.current.action();
            timer.current = setTimeout(repeat, REPEAT_INTERVAL);
        };
        timer.current = setTimeout(repeat, REPEAT_DELAY);
    }, [stop]);
    const click = React.useCallback(event => {
        if (!event.detail) latest.current.action();
    }, []);
    React.useEffect(() => stop, [stop]);
    return {handleClick: click, handleStart: start, handleStop: stop};
};

const StepButton = ({disabled, icon: Icon, label, onStep}) => {
    const {handleClick, handleStart, handleStop} = useRepeat(onStep, disabled);
    return (
        <button
            type="button"
            aria-label={label}
            className={styles.stepButton}
            disabled={disabled}
            title={label}
            onClick={handleClick}
            onPointerCancel={handleStop}
            onPointerDown={handleStart}
            onPointerLeave={handleStop}
            onPointerUp={handleStop}
        >
            <Icon
                size={16}
                aria-hidden="true"
            />
        </button>
    );
};

StepButton.propTypes = {
    disabled: PropTypes.bool,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    onStep: PropTypes.func.isRequired
};

const ParamRow = ({decreaseLabel, increaseLabel, label, onNudge, onSubmit, param, value}) => {
    const handleSubmit = React.useCallback(text => onSubmit(param.key, text), [onSubmit, param.key]);
    const handleDown = React.useCallback(() => onNudge(param.key, -1), [onNudge, param.key]);
    const handleUp = React.useCallback(() => onNudge(param.key, 1), [onNudge, param.key]);
    const handleKeyDown = React.useCallback(event => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        onNudge(param.key, event.key === 'ArrowUp' ? 1 : -1);
    }, [onNudge, param.key]);
    return (
        <div className={styles.param}>
            <span className={styles.paramLabel}>{label}</span>
            <div className={styles.stepper}>
                <StepButton
                    disabled={value <= param.min}
                    icon={Minus}
                    label={decreaseLabel}
                    onStep={handleDown}
                />
                <BufferedField
                    aria-label={label}
                    className={styles.stepInput}
                    data-param={param.key}
                    inputMode={param.min < 0 ? 'text' : 'decimal'}
                    type="text"
                    value={formatParam(param, value)}
                    onFocus={selectAll}
                    onKeyDown={handleKeyDown}
                    onSubmit={handleSubmit}
                />
                <StepButton
                    disabled={value >= param.max}
                    icon={Plus}
                    label={increaseLabel}
                    onStep={handleUp}
                />
            </div>
        </div>
    );
};

ParamRow.propTypes = {
    decreaseLabel: PropTypes.string.isRequired,
    increaseLabel: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onNudge: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    param: PropTypes.shape({
        key: PropTypes.string,
        max: PropTypes.number,
        min: PropTypes.number,
        step: PropTypes.number,
        unit: PropTypes.string
    }).isRequired,
    value: PropTypes.number
};

const actionShape = PropTypes.shape({
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    flip: PropTypes.bool,
    icon: PropTypes.elementType.isRequired,
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    short: PropTypes.string
});

const ActionTile = ({action}) => {
    const {icon: Icon, onClick} = action;
    return (
        <button
            type="button"
            aria-label={action.label}
            aria-pressed={typeof action.active === 'boolean' ? action.active : null}
            className={classNames(styles.rackTool, {
                [styles.rackToolActive]: action.active,
                [styles.flipInRtl]: action.flip
            })}
            data-action={action.id}
            disabled={action.disabled}
            title={action.label}
            onClick={onClick}
        >
            <Icon
                size={18}
                aria-hidden="true"
            />
            <span>{action.short || action.label}</span>
        </button>
    );
};

ActionTile.propTypes = {
    action: actionShape.isRequired
};

const ToolButton = ({active, icon: Icon, label, onClick, id}) => (
    <button
        type="button"
        aria-pressed={active}
        className={classNames(styles.rackTool, {[styles.rackToolActive]: active})}
        data-tool={id}
        onClick={onClick}
    >
        <Icon
            size={18}
            aria-hidden="true"
        />
        <span>{label}</span>
    </button>
);

ToolButton.propTypes = {
    active: PropTypes.bool,
    icon: PropTypes.elementType.isRequired,
    id: PropTypes.string,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
};

const IconAction = ({disabled, icon: Icon, label, onClick, className, active, fill}) => (
    <button
        type="button"
        aria-label={label}
        aria-pressed={typeof active === 'boolean' ? active : null}
        className={classNames(styles.iconAction, className, {[styles.iconActionActive]: active})}
        disabled={disabled}
        title={label}
        onClick={onClick}
    >
        <Icon
            size={18}
            fill={fill ? 'currentColor' : 'none'}
            aria-hidden="true"
        />
    </button>
);

IconAction.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    fill: PropTypes.bool,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func
};

const StopIcon = iconProps => (
    <Square
        {...iconProps}
        fill="currentColor"
    />
);

let waveformHintCount = 0;

const SoundEditor = props => {
    const {intl} = props;
    const format = intl.formatMessage;
    const [waveformHintId] = React.useState(() => `mw-sound-waveform-keys-${++waveformHintCount}`);
    const compact = Boolean(props.compact);
    const groups = compact ? ['edit', ...TOOL_GROUPS] : TOOL_GROUPS;
    const activeGroup = groups.includes(props.activeGroup) ? props.activeGroup : groups[0];
    const hasSelection = Boolean(props.selection && props.selection.end > props.selection.start);
    const rate = props.sampleRate || 1;
    const tool = activeGroup === 'edit' ? null : getTool(props.activeTool);
    const groupTools = TOOLS.filter(item => item.group === activeGroup);
    const startSample = hasSelection ? props.selection.start : props.cursor;
    const endSample = hasSelection ? props.selection.end : props.cursor;
    const lengthSeconds = hasSelection ? (props.selection.end - props.selection.start) / rate : 0;
    const peakDb = props.peak > 0 ? gainToDb(props.peak) : -Infinity;
    const peakText = Number.isFinite(peakDb) ? peakDb.toFixed(1) : '-∞';
    const clipping = props.peak > 1;
    const channelLabels = props.clip.channels.length === 2 ? [format(messages.left), format(messages.right)] : [];
    const recording = props.recording !== 'idle';
    const live = props.playing || props.previewing || props.recording === 'recording';
    const markerAtCursor = props.markers.includes(startSample);
    const markerLabels = props.markers.map(marker => format(messages.marker, {time: formatClock(marker / rate)}));
    let applyHint;
    if (recording) applyHint = format(messages.recordingHint);
    else if (tool && tool.needsSource) applyHint = format(messages.mixDragHint);
    else if (tool && tool.atCursor) applyHint = format(messages.appliesCursor);
    else if (hasSelection) applyHint = format(messages.appliesSelection);
    else applyHint = format(messages.appliesWhole);
    const sourceMissing = tool && tool.needsSource && props.mixSources.length === 0;
    const infoText = [
        format(messages.sampleRate, {
            rate: intl.formatNumber(props.sampleRate / 1000, {maximumFractionDigits: 2})
        }),
        format(props.isStereo ? messages.stereo : messages.mono),
        formatClock(props.duration),
        formatBytes(props.size)
    ].join(' · ');

    const editActions = [
        {id: 'cut', icon: Scissors, label: format(messages.cut), disabled: !props.canRemove, onClick: props.onCut},
        {id: 'copy', icon: Copy, label: format(messages.copy), onClick: props.onCopy},
        {
            id: 'paste',
            icon: ClipboardPaste,
            label: format(messages.paste),
            disabled: !props.canPaste,
            onClick: props.onPaste
        },
        {
            id: 'trim',
            icon: Crop,
            label: format(messages.trim),
            short: format(messages.trimShort),
            disabled: !props.canRemove,
            onClick: props.onTrim
        },
        {
            id: 'delete',
            icon: Trash2,
            label: format(messages.delete),
            disabled: !props.canRemove,
            onClick: props.onDelete
        },
        {id: 'copyToNew', icon: CopyPlus, label: format(messages.copyToNew), flip: true, onClick: props.onCopyToNew}
    ];
    const markActions = [
        {
            id: 'snap',
            icon: Magnet,
            label: format(messages.snap),
            short: format(messages.snapShort),
            active: Boolean(props.snap),
            onClick: props.onToggleSnap
        },
        {
            id: 'previousMarker',
            icon: ChevronsLeft,
            label: format(messages.previousMarker),
            short: format(messages.previousShort),
            disabled: !props.canPreviousMarker,
            onClick: props.onPreviousMarker
        },
        {
            id: 'marker',
            icon: Flag,
            label: format(markerAtCursor ? messages.removeMarker : messages.addMarker),
            short: format(messages.markerShort),
            active: markerAtCursor,
            onClick: props.onToggleMarker
        },
        {
            id: 'nextMarker',
            icon: ChevronsRight,
            label: format(messages.nextMarker),
            short: format(messages.nextShort),
            disabled: !props.canNextMarker,
            onClick: props.onNextMarker
        }
    ];
    const iconAction = ({active, disabled, flip, icon, id, label, onClick}) => (
        <IconAction
            key={id}
            active={active}
            className={flip ? styles.flipInRtl : null}
            disabled={disabled}
            icon={icon}
            label={label}
            onClick={onClick}
        />
    );

    const playButton = (
        <button
            type="button"
            aria-label={format(props.playing ? messages.pause : messages.play)}
            className={styles.playButton}
            disabled={recording}
            title={format(props.playing ? messages.pause : messages.play)}
            onClick={props.playing ? props.onPause : props.onPlay}
        >
            {props.playing ? (
                <Pause
                    size={22}
                    fill="currentColor"
                    aria-hidden="true"
                />
            ) : (
                <Play
                    size={22}
                    fill="currentColor"
                    aria-hidden="true"
                />
            )}
        </button>
    );
    const transportActions = (
        <React.Fragment>
            {compact ? null : (
                <IconAction
                    disabled={!props.playing && props.playhead === null && !recording}
                    icon={StopIcon}
                    label={format(recording ? messages.stopRecording : messages.stop)}
                    onClick={props.onStop}
                />
            )}
            <IconAction
                icon={SkipBack}
                label={format(messages.toStart)}
                onClick={props.onToStart}
            />
            <IconAction
                active={props.loop}
                icon={Repeat}
                label={format(messages.loop)}
                onClick={props.onToggleLoop}
            />
            <IconAction
                active={recording}
                className={classNames({[styles.recordActive]: recording})}
                disabled={props.busy && !recording}
                fill={recording}
                icon={recording ? Square : Mic}
                label={format(recording ? messages.stopRecording : messages.record)}
                onClick={recording ? props.onStop : props.onRecord}
            />
        </React.Fragment>
    );
    const clock = (
        <PlaybackClock
            idleSample={props.playhead === null ? startSample : props.playhead}
            monitor={props.monitor}
            sampleRate={rate}
        />
    );

    return (
        <div
            className={classNames(styles.editor, {[styles.compact]: compact})}
            ref={props.setRef}
        >
            <div className={styles.header}>
                <label className={styles.nameField}>
                    <span className={compact ? styles.visuallyHidden : styles.fieldLabel}>
                        {format(messages.sound)}
                    </span>
                    <BufferedInput
                        type="text"
                        value={props.name}
                        onSubmit={props.onChangeName}
                        className={styles.nameInput}
                    />
                </label>
                <div className={styles.actionGroup}>
                    <IconAction
                        disabled={!props.canUndo}
                        icon={Undo2}
                        label={format(messages.undo)}
                        onClick={props.onUndo}
                    />
                    <IconAction
                        disabled={!props.canRedo}
                        icon={Redo2}
                        label={format(messages.redo)}
                        onClick={props.onRedo}
                    />
                </div>
                {compact ? null : <div className={styles.info}>{infoText}</div>}
            </div>

            {compact ? null : (
                <div className={styles.toolbar}>
                    <div className={styles.actionGroup}>{editActions.map(iconAction)}</div>
                    <div className={styles.actionGroup}>{markActions.map(iconAction)}</div>
                </div>
            )}

            <SoundTimeline
                channelLabels={channelLabels}
                clip={props.clip}
                clipVersion={props.clipVersion}
                cursor={props.cursor}
                describedBy={waveformHintId}
                dropSample={props.dropSample}
                footer={compact ? (
                    <div className={styles.cells}>
                        <label className={styles.cell}>
                            <span className={styles.cellLabel}>{format(messages.start)}</span>
                            <BufferedField
                                className={styles.cellInput}
                                type="text"
                                inputMode="decimal"
                                value={formatClock(startSample / rate)}
                                onFocus={selectAll}
                                onSubmit={props.onSubmitStart}
                            />
                        </label>
                        <label className={styles.cell}>
                            <span className={styles.cellLabel}>{format(messages.end)}</span>
                            <BufferedField
                                className={styles.cellInput}
                                type="text"
                                inputMode="decimal"
                                value={formatClock(endSample / rate)}
                                onFocus={selectAll}
                                onSubmit={props.onSubmitEnd}
                            />
                        </label>
                        <div className={styles.cell}>
                            <span className={styles.cellLabel}>{format(messages.length)}</span>
                            <span className={styles.cellValue}>{formatClock(lengthSeconds)}</span>
                        </div>
                        <div className={classNames(styles.cell, {[styles.cellHot]: clipping})}>
                            <span className={styles.cellLabel}>
                                {format(clipping ? messages.tooLoud : messages.peakLabel)}
                            </span>
                            <span className={styles.cellValue}>{format(messages.peakValue, {value: peakText})}</span>
                        </div>
                    </div>
                ) : null}
                label={format(messages.waveform)}
                markerLabels={markerLabels}
                markers={props.markers}
                monitor={props.monitor}
                overviewActions={
                    <div className={styles.actionGroup}>
                        <IconAction
                            disabled={!props.canZoomOut}
                            icon={ZoomOut}
                            label={format(messages.zoomOut)}
                            onClick={props.onZoomOut}
                        />
                        <IconAction
                            disabled={!props.canZoomOut}
                            icon={Maximize2}
                            label={format(messages.zoomFit)}
                            onClick={props.onZoomFit}
                        />
                        <IconAction
                            disabled={!props.canZoomIn}
                            icon={ZoomIn}
                            label={format(messages.zoomIn)}
                            onClick={props.onZoomIn}
                        />
                    </div>
                }
                peakIndex={props.peakIndex}
                playhead={props.playhead}
                ref={props.timelineRef}
                selection={hasSelection ? props.selection : null}
                theme={props.theme}
                viewLength={props.viewLength}
                viewStart={props.viewStart}
                onSeek={props.onSeek}
                onSelect={props.onSelect}
                onSelectEnd={props.onSelectEnd}
                onSelectRegion={props.onSelectRegion}
                onView={props.onView}
                onZoomAround={props.onZoomAround}
            />
            <p
                className={styles.visuallyHidden}
                id={waveformHintId}
            >
                {format(messages.waveformKeys)}
            </p>

            {compact ? (
                <div className={styles.transport}>
                    {playButton}
                    {clock}
                    <div className={classNames(styles.actionGroup, styles.transportGroup)}>{transportActions}</div>
                </div>
            ) : (
                <div className={styles.transport}>
                    <div className={styles.transportButtons}>
                        {playButton}
                        {transportActions}
                    </div>
                    {clock}
                    <div className={styles.readouts}>
                        <label className={styles.timeField}>
                            <span className={styles.fieldLabel}>{format(messages.start)}</span>
                            <BufferedInput
                                className={styles.timeInput}
                                type="text"
                                inputMode="decimal"
                                value={formatClock(startSample / rate)}
                                onSubmit={props.onSubmitStart}
                            />
                        </label>
                        <label className={styles.timeField}>
                            <span className={styles.fieldLabel}>{format(messages.end)}</span>
                            <BufferedInput
                                className={styles.timeInput}
                                type="text"
                                inputMode="decimal"
                                value={formatClock(endSample / rate)}
                                onSubmit={props.onSubmitEnd}
                            />
                        </label>
                        <div className={styles.timeField}>
                            <span className={styles.fieldLabel}>{format(messages.length)}</span>
                            <span className={styles.timeValue}>{formatClock(lengthSeconds)}</span>
                        </div>
                        <LevelMeter
                            channelCount={props.clip.channels.length}
                            hot={clipping}
                            label={format(messages.level)}
                            live={live}
                            monitor={props.monitor}
                            peak={props.peak}
                            text={clipping ? format(messages.clipping) : format(messages.peak, {value: peakText})}
                        />
                    </div>
                </div>
            )}

            <div className={styles.rack}>
                <div
                    className={styles.groupTabs}
                    role="group"
                    aria-label={format(messages.tools)}
                >
                    {groups.map(group => (
                        <button
                            key={group}
                            type="button"
                            aria-pressed={activeGroup === group}
                            className={classNames(styles.groupTab, {
                                [styles.groupTabActive]: activeGroup === group
                            })}
                            data-group={group}
                            onClick={props.onSelectGroup}
                        >
                            {format(GROUP_MESSAGES[group])}
                        </button>
                    ))}
                </div>
                <div className={styles.rackBody}>
                    <div
                        className={styles.toolList}
                        role="group"
                    >
                        {activeGroup === 'edit' ? editActions.concat(markActions).map(action => (
                            <ActionTile
                                key={action.id}
                                action={action}
                            />
                        )) : groupTools.map(item => (
                            <ToolButton
                                key={item.id}
                                active={props.activeTool === item.id}
                                icon={TOOL_ICONS[item.id]}
                                id={item.id}
                                label={format(messages[item.id])}
                                onClick={props.onSelectTool}
                            />
                        ))}
                    </div>
                    {tool ? (
                        <div className={styles.toolPanel}>
                            <div className={styles.params}>
                                {tool.needsSource ? (
                                    sourceMissing ? (
                                        <p className={styles.hint}>{format(messages.noSources)}</p>
                                    ) : (
                                        <label className={styles.param}>
                                            <span className={styles.paramLabel}>{format(messages.source)}</span>
                                            <select
                                                className={styles.select}
                                                value={props.mixSource}
                                                onChange={props.onChangeMixSource}
                                            >
                                                {props.mixSources.map(source => (
                                                    <option
                                                        key={source.index}
                                                        value={source.index}
                                                    >
                                                        {source.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    )
                                ) : null}
                                {(sourceMissing ? [] : tool.params).map(param => {
                                    const name = format(PARAM_MESSAGES[tool.id][param.key]);
                                    return param.options ? (
                                        <div
                                            key={param.key}
                                            className={styles.param}
                                        >
                                            <span className={styles.paramLabel}>{name}</span>
                                            <div
                                                className={styles.segmented}
                                                role="group"
                                                aria-label={name}
                                            >
                                                {param.options.map(option => {
                                                    const selected = props.toolParams[param.key] === option;
                                                    return (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            aria-pressed={selected}
                                                            className={classNames(styles.segment, {
                                                                [styles.segmentActive]: selected
                                                            })}
                                                            data-param={param.key}
                                                            data-value={option}
                                                            onClick={props.onChangeOption}
                                                        >
                                                            {format(OPTION_MESSAGES[option])}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <ParamRow
                                            key={param.key}
                                            decreaseLabel={format(messages.decrease, {name})}
                                            increaseLabel={format(messages.increase, {name})}
                                            label={name}
                                            param={param}
                                            value={props.toolParams[param.key]}
                                            onNudge={props.onNudgeParam}
                                            onSubmit={props.onSubmitParam}
                                        />
                                    );
                                })}
                                {DESCRIPTIONS[tool.id] ? (
                                    <p className={styles.description}>{format(DESCRIPTIONS[tool.id])}</p>
                                ) : null}
                            </div>
                            <div className={styles.toolFooter}>
                                {sourceMissing ? null : <p className={styles.hint}>{applyHint}</p>}
                                <div className={styles.toolActions}>
                                    <button
                                        type="button"
                                        className={classNames(styles.secondaryButton, {
                                            [styles.buttonActive]: props.previewing
                                        })}
                                        disabled={props.busy || sourceMissing}
                                        onClick={props.previewing ? props.onStop : props.onPreview}
                                    >
                                        {props.previewing ? (
                                            <Square
                                                size={14}
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Play
                                                size={14}
                                                aria-hidden="true"
                                            />
                                        )}
                                        {format(props.previewing ? messages.stop : messages.preview)}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.primaryButton}
                                        disabled={props.busy || sourceMissing}
                                        onClick={props.onApply}
                                    >
                                        {format(messages.apply)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {compact && activeGroup === 'edit' ? <div className={styles.info}>{infoText}</div> : null}

            {props.size >= SOUND_BYTE_LIMIT ? (
                <div className={styles.alert}>
                    <FormattedMessage
                        defaultMessage="This sound may be too large to upload to Scratch."
                        description="Message that appears when a sound exceeds the Scratch sound size limit."
                        id="tw.tooLarge"
                    />
                </div>
            ) : null}
        </div>
    );
};

SoundEditor.propTypes = {
    activeGroup: PropTypes.string.isRequired,
    activeTool: PropTypes.string,
    busy: PropTypes.bool,
    canNextMarker: PropTypes.bool,
    canPaste: PropTypes.bool.isRequired,
    canPreviousMarker: PropTypes.bool,
    canRemove: PropTypes.bool,
    canRedo: PropTypes.bool.isRequired,
    canUndo: PropTypes.bool.isRequired,
    canZoomIn: PropTypes.bool,
    canZoomOut: PropTypes.bool,
    clip: PropTypes.shape({
        channels: PropTypes.arrayOf(PropTypes.instanceOf(Float32Array)),
        sampleRate: PropTypes.number
    }).isRequired,
    clipVersion: PropTypes.number,
    compact: PropTypes.bool,
    cursor: PropTypes.number.isRequired,
    dropSample: PropTypes.number,
    duration: PropTypes.number.isRequired,
    intl: intlShape,
    isStereo: PropTypes.bool.isRequired,
    loop: PropTypes.bool,
    markers: PropTypes.arrayOf(PropTypes.number),
    mixSource: PropTypes.string,
    mixSources: PropTypes.arrayOf(PropTypes.shape({
        index: PropTypes.string,
        name: PropTypes.string
    })),
    monitor: PropTypes.instanceOf(PlaybackMonitor).isRequired,
    name: PropTypes.string.isRequired,
    onApply: PropTypes.func.isRequired,
    onChangeMixSource: PropTypes.func,
    onChangeName: PropTypes.func.isRequired,
    onChangeOption: PropTypes.func.isRequired,
    onCopy: PropTypes.func.isRequired,
    onCopyToNew: PropTypes.func.isRequired,
    onCut: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onNextMarker: PropTypes.func,
    onNudgeParam: PropTypes.func.isRequired,
    onPaste: PropTypes.func.isRequired,
    onPause: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onPreview: PropTypes.func.isRequired,
    onPreviousMarker: PropTypes.func,
    onRecord: PropTypes.func,
    onRedo: PropTypes.func.isRequired,
    onSeek: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onSelectEnd: PropTypes.func,
    onSelectGroup: PropTypes.func.isRequired,
    onSelectRegion: PropTypes.func,
    onSelectTool: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    onSubmitEnd: PropTypes.func.isRequired,
    onSubmitParam: PropTypes.func.isRequired,
    onSubmitStart: PropTypes.func.isRequired,
    onToStart: PropTypes.func.isRequired,
    onToggleLoop: PropTypes.func.isRequired,
    onToggleMarker: PropTypes.func,
    onToggleSnap: PropTypes.func,
    onTrim: PropTypes.func.isRequired,
    onUndo: PropTypes.func.isRequired,
    onView: PropTypes.func.isRequired,
    onZoomAround: PropTypes.func.isRequired,
    onZoomFit: PropTypes.func.isRequired,
    onZoomIn: PropTypes.func.isRequired,
    onZoomOut: PropTypes.func.isRequired,
    peak: PropTypes.number,
    peakIndex: PropTypes.shape({
        blockSize: PropTypes.number,
        channels: PropTypes.arrayOf(PropTypes.object)
    }),
    playhead: PropTypes.number,
    playing: PropTypes.bool,
    previewing: PropTypes.bool,
    recording: PropTypes.oneOf(['idle', 'starting', 'recording']),
    sampleRate: PropTypes.number.isRequired,
    selection: PropTypes.shape({
        start: PropTypes.number,
        end: PropTypes.number
    }),
    setRef: PropTypes.func,
    size: PropTypes.number.isRequired,
    snap: PropTypes.bool,
    theme: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    timelineRef: PropTypes.func,
    toolParams: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    viewLength: PropTypes.number.isRequired,
    viewStart: PropTypes.number.isRequired
};

SoundEditor.defaultProps = {
    markers: [],
    mixSources: [],
    recording: 'idle',
    toolParams: {}
};

export default injectIntl(SoundEditor);
