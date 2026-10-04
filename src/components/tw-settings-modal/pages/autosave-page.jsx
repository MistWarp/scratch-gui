import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import React from 'react';
import bindAll from 'lodash.bindall';
import Box from '../../box/box.jsx';
import Input from '../../forms/input.jsx';
import BufferedInputHOC from '../../forms/buffered-input-hoc.jsx';
import Header from '../settings-header.jsx';
import {BooleanSetting} from '../setting.jsx';
import styles from '../settings-modal.css';
import {
    getSetting as getAutosaveSetting, setSetting as setAutosaveSetting,
    onSettingsChanged as onAutosaveSettingsChanged
} from '../../../lib/mw/autosave-settings.js';

const BufferedInput = BufferedInputHOC(Input);

const messages = defineMessages({
    header: {
        defaultMessage: 'Autosave',
        id: 'mw.settings.autosaveHeader'
    }
});

class UnwrappedAutosavePage extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleEnabledChange',
            'handleIntervalSubmit',
            'handleNotificationsChange',
            'handleOnlyWhenChangedChange'
        ]);
        this.state = {
            enabled: getAutosaveSetting('enabled'),
            interval: String(getAutosaveSetting('interval')),
            notifications: getAutosaveSetting('notifications'),
            onlyWhenChanged: getAutosaveSetting('only_when_changed')
        };
    }
    componentDidMount () {
        this.disposeAutosaveSettings = onAutosaveSettingsChanged(() => {
            this.setState({
                enabled: getAutosaveSetting('enabled'),
                interval: String(getAutosaveSetting('interval')),
                notifications: getAutosaveSetting('notifications'),
                onlyWhenChanged: getAutosaveSetting('only_when_changed')
            });
        });
    }
    componentWillUnmount () {
        if (this.disposeAutosaveSettings) this.disposeAutosaveSettings();
    }
    handleEnabledChange (e) {
        const value = e.target.checked;
        setAutosaveSetting('enabled', value);
        this.setState({enabled: getAutosaveSetting('enabled')});
    }
    handleIntervalSubmit (value) {
        setAutosaveSetting('interval', value);
        this.setState({interval: String(getAutosaveSetting('interval'))});
    }
    handleNotificationsChange (e) {
        const value = e.target.checked;
        setAutosaveSetting('notifications', value);
        this.setState({notifications: getAutosaveSetting('notifications')});
    }
    handleOnlyWhenChangedChange (e) {
        const value = e.target.checked;
        setAutosaveSetting('only_when_changed', value);
        this.setState({onlyWhenChanged: getAutosaveSetting('only_when_changed')});
    }
    render () {
        const {intl} = this.props;
        return (
            <Box className={styles.body}>
                <Header>{intl.formatMessage(messages.header)}</Header>
                <BooleanSetting
                    value={this.state.enabled}
                    onChange={this.handleEnabledChange}
                    label={<FormattedMessage
                        defaultMessage="Enable autosave"
                        id="mw.settings.autosave.enabled"
                    />}
                    help={<FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Saves your changes to MistWarp every few minutes without creating a new version. Only works for projects you own on MistWarp."
                        id="mw.settings.autosave.enabledHelp"
                    />}
                />
                <div className={styles.setting}>
                    <div className={styles.textSettingLabel}>
                        <FormattedMessage
                            defaultMessage="Autosave interval (minutes)"
                            id="mw.settings.autosave.interval"
                        />
                    </div>
                    <BufferedInput
                        className={styles.textInput}
                        type="number"
                        min="1"
                        max="60"
                        value={this.state.interval}
                        onSubmit={this.handleIntervalSubmit}
                    />
                    <p className={styles.detail}>
                        <FormattedMessage
                            defaultMessage="How often autosave runs, from 1 to 60 minutes."
                            id="mw.settings.autosave.intervalHelp"
                        />
                    </p>
                </div>
                <BooleanSetting
                    value={this.state.notifications}
                    onChange={this.handleNotificationsChange}
                    label={<FormattedMessage
                        defaultMessage="Show autosave notifications"
                        id="mw.settings.autosave.notifications"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Show a notification when autosave saves your changes or fails."
                        id="mw.settings.autosave.notificationsHelp"
                    />}
                />
                <BooleanSetting
                    value={this.state.onlyWhenChanged}
                    onChange={this.handleOnlyWhenChangedChange}
                    label={<FormattedMessage
                        defaultMessage="Only autosave changed projects"
                        id="mw.settings.autosave.onlyWhenChanged"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Skip autosave when nothing has changed since the last save."
                        id="mw.settings.autosave.onlyWhenChangedHelp"
                    />}
                />
            </Box>
        );
    }
}
UnwrappedAutosavePage.propTypes = {
    intl: intlShape.isRequired
};
const AutosavePage = injectIntl(UnwrappedAutosavePage);

export default AutosavePage;
