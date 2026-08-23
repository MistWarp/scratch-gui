import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {intlShape, injectIntl} from 'react-intl';

import {
    openSpriteLibrary,
    closeSpriteLibrary
} from '../reducers/modals';
import {activateTab, COSTUMES_TAB_INDEX, BLOCKS_TAB_INDEX} from '../reducers/editor-tab';
import {setReceivedBlocks} from '../reducers/hovered-target';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';
import {setRestore} from '../reducers/restore-deletion';
import DragConstants from '../lib/constants/drag-constants';
import TargetPaneComponent from '../components/target-pane/target-pane.jsx';
import {getSpriteLibrary} from '../lib/libraries/tw-async-libraries';
import {handleFileUpload, spriteUpload} from '../lib/file-uploader.js';
import sharedMessages from '../lib/constants/shared-messages';
import {emptySprite} from '../lib/utils/empty-assets';
import {highlightTarget} from '../reducers/targets';
import {fetchSprite, fetchCode} from '../lib/api/backpack';
import randomizeSpritePosition from '../lib/utils/randomize-sprite-position';
import downloadBlob from '../lib/utils/download-blob';
import {projectFilename} from '../lib/utils/safe-filename.js';
import log from '../lib/utils/log';
import {placeInViewport} from '../lib/backpack/code-payload.js';
import CollaborationService from '../lib/collaboration/index.js';

class TargetPane extends React.Component {
    constructor (props) {
        super(props);
        this.exportingSprites = new Set();
        this.deletingSprites = new Set();
        bindAll(this, [
            'handleActivateBlocksTab',
            'handleBlockDragEnd',
            'handleChangeSpriteRotationStyle',
            'handleChangeSpriteDirection',
            'handleChangeSpriteName',
            'handleChangeSpriteSize',
            'handleChangeSpriteVisibility',
            'handleChangeSpriteX',
            'handleChangeSpriteY',
            'handleDeleteSprite',
            'handleDrop',
            'handleDuplicateSprite',
            'handleExportSprite',
            'handleNewSprite',
            'handleSelectSprite',
            'handleSurpriseSpriteClick',
            'handlePaintSpriteClick',
            'handleFileUploadClick',
            'handleSpriteUpload',
            'setFileInput'
        ]);
    }
    componentDidMount () {
        this.props.vm.addListener('BLOCK_DRAG_END', this.handleBlockDragEnd);
    }
    componentDidUpdate (prevProps) {
        if (prevProps.sprites !== this.props.sprites) {
            const spriteIds = new Set(Object.keys(this.props.sprites || {}));
            for (const id of this.deletingSprites) {
                if (!spriteIds.has(id)) this.deletingSprites.delete(id);
            }
        }
    }
    componentWillUnmount () {
        this.props.vm.removeListener('BLOCK_DRAG_END', this.handleBlockDragEnd);
        this.deletingSprites.clear();
    }
    handleChangeSpriteDirection (direction) {
        this.props.vm.postSpriteInfo({direction});
    }
    handleChangeSpriteRotationStyle (rotationStyle) {
        this.props.vm.postSpriteInfo({rotationStyle});
    }
    handleChangeSpriteName (name) {
        this.props.vm.renameSprite(this.props.editingTarget, name);
    }
    handleChangeSpriteSize (size) {
        this.props.vm.postSpriteInfo({size});
    }
    handleChangeSpriteVisibility (visible) {
        this.props.vm.postSpriteInfo({visible});
    }
    handleChangeSpriteX (x) {
        this.props.vm.postSpriteInfo({x});
    }
    handleChangeSpriteY (y) {
        this.props.vm.postSpriteInfo({y});
    }
    handleDeleteSprite (id) {
        if (this.deletingSprites.has(id)) return false;
        this.deletingSprites.add(id);
        try {
            const restoreSprite = this.props.vm.deleteSprite(id);
            if (typeof restoreSprite !== 'function') {
                this.deletingSprites.delete(id);
                this.props.onShowDeleteError();
                return false;
            }
            const restoreFun = () => Promise.resolve(restoreSprite()).then(this.handleActivateBlocksTab);

            this.props.dispatchUpdateRestore({
                restoreFun: restoreFun,
                deletedItem: 'Sprite'
            });
            return true;
        } catch (error) {
            this.deletingSprites.delete(id);
            log.error(error);
            this.props.onShowDeleteError();
            return false;
        }
    }
    handleDuplicateSprite (id) {
        try {
            return Promise.resolve(this.props.vm.duplicateSprite(id))
                .catch(this.props.onShowImportError);
        } catch (error) {
            this.props.onShowImportError(error);
            return Promise.resolve(false);
        }
    }
    async handleExportSprite (id) {
        if (this.exportingSprites.has(id)) return;
        this.exportingSprites.add(id);
        try {
            const target = this.props.vm.runtime.getTargetById(id);
            if (!target) throw new Error('Sprite not found');
            const content = await this.props.vm.exportSprite(id);
            downloadBlob(projectFilename(target.getName(), 'Sprite', 'sprite3'), content);
        } catch (error) {
            log.error(error);
            this.props.onShowExportError();
        } finally {
            this.exportingSprites.delete(id);
        }
    }
    handleSelectSprite (id) {
        this.props.vm.setEditingTarget(id);
        if (this.props.stage && id !== this.props.stage.id) {
            this.props.onHighlightTarget(id);
        }
        
        const service = CollaborationService.getInstance();
        if (service) {
            service.onEditingTargetChange();
        }
    }
    async handleSurpriseSpriteClick () {
        try {
            const spriteLibraryContent = await getSpriteLibrary();
            const surpriseSprites = spriteLibraryContent.filter(sprite =>
                (sprite.tags.indexOf('letters') === -1) && (sprite.tags.indexOf('numbers') === -1)
            );
            const item = surpriseSprites[Math.floor(Math.random() * surpriseSprites.length)];
            if (!item) throw new Error('No sprites are available');
            randomizeSpritePosition(item);
            await this.props.vm.addSprite(JSON.stringify(item));
            this.handleActivateBlocksTab();
        } catch (error) {
            log.error(error);
            this.props.onShowImportError();
        }
    }
    handlePaintSpriteClick () {
        const formatMessage = this.props.intl.formatMessage;
        const emptyItem = emptySprite(
            formatMessage(sharedMessages.sprite, {index: 1}),
            formatMessage(sharedMessages.pop),
            formatMessage(sharedMessages.costume, {index: 1})
        );
        this.props.vm.addSprite(JSON.stringify(emptyItem))
            .then(() => {
                setTimeout(() => { // Wait for targets update to propagate before tab switching
                    this.props.onActivateTab(COSTUMES_TAB_INDEX);
                });
            })
            .catch(this.props.onShowImportError);
    }
    handleActivateBlocksTab () {
        this.props.onActivateTab(BLOCKS_TAB_INDEX);
    }
    handleNewSprite (spriteJSONString) {
        return this.props.vm.addSprite(spriteJSONString)
            .then(this.handleActivateBlocksTab)
            .catch(err => {
                log.error(err);
                this.props.onShowImportError();
                throw err;
            });
    }
    handleFileUploadClick () {
        if (!this.fileInput) return false;
        this.fileInput.click();
        return true;
    }
    handleSpriteUpload (e) {
        const vm = this.props.vm;
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
            spriteUpload(buffer, fileType, fileName, vm, newSprite => {
                this.handleNewSprite(newSprite)
                    .then(() => {
                        finishFile(fileIndex, totalFiles);
                    })
                    .catch(error => failFile(error, fileIndex, totalFiles));
            }, error => failFile(error, fileIndex, totalFiles));
        }, failFile);
        if (fileCount === 0) this.props.onCloseImporting();
    }
    setFileInput (input) {
        this.fileInput = input;
    }
    async handleBlockDragEnd (blocks) {
        if (this.props.hoveredTarget.sprite && this.props.hoveredTarget.sprite !== this.props.editingTarget) {
            try {
                await this.shareBlocks(blocks, this.props.hoveredTarget.sprite, this.props.editingTarget);
                this.props.onReceivedBlocks(true);
            } catch (error) {
                log.error(error);
                this.props.onShowImportError();
            }
        }
    }
    shareBlocks (payload, targetId, optFromTargetId) {
        // Position the top-level block based on the scroll position.
        // Get workspace metrics at call time to avoid subscribing to constant updates
        const centered = placeInViewport(payload, this.props.getWorkspaceMetrics().targets[targetId], this.props.isRtl);
        return this.props.vm.shareBlocksToTarget(centered, targetId, optFromTargetId);
    }
    async handleDrop (dragInfo) {
        try {
            const {sprite: targetId} = this.props.hoveredTarget;
            if (dragInfo.dragType === DragConstants.SPRITE) {
                // Add one to both new and target index because we are not counting/moving the stage
                this.props.vm.reorderTarget(dragInfo.index + 1, dragInfo.newIndex + 1);
            } else if (dragInfo.dragType === DragConstants.BACKPACK_SPRITE) {
                // TODO storage does not have a way of loading zips right now, and may never need it.
                // So for now just grab the zip manually.
                const sprite3Zip = await fetchSprite(dragInfo.payload.bodyUrl);
                await this.props.vm.addSprite(sprite3Zip);
            } else if (targetId) {
                // Something is being dragged over one of the sprite tiles or the backdrop.
                // Dropping assets like sounds and costumes duplicate the asset on the
                // hovered target without switching the editing target.
                if (dragInfo.dragType === DragConstants.COSTUME) {
                    await this.props.vm.shareCostumeToTarget(dragInfo.index, targetId);
                } else if (dragInfo.dragType === DragConstants.SOUND) {
                    await this.props.vm.shareSoundToTarget(dragInfo.index, targetId);
                } else if (dragInfo.dragType === DragConstants.BACKPACK_COSTUME) {
                    await this.props.vm.addCostume(dragInfo.payload.body, {
                        name: dragInfo.payload.name
                    }, targetId);
                } else if (dragInfo.dragType === DragConstants.BACKPACK_SOUND) {
                    await this.props.vm.addSound({
                        md5: dragInfo.payload.body,
                        name: dragInfo.payload.name
                    }, targetId);
                } else if (dragInfo.dragType === DragConstants.BACKPACK_CODE) {
                    const blocks = await fetchCode(dragInfo.payload.bodyUrl);
                    await this.shareBlocks(blocks, targetId);
                    this.props.vm.refreshWorkspace();
                }
            }
        } catch (error) {
            log.error(error);
            this.props.onShowImportError();
        }
    }
    render () {
        /* eslint-disable no-unused-vars */
        const {
            dispatchUpdateRestore,
            isRtl,
            onActivateTab,
            onCloseImporting,
            onHighlightTarget,
            onShowDeleteError,
            onReceivedBlocks,
            onShowExportError,
            onShowImportError,
            onShowImporting,
            ...componentProps
        } = this.props;
        /* eslint-enable no-unused-vars */
        return (
            <TargetPaneComponent
                {...componentProps}
                fileInputRef={this.setFileInput}
                onActivateBlocksTab={this.handleActivateBlocksTab}
                onChangeSpriteDirection={this.handleChangeSpriteDirection}
                onChangeSpriteName={this.handleChangeSpriteName}
                onChangeSpriteRotationStyle={this.handleChangeSpriteRotationStyle}
                onChangeSpriteSize={this.handleChangeSpriteSize}
                onChangeSpriteVisibility={this.handleChangeSpriteVisibility}
                onChangeSpriteX={this.handleChangeSpriteX}
                onChangeSpriteY={this.handleChangeSpriteY}
                onDeleteSprite={this.handleDeleteSprite}
                onDrop={this.handleDrop}
                onDuplicateSprite={this.handleDuplicateSprite}
                onExportSprite={this.handleExportSprite}
                onFileUploadClick={this.handleFileUploadClick}
                onPaintSpriteClick={this.handlePaintSpriteClick}
                onSelectSprite={this.handleSelectSprite}
                onSpriteUpload={this.handleSpriteUpload}
                onSurpriseSpriteClick={this.handleSurpriseSpriteClick}
            />
        );
    }
}

const {
    onSelectSprite, // eslint-disable-line no-unused-vars
    onActivateBlocksTab, // eslint-disable-line no-unused-vars
    ...targetPaneProps
} = TargetPaneComponent.propTypes;

TargetPane.propTypes = {
    intl: intlShape.isRequired,
    onCloseImporting: PropTypes.func,
    onShowExportError: PropTypes.func,
    onShowDeleteError: PropTypes.func,
    onShowImportError: PropTypes.func,
    onShowImporting: PropTypes.func,
    ...targetPaneProps
};

const mapStateToProps = state => ({
    editingTarget: state.scratchGui.targets.editingTarget,
    hoveredTarget: state.scratchGui.hoveredTarget,
    isRtl: state.locales.isRtl,
    spriteLibraryVisible: state.scratchGui.modals.spriteLibrary,
    sprites: state.scratchGui.targets.sprites,
    stage: state.scratchGui.targets.stage,
    raiseSprites: state.scratchGui.blockDrag
});

const mapDispatchToProps = dispatch => ({
    onNewSpriteClick: e => {
        e.preventDefault();
        dispatch(openSpriteLibrary());
    },
    onRequestCloseSpriteLibrary: () => {
        dispatch(closeSpriteLibrary());
    },
    onActivateTab: tabIndex => {
        dispatch(activateTab(tabIndex));
    },
    onReceivedBlocks: receivedBlocks => {
        dispatch(setReceivedBlocks(receivedBlocks));
    },
    dispatchUpdateRestore: restoreState => {
        dispatch(setRestore(restoreState));
    },
    onHighlightTarget: id => {
        dispatch(highlightTarget(id));
    },
    onCloseImporting: () => dispatch(closeAlertWithId('importingAsset')),
    onShowImporting: () => dispatch(showStandardAlert('importingAsset')),
    onShowExportError: () => dispatch(showStandardAlert('assetExportError')),
    onShowDeleteError: () => dispatch(showStandardAlert('assetDeleteError')),
    onShowImportError: () => dispatch(showStandardAlert('assetImportError'))
});

// Custom mergeProps to provide on-demand access to workspace metrics
const mergeProps = (stateProps, dispatchProps, ownProps) => ({
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    getWorkspaceMetrics: () => {
        // Access the store directly through the connect context
        // This avoids subscribing to workspace metrics changes
        const store = ownProps.store || (typeof window !== 'undefined' && window.ReduxStore);
        return store ? store.getState().scratchGui.workspaceMetrics : {};
    }
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
)(TargetPane));

export {TargetPane};
