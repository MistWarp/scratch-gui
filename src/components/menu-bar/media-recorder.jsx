import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {
    CircleAlert,
    Download,
    Flag,
    Mic,
    Settings2,
    Square,
    Timer,
    Video,
    Volume2,
    X
} from 'lucide-react';

import AddonWindow from '../../addons/window-system/window.jsx';
import downloadBlob from '../../addons/libraries/common/cs/download-blob.js';
import styles from './media-recorder.css';

const MIME_TYPES = [
    'video/webm; codecs=vp9',
    'video/webm',
    'video/mp4'
];

const formatBytes = bytes => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

class MediaRecorderButton extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            open: false,
            phase: 'options',
            duration: 30,
            delay: 0,
            projectAudio: true,
            microphone: false,
            startOnFlag: true,
            stopOnStop: true,
            elapsed: 0,
            bytes: 0,
            countdown: 0,
            error: ''
        };
        this.recorder = null;
        this.chunks = [];
        this.saveOnStop = true;
        this.durationTimer = null;
        this.statusTimer = null;
        this.delayTimer = null;
        this.flagListener = null;
        this.stopListener = null;
        this.micStream = null;
        this.captureStream = null;
        this.mixContext = null;
        this.projectAudioDestination = null;
        this.startedAt = 0;
        this.unmounted = false;
    }

    componentWillUnmount () {
        this.unmounted = true;
        this.cancelRecording();
    }

    getMimeType () {
        return MIME_TYPES.find(type => window.MediaRecorder.isTypeSupported(type)) || '';
    }

    getExtension () {
        return this.getMimeType().startsWith('video/mp4') ? 'mp4' : 'webm';
    }

    clearTimers () {
        clearTimeout(this.durationTimer);
        clearInterval(this.statusTimer);
        clearInterval(this.delayTimer);
        this.durationTimer = null;
        this.statusTimer = null;
        this.delayTimer = null;
    }

    removeRuntimeListeners () {
        const runtime = this.props.vm.runtime;
        if (this.flagListener) runtime.off('PROJECT_START', this.flagListener);
        if (this.stopListener) runtime.off('PROJECT_STOP_ALL', this.stopListener);
        this.flagListener = null;
        this.stopListener = null;
    }

    releaseStreams () {
        if (this.captureStream) {
            for (const track of this.captureStream.getTracks()) track.stop();
        }
        if (this.micStream) {
            for (const track of this.micStream.getTracks()) track.stop();
        }
        if (this.projectAudioDestination) {
            try {
                this.props.vm.runtime.audioEngine.inputNode.disconnect(this.projectAudioDestination);
            } catch (_) {
                // ignore
            }
            for (const track of this.projectAudioDestination.stream.getTracks()) track.stop();
        }
        if (this.mixContext) this.mixContext.close();
        this.captureStream = null;
        this.micStream = null;
        this.mixContext = null;
        this.projectAudioDestination = null;
    }

    cleanupCapture () {
        this.clearTimers();
        this.removeRuntimeListeners();
        this.releaseStreams();
        this.recorder = null;
        this.chunks = [];
    }

    cancelRecording () {
        this.saveOnStop = false;
        if (this.recorder && this.recorder.state !== 'inactive') {
            this.recorder.stop();
        } else {
            this.cleanupCapture();
        }
    }

    handleOpen = () => {
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    handleNumberChange = event => {
        const field = event.currentTarget.dataset.field;
        const limits = field === 'duration' ? [1, 600] : [0, 600];
        const value = Math.min(limits[1], Math.max(limits[0], Number(event.currentTarget.value) || 0));
        this.setState({[field]: value});
    };

    handleToggle = event => {
        const field = event.currentTarget.dataset.field;
        this.setState({[field]: event.currentTarget.checked});
    };

    handleStart = async () => {
        if (!this.getMimeType()) {
            this.setState({error: 'This browser cannot encode a supported video format.'});
            return;
        }
        this.setState({error: '', elapsed: 0, bytes: 0});
        if (this.state.microphone) {
            try {
                this.micStream = await navigator.mediaDevices.getUserMedia({audio: true});
            } catch (error) {
                const unavailable = error.name === 'NotAllowedError' || error.name === 'NotFoundError';
                if (!unavailable) {
                    this.setState({error: error.message || 'Microphone access failed.'});
                    return;
                }
                this.setState({microphone: false,
                    error:
                    'Microphone access was unavailable. Recording will continue without it.'});
            }
        }
        if (this.unmounted) {
            this.releaseStreams();
            return;
        }
        if (this.state.startOnFlag) {
            this.setState({phase: 'waiting'});
            this.flagListener = () => {
                this.flagListener = null;
                this.beginDelay();
            };
            this.props.vm.runtime.once('PROJECT_START', this.flagListener);
        } else {
            this.beginDelay();
        }
    };

    beginDelay () {
        if (this.state.delay <= 0) {
            this.beginCapture();
            return;
        }
        const endsAt = Date.now() + (this.state.delay * 1000);
        const update = () => {
            const countdown = Math.max(0, (endsAt - Date.now()) / 1000);
            this.setState({phase: 'delaying', countdown});
            if (countdown <= 0) {
                clearInterval(this.delayTimer);
                this.delayTimer = null;
                this.beginCapture();
            }
        };
        update();
        this.delayTimer = setInterval(update, 100);
    }

    beginCapture () {
        try {
            const runtime = this.props.vm.runtime;
            this.captureStream = new MediaStream();
            const stageStream = runtime.renderer.canvas.captureStream();
            const videoTrack = stageStream.getVideoTracks()[0];
            if (!videoTrack) throw new Error('The stage could not provide a video track.');
            this.captureStream.addTrack(videoTrack);

            if (this.state.projectAudio || this.micStream) {
                this.mixContext = new AudioContext();
                const mix = this.mixContext.createMediaStreamDestination();
                if (this.state.projectAudio) {
                    this.projectAudioDestination = runtime.audioEngine.audioContext.createMediaStreamDestination();
                    runtime.audioEngine.inputNode.connect(this.projectAudioDestination);
                    this.mixContext.createMediaStreamSource(this.projectAudioDestination.stream).connect(mix);
                }
                if (this.micStream) this.mixContext.createMediaStreamSource(this.micStream).connect(mix);
                const audioTrack = mix.stream.getAudioTracks()[0];
                if (audioTrack) this.captureStream.addTrack(audioTrack);
            }

            this.chunks = [];
            this.saveOnStop = true;
            this.recorder = new window.MediaRecorder(this.captureStream, {mimeType: this.getMimeType()});
            this.recorder.ondataavailable = event => {
                if (event.data.size) {
                    this.chunks.push(event.data);
                    if (!this.unmounted) {
                        this.setState({bytes: this.chunks.reduce((total, chunk) => total + chunk.size, 0)});
                    }
                }
            };
            this.recorder.onerror = event => {
                this.setState({error: event.error?.message || 'Recording failed.'});
                this.stopRecording(false);
            };
            this.recorder.onstop = this.handleRecorderStopped;
            this.recorder.start(1000);
            this.startedAt = Date.now();
            this.setState({phase: 'recording', elapsed: 0});
            this.statusTimer = setInterval(() => {
                this.setState({elapsed: (Date.now() - this.startedAt) / 1000});
            }, 100);
            this.durationTimer = setTimeout(() => this.stopRecording(true), this.state.duration * 1000);
            if (this.state.stopOnStop) {
                this.stopListener = () => this.stopRecording(true);
                runtime.once('PROJECT_STOP_ALL', this.stopListener);
            }
        } catch (error) {
            this.cleanupCapture();
            this.setState({phase: 'options', error: error.message || 'Recording could not start.'});
        }
    }

    handleRecorderStopped = () => {
        const shouldSave = this.saveOnStop;
        const chunks = this.chunks;
        const mimeType = this.getMimeType();
        this.cleanupCapture();
        if (shouldSave && chunks.length) {
            const filename = `${this.props.projectTitle || 'video'}.${this.getExtension()}`;
            downloadBlob(filename, new Blob(chunks, {type: mimeType}));
        }
        if (!this.unmounted) this.setState({phase: 'options', elapsed: 0, bytes: 0, countdown: 0});
    };

    stopRecording (save) {
        this.saveOnStop = save;
        if (this.state.phase === 'waiting' || this.state.phase === 'delaying') {
            this.cleanupCapture();
            this.setState({phase: 'options', elapsed: 0, bytes: 0, countdown: 0});
            return;
        }
        if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    }

    handleStopAndSave = () => {
        this.stopRecording(true);
    };

    handleCancel = () => {
        this.stopRecording(false);
    };

    renderOptions () {
        return (
            <React.Fragment>
                <div className={styles.intro}>
                    <Video size={22} />
                    <div>
                        <strong>{'Capture the stage'}</strong>
                        <span>
                            {`Save the stage as a .${this.getExtension()} video. ` +
                                'Variable and list monitors are not included.'}
                        </span>
                    </div>
                </div>
                <section className={styles.section}>
                    <h3><Timer size={17} /> {'Timing'}</h3>
                    <div className={styles.fieldGrid}>
                        <label>
                            <span>{'Duration'}</span>
                            <div className={styles.inputWithUnit}>
                                <input
                                    data-field="duration"
                                    max="600"
                                    min="1"
                                    type="number"
                                    value={this.state.duration}
                                    onChange={this.handleNumberChange}
                                />
                                <span>{'seconds'}</span>
                            </div>
                        </label>
                        <label>
                            <span>{'Start delay'}</span>
                            <div className={styles.inputWithUnit}>
                                <input
                                    data-field="delay"
                                    max="600"
                                    min="0"
                                    step="0.1"
                                    type="number"
                                    value={this.state.delay}
                                    onChange={this.handleNumberChange}
                                />
                                <span>{'seconds'}</span>
                            </div>
                        </label>
                    </div>
                </section>
                <section className={styles.section}>
                    <h3><Settings2 size={17} /> {'Capture options'}</h3>
                    {this.renderToggle('projectAudio', Volume2, 'Include project audio')}
                    {this.renderToggle('microphone', Mic, 'Include microphone audio')}
                    {this.renderToggle('startOnFlag', Flag, 'Wait for the green flag')}
                    {this.renderToggle('stopOnStop', Square, 'Stop when the project stops')}
                </section>
                {this.state.error && (
                    <div className={styles.notice}>
                        <CircleAlert size={17} />
                        <span>{this.state.error}</span>
                    </div>
                )}
                <div className={styles.actions}>
                    <button
                        className={styles.secondaryButton}
                        onClick={this.handleClose}
                    >
                        <X size={17} />
                        {'Cancel'}
                    </button>
                    <button
                        className={styles.primaryButton}
                        onClick={this.handleStart}
                    >
                        <Video size={17} />
                        {'Start recording'}
                    </button>
                </div>
            </React.Fragment>
        );
    }

    renderToggle (field, Icon, label, disabled = false) {
        return (
            <label
                key={field}
                className={classNames(styles.toggleRow, {[styles.disabled]: disabled})}
            >
                <Icon size={18} />
                <span>{label}</span>
                <input
                    checked={this.state[field]}
                    data-field={field}
                    disabled={disabled}
                    type="checkbox"
                    onChange={this.handleToggle}
                />
            </label>
        );
    }

    renderStatus () {
        const waiting = this.state.phase === 'waiting';
        const delaying = this.state.phase === 'delaying';
        const elapsed = Math.min(this.state.duration, this.state.elapsed);
        const progress = this.state.duration ? (elapsed / this.state.duration) * 100 : 0;
        return (
            <div className={styles.statusPage}>
                <div className={classNames(styles.statusIcon, {[styles.recording]: !waiting && !delaying})}>
                    {waiting ? <Flag size={30} /> : delaying ? <Timer size={30} /> : <Video size={30} />}
                </div>
                <h2>
                    {waiting ? 'Waiting for the green flag' :
                        delaying ? 'Starting shortly' : 'Recording the stage'}
                </h2>
                <p>
                    {waiting ?
                        'Recording will begin when the project starts.' :
                        delaying ?
                            `Starting in ${this.state.countdown.toFixed(1)} seconds.` :
                            'Keep this window open or return to the editor while the capture runs.'}
                </p>
                {!waiting && !delaying && (
                    <React.Fragment>
                        <div className={styles.progress}>
                            <span style={{width: `${progress}%`}} />
                        </div>
                        <div className={styles.stats}>
                            <div>
                                <Timer size={18} />
                                <span>{'Elapsed'}</span>
                                <strong>{`${elapsed.toFixed(1)}s / ${this.state.duration}s`}</strong>
                            </div>
                            <div>
                                <Download size={18} />
                                <span>{'Captured'}</span>
                                <strong>{formatBytes(this.state.bytes)}</strong>
                            </div>
                        </div>
                    </React.Fragment>
                )}
                {this.state.error && (
                    <div className={styles.notice}>
                        <CircleAlert size={17} />
                        <span>{this.state.error}</span>
                    </div>
                )}
                <div className={styles.actions}>
                    <button
                        className={styles.secondaryButton}
                        onClick={this.handleCancel}
                    >
                        <X size={17} />
                        {'Discard'}
                    </button>
                    {!waiting && !delaying && (
                        <button
                            className={styles.primaryButton}
                            onClick={this.handleStopAndSave}
                        >
                            <Square size={17} />
                            {'Stop and save'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    render () {
        const active = this.state.phase !== 'options';
        return (
            <React.Fragment>
                <button
                    className={classNames(styles.menuButton, this.props.className, {
                        [styles.menuButtonActive]: active
                    })}
                    data-mw-item="media-recorder"
                    title={active ? 'Recording status' : 'Record project video'}
                    type="button"
                    onClick={this.handleOpen}
                >
                    {active ? <Square size={20} /> : <Video size={20} />}
                    <span className={this.props.labelClassName}>{active ? 'Recording' : 'Record'}</span>
                </button>
                {this.state.open && (
                    <AddonWindow
                        className={styles.window}
                        height={560}
                        id="media-recorder"
                        maximizable={false}
                        minimizable={false}
                        minHeight={430}
                        minWidth={380}
                        resizable
                        title={this.props.intl.formatMessage({
                            id: 'mw.mediaRecorder.title',
                            defaultMessage: 'Project Video Recorder'
                        })}
                        width={480}
                        onClose={this.handleClose}
                    >
                        <div className={styles.page}>
                            {active ? this.renderStatus() : this.renderOptions()}
                        </div>
                    </AddonWindow>
                )}
            </React.Fragment>
        );
    }
}

MediaRecorderButton.propTypes = {
    className: PropTypes.string,
    intl: intlShape.isRequired,
    labelClassName: PropTypes.string,
    projectTitle: PropTypes.string,
    vm: PropTypes.object.isRequired
};

export default injectIntl(MediaRecorderButton);
