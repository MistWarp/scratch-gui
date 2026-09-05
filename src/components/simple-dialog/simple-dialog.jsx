import {defineMessages, FormattedMessage} from 'react-intl';
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
    
    handleKeyDown = e => {
        if (e.key === 'Enter' && this.props.onOk) {
            this.props.onOk(this.state.inputValue);
        } else if (e.key === 'Escape') {
            this.props.onCancel();
        }
    };

    handleChoice = event => {
        this.props.onOk(event.currentTarget.value);
    };

    handleConfirm = () => {
        this.props.onOk(this.state.inputValue);
    };
    
    render () {
        const {type, title, message, choices} = this.props;
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
                            onKeyDown={this.handleKeyDown}
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
                        {choices ? choices.map(choice => (
                            <button
                                key={choice.value}
                                className={styles.okButton}
                                onClick={this.handleChoice}
                                value={choice.value}
                                type="button"
                            >
                                {choice.label}
                            </button>
                        )) : <button
                            className={styles.okButton}
                            onClick={this.handleConfirm}
                            type="button"
                        >
                            <FormattedMessage {...messages.ok} />
                        </button>}
                    </div>
                </div>
            </Modal>
        );
    }
}

SimpleDialogComponent.propTypes = {
    type: PropTypes.oneOf(['alert', 'confirm', 'prompt']).isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.node.isRequired,
    defaultValue: PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
    })),
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default SimpleDialogComponent;
