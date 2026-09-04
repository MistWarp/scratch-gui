/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';
import {
    Backpack,
    Edit2,
    PackagePlus,
    Plus,
    Trash2,
    Upload,
    X
} from 'lucide-react';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import api from '../../community/api.js';
import styles from './game-items-modal.module.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Game Items',
        description: 'Title for game items window',
        id: 'mw.gameItemsModal.title'
    }
});

const compressItemImage = file => new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('Please select an image file'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = e => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.onload = () => {
            const MAX_SIZE = 128;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_SIZE) {
                    height = Math.round((height * MAX_SIZE) / width);
                    width = MAX_SIZE;
                }
            } else if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
            }
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            let dataUrl = canvas.toDataURL('image/webp', 0.82);
            if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
                dataUrl = canvas.toDataURL('image/png');
            }
            resolve(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

const slugify = name => String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);

const itemImageUrl = item => {
    if (!item) return '';
    if (item.image) return item.image;
    if (item.visual && item.visual.url) return item.visual.url;
    return '';
};

class GameItemsModalComponent extends React.Component {
    constructor (props) {
        super(props);

        const initialItems = props.vm && props.vm.getItems ? props.vm.getItems() : [];

        this.state = {
            items: initialItems,
            showForm: false,
            editingId: null,
            formName: '',
            formId: '',
            formImage: '',
            formAwardable: true,
            idManuallyEdited: false,
            publishing: false,
            publishState: '',
            error: ''
        };

        this.fileInputRef = React.createRef();
    }

    componentDidMount () {
        if (this.props.vm && this.props.vm.runtime) {
            this.handleItemsChanged = items => {
                this.setState({items: items || []});
            };
            this.props.vm.runtime.on('ITEMS_CHANGED', this.handleItemsChanged);
        }
    }

    componentWillUnmount () {
        if (this.props.vm && this.props.vm.runtime && this.handleItemsChanged) {
            this.props.vm.runtime.off('ITEMS_CHANGED', this.handleItemsChanged);
        }
    }

    isOnline () {
        const {projectId} = this.props;
        return Boolean(projectId && projectId !== '0' && projectId !== 0);
    }

    handleStartAdd = () => {
        this.setState({
            showForm: true,
            editingId: null,
            formName: '',
            formId: '',
            formImage: '',
            formAwardable: true,
            idManuallyEdited: false,
            error: ''
        });
    };

    handleStartEdit = item => {
        this.setState({
            showForm: true,
            editingId: item.id,
            formName: item.name || '',
            formId: item.id || '',
            formImage: itemImageUrl(item),
            formAwardable: item.gameAwardable !== false,
            idManuallyEdited: true,
            error: ''
        });
    };

    handleCancelForm = () => {
        this.setState({
            showForm: false,
            editingId: null,
            formName: '',
            formId: '',
            formImage: '',
            formAwardable: true,
            error: ''
        });
    };

    handleNameChange = e => {
        const name = e.target.value;
        this.setState(prevState => ({
            formName: name,
            formId: prevState.idManuallyEdited ? prevState.formId : slugify(name)
        }));
    };

    handleIdChange = e => {
        this.setState({
            formId: slugify(e.target.value),
            idManuallyEdited: true
        });
    };

    handleImageFileChange = async e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
            const compressed = await compressItemImage(file);
            this.setState({formImage: compressed, error: ''});
        } catch (err) {
            this.setState({error: err.message || 'Failed to process image'});
        }
    };

    handleRemoveImage = () => {
        this.setState({formImage: ''});
        if (this.fileInputRef.current) {
            this.fileInputRef.current.value = '';
        }
    };

    handleSaveItem = e => {
        if (e) e.preventDefault();
        const {editingId, formName, formId, formImage, formAwardable, items} = this.state;
        const name = formName.trim();
        const id = (formId || slugify(name)).trim();

        if (!name) {
            this.setState({error: 'Item name is required'});
            return;
        }
        if (!id) {
            this.setState({error: 'Item ID is required'});
            return;
        }
        if (!formImage) {
            this.setState({error: 'Item image is required'});
            return;
        }

        const existingWithSameId = items.find(item => item.id === id);
        if (existingWithSameId && existingWithSameId.id !== editingId) {
            this.setState({error: `An item with ID "${id}" already exists`});
            return;
        }

        const itemData = {
            id,
            name,
            image: formImage,
            gameAwardable: formAwardable
        };

        let nextItems;
        if (editingId) {
            nextItems = items.map(item => (item.id === editingId ? itemData : item));
        } else {
            nextItems = [...items, itemData];
        }

        this.setState({
            items: nextItems,
            showForm: false,
            editingId: null,
            formName: '',
            formId: '',
            formImage: '',
            formAwardable: true,
            error: ''
        });

        if (this.props.vm && this.props.vm.setItems) {
            this.props.vm.setItems(nextItems);
        }
    };

    handleDeleteItem = itemId => {
        const nextItems = this.state.items.filter(item => item.id !== itemId);
        this.setState({items: nextItems});
        if (this.props.vm && this.props.vm.setItems) {
            this.props.vm.setItems(nextItems);
        }
    };

    handlePublishItems = async () => {
        const {items} = this.state;
        const {projectId} = this.props;
        this.setState({publishing: true, publishState: ''});
        try {
            await api.updateProject(projectId, {gameItems: items.map(item => ({
                id: item.id,
                name: item.name,
                visual: {type: 'image', url: itemImageUrl(item)},
                gameAwardable: item.gameAwardable !== false
            }))});
            this.setState({publishing: false, publishState: 'Items published live.'});
        } catch (err) {
            this.setState({publishing: false, publishState: `Publish failed: ${err.message || err}`});
        }
    };

    renderForm () {
        const {editingId, formName, formId, formImage, formAwardable, error} = this.state;
        return (
            <form
                className={styles.formCard}
                onSubmit={this.handleSaveItem}
            >
                <h3 className={styles.sectionTitle}>
                    {editingId ? (
                        <FormattedMessage
                            defaultMessage="Edit Item"
                            description="Title of edit item form"
                            id="mw.gameItemsModal.editItem"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Add New Item"
                            description="Title of add item form"
                            id="mw.gameItemsModal.addNewItem"
                        />
                    )}
                </h3>

                <div className={styles.formRow}>
                    <label className={styles.formLabel}>
                        <FormattedMessage
                            defaultMessage="Item Name"
                            description="Label for item name field"
                            id="mw.gameItemsModal.itemName"
                        />
                    </label>
                    <input
                        autoFocus
                        className={styles.formInput}
                        placeholder="e.g. Golden Key"
                        type="text"
                        value={formName}
                        onChange={this.handleNameChange}
                    />
                </div>

                <div className={styles.formRow}>
                    <label className={styles.formLabel}>
                        <FormattedMessage
                            defaultMessage="Item ID (slug)"
                            description="Label for item slug field"
                            id="mw.gameItemsModal.itemId"
                        />
                    </label>
                    <input
                        className={styles.formInput}
                        placeholder="e.g. golden_key"
                        type="text"
                        value={formId}
                        onChange={this.handleIdChange}
                    />
                </div>

                <div className={styles.formRow}>
                    <label className={styles.formLabel}>
                        <FormattedMessage
                            defaultMessage="Item Image (compressed)"
                            description="Label for item image upload field"
                            id="mw.gameItemsModal.itemImage"
                        />
                    </label>
                    <div className={styles.iconUploadArea}>
                        <div className={styles.iconPreviewBox}>
                            {formImage ? (
                                <img
                                    alt="Item preview"
                                    className={styles.iconPreviewImg}
                                    src={formImage}
                                />
                            ) : (
                                <Backpack
                                    color="#888"
                                    size={24}
                                />
                            )}
                        </div>
                        <input
                            ref={this.fileInputRef}
                            accept="image/*"
                            style={{display: 'none'}}
                            type="file"
                            onChange={this.handleImageFileChange}
                        />
                        <button
                            className={styles.buttonSecondary}
                            type="button"
                            onClick={() => this.fileInputRef.current && this.fileInputRef.current.click()}
                        >
                            <Upload size={14} />
                            {formImage ? (
                                <FormattedMessage
                                    defaultMessage="Change image"
                                    description="Button to change item image"
                                    id="mw.gameItemsModal.changeImage"
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="Upload image"
                                    description="Button to upload item image"
                                    id="mw.gameItemsModal.uploadImage"
                                />
                            )}
                        </button>
                        {formImage ? (
                            <button
                                className={styles.buttonDanger}
                                type="button"
                                onClick={this.handleRemoveImage}
                            >
                                <X size={14} />
                                <FormattedMessage
                                    defaultMessage="Remove"
                                    description="Button to remove item image"
                                    id="mw.gameItemsModal.removeImage"
                                />
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className={styles.formRow}>
                    <label className={styles.formLabel}>
                        <FormattedMessage
                            defaultMessage="Awardable by game code"
                            description="Label for game awardable toggle"
                            id="mw.gameItemsModal.awardable"
                        />
                    </label>
                    <label style={{display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem'}}>
                        <input
                            checked={formAwardable}
                            type="checkbox"
                            onChange={e => this.setState({formAwardable: e.target.checked})}
                        />
                        <FormattedMessage
                            defaultMessage="Blocks can give this item to players"
                            description="Help text for awardable toggle"
                            id="mw.gameItemsModal.awardableHelp"
                        />
                    </label>
                </div>

                {error ? (
                    <p style={{color: '#e5484d', margin: 0, fontSize: '0.82rem'}}>{error}</p>
                ) : null}

                <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                    <button
                        className={styles.buttonPrimary}
                        type="submit"
                    >
                        <PackagePlus size={15} />
                        {editingId ? (
                            <FormattedMessage
                                defaultMessage="Save Changes"
                                description="Button to save item edits"
                                id="mw.gameItemsModal.saveChanges"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Add Item"
                                description="Button to submit new item"
                                id="mw.gameItemsModal.submitNewItem"
                            />
                        )}
                    </button>
                    <button
                        className={styles.buttonSecondary}
                        type="button"
                        onClick={this.handleCancelForm}
                    >
                        <FormattedMessage
                            defaultMessage="Cancel"
                            description="Button to cancel item editing"
                            id="mw.gameItemsModal.cancel"
                        />
                    </button>
                </div>
            </form>
        );
    }

    render () {
        const {intl, onRequestClose} = this.props;
        const {items, showForm, publishing, publishState} = this.state;

        if (showForm) {
            return (
                <Modal
                    className={styles.modalContent}
                    contentLabel={intl.formatMessage(messages.title)}
                    height={520}
                    id="gameItemsModal"
                    width={560}
                    onRequestClose={onRequestClose}
                >
                    <Box className={styles.body}>
                        {this.renderForm()}
                    </Box>
                </Modal>
            );
        }

        return (
            <Modal
                className={styles.modalContent}
                contentLabel={intl.formatMessage(messages.title)}
                height={520}
                id="gameItemsModal"
                width={720}
                onRequestClose={onRequestClose}
            >
                <Box className={styles.body}>
                    <div
                        className={styles.tabs}
                        role="tablist"
                    >
                        <span className={`${styles.tab} ${styles.tabSelected}`}>
                            <Backpack size={15} />
                            <FormattedMessage
                                defaultMessage="Items"
                                description="Items tab in game items modal"
                                id="mw.gameItemsModal.itemsTab"
                            />
                        </span>
                    </div>
                    <div className={styles.panel}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>
                                <FormattedMessage
                                    defaultMessage="Collectable Items"
                                    description="Section header for item list"
                                    id="mw.gameItemsModal.collectableItems"
                                />
                            </h3>
                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                {this.isOnline() ? (
                                    <button
                                        className={styles.buttonSecondary}
                                        type="button"
                                        disabled={publishing}
                                        onClick={this.handlePublishItems}
                                    >
                                        <Upload size={15} />
                                        {publishing ? 'Publishing…' : 'Publish to live'}
                                    </button>
                                ) : null}
                                <button
                                    className={styles.buttonPrimary}
                                    type="button"
                                    onClick={this.handleStartAdd}
                                >
                                    <Plus size={15} />
                                    <FormattedMessage
                                        defaultMessage="Add Item"
                                        description="Button to open add item form"
                                        id="mw.gameItemsModal.addItemButton"
                                    />
                                </button>
                            </div>
                        </div>
                        <p style={{margin: 0, fontSize: '0.85rem'}}>
                            <FormattedMessage
                                defaultMessage={
                                    'Items are cross-project collectables saved to each player. ' +
                                    'They are never sold directly. Award them with blocks and read them back anywhere.'
                                }
                                description="Help text explaining game items"
                                id="mw.gameItemsModal.itemsHelp"
                            />
                        </p>
                        {publishState ? (
                            <p style={{margin: '0 0 0.5rem', fontSize: '0.85rem'}}>{publishState}</p>
                        ) : null}

                        {items.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Backpack size={36} />
                                <p style={{margin: 0, fontWeight: 600}}>
                                    <FormattedMessage
                                        defaultMessage="No items defined yet"
                                        description="Empty state header for item list"
                                        id="mw.gameItemsModal.emptyTitle"
                                    />
                                </p>
                                <p style={{margin: 0, fontSize: '0.85rem'}}>
                                    <FormattedMessage
                                        defaultMessage="Click Add Item to create collectables players keep across projects."
                                        description="Empty state description for item list"
                                        id="mw.gameItemsModal.emptyDescription"
                                    />
                                </p>
                            </div>
                        ) : (
                            <div className={styles.productGrid}>
                                {items.map(item => {
                                    const image = itemImageUrl(item);
                                    return (
                                        <div
                                            key={item.id}
                                            className={styles.productCard}
                                        >
                                            <div className={styles.productHeader}>
                                                {image ? (
                                                    <img
                                                        alt={item.name}
                                                        className={styles.productIcon}
                                                        src={image}
                                                    />
                                                ) : (
                                                    <div className={styles.productIcon}>
                                                        <Backpack
                                                            color="#888"
                                                            size={22}
                                                        />
                                                    </div>
                                                )}
                                                <div className={styles.productInfo}>
                                                    <span className={styles.productName}>{item.name}</span>
                                                    <span className={styles.productId}>
                                                        {'#'}
                                                        {item.id}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.productActions}>
                                                <button
                                                    className={styles.buttonSecondary}
                                                    type="button"
                                                    onClick={() => this.handleStartEdit(item)}
                                                >
                                                    <Edit2 size={13} />
                                                    <FormattedMessage
                                                        defaultMessage="Edit"
                                                        description="Button to edit an item"
                                                        id="mw.gameItemsModal.edit"
                                                    />
                                                </button>
                                                <button
                                                    className={styles.buttonDanger}
                                                    type="button"
                                                    onClick={() => this.handleDeleteItem(item.id)}
                                                >
                                                    <Trash2 size={13} />
                                                    <FormattedMessage
                                                        defaultMessage="Delete"
                                                        description="Button to delete an item"
                                                        id="mw.gameItemsModal.delete"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Box>
            </Modal>
        );
    }
}

GameItemsModalComponent.propTypes = {
    intl: intlShape.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    vm: PropTypes.instanceOf(VM).isRequired
};

export default injectIntl(GameItemsModalComponent);
