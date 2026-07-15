import PropTypes from 'prop-types';
import React from 'react';
import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import ColorPicker from './color-picker.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';

import booleanInputIcon from './icon--boolean-input.svg';
import textInputIcon from './icon--text-input.svg';
import labelIcon from './icon--label.svg';

import styles from './custom-procedures.css';

const messages = defineMessages({
    myblockModalTitle: {
        defaultMessage: 'Make a Block',
        description: 'Title for the modal where you create a custom block.',
        id: 'gui.customProcedures.myblockModalTitle'
    }
});

const CustomProcedures = props => (
    <Modal
        className={styles.modalContent}
        contentLabel={props.intl.formatMessage(messages.myblockModalTitle)}
        onRequestClose={props.onCancel}
        id="customProceduresModal"
        centered
        width={Math.min(720, window.innerWidth - 40)}
        height={Math.min(600, window.innerHeight - 40)}
        minWidth={540}
        minHeight={440}
        maximizable={false}
    >
        <Box className={styles.container}>
            <Box
                className={styles.workspace}
                componentRef={props.componentRef}
            />
            <Box className={styles.addButtons}>
                <button
                    className={styles.addButton}
                    onClick={props.onAddTextNumber}
                >
                    <img
                        src={textInputIcon}
                        draggable={false}
                    />
                    <span className={styles.addButtonText}>
                        <span className={styles.addButtonLabel}>
                            <FormattedMessage
                                defaultMessage="Add an input"
                                description="Label for button to add a number/text input"
                                id="gui.customProcedures.addAnInputNumberText"
                            />
                        </span>
                        <span className={styles.addButtonType}>
                            <FormattedMessage
                                defaultMessage="number or text"
                                description="Description of the number or text input type"
                                id="gui.customProcedures.numberTextType"
                            />
                        </span>
                    </span>
                </button>
                <button
                    className={styles.addButton}
                    onClick={props.onAddBoolean}
                >
                    <img
                        src={booleanInputIcon}
                        draggable={false}
                    />
                    <span className={styles.addButtonText}>
                        <span className={styles.addButtonLabel}>
                            <FormattedMessage
                                defaultMessage="Add an input"
                                description="Label for button to add a boolean input"
                                id="gui.customProcedures.addAnInputBoolean"
                            />
                        </span>
                        <span className={styles.addButtonType}>
                            <FormattedMessage
                                defaultMessage="boolean"
                                description="Description of the boolean input type"
                                id="gui.customProcedures.booleanType"
                            />
                        </span>
                    </span>
                </button>
                <button
                    className={styles.addButton}
                    onClick={props.onAddLabel}
                >
                    <img
                        src={labelIcon}
                        draggable={false}
                    />
                    <span className={styles.addButtonText}>
                        <span className={styles.addButtonLabel}>
                            <FormattedMessage
                                defaultMessage="Add a label"
                                description="Label for button to add a label"
                                id="gui.customProcedures.addALabel"
                            />
                        </span>
                        <span className={styles.addButtonType}>
                            <FormattedMessage
                                defaultMessage="plain text"
                                description="Description of the label type"
                                id="gui.customProcedures.labelType"
                            />
                        </span>
                    </span>
                </button>
            </Box>
            <ColorPicker
                color={props.color}
                onColorChange={props.onColorChange}
            />
            <Box className={styles.footer}>
                <label className={styles.warpLabel}>
                    <FancyCheckbox
                        checked={props.warp}
                        onChange={props.onToggleWarp}
                    />
                    <FormattedMessage
                        defaultMessage="Run without screen refresh"
                        description="Label for checkbox to run without screen refresh"
                        id="gui.customProcedures.runWithoutScreenRefresh"
                    />
                </label>
                <Box className={styles.footerButtons}>
                    <button
                        className={styles.cancelButton}
                        onClick={props.onCancel}
                    >
                        <FormattedMessage
                            defaultMessage="Cancel"
                            description="Label for button to cancel custom procedure edits"
                            id="gui.customProcedures.cancel"
                        />
                    </button>
                    <button
                        className={styles.okButton}
                        disabled={props.emptyName}
                        onClick={props.onOk}
                    >
                        <FormattedMessage
                            defaultMessage="OK"
                            description="Label for button to save new custom procedure"
                            id="gui.customProcedures.ok"
                        />
                    </button>
                </Box>
            </Box>
        </Box>
    </Modal>
);

CustomProcedures.propTypes = {
    color: PropTypes.string.isRequired,
    componentRef: PropTypes.func.isRequired,
    emptyName: PropTypes.bool,
    intl: intlShape,
    onAddBoolean: PropTypes.func.isRequired,
    onAddLabel: PropTypes.func.isRequired,
    onAddTextNumber: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onColorChange: PropTypes.func.isRequired,
    onOk: PropTypes.func.isRequired,
    onToggleWarp: PropTypes.func.isRequired,
    warp: PropTypes.bool.isRequired
};

export default injectIntl(CustomProcedures);
