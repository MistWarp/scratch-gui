import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';

import {getSetting, onSettingChanged} from '../../lib/mw-stage-controls/settings.js';
import {
    setup,
    getVolume,
    setVolume,
    isMuted,
    setMuted,
    setUnmutedVolume,
    onVolumeChanged
} from '../../lib/mw-stage-controls/volume.js';
import muteIcon from './icons/mute.svg';
import quietIcon from './icons/quiet.svg';
import loudIcon from './icons/loud.svg';
import styles from './stage-controls.css';

class VolumeSlider extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleVolumeChanged',
            'handleSettingChanged',
            'handleSliderInput',
            'handleSliderChange',
            'handleIconClick'
        ]);
        setup(props.vm);
        this.state = {
            visible: getSetting('volume_slider'),
            volume: getVolume()
        };
    }
    componentDidMount () {
        onVolumeChanged(this.handleVolumeChanged);
        this.removeSettingListener = onSettingChanged(this.handleSettingChanged);
    }
    componentWillUnmount () {
        if (this.removeSettingListener) {
            this.removeSettingListener();
        }
    }
    handleVolumeChanged () {
        this.setState({volume: getVolume()});
    }
    handleSettingChanged () {
        this.setState({visible: getSetting('volume_slider')});
    }
    handleSliderInput (e) {
        setVolume(parseFloat(e.target.value));
    }
    handleSliderChange () {
        if (!isMuted()) {
            setUnmutedVolume(getVolume());
        }
    }
    handleIconClick () {
        setMuted(!isMuted());
    }
    render () {
        if (!this.state.visible) {
            return null;
        }
        const {volume} = this.state;
        const icon = volume === 0 ? muteIcon : volume < 0.5 ? quietIcon : loudIcon;
        return (
            <div className={styles.volSlider}>
                <span
                    className={styles.volIcon}
                    onClick={this.handleIconClick}
                    title={isMuted() ? 'Unmute' : 'Mute'}
                >
                    <img
                        draggable={false}
                        src={icon}
                        alt={isMuted() ? 'Muted' : 'Volume'}
                    />
                </span>
                <input
                    className={styles.volInput}
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={volume}
                    onInput={this.handleSliderInput}
                    onChange={this.handleSliderChange}
                    aria-label="Project volume"
                />
            </div>
        );
    }
}

VolumeSlider.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export default VolumeSlider;
