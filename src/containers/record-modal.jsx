import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import {encodeAndAddSoundToVM} from '../lib/audio/audio-util.js';

import RecordModalComponent from '../components/record-modal/record-modal.jsx';

import {
    closeSoundRecorder
} from '../reducers/modals';
import {showStandardAlert} from '../reducers/alerts';

class RecordModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleRecord',
            'handleStopRecording',
            'handlePlay',
            'handleStopPlaying',
            'handleBack',
            'handleSubmit',
            'handleCancel',
            'handleSetPlayhead',
            'handleSetTrimStart',
            'handleSetTrimEnd'
        ]);

        this.state = {
            samples: null,
            encoding: false,
            levels: null,
            playhead: null,
            playing: false,
            recording: false,
            sampleRate: null,
            trimStart: 0,
            trimEnd: 1
        };
        this._isMounted = false;
        this.submitPromise = null;
    }
    componentDidMount () {
        this._isMounted = true;
    }
    componentWillUnmount () {
        this._isMounted = false;
    }
    handleRecord () {
        this.setState({recording: true});
    }
    handleStopRecording (samples, sampleRate, levels, trimStart, trimEnd) {
        if (samples.length > 0) {
            this.setState({samples, sampleRate, levels, trimStart, trimEnd, recording: false});
        }
    }
    handlePlay () {
        this.setState({playing: true});
    }
    handleStopPlaying () {
        this.setState({playing: false, playhead: null});
    }
    handleBack () {
        this.setState({playing: false, samples: null});
    }
    handleSetTrimEnd (trimEnd) {
        this.setState({trimEnd});
    }
    handleSetTrimStart (trimStart) {
        this.setState({trimStart});
    }
    handleSetPlayhead (playhead) {
        this.setState({playhead});
    }
    handleSubmit () {
        if (this.submitPromise) return this.submitPromise;
        const targetId = this.props.vm.editingTarget && this.props.vm.editingTarget.id;
        this.submitPromise = new Promise(resolve => {
            this.setState({encoding: true}, () => {
                const sampleCount = this.state.samples.length;
                const startIndex = Math.floor(this.state.trimStart * sampleCount);
                const endIndex = Math.floor(this.state.trimEnd * sampleCount);
                const clippedSamples = this.state.samples.slice(startIndex, endIndex);

                encodeAndAddSoundToVM(
                    this.props.vm,
                    clippedSamples,
                    this.state.sampleRate,
                    'recording1',
                    null,
                    targetId
                ).then(() => {
                    if (this._isMounted) {
                        this.props.onClose();
                        this.props.onNewSound(targetId);
                    }
                    resolve(true);
                })
                    .catch(() => {
                        if (this._isMounted) {
                            this.setState({encoding: false});
                            this.props.onShowImportError();
                        }
                        resolve(false);
                    });
            });
        }).finally(() => {
            this.submitPromise = null;
        });
        return this.submitPromise;
    }
    handleCancel () {
        if (this.state.encoding) return;
        this.props.onClose();
    }
    render () {
        return (
            <RecordModalComponent
                encoding={this.state.encoding}
                levels={this.state.levels}
                playhead={this.state.playhead}
                playing={this.state.playing}
                recording={this.state.recording}
                sampleRate={this.state.sampleRate}
                samples={this.state.samples}
                trimEnd={this.state.trimEnd}
                trimStart={this.state.trimStart}
                onBack={this.handleBack}
                onCancel={this.handleCancel}
                onPlay={this.handlePlay}
                onRecord={this.handleRecord}
                onSetPlayhead={this.handleSetPlayhead}
                onSetTrimEnd={this.handleSetTrimEnd}
                onSetTrimStart={this.handleSetTrimStart}
                onStopPlaying={this.handleStopPlaying}
                onStopRecording={this.handleStopRecording}
                onSubmit={this.handleSubmit}
            />
        );
    }
}

RecordModal.propTypes = {
    onClose: PropTypes.func,
    onNewSound: PropTypes.func,
    onShowImportError: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onClose: () => {
        dispatch(closeSoundRecorder());
    },
    onShowImportError: () => dispatch(showStandardAlert('assetImportError'))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RecordModal);

export {RecordModal};
