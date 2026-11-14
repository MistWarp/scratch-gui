import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import PlaybackMonitor from '../../lib/audio/playback-monitor.js';
import {formatClock} from '../../lib/audio/sound-time.js';
import {gainToDb} from '../../lib/audio/sound-data.js';

import styles from './sound-editor.css';

const useMonitor = monitor => {
    const [, setTick] = React.useState(0);
    React.useEffect(() => monitor.subscribe(() => setTick(tick => tick + 1)), [monitor]);
    return monitor;
};

const levelPercent = level => {
    if (!level || level <= 0) return 0;
    const db = gainToDb(level);
    return Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
};

const PlaybackClock = ({monitor, idleSample, sampleRate}) => {
    const {sample, recordingSeconds} = useMonitor(monitor);
    const recording = recordingSeconds !== null;
    let seconds = idleSample / sampleRate;
    if (recording) seconds = recordingSeconds;
    else if (sample !== null) seconds = sample / sampleRate;
    return (
        <div
            className={classNames(styles.clock, {[styles.clockRecording]: recording})}
            aria-live="off"
        >
            {formatClock(seconds)}
        </div>
    );
};

PlaybackClock.propTypes = {
    idleSample: PropTypes.number.isRequired,
    monitor: PropTypes.instanceOf(PlaybackMonitor).isRequired,
    sampleRate: PropTypes.number.isRequired
};

const LevelMeter = ({monitor, channelCount, live, peak, label, text, hot}) => {
    const {levels} = useMonitor(monitor);
    const peakDb = peak > 0 ? gainToDb(peak) : -Infinity;
    const tracks = [];
    for (let c = 0; c < channelCount; c++) {
        const level = live ? (levels.length > c ? levels[c] : levels[0]) : peak;
        tracks.push(
            <div
                key={c}
                className={styles.meterTrack}
            >
                <div
                    className={classNames(styles.meterFill, {[styles.meterHot]: live && level >= 1})}
                    style={{width: `${levelPercent(level)}%`}}
                />
            </div>
        );
    }
    return (
        <div
            className={styles.meter}
            role="meter"
            aria-label={label}
            aria-valuemin={-60}
            aria-valuemax={0}
            aria-valuenow={Number.isFinite(peakDb) ? Math.round(peakDb) : -60}
        >
            <div className={classNames(styles.meterBars, {[styles.meterStatic]: !live})}>{tracks}</div>
            <span className={classNames(styles.meterText, {[styles.meterTextHot]: hot})}>{text}</span>
        </div>
    );
};

LevelMeter.propTypes = {
    channelCount: PropTypes.number.isRequired,
    hot: PropTypes.bool,
    label: PropTypes.string.isRequired,
    live: PropTypes.bool,
    monitor: PropTypes.instanceOf(PlaybackMonitor).isRequired,
    peak: PropTypes.number,
    text: PropTypes.string.isRequired
};

export {
    LevelMeter,
    PlaybackClock
};
