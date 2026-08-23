import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {Pencil, RotateCcw, X} from 'lucide-react';

import KeyCombo, {eventToCombo} from './key-combo.jsx';

import styles from './shortcut-manager.css';

const messages = defineMessages({
    edit: {
        defaultMessage: 'Change shortcut',
        description: 'Tooltip for the button that starts recording a new shortcut',
        id: 'shortcut-manager.edit'
    },
    reset: {
        defaultMessage: 'Reset to default',
        description: 'Tooltip for the button that resets a shortcut to its default',
        id: 'shortcut-manager.reset'
    },
    cancel: {
        defaultMessage: 'Cancel',
        description: 'Tooltip for the button that cancels recording a shortcut',
        id: 'shortcut-manager.cancel'
    },
    recording: {
        defaultMessage: 'Press a shortcut…',
        description: 'Prompt shown while recording a new keyboard shortcut',
        id: 'shortcut-manager.recording'
    }
});

class ShortcutItem extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleStartRecording',
            'handleStopRecording',
            'handleReset',
            'handleKeyDown'
        ]);
        this.state = {
            recording: false,
            conflict: null
        };
    }

    componentWillUnmount () {
        this.removeListener();
    }

    addListener () {
        document.addEventListener('keydown', this.handleKeyDown, true);
    }

    removeListener () {
        document.removeEventListener('keydown', this.handleKeyDown, true);
    }

    handleStartRecording () {
        this.setState({recording: true, conflict: null});
        this.addListener();
    }

    handleStopRecording () {
        this.removeListener();
        this.setState({recording: false, conflict: null});
    }

    handleReset () {
        this.props.onReset(this.props.shortcut.id);
    }

    handleKeyDown (e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (e.code === 'Escape' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            this.handleStopRecording();
            return;
        }

        const combo = eventToCombo(e);
        if (!combo) {
            return;
        }

        const conflict = this.props.getConflict(combo, this.props.shortcut.id);
        if (conflict) {
            this.setState({conflict: {combo, label: conflict}});
            return;
        }

        this.props.onSave(this.props.shortcut.id, combo);
        this.handleStopRecording();
    }

    render () {
        const {shortcut, intl} = this.props;
        const {recording, conflict} = this.state;
        const isCustom = shortcut.key !== shortcut.defaultKey;

        if (recording) {
            return (
                <div className={classNames(styles.shortcutRow, styles.shortcutRowRecording)}>
                    <div className={styles.shortcutLabel}>{shortcut.label}</div>
                    <div className={styles.recordArea}>
                        {conflict ? (
                            <div className={styles.recordConflict}>
                                <KeyCombo keyCombo={conflict.combo} />
                                <span className={styles.conflictText}>
                                    {intl.formatMessage(
                                        {
                                            defaultMessage: 'In use by {label}',
                                            description: 'Message shown when a chosen shortcut is already assigned',
                                            id: 'shortcut-manager.conflict'
                                        },
                                        {label: conflict.label}
                                    )}
                                </span>
                            </div>
                        ) : (
                            <div className={styles.recordPrompt}>
                                {intl.formatMessage(messages.recording)}
                            </div>
                        )}
                        <button
                            type="button"
                            className={styles.iconButton}
                            onClick={this.handleStopRecording}
                            title={intl.formatMessage(messages.cancel)}
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.shortcutRow}>
                <div className={styles.shortcutLabel}>{shortcut.label}</div>
                <div className={styles.shortcutControls}>
                    <KeyCombo keyCombo={shortcut.key} />
                    {isCustom && (
                        <button
                            type="button"
                            className={styles.iconButton}
                            onClick={this.handleReset}
                            title={intl.formatMessage(messages.reset)}
                        >
                            <RotateCcw size={15} />
                        </button>
                    )}
                    <button
                        type="button"
                        className={styles.iconButton}
                        onClick={this.handleStartRecording}
                        title={intl.formatMessage(messages.edit)}
                    >
                        <Pencil size={15} />
                    </button>
                </div>
            </div>
        );
    }
}

ShortcutItem.propTypes = {
    shortcut: PropTypes.shape({
        id: PropTypes.string,
        key: PropTypes.string,
        defaultKey: PropTypes.string,
        label: PropTypes.string
    }).isRequired,
    onSave: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    getConflict: PropTypes.func.isRequired,
    intl: intlShape.isRequired
};

export default injectIntl(ShortcutItem);
