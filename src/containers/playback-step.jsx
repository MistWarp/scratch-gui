import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import PlaybackStepComponent from '../components/record-modal/playback-step.jsx';
import AudioBufferPlayer from '../lib/audio/audio-buffer-player.js';
import PlaybackMonitor from '../lib/audio/playback-monitor.js';
import {buildPeakIndex, clipLength, fromSamples} from '../lib/audio/sound-data.js';

class PlaybackStep extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleEnded',
            'handlePlay',
            'handleSeek',
            'handleSelect',
            'handleStopPlaying',
            'handleUpdate'
        ]);
        this.clip = fromSamples(props.samples, props.sampleRate);
        this.peakIndex = buildPeakIndex(this.clip);
        this.monitor = new PlaybackMonitor();
    }
    componentDidMount () {
        this.audioBufferPlayer = new AudioBufferPlayer(this.clip);
    }
    componentWillUnmount () {
        this.audioBufferPlayer.stop();
    }
    selection () {
        const length = clipLength(this.clip);
        return {
            start: Math.round(this.props.trimStart * length),
            end: Math.round(this.props.trimEnd * length)
        };
    }
    handlePlay () {
        const {start, end} = this.selection();
        this.audioBufferPlayer.playRange({
            start,
            end,
            onUpdate: this.handleUpdate,
            onEnded: this.handleEnded
        });
        this.props.onPlay();
    }
    handleUpdate (sample, levels) {
        this.monitor.update({sample, levels});
    }
    handleEnded () {
        this.monitor.reset();
        this.props.onStopPlaying();
    }
    handleStopPlaying () {
        this.audioBufferPlayer.stop();
        this.handleEnded();
    }
    handleSelect (start, end) {
        const length = clipLength(this.clip);
        if (end <= start || !length) return;
        if (this.props.playing) this.handleStopPlaying();
        this.props.onSetTrimStart(start / length);
        this.props.onSetTrimEnd(end / length);
    }
    handleSeek () {
        if (this.props.playing) this.handleStopPlaying();
    }
    render () {
        return (
            <PlaybackStepComponent
                clip={this.clip}
                encoding={this.props.encoding}
                monitor={this.monitor}
                peakIndex={this.peakIndex}
                playing={this.props.playing}
                selection={this.selection()}
                onBack={this.props.onBack}
                onPlay={this.handlePlay}
                onSeek={this.handleSeek}
                onSelect={this.handleSelect}
                onStopPlaying={this.handleStopPlaying}
                onSubmit={this.props.onSubmit}
            />
        );
    }
}

PlaybackStep.propTypes = {
    encoding: PropTypes.bool.isRequired,
    onBack: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onSetTrimEnd: PropTypes.func.isRequired,
    onSetTrimStart: PropTypes.func.isRequired,
    onStopPlaying: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    playing: PropTypes.bool.isRequired,
    sampleRate: PropTypes.number.isRequired,
    samples: PropTypes.instanceOf(Float32Array).isRequired,
    trimEnd: PropTypes.number.isRequired,
    trimStart: PropTypes.number.isRequired
};

export default PlaybackStep;
