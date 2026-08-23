import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';

import DocumentationLink from '../tw-documentation-link/documentation-link.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import helpIcon from './help-icon.svg';
import styles from './settings-modal.css';

const messages = defineMessages({
    help: {
        defaultMessage: 'Click for help',
        description: 'Hover text of help icon in settings',
        id: 'tw.settingsModal.help'
    }
});

const LearnMore = props => (
    <React.Fragment>
        {' '}
        <DocumentationLink {...props}>
            <FormattedMessage
                defaultMessage="Learn more."
                id="gui.alerts.cloudInfoLearnMore"
            />
        </DocumentationLink>
    </React.Fragment>
);

class UnwrappedSetting extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, ['handleClickHelp']);
        this.state = {
            helpVisible: false
        };
    }
    componentDidUpdate (prevProps) {
        if (this.props.active && !prevProps.active) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({helpVisible: true});
        }
    }
    handleClickHelp () {
        this.setState(prevState => ({helpVisible: !prevState.helpVisible}));
    }
    render () {
        const {active, help, intl, primary, secondary, slug} = this.props;
        return (
            <div
                className={classNames(styles.setting, {
                    [styles.active]: active
                })}
            >
                <div className={styles.label}>
                    {primary}
                    <button
                        className={styles.helpIcon}
                        type="button"
                        aria-expanded={this.state.helpVisible}
                        onClick={this.handleClickHelp}
                        title={intl.formatMessage(messages.help)}
                    >
                        <img
                            src={helpIcon}
                            draggable={false}
                            alt=""
                        />
                    </button>
                </div>
                {this.state.helpVisible ? (
                    <div className={styles.detail}>
                        {help}
                        {slug ? <LearnMore slug={slug} /> : null}
                    </div>
                ) : null}
                {secondary}
            </div>
        );
    }
}

UnwrappedSetting.propTypes = {
    active: PropTypes.bool,
    help: PropTypes.node,
    intl: intlShape,
    primary: PropTypes.node,
    secondary: PropTypes.node,
    slug: PropTypes.string
};

const Setting = injectIntl(UnwrappedSetting);

const BooleanSetting = ({value, onChange, label, ...props}) => (
    <Setting
        {...props}
        active={value}
        primary={
            <label className={styles.label}>
                <FancyCheckbox
                    className={styles.checkbox}
                    checked={value}
                    onChange={onChange}
                />
                {label}
            </label>
        }
    />
);

BooleanSetting.propTypes = {
    label: PropTypes.node.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.bool.isRequired
};

export {BooleanSetting, LearnMore, Setting, UnwrappedSetting};
