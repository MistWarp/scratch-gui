import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';

import {openSettingsModal} from '../../reducers/modals.js';

import menuBarStyles from './menu-bar.css';
import styles from './settings-menu.css';

import {Settings} from 'lucide-react';

const messages = defineMessages({
    settings: {
        defaultMessage: 'Settings',
        description: 'Button in the menu bar to open the settings window',
        id: 'mw.menuBar.settings'
    }
});

const SettingsMenuComponent = ({intl, onOpenSettings}) => {
    // The visible label is hidden on narrow screens and in icons-only mode.
    const label = intl.formatMessage(messages.settings);
    return (
        <button
            type="button"
            data-mw-item="view"
            aria-label={label}
            className={classNames(styles.button, menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
            title={label}
            onClick={onOpenSettings}
        >
            <Settings
                width={20}
                height={20}
                size={20}
            />
            <span className={classNames(styles.dropdownLabel, menuBarStyles.collapsibleLabel)}>
                {label}
            </span>
        </button>
    );
};

SettingsMenuComponent.propTypes = {
    intl: intlShape.isRequired,
    onOpenSettings: PropTypes.func
};

const SettingsMenu = injectIntl(SettingsMenuComponent);

const ConnectedSettingsMenu = connect(
    null,
    dispatch => ({
        onOpenSettings: () => dispatch(openSettingsModal())
    })
)(SettingsMenu);

export {SettingsMenu};
export default ConnectedSettingsMenu;
