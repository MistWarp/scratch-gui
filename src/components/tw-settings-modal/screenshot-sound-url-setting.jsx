import React from 'react';
import {FormattedMessage} from 'react-intl';
import Input from '../forms/input.jsx';
import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import {getScreenshotSoundUrl, setScreenshotSoundUrl} from '../../lib/mw-stage-controls/settings.js';
import styles from './settings-modal.css';

const BufferedInput = BufferedInputHOC(Input);

class ScreenshotSoundUrlSetting extends React.Component {
    constructor (props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {value: getScreenshotSoundUrl()};
    }
    handleSubmit (value) {
        setScreenshotSoundUrl(value);
        this.setState({value: getScreenshotSoundUrl()});
    }
    render () {
        return (
            <div className={styles.setting}>
                <div className={styles.textSettingLabel}>
                    <FormattedMessage
                        defaultMessage="Screenshot Sound Effect URL"
                        id="mw.settingsModal.screenshotSoundUrl"
                    />
                </div>
                <BufferedInput
                    className={styles.textInput}
                    type="text"
                    value={this.state.value}
                    placeholder="https://…"
                    onSubmit={this.handleSubmit}
                />
                <p className={styles.detail}>
                    <FormattedMessage
                        defaultMessage={'Optional sound played after a stage screenshot is captured. ' +
                            'Leave empty for silence.'}
                        id="mw.settingsModal.screenshotSoundUrlHelp"
                    />
                </p>
            </div>
        );
    }
}

export default ScreenshotSoundUrlSetting;
