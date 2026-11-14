import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import SoundTimeline from '../sound-editor/sound-timeline.jsx';
import PlaybackMonitor from '../../lib/audio/playback-monitor.js';
import {clipLength} from '../../lib/audio/sound-data.js';
import TWRenderRecoloredImage from '../../lib/tw-recolor/render.jsx';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import styles from './record-modal.css';
import backIcon from './icon--back.svg?recolor';
import stopIcon from './icon--stop-playback.svg?recolor';
import playIcon from './icon--play.svg?recolor';

const messages = defineMessages({
    stopMsg: {
        defaultMessage: 'Stop',
        description: 'Stop/Play button in recording playback',
        id: 'gui.playbackStep.stopMsg'
    },
    playMsg: {
        defaultMessage: 'Play',
        description: 'Stop/Play button in recording playback',
        id: 'gui.playbackStep.playMsg'
    },
    loadingMsg: {
        defaultMessage: 'Loading...',
        description: 'Loading/Save button in recording playback',
        id: 'gui.playbackStep.loadingMsg'
    },
    saveMsg: {
        defaultMessage: 'Save',
        description: 'Loading/Save button in recording playback',
        id: 'gui.playbackStep.saveMsg'
    },
    reRecordMsg: {
        defaultMessage: 'Re-record',
        description: 'Button to re-record sound in recording playback',
        id: 'gui.playbackStep.reRecordMsg'
    },
    waveform: {
        defaultMessage: 'Recording. Drag the edges of the selection to trim it.',
        description: 'Accessible label for the waveform of a new recording. The selection is the part that is kept',
        id: 'mw.playbackStep.waveform'
    }
});

const noop = () => {};

const PlaybackStep = props => (
    <Box>
        <Box className={styles.timelineContainer}>
            <SoundTimeline
                hideOverview
                clip={props.clip}
                cursor={props.selection.start}
                label={props.intl.formatMessage(messages.waveform)}
                monitor={props.monitor}
                peakIndex={props.peakIndex}
                selection={props.selection}
                viewLength={Math.max(1, clipLength(props.clip))}
                viewStart={0}
                onSeek={props.onSeek}
                onSelect={props.onSelect}
                onView={noop}
                onZoomAround={noop}
            />
        </Box>
        <Box className={styles.mainButtonRow}>
            <button
                type="button"
                className={styles.mainButton}
                onClick={props.playing ? props.onStopPlaying : props.onPlay}
            >
                <TWRenderRecoloredImage
                    draggable={false}
                    src={props.playing ? stopIcon : playIcon}
                />
                <div className={styles.helpText}>
                    <span className={styles.playingText}>
                        {props.playing ?
                            props.intl.formatMessage(messages.stopMsg) :
                            props.intl.formatMessage(messages.playMsg)
                        }
                    </span>
                </div>
            </button>
        </Box>
        <Box className={styles.buttonRow}>
            <button
                type="button"
                className={styles.rerecordButton}
                onClick={props.onBack}
            >
                <TWRenderRecoloredImage
                    draggable={false}
                    src={backIcon}
                />
                {props.intl.formatMessage(messages.reRecordMsg)}
            </button>
            <button
                type="button"
                className={styles.okButton}
                disabled={props.encoding}
                onClick={props.onSubmit}
            >
                {props.encoding ?
                    props.intl.formatMessage(messages.loadingMsg) :
                    props.intl.formatMessage(messages.saveMsg)
                }
            </button>
        </Box>
    </Box>
);

PlaybackStep.propTypes = {
    clip: PropTypes.shape({
        channels: PropTypes.arrayOf(PropTypes.instanceOf(Float32Array)),
        sampleRate: PropTypes.number
    }).isRequired,
    encoding: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    monitor: PropTypes.instanceOf(PlaybackMonitor).isRequired,
    onBack: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onSeek: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onStopPlaying: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    peakIndex: PropTypes.shape({
        blockSize: PropTypes.number,
        channels: PropTypes.arrayOf(PropTypes.object)
    }),
    playing: PropTypes.bool.isRequired,
    selection: PropTypes.shape({
        start: PropTypes.number,
        end: PropTypes.number
    }).isRequired
};

export default injectIntl(PlaybackStep);
