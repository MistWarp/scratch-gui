import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {FormattedMessage} from 'react-intl';
import {Download, FileQuestion, MousePointerClick, Trash2} from 'lucide-react';
import {formatBytes} from '../../lib/utils/bytes';
import styles from './assets-modal.css';

class AssetPreview extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, ['handleExport', 'handleDelete']);
    }

    handleExport () {
        this.props.onExport(this.props.preview.index);
    }

    handleDelete () {
        this.props.onDelete(this.props.preview.index);
    }

    renderMedia () {
        const {preview} = this.props;
        if (preview.kind === 'image') {
            return (
                <img
                    className={styles.previewImage}
                    src={preview.url}
                    alt={preview.name}
                />
            );
        }
        if (preview.kind === 'audio') {
            return (
                <audio
                    className={styles.previewAudio}
                    src={preview.url}
                    controls
                />
            );
        }
        if (preview.kind === 'text') {
            return (
                <pre className={styles.previewText}>{preview.text}</pre>
            );
        }
        return (
            <div className={styles.previewNone}>
                <FileQuestion size={28} />
                <FormattedMessage
                    defaultMessage="No preview available"
                    description="Shown when a custom asset cannot be previewed"
                    id="mw.assets.noPreview"
                />
            </div>
        );
    }

    render () {
        const {preview} = this.props;

        if (!preview) {
            return (
                <div className={styles.preview}>
                    <div className={styles.previewNone}>
                        <MousePointerClick size={28} />
                        <FormattedMessage
                            defaultMessage="Select a file to preview it"
                            description="Shown when no custom asset is selected"
                            id="mw.assets.noSelection"
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.preview}>
                <div className={styles.previewMedia}>
                    {this.renderMedia()}
                </div>

                <dl className={styles.metadata}>
                    <dt>
                        <FormattedMessage
                            defaultMessage="Path"
                            description="Metadata label for a custom asset's full path"
                            id="mw.assets.metaPath"
                        />
                    </dt>
                    <dd
                        className={styles.metadataPath}
                        title={preview.name}
                    >
                        {`/${preview.name}`}
                    </dd>

                    <dt>
                        <FormattedMessage
                            defaultMessage="Format"
                            description="Metadata label for a custom asset's file format"
                            id="mw.assets.metaFormat"
                        />
                    </dt>
                    <dd>{preview.dataFormat}</dd>

                    <dt>
                        <FormattedMessage
                            defaultMessage="Size"
                            description="Metadata label for a custom asset's size"
                            id="mw.assets.metaSize"
                        />
                    </dt>
                    <dd>{formatBytes(preview.size)}</dd>

                    <dt>
                        <FormattedMessage
                            defaultMessage="Checksum"
                            description="Metadata label for a custom asset's md5 checksum"
                            id="mw.assets.metaChecksum"
                        />
                    </dt>
                    <dd
                        className={styles.metadataPath}
                        title={preview.md5}
                    >
                        {preview.md5}
                    </dd>
                </dl>

                <div className={styles.previewButtons}>
                    <button
                        className={styles.previewButton}
                        onClick={this.handleExport}
                    >
                        <Download size={15} />
                        <FormattedMessage
                            defaultMessage="Export"
                            description="Button to download a custom asset"
                            id="mw.assets.export"
                        />
                    </button>
                    <button
                        className={styles.previewButton}
                        onClick={this.handleDelete}
                    >
                        <Trash2 size={15} />
                        <FormattedMessage
                            defaultMessage="Delete"
                            description="Button to delete a custom asset"
                            id="mw.assets.deleteButton"
                        />
                    </button>
                </div>
            </div>
        );
    }
}

AssetPreview.propTypes = {
    preview: PropTypes.shape({
        index: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        dataFormat: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired,
        md5: PropTypes.string.isRequired,
        kind: PropTypes.oneOf(['image', 'audio', 'text', 'none']).isRequired,
        url: PropTypes.string,
        text: PropTypes.string
    }),
    onExport: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};

export default AssetPreview;
