import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

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

const messages = defineMessages({
    mute: {
        id: 'mw.stageControls.mute',
        defaultMessage: 'Mute project',
        description: 'Label of the stage volume button when the project can be muted'
    },
    unmute: {
        id: 'mw.stageControls.unmute',
        defaultMessage: 'Unmute project',
        description: 'Label of the stage volume button when the project is muted'
    },
    volume: {
        id: 'mw.stageControls.volume',
        defaultMessage: 'Project volume',
        description: 'Accessible label of the stage volume slider'
    }
});

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
        this.removeVolumeListener = onVolumeChanged(this.handleVolumeChanged);
        this.removeSettingListener = onSettingChanged(this.handleSettingChanged);
    }
    componentWillUnmount () {
        this.removeVolumeListener();
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
        const {intl} = this.props;
        const {volume} = this.state;
        const icon = volume === 0 ? muteIcon : volume < 0.5 ? quietIcon : loudIcon;
        const muteLabel = intl.formatMessage(isMuted() ? messages.unmute : messages.mute);
        return (
            <div className={styles.volSlider}>
                <button
                    type="button"
                    className={styles.volIcon}
                    onClick={this.handleIconClick}
                    title={muteLabel}
                    aria-label={muteLabel}
                    aria-pressed={isMuted()}
                >
                    <img
                        draggable={false}
                        src={icon}
                        alt=""
                    />
                </button>
                <input
                    className={styles.volInput}
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={volume}
                    onInput={this.handleSliderInput}
                    onChange={this.handleSliderChange}
                    aria-label={intl.formatMessage(messages.volume)}
                />
            </div>
        );
    }
}

VolumeSlider.propTypes = {
    intl: intlShape.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default injectIntl(VolumeSlider);
