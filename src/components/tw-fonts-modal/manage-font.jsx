import React from 'react';
import PropTypes from 'prop-types';
import {injectIntl, intlShape, defineMessages, FormattedMessage} from 'react-intl';
import bindAll from 'lodash.bindall';
import {formatBytes} from '../../lib/utils/bytes';
import downloadBlob from '../../lib/utils/download-blob';
import {projectFilename} from '../../lib/utils/safe-filename.js';
import styles from './fonts-modal.css';
import deleteIcon from './delete.svg';
import exportIcon from './export.svg';

const messages = defineMessages({
    delete: {
        // eslint-disable-next-line max-len
        defaultMessage: 'Are you sure you want to delete "{font}"? Any vector costumes will use the fallback font instead.',
        description: 'Part of font management modal. {font} is replaced with the name of a font like "Arial"',
        id: 'tw.fonts.delete'
    }
});

class ManageFont extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleExport',
            'handleDelete',
            'handleCancelDelete',
            'handleConfirmDelete'
        ]);
        this.state = {
            confirmingDelete: false,
            deleteError: ''
        };
    }

    handleExport () {
        const blob = new Blob([this.props.data], {
            type: `font/${this.props.format}`
        });
        downloadBlob(projectFilename(this.props.name, 'font', this.props.format), blob);
    }

    handleDelete () {
        this.setState({confirmingDelete: true, deleteError: ''});
    }

    handleCancelDelete () {
        this.setState({confirmingDelete: false, deleteError: ''});
    }

    handleConfirmDelete () {
        try {
            this.props.fontManager.deleteFont(this.props.index);
        } catch (error) {
            this.setState({deleteError: error.message || 'Could not delete this font.'});
        }
    }

    render () {
        return (
            <div className={styles.manageFont}>
                {this.state.confirmingDelete ? (
                    <div className={styles.manageFontConfirm}>
                        <div>
                            <strong>{this.props.intl.formatMessage(messages.delete, {font: this.props.name})}</strong>
                            {this.state.deleteError ? (
                                <span className={styles.manageFontError}>{this.state.deleteError}</span>
                            ) : null}
                        </div>
                        <div className={styles.manageFontConfirmButtons}>
                            <button
                                type="button"
                                className={styles.manageFontCancel}
                                onClick={this.handleCancelDelete}
                            >
                                <FormattedMessage
                                    defaultMessage="Cancel"
                                    id="general.cancel"
                                />
                            </button>
                            <button
                                type="button"
                                className={styles.manageFontDelete}
                                onClick={this.handleConfirmDelete}
                            >
                                <FormattedMessage
                                    defaultMessage="Delete font"
                                    id="tw.fonts.delete.action"
                                />
                            </button>
                        </div>
                    </div>
                ) : <React.Fragment>
                    <div>
                        <div
                            className={styles.manageFontName}
                            title={this.props.family}
                            style={{
                                fontFamily: this.props.family
                            }}
                        >
                            {this.props.name}
                        </div>

                        <div className={styles.manageFontDetails}>
                            {this.props.system ? (
                                <FormattedMessage
                                    defaultMessage="System font"
                                    description="Part of font management modal"
                                    id="tw.fonts.system"
                                />
                            ) : (
                                formatBytes(this.props.data.byteLength)
                            )}
                        </div>
                    </div>

                    <div className={styles.manageFontButtons}>
                        {!this.props.system && (
                            <button
                                type="button"
                                className={styles.manageFontButton}
                                onClick={this.handleExport}
                            >
                                <img
                                    src={exportIcon}
                                    alt="Export"
                                    draggable={false}
                                />
                            </button>
                        )}

                        <button
                            type="button"
                            className={styles.manageFontButton}
                            onClick={this.handleDelete}
                        >
                            <img
                                src={deleteIcon}
                                alt="Delete"
                                draggable={false}
                            />
                        </button>
                    </div>
                </React.Fragment>}
            </div>
        );
    }
}

ManageFont.propTypes = {
    intl: intlShape,
    system: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    family: PropTypes.string.isRequired,
    data: PropTypes.instanceOf(Uint8Array),
    format: PropTypes.string,
    index: PropTypes.number.isRequired,
    fontManager: PropTypes.shape({
        deleteFont: PropTypes.func.isRequired
    }).isRequired
};

export {
    ManageFont
};

export default injectIntl(ManageFont);
