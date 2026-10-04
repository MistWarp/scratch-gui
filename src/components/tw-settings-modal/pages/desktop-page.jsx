import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Box from '../../box/box.jsx';
import {BooleanSetting, Setting} from '../setting.jsx';
import styles from '../settings-modal.css';

const DesktopSelectSetting = ({label, help, value, options, onChange}) => (
    <Setting
        help={help}
        primary={
            <div className={styles.label}>
                <span className={styles.settingText}>{label}</span>
                <select
                    className={styles.select}
                    value={value}
                    onChange={onChange}
                >
                    {options.map(option => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        }
    />
);
DesktopSelectSetting.propTypes = {
    label: PropTypes.node,
    help: PropTypes.node,
    value: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string,
        label: PropTypes.node
    })),
    onChange: PropTypes.func
};

class DesktopPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            settings: null,
            devices: []
        };
    }

    componentDidMount () {
        try {
            this.setState({settings: window.EditorPreload.getDesktopSettings()});
        } catch (e) {
            this.setState({settings: null});
        }
        navigator.mediaDevices.enumerateDevices()
            .then(devices => this.setState({devices}))
            .catch(() => {});
    }

    set (key, value) {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                [key]: value
            }
        }));
        window.EditorPreload.setDesktopSetting(key, value);
    }

    renderDeviceSelect (key, label, help, kind) {
        const devices = this.state.devices.filter(device => device.kind === kind);
        return (
            <DesktopSelectSetting
                label={label}
                help={help}
                value={this.state.settings[key] || ''}
                options={[
                    {
                        value: '',
                        label: 'System default'
                    },
                    ...devices.map(device => ({
                        value: device.deviceId,
                        label: device.label || device.deviceId
                    }))
                ]}
                onChange={e => this.set(key, e.target.value || null)}
            />
        );
    }

    render () {
        const s = this.state.settings;
        if (!s) {
            return null;
        }
        return (
            <Box className={styles.pageContent}>
                {s.updateCheckerAllowed ? (
                    <DesktopSelectSetting
                        label={<FormattedMessage
                            defaultMessage="Update notifications"
                            id="mw.settingsModal.desktop.updateChecker"
                        />}
                        help={<FormattedMessage
                            defaultMessage="Controls which app updates you are notified about. Security updates only shows the most important releases; Never disables the update check entirely."
                            id="mw.settingsModal.desktop.updateCheckerHelp"
                        />}
                        value={s.updateChecker}
                        options={[
                            {value: 'unstable',
                                label: 'All updates, including betas'},
                            {value: 'stable',
                                label: 'Stable updates'},
                            {value: 'security',
                                label: 'Security updates only'},
                            {value: 'never',
                                label: 'Never'}
                        ]}
                        onChange={e => this.set('updateChecker', e.target.value)}
                    />
                ) : null}
                {this.renderDeviceSelect('microphone', (<FormattedMessage
                    defaultMessage="Microphone"
                    id="mw.settingsModal.desktop.microphone"
                />), (<FormattedMessage
                    defaultMessage="The input device projects use to record audio, such as the microphone extension."
                    id="mw.settingsModal.desktop.microphoneHelp"
                />), 'audioinput')}
                {this.renderDeviceSelect('camera', (<FormattedMessage
                    defaultMessage="Camera"
                    id="mw.settingsModal.desktop.camera"
                />), (<FormattedMessage
                    defaultMessage="The camera projects use for video sensing."
                    id="mw.settingsModal.desktop.cameraHelp"
                />), 'videoinput')}
                <BooleanSetting
                    value={!!s.hardwareAcceleration}
                    onChange={value => this.set('hardwareAcceleration', value)}
                    label={<FormattedMessage
                        defaultMessage="Hardware acceleration (requires restart)"
                        id="mw.settingsModal.desktop.hardwareAcceleration"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Uses the GPU to speed up rendering. Turn this off if you see graphical glitches or crashes on your system."
                        id="mw.settingsModal.desktop.hardwareAccelerationHelp"
                    />}
                />
                <BooleanSetting
                    value={!!s.backgroundThrottling}
                    onChange={value => this.set('backgroundThrottling', value)}
                    label={<FormattedMessage
                        defaultMessage="Pause when the window is not visible"
                        id="mw.settingsModal.desktop.backgroundThrottling"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Slows down projects while the window is hidden or minimized to save power. Disable this if projects need to keep running in the background."
                        id="mw.settingsModal.desktop.backgroundThrottlingHelp"
                    />}
                />
                <BooleanSetting
                    value={!!s.bypassCORS}
                    onChange={value => this.set('bypassCORS', value)}
                    label={<FormattedMessage
                        defaultMessage="Allow projects to access any website (requires restart, dangerous)"
                        id="mw.settingsModal.desktop.bypassCORS"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Lets projects fetch data from websites that would normally block them. Only enable this for projects you trust, as it removes a security protection."
                        id="mw.settingsModal.desktop.bypassCORSHelp"
                    />}
                />
                <BooleanSetting
                    value={!!s.spellchecker}
                    onChange={value => this.set('spellchecker', value)}
                    label={<FormattedMessage
                        defaultMessage="Spellchecker (requires restart)"
                        id="mw.settingsModal.desktop.spellchecker"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Underlines misspelled words in text fields like the ask block prompt and costume names."
                        id="mw.settingsModal.desktop.spellcheckerHelp"
                    />}
                />
                <BooleanSetting
                    value={!!s.exitFullscreenOnEscape}
                    onChange={value => this.set('exitFullscreenOnEscape', value)}
                    label={<FormattedMessage
                        defaultMessage="Exit fullscreen when escape is pressed"
                        id="mw.settingsModal.desktop.exitFullscreenOnEscape"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Lets the Escape key leave fullscreen mode. Disable this if your project uses Escape for its own controls."
                        id="mw.settingsModal.desktop.exitFullscreenOnEscapeHelp"
                    />}
                />
                {s.richPresenceAvailable ? (
                    <BooleanSetting
                        value={!!s.richPresence}
                        onChange={value => this.set('richPresence', value)}
                        label={<FormattedMessage
                            defaultMessage="Discord rich presence"
                            id="mw.settingsModal.desktop.richPresence"
                        />}
                        help={<FormattedMessage
                            defaultMessage="Shows that you are using MistWarp on your Discord profile while the app is open."
                            id="mw.settingsModal.desktop.richPresenceHelp"
                        />}
                    />
                ) : null}
                <button
                    type="button"
                    className={styles.button}
                    onClick={() => window.EditorPreload.openUserData()}
                >
                    <FormattedMessage
                        defaultMessage="Open user data folder"
                        id="mw.settingsModal.desktop.openUserData"
                    />
                </button>
            </Box>
        );
    }
}

export default DesktopPage;
