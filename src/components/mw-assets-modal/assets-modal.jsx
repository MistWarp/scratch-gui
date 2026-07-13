import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import {FilePlus2, FolderPlus} from 'lucide-react';
import Modal from '../../containers/windowed-modal.jsx';
import {buildTree, AssetFolder} from './asset-tree.jsx';
import AssetPreview from './asset-preview.jsx';
import {formatBytes} from '../../lib/utils/bytes';
import styles from './assets-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Assets',
        description: 'Title of custom asset management modal',
        id: 'mw.assets.title'
    },
    delete: {
        defaultMessage: 'Are you sure you want to delete "{asset}"? Blocks that use it will stop working.',
        description: 'Confirmation shown before deleting a custom asset. {asset} is the asset path',
        id: 'mw.assets.delete'
    },
    newFolder: {
        defaultMessage: 'Folder name',
        description: 'Prompt shown when creating a folder for custom assets',
        id: 'mw.assets.newFolderPrompt'
    }
});

const AssetsModal = props => {
    const totalSize = props.assets.reduce((total, asset) => total + asset.size, 0);
    return (
        <Modal
            className={styles.modalContent}
            onRequestClose={props.onClose}
            contentLabel={props.intl.formatMessage(messages.title)}
            id="assetsModal"
            width={900}
            height={620}
            minWidth={520}
            minHeight={360}
            resizable
            maximizable
        >
            <div className={styles.body}>
                <div className={styles.toolbar}>
                    <button
                        className={styles.addButton}
                        onClick={props.onClickAdd}
                    >
                        <FilePlus2 size={15} />
                        <FormattedMessage
                            defaultMessage="Add files"
                            description="Button to add custom assets"
                            id="mw.assets.add"
                        />
                    </button>
                    <input
                        className={styles.fileInput}
                        type="file"
                        multiple
                        ref={props.fileInputRef}
                        onChange={props.onFileChange}
                    />

                    <button
                        className={styles.folderButton}
                        onClick={props.onNewFolder}
                    >
                        <FolderPlus size={15} />
                        <FormattedMessage
                            defaultMessage="New folder"
                            description="Button to create a folder for custom assets"
                            id="mw.assets.newFolder"
                        />
                    </button>

                    <div className={styles.destination}>
                        <FormattedMessage
                            defaultMessage="Adding to {folder}"
                            description="Shows which folder new assets will be added to"
                            id="mw.assets.destination"
                            values={{
                                folder: <code>{props.selected === '' ? '/' : `/${props.selected}`}</code>
                            }}
                        />
                    </div>

                    <div className={styles.total}>
                        {`${props.assets.length} files - ${formatBytes(totalSize)}`}
                    </div>
                </div>

                <div className={styles.columns}>
                    <div className={styles.treeColumn}>
                        {props.assets.length === 0 && props.folders.length === 0 ? (
                            <div className={styles.empty}>
                                <FormattedMessage
                                    // eslint-disable-next-line max-len
                                    defaultMessage="Drop files here, paste them, or click Add files. Assets cost nothing until a block loads them."
                                    description="Shown when a project has no custom assets"
                                    id="mw.assets.none"
                                />
                            </div>
                        ) : null}

                        <AssetFolder
                            node={buildTree(props.assets, props.folders)}
                            isRoot
                            selected={props.selected}
                            selectedIndex={props.selectedIndex}
                            onSelect={props.onSelect}
                            onSelectFile={props.onSelectFile}
                            onMove={props.onMove}
                            onDropFiles={props.onDropFiles}
                            onRename={props.onRename}
                        />
                    </div>

                    <AssetPreview
                        preview={props.preview}
                        onExport={props.onExport}
                        onDelete={props.onDelete}
                    />
                </div>
            </div>
        </Modal>
    );
};

AssetsModal.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func.isRequired,
    assets: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        dataFormat: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired
    })).isRequired,
    folders: PropTypes.arrayOf(PropTypes.string).isRequired,
    selected: PropTypes.string.isRequired,
    selectedIndex: PropTypes.number,
    preview: PropTypes.shape({}),
    fileInputRef: PropTypes.func.isRequired,
    onClickAdd: PropTypes.func.isRequired,
    onNewFolder: PropTypes.func.isRequired,
    onFileChange: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onSelectFile: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onDropFiles: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onExport: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};

export {messages};
export default injectIntl(AssetsModal);
