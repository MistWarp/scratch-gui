import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {File, FileAudio, FileCode, FileImage, FileText} from 'lucide-react';
import {formatBytes} from '../../lib/utils/bytes';
import styles from './assets-modal.css';

const DRAG_TYPE = 'application/x-mistwarp-asset';

const ICONS_BY_FORMAT = {
    png: FileImage,
    jpg: FileImage,
    jpeg: FileImage,
    gif: FileImage,
    bmp: FileImage,
    webp: FileImage,
    svg: FileImage,
    wav: FileAudio,
    mp3: FileAudio,
    ogg: FileAudio,
    json: FileCode,
    html: FileCode,
    xml: FileCode,
    js: FileCode,
    css: FileCode,
    txt: FileText,
    csv: FileText,
    md: FileText
};

class AssetFile extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, ['handleDragStart', 'handleClick', 'handleRename']);
    }

    handleDragStart (e) {
        e.stopPropagation();
        e.dataTransfer.setData(DRAG_TYPE, String(this.props.index));
        e.dataTransfer.effectAllowed = 'move';
    }

    handleClick (e) {
        e.stopPropagation();
        this.props.onSelectFile(this.props.index);
    }

    handleRename (e) {
        this.props.onRename(this.props.index, this.props.folder ?
            `${this.props.folder}/${e.target.value}` :
            e.target.value);
    }

    render () {
        const Icon = ICONS_BY_FORMAT[this.props.dataFormat] || File;
        return (
            <div
                className={classNames(styles.file, {
                    [styles.selected]: this.props.selected
                })}
                draggable
                onDragStart={this.handleDragStart}
                onClick={this.handleClick}
            >
                <Icon
                    className={styles.fileIcon}
                    size={15}
                />

                <input
                    className={styles.fileName}
                    value={this.props.fileName}
                    title={this.props.name}
                    onChange={this.handleRename}
                />

                <span className={styles.fileSize}>{formatBytes(this.props.size)}</span>
            </div>
        );
    }
}

AssetFile.propTypes = {
    index: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    fileName: PropTypes.string.isRequired,
    folder: PropTypes.string.isRequired,
    dataFormat: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    selected: PropTypes.bool.isRequired,
    onSelectFile: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired
};

export {DRAG_TYPE};
export default AssetFile;
