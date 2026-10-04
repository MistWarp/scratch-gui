import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import Box from '../../box/box.jsx';
import Input from '../../forms/input.jsx';
import BufferedInputHOC from '../../forms/buffered-input-hoc.jsx';
import Header from '../settings-header.jsx';
import {BooleanSetting} from '../setting.jsx';
import styles from '../settings-modal.css';
import {
    getAuthorName, getAuthorEmail, setAuthorName, setAuthorEmail,
    getDefaultBranch, setDefaultBranch, getAutoCommit, setAutoCommit
} from '../../../lib/git/config.js';

const BufferedInput = BufferedInputHOC(Input);

const messages = defineMessages({
    header: {
        defaultMessage: 'Version Control',
        id: 'mw.settings.versionControlHeader'
    }
});

const TextSetting = ({label, help, value, onSubmit, placeholder}) => (
    <div className={styles.setting}>
        <div className={styles.textSettingLabel}>{label}</div>
        <BufferedInput
            className={styles.textInput}
            type="text"
            value={value}
            placeholder={placeholder}
            onSubmit={onSubmit}
        />
        {help && <p className={styles.detail}>{help}</p>}
    </div>
);
TextSetting.propTypes = {
    label: PropTypes.node,
    help: PropTypes.node,
    value: PropTypes.string,
    onSubmit: PropTypes.func.isRequired,
    placeholder: PropTypes.string
};

class UnwrappedVersionControlPage extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleNameChange',
            'handleEmailChange',
            'handleBranchChange',
            'handleAutoCommitChange'
        ]);
        this.state = {
            authorName: getAuthorName(),
            authorEmail: getAuthorEmail(),
            defaultBranch: getDefaultBranch(),
            autoCommit: getAutoCommit()
        };
    }
    handleNameChange (value) {
        setAuthorName(value);
        this.setState({authorName: getAuthorName()});
    }
    handleEmailChange (value) {
        setAuthorEmail(value);
        this.setState({authorEmail: getAuthorEmail()});
    }
    handleBranchChange (value) {
        setDefaultBranch(value);
        this.setState({defaultBranch: getDefaultBranch()});
    }
    handleAutoCommitChange (e) {
        const value = e.target.checked;
        setAutoCommit(value);
        this.setState({autoCommit: value});
    }
    render () {
        const {intl} = this.props;
        return (
            <Box className={styles.body}>
                <Header>{intl.formatMessage(messages.header)}</Header>
                <TextSetting
                    label={<FormattedMessage
                        defaultMessage="Author name"
                        id="mw.settings.vc.authorName"
                    />}
                    help={<FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Shown as the author of each version you save, and used as your username when sending changes to private repositories."
                        id="mw.settings.vc.authorNameHelp"
                    />}
                    value={this.state.authorName}
                    onSubmit={this.handleNameChange}
                    placeholder="User"
                />
                <TextSetting
                    label={<FormattedMessage
                        defaultMessage="Author email"
                        id="mw.settings.vc.authorEmail"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Saved as the contact email on each version you create."
                        id="mw.settings.vc.authorEmailHelp"
                    />}
                    value={this.state.authorEmail}
                    onSubmit={this.handleEmailChange}
                    placeholder="user@example.com"
                />
                <TextSetting
                    label={<FormattedMessage
                        defaultMessage="Default branch name"
                        id="mw.settings.vc.defaultBranch"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Name of the first branch when version history is turned on for a project."
                        id="mw.settings.vc.defaultBranchHelp"
                    />}
                    value={this.state.defaultBranch}
                    onSubmit={this.handleBranchChange}
                    placeholder="main"
                />
                <BooleanSetting
                    value={this.state.autoCommit}
                    onChange={this.handleAutoCommitChange}
                    label={<FormattedMessage
                        defaultMessage="Save a version automatically when the project is saved"
                        id="mw.settings.vc.autoCommit"
                    />}
                    help={<FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Adds a version to the project history each time you save, so you never have to create one by hand."
                        id="mw.settings.vc.autoCommitHelp"
                    />}
                />
            </Box>
        );
    }
}
UnwrappedVersionControlPage.propTypes = {
    intl: intlShape.isRequired
};
const VersionControlPage = injectIntl(UnwrappedVersionControlPage);

export default VersionControlPage;
