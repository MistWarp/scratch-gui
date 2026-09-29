import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import VM from 'scratch-vm';
import {Camera} from 'lucide-react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Button from '../button/button.jsx';
import {
    getSetting,
    getScreenshotSoundUrl,
    onSettingChanged
} from '../../lib/mw-stage-controls/settings.js';
import styles from './stage-controls.css';

const messages = defineMessages({
    takeScreenshot: {
        id: 'mw.stageControls.takeScreenshot',
        defaultMessage: 'Take stage screenshot',
        description: 'Label of the stage header button that captures the stage as an image'
    },
    preview: {
        id: 'mw.stageControls.screenshotPreview',
        defaultMessage: 'Stage screenshot',
        description: 'Alternative text of the stage screenshot preview image'
    },
    copied: {
        id: 'mw.stageControls.screenshotCopied',
        defaultMessage: 'Screenshot copied to clipboard.',
        description: 'Caption under the stage screenshot preview when it was copied'
    },
    notCopied: {
        id: 'mw.stageControls.screenshotNotCopied',
        defaultMessage: 'Screenshot taken, but your browser did not allow copying it to the clipboard.',
        description: 'Caption under the stage screenshot preview when copying to the clipboard failed'
    }
});

class ScreenshotButton extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClick',
            'handleSettingChanged'
        ]);
        this.state = {
            visible: getSetting('screenshot'),
            previewUrl: null,
            copied: false
        };
        this.previewTimeout = null;
    }
    componentDidMount () {
        this.removeSettingListener = onSettingChanged(this.handleSettingChanged);
    }
    componentWillUnmount () {
        if (this.removeSettingListener) {
            this.removeSettingListener();
        }
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }
    }
    handleSettingChanged () {
        this.setState({visible: getSetting('screenshot')});
    }
    playSoundEffect () {
        const soundUrl = getScreenshotSoundUrl();
        if (!soundUrl) {
            return;
        }
        try {
            const audio = new Audio(soundUrl);
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (err) {
            // Audio creation failed - ignore silently
        }
    }
    showPreview (dataUrl, copied) {
        if (!getSetting('screenshot_notifications') || !dataUrl) {
            return;
        }
        this.setState({previewUrl: dataUrl, copied});
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }
        this.previewTimeout = setTimeout(() => {
            this.setState({previewUrl: null});
            this.previewTimeout = null;
        }, 3000);
    }
    async takeScreenshot () {
        const renderer = this.props.vm.renderer;
        if (!renderer) {
            return;
        }
        const dataUrl = await new Promise(resolve => {
            renderer.requestSnapshot(resolve);
        });
        if (!dataUrl) {
            return;
        }
        let copied = false;
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            if (blob && blob.size > 0 && navigator.clipboard && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({'image/png': blob})
                    ]);
                    copied = true;
                } catch (err) {
                    // Clipboard write failed; preview still shows the capture
                }
            }
        } catch (err) {
            // Conversion failed; preview still shows the capture
        }
        this.showPreview(dataUrl, copied);
        this.playSoundEffect();
    }
    handleClick (e) {
        e.preventDefault();
        e.stopPropagation();
        this.takeScreenshot();
    }
    render () {
        if (!this.state.visible) {
            return null;
        }
        const {intl} = this.props;
        return (
            <React.Fragment>
                <div className={styles.screenshotButton}>
                    <Button
                        aria-label={intl.formatMessage(messages.takeScreenshot)}
                        title={intl.formatMessage(messages.takeScreenshot)}
                        iconElem={Camera}
                        className={this.props.buttonClassName}
                        iconClassName={this.props.buttonIconClassName}
                        onClick={this.handleClick}
                    />
                </div>
                {this.state.previewUrl && (
                    <div className={classNames(styles.screenshotPreview, styles.screenshotPreviewVisible)}>
                        <div className={styles.screenshotPreviewImage}>
                            <img
                                src={this.state.previewUrl}
                                alt={intl.formatMessage(messages.preview)}
                            />
                        </div>
                        <div className={styles.screenshotPreviewCaption}>
                            {intl.formatMessage(this.state.copied ? messages.copied : messages.notCopied)}
                        </div>
                    </div>
                )}
            </React.Fragment>
        );
    }
}

ScreenshotButton.propTypes = {
    intl: intlShape.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
    buttonClassName: PropTypes.string,
    buttonIconClassName: PropTypes.string
};

export default injectIntl(ScreenshotButton);
