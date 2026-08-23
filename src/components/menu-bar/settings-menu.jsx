import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import {openSettingsModal} from '../../reducers/modals.js';

import menuBarStyles from './menu-bar.css';
import styles from './settings-menu.css';

import {Settings} from 'lucide-react';

const SettingsMenu = ({onOpenSettings}) => (
    <button
        type="button"
        data-mw-item="view"
        className={classNames(styles.button, menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
        onClick={onOpenSettings}
    >
        <Settings
            width={20}
            height={20}
            size={20}
        />
        <span className={classNames(styles.dropdownLabel, menuBarStyles.collapsibleLabel)}>
            <FormattedMessage
                defaultMessage="Settings"
                description="Button in the menu bar to open the settings window"
                id="mw.menuBar.settings"
            />
        </span>
    </button>
);

SettingsMenu.propTypes = {
    onOpenSettings: PropTypes.func
};

const ConnectedSettingsMenu = connect(
    null,
    dispatch => ({
        onOpenSettings: () => dispatch(openSettingsModal())
    })
)(SettingsMenu);

export {SettingsMenu};
export default ConnectedSettingsMenu;
