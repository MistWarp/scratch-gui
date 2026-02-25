import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import Modal from '../../containers/windowed-modal.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import styles from './project-theme-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Custom Theme',
        description: 'Title of modal that appears when a project has a stored theme',
        id: 'mw.projectThemeModal.title'
    }
});

const ProjectThemeModal = props => (
    <Modal
        className={styles.modalContent}
        onRequestClose={props.onCancel}
        contentLabel={props.intl.formatMessage(messages.title)}
        id="mwProjectThemeModal"
        resizable={false}
        maximizable={false}
        width={520}
        height={240}
        minWidth={520}
        minHeight={240}
        maxWidth={520}
        maxHeight={240}
    >
        <div className={styles.body}>
            <p>
                <FormattedMessage
                    defaultMessage="This project has a custom theme. Would you like to apply it?"
                    description="Prompt shown when a project contains a stored MistWarp theme"
                    id="mw.projectThemeModal.prompt"
                />
            </p>

            <label className={styles.checkboxLabel}>
                <FancyCheckbox
                    className={styles.checkbox}
                    checked={props.dontAskAgain}
                    onChange={props.onDontAskAgainChange}
                />
                <FormattedMessage
                    defaultMessage="Do not ask again"
                    description="Checkbox in the project theme prompt modal"
                    id="mw.projectThemeModal.doNotAskAgain"
                />
            </label>

            <div className={styles.buttons}>
                <button
                    className={styles.secondaryButton}
                    onClick={props.onCancel}
                >
                    <FormattedMessage
                        defaultMessage="Keep current theme"
                        description="Cancel button in the project theme prompt modal"
                        id="mw.projectThemeModal.cancel"
                    />
                </button>
                <button
                    className={styles.primaryButton}
                    onClick={props.onApply}
                >
                    <FormattedMessage
                        defaultMessage="Apply theme"
                        description="Apply button in the project theme prompt modal"
                        id="mw.projectThemeModal.apply"
                    />
                </button>
            </div>
        </div>
    </Modal>
);

ProjectThemeModal.propTypes = {
    intl: intlShape,
    dontAskAgain: PropTypes.bool,
    onDontAskAgainChange: PropTypes.func,
    onCancel: PropTypes.func,
    onApply: PropTypes.func
};

export default injectIntl(ProjectThemeModal);
