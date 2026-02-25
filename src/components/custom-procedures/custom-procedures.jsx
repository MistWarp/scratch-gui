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
        width={800}
        height={700}
        resizable={false}
        maximizable={false}
    >
        <Box
            className={styles.workspace}
            componentRef={props.componentRef}
        />
        <Box className={styles.body}>
            <Box className={styles.toolbarSection}>
                <Box className={styles.toolbar}>
                    <button
                        className={styles.toolbarButton}
                        onClick={props.onAddTextNumber}
                        title={props.intl.formatMessage({
                            defaultMessage: 'Add number or text input',
                            id: 'gui.customProcedures.numberTextType'
                        })}
                    >
                        <img
                            src={textInputIcon}
                            draggable={false}
                        />
                        <span>
                            <FormattedMessage
                                defaultMessage="Add number or text"
                                description="Label for button to add a number/text input"
                                id="gui.customProcedures.addAnInputNumberText"
                            />
                        </span>
                    </button>
                    <button
                        className={styles.toolbarButton}
                        onClick={props.onAddBoolean}
                        title={props.intl.formatMessage({
                            defaultMessage: 'Add boolean input',
                            id: 'gui.customProcedures.booleanType'
                        })}
                    >
                        <img
                            src={booleanInputIcon}
                            draggable={false}
                        />
                        <span>
                            <FormattedMessage
                                defaultMessage="Add boolean"
                                description="Label for button to add a boolean input"
                                id="gui.customProcedures.addAnInputBoolean"
                            />
                        </span>
                    </button>
                    <button
                        className={styles.toolbarButton}
                        onClick={props.onAddLabel}
                        title={props.intl.formatMessage({
                            defaultMessage: 'Add a label',
                            id: 'gui.customProcedures.addALabel'
                        })}
                    >
                        <img
                            src={labelIcon}
                            draggable={false}
                        />
                        <span>
                            <FormattedMessage
                                defaultMessage="Add label"
                                description="Label for button to add a label"
                                id="gui.customProcedures.addALabel"
                            />
                        </span>
                    </button>
                </Box>
            </Box>
            <Box className={styles.colorSection}>
                <ColorPicker
                    color={props.color || '#FF6680'}
                    onColorChange={props.onColorChange}
                />
            </Box>
            <Box className={styles.warpSection}>
                <label className={styles.checkboxRow}>
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
            </Box>
            <Box className={styles.buttonRow}>
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
    </Modal>
);

CustomProcedures.propTypes = {
    color: PropTypes.string,
    componentRef: PropTypes.func.isRequired,
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
