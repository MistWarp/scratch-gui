import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';
import {closeAssetsModal} from '../reducers/modals';
import {showStandardAlert} from '../reducers/alerts';
import downloadBlob from '../lib/utils/download-blob';
import storage from '../lib/persistence/storage';
import log from '../lib/utils/log';
import AssetsModalComponent from '../components/mw-assets-modal/assets-modal.jsx';

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
            'handleClose',
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
            'handleDialogInput',
            'handleDialogKeyDown',
            'handleDialogCancel',
            'handleDialogConfirm',
            'setFileInput'
        ]);
        this.state = {
            assets: this.getAssets(),
            folders: [],
            selected: '',
            selectedIndex: null,
            dialog: null,
            dialogError: '',
            importing: false
        };
        this.selectedEntry = null;
        this.importPromise = null;
        this.mounted = false;
    }

    componentDidMount () {
        this.mounted = true;
        this.assetManager.on('change', this.handleAssetsChanged);
        document.addEventListener('paste', this.handlePaste);
    }

    componentWillUnmount () {
        this.mounted = false;
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
        const selectedIndex = this.selectedEntry ?
            this.assetManager.assets.indexOf(this.selectedEntry) :
            -1;
        if (selectedIndex === -1) this.selectedEntry = null;
        this.setState({
            assets: this.getAssets(),
            selectedIndex: selectedIndex === -1 ? null : selectedIndex
        });
        this.props.vm.emitWorkspaceUpdate();
    }

    setFileInput (input) {
        this.fileInput = input;
    }

    addFiles (files, folder) {
        if (this.importPromise) return this.importPromise;
        this.setState({importing: true});
        this.importPromise = this.runAddFiles(files, folder).finally(() => {
            this.importPromise = null;
            if (this.mounted) this.setState({importing: false});
        });
        return this.importPromise;
    }

    async runAddFiles (files, folder) {
        let failed = 0;
        let added = 0;
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
                added++;
            } catch (e) {
                failed++;
                log.error(`could not add custom asset "${file.name}"`, e);
            }
        }
        if (failed && this.mounted) this.props.onShowImportError();
        return {added, failed};
    }

    handleClose () {
        if (this.importPromise) return;
        if (this.state.dialog) this.handleDialogCancel();
        else this.props.onClose();
    }

    handleClickAdd () {
        if (this.fileInput) this.fileInput.click();
    }

    handleNewFolder () {
        if (this.state.dialog) return false;
        this.setState({
            dialog: {type: 'folder', parent: this.state.selected, value: ''},
            dialogError: ''
        });
        return true;
    }

    handleFileChange (e) {
        const files = e.target.files;
        if (files && files.length) {
            const adding = this.addFiles(files, this.state.selected);
            e.target.value = null;
            return adding;
        }
        e.target.value = null;
        return Promise.resolve({added: 0, failed: 0});
    }

    handlePaste (e) {
        const files = e.clipboardData && e.clipboardData.files;
        if (files && files.length) {
            e.preventDefault();
            return this.addFiles(files, this.state.selected);
        }
        return Promise.resolve({added: 0, failed: 0});
    }

    handleDropFiles (files, folder) {
        return this.addFiles(files, folder);
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
        this.selectedEntry = null;
        this.setState({
            selected: folder,
            selectedIndex: null
        });
    }

    handleSelectFile (index) {
        const entry = this.assetManager.assets[index];
        this.selectedEntry = entry || null;
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
        if (!entry) return false;
        const blob = new Blob([entry.asset.data]);
        downloadBlob(getBaseName(entry.name), blob);
        return true;
    }

    handleDelete (index) {
        const entry = this.assetManager.assets[index];
        if (!entry) return false;
        this.setState({
            dialog: {type: 'delete', entry},
            dialogError: ''
        });
        return true;
    }

    handleDialogInput (event) {
        const value = event.target.value;
        this.setState(state => ({dialog: {...state.dialog, value}, dialogError: ''}));
    }

    handleDialogKeyDown (event) {
        if (event.key === 'Enter') this.handleDialogConfirm();
    }

    handleDialogCancel () {
        this.setState({dialog: null, dialogError: ''});
    }

    handleDialogConfirm () {
        const {dialog} = this.state;
        if (!dialog) return false;
        if (dialog.type === 'folder') {
            const name = dialog.value.trim();
            if (!name) {
                this.setState({dialogError: 'Enter a folder name.'});
                return false;
            }
            const path = dialog.parent ? `${dialog.parent}/${name}` : name;
            this.selectedEntry = null;
            this.setState(state => ({
                folders: state.folders.includes(path) ? state.folders : state.folders.concat(path),
                selected: path,
                selectedIndex: null,
                dialog: null,
                dialogError: ''
            }));
            return true;
        }

        const index = this.assetManager.assets.indexOf(dialog.entry);
        if (index === -1) {
            this.setState({dialog: null, dialogError: ''});
            return false;
        }
        this.assetManager.deleteAsset(index);
        if (this.selectedEntry === dialog.entry) this.selectedEntry = null;
        this.setState({selectedIndex: null, dialog: null, dialogError: ''});
        return true;
    }

    render () {
        return (
            <AssetsModalComponent
                onClose={this.handleClose}
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
                dialog={this.state.dialog}
                dialogError={this.state.dialogError}
                importing={this.state.importing}
                onDialogInput={this.handleDialogInput}
                onDialogKeyDown={this.handleDialogKeyDown}
                onDialogCancel={this.handleDialogCancel}
                onDialogConfirm={this.handleDialogConfirm}
            />
        );
    }
}

MWAssetsModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onShowImportError: PropTypes.func.isRequired,
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
    onClose: () => dispatch(closeAssetsModal()),
    onShowImportError: () => dispatch(showStandardAlert('assetImportError'))
});

export {
    MWAssetsModal
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MWAssetsModal);
