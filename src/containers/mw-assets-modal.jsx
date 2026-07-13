import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {injectIntl, intlShape} from 'react-intl';
import bindAll from 'lodash.bindall';
import {closeAssetsModal} from '../reducers/modals';
import downloadBlob from '../lib/utils/download-blob';
import storage from '../lib/persistence/storage';
import log from '../lib/utils/log';
import AssetsModalComponent, {messages} from '../components/mw-assets-modal/assets-modal.jsx';

const IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];
const AUDIO_FORMATS = ['wav', 'mp3', 'ogg'];
const TEXT_FORMATS = ['txt', 'json', 'csv', 'html', 'md', 'xml', 'js', 'css', 'fractch'];

const PREVIEW_TEXT_LIMIT = 5000;

const getExtension = fileName => {
    const dot = fileName.lastIndexOf('.');
    if (dot <= 0 || dot === fileName.length - 1) {
        return 'bin';
    }
    return fileName.substring(dot + 1).toLowerCase();
};

const getBaseName = path => path.substring(path.lastIndexOf('/') + 1);

const getFolder = path => {
    const slash = path.lastIndexOf('/');
    return slash === -1 ? '' : path.substring(0, slash);
};

class MWAssetsModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleAssetsChanged',
            'handleClickAdd',
            'handleNewFolder',
            'handleFileChange',
            'handlePaste',
            'handleDropFiles',
            'handleMove',
            'handleSelect',
            'handleSelectFile',
            'handleRename',
            'handleExport',
            'handleDelete',
            'setFileInput'
        ]);
        this.state = {
            assets: this.getAssets(),
            folders: [],
            selected: '',
            selectedIndex: null
        };
    }

    componentDidMount () {
        this.assetManager.on('change', this.handleAssetsChanged);
        document.addEventListener('paste', this.handlePaste);
    }

    componentWillUnmount () {
        this.assetManager.off('change', this.handleAssetsChanged);
        document.removeEventListener('paste', this.handlePaste);
    }

    get assetManager () {
        return this.props.vm.runtime.assetManager;
    }

    getAssets () {
        return this.props.vm.runtime.assetManager.assets.map(entry => ({
            name: entry.name,
            dataFormat: entry.asset.dataFormat,
            size: entry.asset.data.length,
            md5: entry.asset.assetId
        }));
    }

    getPreview () {
        const index = this.state.selectedIndex;
        const entry = index === null ? null : this.assetManager.assets[index];
        if (!entry) {
            return null;
        }

        const dataFormat = entry.asset.dataFormat;
        const preview = {
            index,
            name: entry.name,
            dataFormat,
            size: entry.asset.data.length,
            md5: entry.asset.assetId,
            kind: 'none'
        };

        if (IMAGE_FORMATS.includes(dataFormat)) {
            preview.kind = 'image';
            preview.url = this.assetManager.getObjectURL(entry.name);
        } else if (AUDIO_FORMATS.includes(dataFormat)) {
            preview.kind = 'audio';
            preview.url = this.assetManager.getObjectURL(entry.name);
        } else if (TEXT_FORMATS.includes(dataFormat)) {
            preview.kind = 'text';
            const text = entry.asset.decodeText();
            preview.text = text.length > PREVIEW_TEXT_LIMIT ?
                `${text.substring(0, PREVIEW_TEXT_LIMIT)}\n…` :
                text;
        }

        return preview;
    }

    handleAssetsChanged () {
        this.setState(state => ({
            assets: this.getAssets(),
            selectedIndex: state.selectedIndex === null ||
                state.selectedIndex < this.assetManager.assets.length ?
                state.selectedIndex :
                null
        }));
        this.props.vm.emitWorkspaceUpdate();
    }

    setFileInput (input) {
        this.fileInput = input;
    }

    async addFiles (files, folder) {
        for (const file of Array.from(files)) {
            try {
                const buffer = await file.arrayBuffer();
                const asset = storage.createAsset(
                    storage.AssetType.CustomAsset,
                    getExtension(file.name),
                    new Uint8Array(buffer),
                    null,
                    true
                );
                const path = folder ? `${folder}/${file.name}` : file.name;
                this.assetManager.addAsset(this.assetManager.getUnusedName(path), asset);
            } catch (e) {
                log.error(`could not add custom asset "${file.name}"`, e);
            }
        }
    }

    handleClickAdd () {
        this.fileInput.click();
    }

    handleNewFolder () {
        // eslint-disable-next-line no-alert
        const name = prompt(this.props.intl.formatMessage(messages.newFolder));
        if (!name) {
            return;
        }
        const path = this.state.selected ? `${this.state.selected}/${name}` : name;
        this.setState(state => ({
            folders: state.folders.includes(path) ? state.folders : state.folders.concat(path),
            selected: path,
            selectedIndex: null
        }));
    }

    handleFileChange (e) {
        const files = e.target.files;
        if (files && files.length) {
            this.addFiles(files, this.state.selected);
        }
        e.target.value = null;
    }

    handlePaste (e) {
        const files = e.clipboardData && e.clipboardData.files;
        if (files && files.length) {
            e.preventDefault();
            this.addFiles(files, this.state.selected);
        }
    }

    handleDropFiles (files, folder) {
        this.addFiles(files, folder);
    }

    handleMove (index, folder) {
        const entry = this.assetManager.assets[index];
        if (!entry) {
            return;
        }
        const base = getBaseName(entry.name);
        this.assetManager.renameAsset(index, folder ? `${folder}/${base}` : base);
    }

    handleSelect (folder) {
        this.setState({
            selected: folder,
            selectedIndex: null
        });
    }

    handleSelectFile (index) {
        const entry = this.assetManager.assets[index];
        this.setState({
            selectedIndex: index,
            selected: entry ? getFolder(entry.name) : ''
        });
    }

    handleRename (index, newName) {
        this.assetManager.renameAsset(index, newName);
    }

    handleExport (index) {
        const entry = this.assetManager.assets[index];
        const blob = new Blob([entry.asset.data]);
        downloadBlob(getBaseName(entry.name), blob);
    }

    handleDelete (index) {
        const entry = this.assetManager.assets[index];
        // eslint-disable-next-line no-alert
        const allowed = confirm(this.props.intl.formatMessage(messages.delete, {
            asset: entry.name
        }));
        if (allowed) {
            this.assetManager.deleteAsset(index);
            this.setState({selectedIndex: null});
        }
    }

    render () {
        return (
            <AssetsModalComponent
                onClose={this.props.onClose}
                assets={this.state.assets}
                folders={this.state.folders}
                selected={this.state.selected}
                selectedIndex={this.state.selectedIndex}
                preview={this.getPreview()}
                fileInputRef={this.setFileInput}
                onClickAdd={this.handleClickAdd}
                onNewFolder={this.handleNewFolder}
                onFileChange={this.handleFileChange}
                onSelect={this.handleSelect}
                onSelectFile={this.handleSelectFile}
                onMove={this.handleMove}
                onDropFiles={this.handleDropFiles}
                onRename={this.handleRename}
                onExport={this.handleExport}
                onDelete={this.handleDelete}
            />
        );
    }
}

MWAssetsModal.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func.isRequired,
    vm: PropTypes.shape({
        emitWorkspaceUpdate: PropTypes.func,
        runtime: PropTypes.shape({
            assetManager: PropTypes.shape({
                assets: PropTypes.array,
                addAsset: PropTypes.func,
                deleteAsset: PropTypes.func,
                renameAsset: PropTypes.func,
                getUnusedName: PropTypes.func,
                getObjectURL: PropTypes.func,
                on: PropTypes.func,
                off: PropTypes.func
            })
        })
    })
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeAssetsModal())
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(MWAssetsModal));
