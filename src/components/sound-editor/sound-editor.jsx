import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {
    ArrowDownToLine,
    ArrowUpToLine,
    AudioLines,
    Bot,
    ClipboardPaste,
    Copy,
    CopyPlus,
    Crop,
    Gauge,
    Layers,
    Maximize2,
    Pause,
    Play,
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

const formatParam = (param, value) => {
    const decimals = param.step < 1 ? Math.max(0, Math.ceil(-Math.log10(param.step))) : 0;
    const number = Number(value).toFixed(decimals);
    const signed = param.unit === 'dB' && Number(value) > 0 ? `+${number}` : number;
    return `${signed} ${param.unit}`;
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

const IconAction = ({disabled, icon: Icon, label, onClick, className, active}) => (
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
            aria-hidden="true"
        />
    </button>
);

IconAction.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
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

const levelPercent = level => {
    if (!level || level <= 0) return 0;
    const db = gainToDb(level);
    return Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
};

let waveformHintCount = 0;

const SoundEditor = props => {
    const {intl} = props;
    const format = intl.formatMessage;
    const [waveformHintId] = React.useState(() => `mw-sound-waveform-keys-${++waveformHintCount}`);
    const hasSelection = Boolean(props.selection && props.selection.end > props.selection.start);
    const rate = props.sampleRate || 1;
    const tool = getTool(props.activeTool);
    const groupTools = TOOLS.filter(item => item.group === props.activeGroup);
    const startSample = hasSelection ? props.selection.start : props.cursor;
    const endSample = hasSelection ? props.selection.end : props.cursor;
    const lengthSeconds = hasSelection ? (props.selection.end - props.selection.start) / rate : 0;
    const peakDb = props.peak > 0 ? gainToDb(props.peak) : -Infinity;
    const clipping = props.peak > 1;
    const channelLabels = props.clip.channels.length === 2 ? [format(messages.left), format(messages.right)] : [];
    let applyHint;
    if (tool && tool.atCursor) applyHint = format(messages.appliesCursor);
    else if (hasSelection) applyHint = format(messages.appliesSelection);
    else applyHint = format(messages.appliesWhole);
    const sourceMissing = tool && tool.needsSource && props.mixSources.length === 0;

    return (
        <div
            className={styles.editor}
            ref={props.setRef}
        >
            <div className={styles.header}>
                <label className={styles.nameField}>
                    <span className={styles.fieldLabel}>{format(messages.sound)}</span>
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
                <div className={styles.actionGroup}>
                    <IconAction
                        disabled={!props.canRemove}
                        icon={Scissors}
                        label={format(messages.cut)}
                        onClick={props.onCut}
                    />
                    <IconAction
                        icon={Copy}
                        label={format(messages.copy)}
                        onClick={props.onCopy}
                    />
                    <IconAction
                        disabled={!props.canPaste}
                        icon={ClipboardPaste}
                        label={format(messages.paste)}
                        onClick={props.onPaste}
                    />
                    <IconAction
                        disabled={!props.canRemove}
                        icon={Crop}
                        label={format(messages.trim)}
                        onClick={props.onTrim}
                    />
                    <IconAction
                        disabled={!props.canRemove}
                        icon={Trash2}
                        label={format(messages.delete)}
                        onClick={props.onDelete}
                    />
                    <IconAction
                        className={styles.flipInRtl}
                        icon={CopyPlus}
                        label={format(messages.copyToNew)}
                        onClick={props.onCopyToNew}
                    />
                </div>
                <div className={styles.info}>
                    {[
                        format(messages.sampleRate, {
                            rate: intl.formatNumber(props.sampleRate / 1000, {maximumFractionDigits: 2})
                        }),
                        format(props.isStereo ? messages.stereo : messages.mono),
                        formatClock(props.duration),
                        formatBytes(props.size)
                    ].join(' · ')}
                </div>
            </div>

            <SoundTimeline
                channelLabels={channelLabels}
                clip={props.clip}
                clipVersion={props.clipVersion}
                cursor={props.cursor}
                describedBy={waveformHintId}
                label={format(messages.waveform)}
                peakIndex={props.peakIndex}
                playhead={props.playhead}
                selection={hasSelection ? props.selection : null}
                theme={props.theme}
                viewLength={props.viewLength}
                viewStart={props.viewStart}
                onSeek={props.onSeek}
                onSelect={props.onSelect}
                onView={props.onView}
                onZoomAround={props.onZoomAround}
            />
            <p
                className={styles.visuallyHidden}
                id={waveformHintId}
            >
                {format(messages.waveformKeys)}
            </p>

            <div className={styles.transport}>
                <div className={styles.transportButtons}>
                    <button
                        type="button"
                        aria-label={format(props.playing ? messages.pause : messages.play)}
                        className={styles.playButton}
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
                    <IconAction
                        disabled={!props.playing && props.playhead === null}
                        icon={StopIcon}
                        label={format(messages.stop)}
                        onClick={props.onStop}
                    />
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
                </div>
                <div
                    className={styles.clock}
                    aria-live="off"
                >
                    {formatClock((props.playhead === null ? startSample : props.playhead) / rate)}
                </div>
                <div className={styles.selectionFields}>
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
                </div>
                <div
                    className={styles.meter}
                    role="meter"
                    aria-label={format(messages.level)}
                    aria-valuemin={-60}
                    aria-valuemax={0}
                    aria-valuenow={Number.isFinite(peakDb) ? Math.round(peakDb) : -60}
                >
                    <div className={classNames(styles.meterBars, {[styles.meterStatic]: !props.playing})}>
                        {props.clip.channels.map((channel, c) => (
                            <div
                                key={c}
                                className={styles.meterTrack}
                            >
                                <div
                                    className={classNames(styles.meterFill, {
                                        [styles.meterHot]: props.playing && props.levels[c] >= 1
                                    })}
                                    style={{
                                        width: `${levelPercent(props.playing ? props.levels[c] : props.peak)}%`
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <span className={classNames(styles.meterText, {[styles.meterTextHot]: clipping})}>
                        {clipping ? format(messages.clipping) : format(messages.peak, {
                            value: Number.isFinite(peakDb) ? peakDb.toFixed(1) : '-∞'
                        })}
                    </span>
                </div>
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
            </div>

            <div className={styles.rack}>
                <div
                    className={styles.groupTabs}
                    role="group"
                    aria-label={format(messages.tools)}
                >
                    {TOOL_GROUPS.map(group => (
                        <button
                            key={group}
                            type="button"
                            aria-pressed={props.activeGroup === group}
                            className={classNames(styles.groupTab, {
                                [styles.groupTabActive]: props.activeGroup === group
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
                        {groupTools.map(item => (
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
                                {tool.params.map(param => (
                                    param.options ? (
                                        <div
                                            key={param.key}
                                            className={styles.param}
                                        >
                                            <span className={styles.paramLabel}>
                                                {format(PARAM_MESSAGES[tool.id][param.key])}
                                            </span>
                                            <div
                                                className={styles.segmented}
                                                role="group"
                                                aria-label={format(PARAM_MESSAGES[tool.id][param.key])}
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
                                        <label
                                            key={param.key}
                                            className={styles.param}
                                        >
                                            <span className={styles.paramLabel}>
                                                {format(PARAM_MESSAGES[tool.id][param.key])}
                                            </span>
                                            <input
                                                className={styles.slider}
                                                type="range"
                                                min={param.min}
                                                max={param.max}
                                                step={param.step}
                                                value={props.toolParams[param.key]}
                                                data-param={param.key}
                                                onChange={props.onChangeParam}
                                            />
                                            <span className={styles.paramValue}>
                                                {formatParam(param, props.toolParams[param.key])}
                                            </span>
                                        </label>
                                    )
                                ))}
                                {DESCRIPTIONS[tool.id] ? (
                                    <p className={styles.description}>{format(DESCRIPTIONS[tool.id])}</p>
                                ) : null}
                            </div>
                            <div className={styles.toolFooter}>
                                <p className={styles.hint}>{applyHint}</p>
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
    canPaste: PropTypes.bool.isRequired,
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
    cursor: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    intl: intlShape,
    isStereo: PropTypes.bool.isRequired,
    levels: PropTypes.arrayOf(PropTypes.number),
    loop: PropTypes.bool,
    mixSource: PropTypes.string,
    mixSources: PropTypes.arrayOf(PropTypes.shape({
        index: PropTypes.string,
        name: PropTypes.string
    })),
    name: PropTypes.string.isRequired,
    onApply: PropTypes.func.isRequired,
    onChangeMixSource: PropTypes.func,
    onChangeName: PropTypes.func.isRequired,
    onChangeOption: PropTypes.func.isRequired,
    onChangeParam: PropTypes.func.isRequired,
    onCopy: PropTypes.func.isRequired,
    onCopyToNew: PropTypes.func.isRequired,
    onCut: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onPaste: PropTypes.func.isRequired,
    onPause: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onPreview: PropTypes.func.isRequired,
    onRedo: PropTypes.func.isRequired,
    onSeek: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onSelectGroup: PropTypes.func.isRequired,
    onSelectTool: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    onSubmitEnd: PropTypes.func.isRequired,
    onSubmitStart: PropTypes.func.isRequired,
    onToStart: PropTypes.func.isRequired,
    onToggleLoop: PropTypes.func.isRequired,
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
    sampleRate: PropTypes.number.isRequired,
    selection: PropTypes.shape({
        start: PropTypes.number,
        end: PropTypes.number
    }),
    setRef: PropTypes.func,
    size: PropTypes.number.isRequired,
    theme: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    toolParams: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    viewLength: PropTypes.number.isRequired,
    viewStart: PropTypes.number.isRequired
};

SoundEditor.defaultProps = {
    levels: [],
    mixSources: [],
    toolParams: {}
};

export default injectIntl(SoundEditor);
