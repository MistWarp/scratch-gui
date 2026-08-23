import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {FormattedMessage} from 'react-intl';
import {formatBytes} from '../../lib/utils/bytes';
import styles from './assets-modal.css';

class ManageAsset extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleChange',
            'handleExport',
            'handleDelete'
        ]);
    }

    handleChange (e) {
        this.props.onRename(this.props.index, e.target.value);
    }

    handleExport () {
        this.props.onExport(this.props.index);
    }

    handleDelete () {
        this.props.onDelete(this.props.index);
    }

    render () {
        return (
            <div className={styles.asset}>
                <div className={styles.assetInfo}>
                    <input
                        className={styles.assetName}
                        value={this.props.name}
                        title={this.props.name}
                        onChange={this.handleChange}
                    />
                    <div className={styles.assetDetails}>
                        {`${this.props.dataFormat} - ${formatBytes(this.props.size)}`}
                    </div>
                </div>

                <button
                    type="button"
                    className={styles.assetButton}
                    onClick={this.handleExport}
                >
                    <FormattedMessage
                        defaultMessage="Export"
                        description="Button to download a custom asset"
                        id="mw.assets.export"
                    />
                </button>

                <button
                    type="button"
                    className={styles.assetButton}
                    onClick={this.handleDelete}
                >
                    <FormattedMessage
                        defaultMessage="Delete"
                        description="Button to delete a custom asset"
                        id="mw.assets.deleteButton"
                    />
                </button>
            </div>
        );
    }
}

ManageAsset.propTypes = {
    index: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    dataFormat: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    onRename: PropTypes.func.isRequired,
    onExport: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};

export default ManageAsset;
