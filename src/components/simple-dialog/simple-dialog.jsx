import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Modal from '../../containers/windowed-modal.jsx';
import styles from './simple-dialog.css';

const messages = defineMessages({
    ok: {
        defaultMessage: 'OK',
        description: 'Button to confirm simple dialog',
        id: 'tw.simpleDialog.ok'
    },
    cancel: {
        defaultMessage: 'Cancel',
        description: 'Button to cancel simple dialog',
        id: 'tw.simpleDialog.cancel'
    }
});

class SimpleDialogComponent extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            inputValue: props.defaultValue || ''
        };
    }
    
    componentDidMount () {
        if (this.inputRef) {
            this.inputRef.focus();
            this.inputRef.select();
        }
    }
    
    handleInputChange = e => {
        this.setState({inputValue: e.target.value});
    };
    
    handleKeyPress = e => {
        if (e.key === 'Enter' && this.props.onOk) {
            this.props.onOk(this.state.inputValue);
        } else if (e.key === 'Escape') {
            this.props.onCancel();
        }
    };
    
    render () {
        const {type, title, message, intl} = this.props;
        const isPrompt = type === 'prompt';
        const isConfirm = type === 'confirm';
        
        return (
            <Modal
                className={styles.modalContent}
                onRequestClose={this.props.onCancel}
                contentLabel={title}
                id="simpleDialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="simpleDialog-title"
            >
                <div className={styles.body}>
                    <p
                        id="simpleDialog-title"
                        className={styles.message}
                        role="alert"
                    >
                        {message}
                    </p>

                    {isPrompt && (
                        <input
                            ref={ref => {
                                this.inputRef = ref;
                            }}
                            className={styles.input}
                            type="text"
                            value={this.state.inputValue}
                            onChange={this.handleInputChange}
                            onKeyPress={this.handleKeyPress}
                            aria-label={typeof message === 'string' ? message : 'Input'}
                        />
                    )}

                    <div
                        className={styles.buttonRow}
                        role="group"
                        aria-label="Dialog actions"
                    >
                        {(isConfirm || isPrompt) && (
                            <button
                                className={styles.cancelButton}
                                onClick={this.props.onCancel}
                                type="button"
                            >
                                <FormattedMessage {...messages.cancel} />
                            </button>
                        )}
                        <button
                            className={styles.okButton}
                            onClick={() => this.props.onOk(this.state.inputValue)}
                            type="button"
                        >
                            <FormattedMessage {...messages.ok} />
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }
}

SimpleDialogComponent.propTypes = {
    intl: intlShape,
    type: PropTypes.oneOf(['alert', 'confirm', 'prompt']).isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.node.isRequired,
    defaultValue: PropTypes.string,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default injectIntl(SimpleDialogComponent);
