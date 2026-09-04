import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import VM from 'scratch-vm';
import {Camera} from 'lucide-react';

import Button from '../button/button.jsx';
import {
    getSetting,
    getScreenshotSoundUrl,
    onSettingChanged
} from '../../lib/mw-stage-controls/settings.js';
import styles from './stage-controls.module.css';

class ScreenshotButton extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClick',
            'handleSettingChanged'
        ]);
        this.state = {
            visible: getSetting('screenshot'),
            previewUrl: null
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
    showPreview (dataUrl) {
        if (!getSetting('screenshot_notifications') || !dataUrl) {
            return;
        }
        this.setState({previewUrl: dataUrl});
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
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            if (blob && blob.size > 0 && navigator.clipboard && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({'image/png': blob})
                    ]);
                } catch (err) {
                    // Clipboard write failed; preview still shows the capture
                }
            }
        } catch (err) {
            // Conversion failed; preview still shows the capture
        }
        this.showPreview(dataUrl);
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
        return (
            <React.Fragment>
                <div className={styles.screenshotButton}>
                    <Button
                        aria-label="Take stage screenshot"
                        title="Take stage screenshot"
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
                                alt="Stage screenshot"
                            />
                        </div>
                        <div className={styles.screenshotPreviewCaption}>
                            {'Screenshot copied to clipboard!'}
                        </div>
                    </div>
                )}
            </React.Fragment>
        );
    }
}

ScreenshotButton.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired,
    buttonClassName: PropTypes.string,
    buttonIconClassName: PropTypes.string
};

export default ScreenshotButton;
