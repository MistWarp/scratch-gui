import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import RecordingStepComponent from '../components/record-modal/recording-step.jsx';
import AudioRecorder from '../lib/audio/audio-recorder.js';
import {injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import {showStandardAlert} from '../reducers/alerts';
import log from '../lib/utils/log';

class RecordingStep extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleRecord',
            'handleStopRecording',
            'handleStarted',
            'handleLevelUpdate',
            'handleRecordingError'
        ]);

        this.state = {
            listening: false,
            level: 0,
            levels: null
        };
        this._isMounted = false;
    }
    componentDidMount () {
        this._isMounted = true;
        this.audioRecorder = new AudioRecorder();
        this.audioRecorder.startListening(this.handleStarted, this.handleLevelUpdate, this.handleRecordingError);
    }
    componentWillUnmount () {
        this._isMounted = false;
        this.audioRecorder.dispose();
    }
    handleStarted () {
        if (!this._isMounted) return;
        this.setState({listening: true});
    }
    handleRecordingError (error) {
        log.error(error);
        if (this._isMounted) this.props.onShowRecordingError();
    }
    handleLevelUpdate (level) {
        if (!this._isMounted) return;
        this.setState({
            level: level,
            levels: this.props.recording ? (this.state.levels || []).concat([level]) : this.state.levels
        });
    }
    handleRecord () {
        this.audioRecorder.startRecording();
        this.props.onRecord();
    }
    handleStopRecording () {
        const {samples, sampleRate, levels, trimStart, trimEnd} = this.audioRecorder.stop();
        this.props.onStopRecording(samples, sampleRate, levels, trimStart, trimEnd);
    }
    render () {
        const {
            onRecord, // eslint-disable-line no-unused-vars
            onStopRecording, // eslint-disable-line no-unused-vars
            ...componentProps
        } = this.props;
        return (
            <RecordingStepComponent
                level={this.state.level}
                levels={this.state.levels}
                listening={this.state.listening}
                onRecord={this.handleRecord}
                onStopRecording={this.handleStopRecording}
                {...componentProps}
            />
        );
    }
}

RecordingStep.propTypes = {
    intl: intlShape.isRequired,
    onRecord: PropTypes.func.isRequired,
    onShowRecordingError: PropTypes.func.isRequired,
    onStopRecording: PropTypes.func.isRequired,
    recording: PropTypes.bool
};

const mapDispatchToProps = dispatch => ({
    onShowRecordingError: () => dispatch(showStandardAlert('recordingError'))
});

export {RecordingStep};
export default injectIntl(connect(null, mapDispatchToProps)(RecordingStep));
