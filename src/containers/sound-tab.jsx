import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {defineMessages, intlShape, injectIntl} from 'react-intl';
import VM from 'scratch-vm';

import AssetPanel from '../components/asset-panel/asset-panel.jsx';
import soundIcon from '../components/asset-panel/icon--sound.svg';
import soundIconRtl from '../components/asset-panel/icon--sound-rtl.svg';
import addSoundFromLibraryIcon from '../components/asset-panel/icon--add-sound-lib.svg';
import addSoundFromRecordingIcon from '../components/asset-panel/icon--add-sound-record.svg';
import fileUploadIcon from '../components/action-menu/icon--file-upload.svg';
import surpriseIcon from '../components/action-menu/icon--surprise.svg';

import RecordModal from './record-modal.jsx';
import SoundEditor from './sound-editor.jsx';
import SoundLibrary from './sound-library.jsx';
import SoundEditorNotSupported from '../components/tw-sound-editor-not-supported/sound-editor-not-supported.jsx';

import {getSoundLibrary} from '../lib/libraries/tw-async-libraries';
import {handleFileUpload, soundUpload} from '../lib/file-uploader.js';
import errorBoundaryHOC from '../lib/components/error-boundary-hoc.jsx';
import DragConstants from '../lib/constants/drag-constants';
import downloadBlob from '../lib/utils/download-blob';
import {projectFilename} from '../lib/utils/safe-filename.js';
import {selectedIndexAfterDelete} from '../lib/utils/asset-selection.js';
import SharedAudioContext from '../lib/audio/shared-audio-context.js';

import {connect} from 'react-redux';

import {
    closeSoundLibrary,
    openSoundLibrary,
    openSoundRecorder
} from '../reducers/modals';

import {
    activateTab,
    COSTUMES_TAB_INDEX
} from '../reducers/editor-tab';

import {setRestore} from '../reducers/restore-deletion';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';
import CollaborationService from '../lib/collaboration/index.js';

const messages = defineMessages({
    fileUploadSound: {
        defaultMessage: 'Upload Sound',
        description: 'Button to upload sound from file in the editor tab',
        id: 'gui.soundTab.fileUploadSound'
    },
    surpriseSound: {
        defaultMessage: 'Surprise',
        description: 'Button to get a random sound in the editor tab',
        id: 'gui.soundTab.surpriseSound'
    },
    recordSound: {
        defaultMessage: 'Record',
        description: 'Button to record a sound in the editor tab',
        id: 'gui.soundTab.recordSound'
    },
    addSound: {
        defaultMessage: 'Add sound',
        description: 'Button to add a sound from the library in the editor tab',
        id: 'gui.soundTab.addSound'
    }
});

class SoundTab extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSelectSound',
            'handleDeleteSound',
            'handleDuplicateSound',
            'handleExportSound',
            'handleNewSound',
            'handleSurpriseSound',
            'handleFileUploadClick',
            'handleSoundUpload',
            'handleDrop',
            'setFileInput'
        ]);
        this.state = {selectedSoundIndex: 0};
        this.unmounted = false;
        this.deletingSounds = new Set();
    }

    UNSAFE_componentWillReceiveProps (nextProps) {
        const {
            editingTarget,
            sprites,
            stage
        } = nextProps;

        const target = editingTarget && sprites[editingTarget] ? sprites[editingTarget] : stage;
        if (!target || !target.sounds) {
            return;
        }

        const oldTarget = this.props.editingTarget && this.props.sprites[this.props.editingTarget] ?
            this.props.sprites[this.props.editingTarget] : this.props.stage;
        if (this.props.editingTarget !== editingTarget ||
            !oldTarget || !oldTarget.sounds || oldTarget.sounds.length !== target.sounds.length) {
            this.deletingSounds.clear();
        }

        // If switching editing targets, reset the sound index
        if (this.props.editingTarget !== editingTarget) {
            this.setState({selectedSoundIndex: 0});
        } else if (this.state.selectedSoundIndex > target.sounds.length - 1) {
            this.setState({selectedSoundIndex: Math.max(target.sounds.length - 1, 0)});
        }
    }

    componentWillUnmount () {
        this.unmounted = true;
    }

    handleSelectSound (soundIndex) {
        this.setState({selectedSoundIndex: soundIndex});
        CollaborationService.getInstance().setActivity({assetIndex: soundIndex});
    }

    handleDeleteSound (soundIndex) {
        if (!this.deletingSounds) this.deletingSounds = new Set();
        if (this.deletingSounds.has(soundIndex)) return false;
        this.deletingSounds.add(soundIndex);
        const soundCount = this.props.vm.editingTarget.sprite.sounds.length;
        let restoreFun;
        try {
            restoreFun = this.props.vm.deleteSound(soundIndex);
        } catch (error) {
            this.deletingSounds.delete(soundIndex);
            this.props.onShowDeleteError(error);
            return false;
        }
        this.setState({
            selectedSoundIndex: selectedIndexAfterDelete(
                this.state.selectedSoundIndex,
                soundIndex,
                soundCount
            )
        });
        this.props.dispatchUpdateRestore({restoreFun, deletedItem: 'Sound'});
        return true;
    }

    handleExportSound (soundIndex) {
        try {
            const item = this.props.vm.editingTarget.sprite.sounds[soundIndex];
            const blob = new Blob([item.asset.data], {type: item.asset.assetType.contentType});
            downloadBlob(projectFilename(item.name, 'Sound', item.asset.dataFormat), blob);
        } catch (error) {
            this.props.onShowExportError(error);
        }
    }

    handleDuplicateSound (soundIndex) {
        const targetId = this.props.vm.editingTarget.id;
        let duplicatePromise;
        try {
            duplicatePromise = this.props.vm.duplicateSound(soundIndex);
        } catch (error) {
            this.props.onShowImportError(error);
            return Promise.resolve(false);
        }
        return Promise.resolve(duplicatePromise)
            .then(() => {
                this.handleNewSound(targetId, soundIndex + 1);
            })
            .catch(this.props.onShowImportError);
    }

    handleNewSound (targetId, selectedSoundIndex) {
        if (this.unmounted) {
            return null;
        }
        if (!this.props.vm.editingTarget) {
            return null;
        }
        if (targetId && this.props.vm.editingTarget.id !== targetId) {
            return null;
        }
        const sprite = this.props.vm.editingTarget.sprite;
        const sounds = sprite.sounds ? sprite.sounds : [];
        this.setState({
            selectedSoundIndex: typeof selectedSoundIndex === 'number' ?
                selectedSoundIndex : Math.max(sounds.length - 1, 0)
        });
    }

    async handleSurpriseSound () {
        const targetId = this.props.vm.editingTarget.id;
        try {
            const soundLibraryContent = await getSoundLibrary();
            const soundItem = soundLibraryContent[Math.floor(Math.random() * soundLibraryContent.length)];
            if (!soundItem) throw new Error('No sounds are available');
            const vmSound = {
                format: soundItem.dataFormat,
                md5: soundItem.md5ext,
                rate: soundItem.rate,
                sampleCount: soundItem.sampleCount,
                name: soundItem.name
            };
            await this.props.vm.addSound(vmSound, targetId);
            this.handleNewSound(targetId);
        } catch (error) {
            this.props.onShowImportError(error);
        }
    }

    handleFileUploadClick () {
        if (!this.fileInput) return false;
        this.fileInput.click();
        return true;
    }

    handleSoundUpload (e) {
        const storage = this.props.vm.runtime.storage;
        const targetId = this.props.vm.editingTarget.id;
        const completedFiles = new Set();
        const finishFile = (fileIndex, fileCount) => {
            completedFiles.add(fileIndex);
            if (completedFiles.size === fileCount) {
                this.props.onCloseImporting();
            }
        };
        const failFile = (error, fileIndex, fileCount) => {
            this.props.onShowImportError(error);
            finishFile(fileIndex, fileCount);
        };
        this.props.onShowImporting();
        const fileCount = handleFileUpload(e.target, (buffer, fileType, fileName, fileIndex, totalFiles) => {
            soundUpload(buffer, fileType, storage, newSound => {
                newSound.name = fileName;
                this.props.vm.addSound(newSound, targetId).then(() => {
                    this.handleNewSound(targetId);
                    finishFile(fileIndex, totalFiles);
                })
                    .catch(error => failFile(error, fileIndex, totalFiles));
            }, error => failFile(error, fileIndex, totalFiles));
        }, failFile);
        if (fileCount === 0) this.props.onCloseImporting();
    }

    handleDrop (dropInfo) {
        if (dropInfo.dragType === DragConstants.SOUND) {
            const sprite = this.props.vm.editingTarget.sprite;
            const activeSound = sprite.sounds[this.state.selectedSoundIndex];

            this.props.vm.reorderSound(this.props.vm.editingTarget.id,
                dropInfo.index, dropInfo.newIndex);

            this.setState({selectedSoundIndex: sprite.sounds.indexOf(activeSound)});
        } else if (dropInfo.dragType === DragConstants.BACKPACK_COSTUME) {
            this.props.onActivateCostumesTab();
            return this.props.vm.addCostume(dropInfo.payload.body, {
                name: dropInfo.payload.name
            }).catch(this.props.onShowImportError);
        } else if (dropInfo.dragType === DragConstants.BACKPACK_SOUND) {
            const targetId = this.props.vm.editingTarget.id;
            return this.props.vm.addSound({
                md5: dropInfo.payload.body,
                name: dropInfo.payload.name
            }, targetId)
                .then(() => this.handleNewSound(targetId))
                .catch(this.props.onShowImportError);
        }
    }

    setFileInput (input) {
        this.fileInput = input;
    }

    render () {
        const {
            dispatchUpdateRestore, // eslint-disable-line no-unused-vars
            intl,
            isRtl,
            vm,
            onNewSoundFromLibraryClick,
            onNewSoundFromRecordingClick
        } = this.props;

        if (!vm.editingTarget) {
            return null;
        }

        const isSupported = !!(vm.runtime.audioEngine && SharedAudioContext());

        const sprite = vm.editingTarget.sprite;

        const sounds = sprite.sounds ? sprite.sounds.map(sound => (
            {
                url: isRtl ? soundIconRtl : soundIcon,
                name: sound.name,
                details: `${(sound.sampleCount / sound.rate).toFixed(2)}s`,
                dragPayload: sound
            }
        )) : [];

        return (
            <AssetPanel
                buttons={isSupported ? [{
                    title: intl.formatMessage(messages.addSound),
                    img: addSoundFromLibraryIcon,
                    onClick: onNewSoundFromLibraryClick
                }, {
                    title: intl.formatMessage(messages.fileUploadSound),
                    img: fileUploadIcon,
                    onClick: this.handleFileUploadClick,
                    fileAccept: '.wav, .mp3, .ogg, .flac, .aac, .m4a',
                    fileChange: this.handleSoundUpload,
                    fileInput: this.setFileInput,
                    fileMultiple: true
                }, {
                    title: intl.formatMessage(messages.surpriseSound),
                    img: surpriseIcon,
                    onClick: this.handleSurpriseSound
                }, {
                    title: intl.formatMessage(messages.recordSound),
                    img: addSoundFromRecordingIcon,
                    onClick: onNewSoundFromRecordingClick
                }] : []}
                dragType={DragConstants.SOUND}
                isRtl={isRtl}
                items={sounds}
                selectedItemIndex={this.state.selectedSoundIndex}
                onDeleteClick={this.handleDeleteSound}
                onDrop={this.handleDrop}
                onDuplicateClick={this.handleDuplicateSound}
                onExportClick={this.handleExportSound}
                onItemClick={this.handleSelectSound}
            >
                {sprite.sounds && sprite.sounds[this.state.selectedSoundIndex] ? (
                    isSupported ? (
                        <SoundEditor soundIndex={this.state.selectedSoundIndex} />
                    ) : (
                        <SoundEditorNotSupported />
                    )
                ) : null}
                {this.props.soundRecorderVisible ? (
                    <RecordModal
                        onNewSound={this.handleNewSound}
                    />
                ) : null}
                {this.props.soundLibraryVisible ? (
                    <SoundLibrary
                        vm={this.props.vm}
                        onNewSound={this.handleNewSound}
                        onRequestClose={this.props.onRequestCloseSoundLibrary}
                    />
                ) : null}
            </AssetPanel>
        );
    }
}

SoundTab.propTypes = {
    dispatchUpdateRestore: PropTypes.func,
    editingTarget: PropTypes.string,
    intl: intlShape,
    isRtl: PropTypes.bool,
    onActivateCostumesTab: PropTypes.func.isRequired,
    onCloseImporting: PropTypes.func.isRequired,
    onShowExportError: PropTypes.func.isRequired,
    onShowDeleteError: PropTypes.func.isRequired,
    onShowImportError: PropTypes.func.isRequired,
    onNewSoundFromLibraryClick: PropTypes.func.isRequired,
    onNewSoundFromRecordingClick: PropTypes.func.isRequired,
    onRequestCloseSoundLibrary: PropTypes.func.isRequired,
    onShowImporting: PropTypes.func.isRequired,
    soundLibraryVisible: PropTypes.bool,
    soundRecorderVisible: PropTypes.bool,
    sprites: PropTypes.shape({
        id: PropTypes.shape({
            sounds: PropTypes.arrayOf(PropTypes.shape({
                name: PropTypes.string.isRequired
            }))
        })
    }),
    stage: PropTypes.shape({
        sounds: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired
        }))
    }),
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    editingTarget: state.scratchGui.targets.editingTarget,
    isRtl: state.locales.isRtl,
    sprites: state.scratchGui.targets.sprites,
    stage: state.scratchGui.targets.stage,
    soundLibraryVisible: state.scratchGui.modals.soundLibrary,
    soundRecorderVisible: state.scratchGui.modals.soundRecorder
});

const mapDispatchToProps = dispatch => ({
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    onNewSoundFromLibraryClick: e => {
        e.preventDefault();
        dispatch(openSoundLibrary());
    },
    onNewSoundFromRecordingClick: () => {
        dispatch(openSoundRecorder());
    },
    onRequestCloseSoundLibrary: () => {
        dispatch(closeSoundLibrary());
    },
    dispatchUpdateRestore: restoreState => {
        dispatch(setRestore(restoreState));
    },
    onCloseImporting: () => dispatch(closeAlertWithId('importingAsset')),
    onShowImporting: () => dispatch(showStandardAlert('importingAsset')),
    onShowExportError: () => dispatch(showStandardAlert('assetExportError')),
    onShowDeleteError: () => dispatch(showStandardAlert('assetDeleteError')),
    onShowImportError: () => dispatch(showStandardAlert('assetImportError'))
});

export default errorBoundaryHOC('Sound Tab')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(SoundTab))
);

export {SoundTab};
