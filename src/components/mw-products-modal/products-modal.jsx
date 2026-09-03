/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';
import {
    BarChart3,
    Bookmark,
    Clock3,
    Coins,
    Edit2,
    ExternalLink,
    Eye,
    Heart,
    PackagePlus,
    Plus,
    ShoppingBag,
    Trash2,
    Upload,
    UserCheck,
    UserMinus,
    UserPlus,
    Users,
    X
} from 'lucide-react';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import api from '../../community/api.js';
import {sendCommercePayment} from '../../community/credits.js';
import styles from './products-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Project Management & Analytics',
        description: 'Title for project management and analytics window',
        id: 'mw.productsModal.title'
    }
});

const compressProductImage = file => new Promise((resolve, reject) => {
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

class ProductsModalComponent extends React.Component {
    constructor (props) {
        super(props);

        const initialProducts = props.vm && props.vm.getProducts ? props.vm.getProducts() : [];
        const initialEntitlements = props.vm && props.vm.getTestEntitlements ? props.vm.getTestEntitlements() : {};
        const hasProject = Boolean(props.projectId && props.projectId !== '0' && props.projectId !== 0);

        this.state = {
            tab: hasProject ? 'analytics' : 'catalog',
            projectData: null,
            products: initialProducts,
            entitlements: initialEntitlements,
            showForm: false,
            editingId: null,
            formName: '',
            formId: '',
            formPrice: 10,
            formIcon: '',
            idManuallyEdited: false,
            selectedProductForEntitlements: initialProducts.length > 0 ? initialProducts[0].id : '',
            grantUsernameInput: '',
            revokeUsernameInput: '',
            revokeArmed: false,
            onlineStatus: '',
            publishing: false,
            publishState: '',
            error: ''
        };

        this.fileInputRef = React.createRef();
    }

    componentDidMount () {
        if (this.props.projectId && this.props.projectId !== '0' && this.props.projectId !== 0) {
            api.getProject(this.props.projectId)
                .then(data => {
                    if (data) {
                        this.setState({projectData: data});
                    }
                })
                .catch(() => {});
        }

        if (this.props.vm && this.props.vm.runtime) {
            this.handleProductsChanged = products => {
                this.setState({
                    products: products || [],
                    selectedProductForEntitlements: this.state.selectedProductForEntitlements ||
                        (products && products.length > 0 ? products[0].id : '')
                });
            };
            this.handleEntitlementsChanged = entitlements => {
                this.setState({entitlements: entitlements || {}});
            };
            this.props.vm.runtime.on('PRODUCTS_CHANGED', this.handleProductsChanged);
            this.props.vm.runtime.on('ENTITLEMENTS_CHANGED', this.handleEntitlementsChanged);
        }
    }

    componentWillUnmount () {
        if (this.props.vm && this.props.vm.runtime) {
            if (this.handleProductsChanged) {
                this.props.vm.runtime.off('PRODUCTS_CHANGED', this.handleProductsChanged);
            }
            if (this.handleEntitlementsChanged) {
                this.props.vm.runtime.off('ENTITLEMENTS_CHANGED', this.handleEntitlementsChanged);
            }
        }
    }

    handleStartAdd = () => {
        this.setState({
            showForm: true,
            editingId: null,
            formName: '',
            formId: '',
            formPrice: 10,
            formIcon: '',
            idManuallyEdited: false,
            error: ''
        });
    };

    handleStartEdit = product => {
        this.setState({
            showForm: true,
            editingId: product.id,
            formName: product.name || '',
            formId: product.id || '',
            formPrice: typeof product.price === 'number' ? product.price : 10,
            formIcon: product.icon || '',
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
            formPrice: 10,
            formIcon: '',
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

    handlePriceChange = e => {
        const price = Math.max(0, parseInt(e.target.value, 10) || 0);
        this.setState({formPrice: price});
    };

    handleIconFileChange = async e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
            const compressed = await compressProductImage(file);
            this.setState({formIcon: compressed, error: ''});
        } catch (err) {
            this.setState({error: err.message || 'Failed to process image'});
        }
    };

    handleRemoveIcon = () => {
        this.setState({formIcon: ''});
        if (this.fileInputRef.current) {
            this.fileInputRef.current.value = '';
        }
    };

    handleSaveProduct = e => {
        if (e) e.preventDefault();
        const {editingId, formName, formId, formPrice, formIcon, products} = this.state;
        const name = formName.trim();
        const id = (formId || slugify(name)).trim();

        if (!name) {
            this.setState({error: 'Product name is required'});
            return;
        }
        if (!id) {
            this.setState({error: 'Product ID is required'});
            return;
        }

        const existingWithSameId = products.find(p => p.id === id);
        if (existingWithSameId && existingWithSameId.id !== editingId) {
            this.setState({error: `A product with ID "${id}" already exists`});
            return;
        }

        const productData = {
            id,
            name,
            price: formPrice,
            icon: formIcon
        };

        let nextProducts;
        if (editingId) {
            nextProducts = products.map(p => (p.id === editingId ? productData : p));
        } else {
            nextProducts = [...products, productData];
        }

        this.setState({
            products: nextProducts,
            showForm: false,
            editingId: null,
            formName: '',
            formId: '',
            formPrice: 10,
            formIcon: '',
            error: '',
            selectedProductForEntitlements: this.state.selectedProductForEntitlements || id
        });

        if (this.props.vm && this.props.vm.setProducts) {
            this.props.vm.setProducts(nextProducts);
        }
    };

    handleDeleteProduct = productId => {
        const nextProducts = this.state.products.filter(p => p.id !== productId);
        this.setState({
            products: nextProducts,
            selectedProductForEntitlements: nextProducts.length > 0 ? nextProducts[0].id : ''
        });
        if (this.props.vm && this.props.vm.setProducts) {
            this.props.vm.setProducts(nextProducts);
        }
    };

    handleGrantUser = e => {
        if (e) e.preventDefault();
        const {selectedProductForEntitlements, grantUsernameInput} = this.state;
        const username = grantUsernameInput.trim();
        if (!selectedProductForEntitlements || !username) return;

        if (this.props.vm && this.props.vm.grantProduct) {
            this.props.vm.grantProduct(selectedProductForEntitlements, username);
            this.setState({
                grantUsernameInput: '',
                entitlements: this.props.vm.getTestEntitlements()
            });
        }
    };

    handleRevokeUser = username => {
        const {selectedProductForEntitlements} = this.state;
        if (!selectedProductForEntitlements || !username) return;

        if (this.props.vm && this.props.vm.revokeProduct) {
            this.props.vm.revokeProduct(selectedProductForEntitlements, username);
            this.setState({
                entitlements: this.props.vm.getTestEntitlements()
            });
        }
    };

    isOnline () {
        const {projectId} = this.props;
        return Boolean(projectId && projectId !== '0' && projectId !== 0);
    }

    handlePublishProducts = async () => {
        const {products} = this.state;
        const {projectId} = this.props;
        this.setState({publishing: true, publishState: ''});
        try {
            await api.updateProject(projectId, {gameProducts: products.map(product => ({
                id: product.id,
                name: product.name,
                description: '',
                price: product.price,
                grantsItem: '',
                icon: product.icon || ''
            }))});
            this.setState({publishing: false, publishState: 'Products published live.'});
        } catch (err) {
            this.setState({publishing: false, publishState: `Publish failed: ${err.message || err}`});
        }
    };

    handleGrantUserOnline = async e => {
        if (e) e.preventDefault();
        const {selectedProductForEntitlements, grantUsernameInput} = this.state;
        const username = grantUsernameInput.trim();
        if (!selectedProductForEntitlements || !username) return;
        this.setState({onlineStatus: 'Granting…'});
        try {
            await api.grantGameProduct(this.props.projectId, selectedProductForEntitlements, username);
            this.setState({onlineStatus: `Granted to @${username}.`, grantUsernameInput: ''});
        } catch (err) {
            this.setState({onlineStatus: `Grant failed: ${err.message || err}`});
        }
    };

    handleRevokeUserOnline = async withRefund => {
        const {selectedProductForEntitlements, revokeUsernameInput, products} = this.state;
        const {projectId} = this.props;
        const username = revokeUsernameInput.trim();
        if (!selectedProductForEntitlements || !username) return;
        const product = products.find(p => p.id === selectedProductForEntitlements);
        const productName = product ? product.name : selectedProductForEntitlements;
        const price = product ? Number(product.price) || 0 : 0;
        if (!withRefund && !this.state.revokeArmed) {
            this.setState({
                revokeArmed: true,
                onlineStatus: `Click confirm to revoke "${productName}" from @${username} without a refund.`
            });
            return;
        }
        this.setState({
            revokeArmed: false,
            onlineStatus: withRefund && price > 0 ? 'Sending refund…' : 'Revoking…'
        });
        try {
            let paymentId;
            if (withRefund && price > 0) {
                const paid = await sendCommercePayment({
                    to: username,
                    amount: price,
                    kind: 'game_product_refund',
                    resourceType: 'game_product',
                    resourceId: `${projectId}:${selectedProductForEntitlements}`,
                    note: `Refund: ${productName}`
                });
                paymentId = paid.payment.id;
                this.setState({onlineStatus: 'Refund sent, revoking…'});
            }
            await api.revokeGameProduct(projectId, selectedProductForEntitlements, {
                username,
                paymentId,
                noRefund: !withRefund
            });
            this.setState({
                onlineStatus: `Revoked from @${username}${withRefund && price > 0 ? ' with refund' : ''}.`,
                revokeUsernameInput: '',
                revokeArmed: false
            });
        } catch (err) {
            this.setState({onlineStatus: `Revoke failed: ${err.message || err}`, revokeArmed: false});
        }
    };

    renderProductSelector () {
        const {products, selectedProductForEntitlements} = this.state;
        return (
            <div
                className={styles.formRow}
                style={{minWidth: '200px'}}
            >
                <label className={styles.formLabel}>
                    <FormattedMessage
                        defaultMessage="Select Product"
                        description="Dropdown label for selecting product in entitlements"
                        id="mw.productsModal.selectProduct"
                    />
                </label>
                <select
                    className={styles.formInput}
                    value={selectedProductForEntitlements}
                    onChange={e => this.setState({selectedProductForEntitlements: e.target.value})}
                >
                    {products.map(p => (
                        <option
                            key={p.id}
                            value={p.id}
                        >
                            {`${p.name} (#${p.id})`}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    renderOnlineRevoke (selectedProduct) {
        const {revokeUsernameInput, revokeArmed} = this.state;
        const price = selectedProduct ? Number(selectedProduct.price) || 0 : 0;
        return (
            <React.Fragment>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                        <FormattedMessage
                            defaultMessage="Revoke live ownership"
                            description="Section header for revoking a live product"
                            id="mw.productsModal.revokeOwnership"
                        />
                    </h3>
                </div>
                <p style={{margin: 0, fontSize: '0.85rem'}}>
                    <FormattedMessage
                        defaultMessage={
                            'Revoking refunds the buyer from your balance by default. ' +
                            'Only revoke without a refund in exceptional cases.'
                        }
                        description="Help text for live product revocation"
                        id="mw.productsModal.revokeHelp"
                    />
                </p>
                <form
                    style={{display: 'flex', gap: '0.5rem', alignItems: 'flex-end'}}
                    onSubmit={e => {
                        e.preventDefault();
                        this.handleRevokeUserOnline(true);
                    }}
                >
                    <div
                        className={styles.formRow}
                        style={{flex: 1, minWidth: '160px'}}
                    >
                        <label className={styles.formLabel}>
                            <FormattedMessage
                                defaultMessage="Revoke from Username"
                                description="Label for username input to revoke product"
                                id="mw.productsModal.revokeFromUsername"
                            />
                        </label>
                        <input
                            className={styles.formInput}
                            placeholder="Username to revoke"
                            type="text"
                            value={revokeUsernameInput}
                            onChange={e => this.setState({
                                revokeUsernameInput: e.target.value,
                                revokeArmed: false
                            })}
                        />
                    </div>
                    <button
                        className={styles.buttonDanger}
                        style={{height: '38px'}}
                        type="submit"
                    >
                        <UserMinus size={15} />
                        {price > 0 ? `Revoke with refund (${price})` : 'Revoke (free)'}
                    </button>
                    <button
                        className={styles.buttonSecondary}
                        style={{height: '38px'}}
                        type="button"
                        onClick={() => this.handleRevokeUserOnline(false)}
                    >
                        {revokeArmed ? (
                            <FormattedMessage
                                defaultMessage="Confirm revoke"
                                description="Button to confirm revoking product without refund"
                                id="mw.productsModal.confirmRevoke"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Without refund"
                                description="Button to revoke product without refund"
                                id="mw.productsModal.withoutRefund"
                            />
                        )}
                    </button>
                </form>
            </React.Fragment>
        );
    }

    renderCatalogTab () {
        const {products, showForm, editingId, formName, formId, formPrice, formIcon, error,
            publishing, publishState} = this.state;

        if (showForm) {
            return (
                <form
                    className={styles.formCard}
                    onSubmit={this.handleSaveProduct}
                >
                    <h3 className={styles.sectionTitle}>
                        {editingId ? (
                            <FormattedMessage
                                defaultMessage="Edit Product"
                                description="Title of edit product form"
                                id="mw.productsModal.editProduct"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Add New Product"
                                description="Title of add product form"
                                id="mw.productsModal.addNewProduct"
                            />
                        )}
                    </h3>

                    <div className={styles.formRow}>
                        <label className={styles.formLabel}>
                            <FormattedMessage
                                defaultMessage="Product Name"
                                description="Label for product name field"
                                id="mw.productsModal.productName"
                            />
                        </label>
                        <input
                            autoFocus
                            className={styles.formInput}
                            placeholder="e.g. VIP Pass"
                            type="text"
                            value={formName}
                            onChange={this.handleNameChange}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <label className={styles.formLabel}>
                            <FormattedMessage
                                defaultMessage="Product ID (slug)"
                                description="Label for product slug field"
                                id="mw.productsModal.productId"
                            />
                        </label>
                        <input
                            className={styles.formInput}
                            placeholder="e.g. vip_pass"
                            type="text"
                            value={formId}
                            onChange={this.handleIdChange}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <label className={styles.formLabel}>
                            <FormattedMessage
                                defaultMessage="Price (credits)"
                                description="Label for product price field"
                                id="mw.productsModal.price"
                            />
                        </label>
                        <input
                            className={styles.formInput}
                            min="0"
                            step="1"
                            type="number"
                            value={formPrice}
                            onChange={this.handlePriceChange}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <label className={styles.formLabel}>
                            <FormattedMessage
                                defaultMessage="Product Icon (compressed)"
                                description="Label for product icon upload field"
                                id="mw.productsModal.productIcon"
                            />
                        </label>
                        <div className={styles.iconUploadArea}>
                            <div className={styles.iconPreviewBox}>
                                {formIcon ? (
                                    <img
                                        alt="Icon preview"
                                        className={styles.iconPreviewImg}
                                        src={formIcon}
                                    />
                                ) : (
                                    <ShoppingBag
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
                                onChange={this.handleIconFileChange}
                            />
                            <button
                                className={styles.buttonSecondary}
                                type="button"
                                onClick={() => this.fileInputRef.current && this.fileInputRef.current.click()}
                            >
                                <Upload size={14} />
                                {formIcon ? (
                                    <FormattedMessage
                                        defaultMessage="Change image"
                                        description="Button to change product icon"
                                        id="mw.productsModal.changeImage"
                                    />
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Upload image"
                                        description="Button to upload product icon"
                                        id="mw.productsModal.uploadImage"
                                    />
                                )}
                            </button>
                            {formIcon ? (
                                <button
                                    className={styles.buttonDanger}
                                    type="button"
                                    onClick={this.handleRemoveIcon}
                                >
                                    <X size={14} />
                                    <FormattedMessage
                                        defaultMessage="Remove"
                                        description="Button to remove product icon"
                                        id="mw.productsModal.removeIcon"
                                    />
                                </button>
                            ) : null}
                        </div>
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
                                    description="Button to save product edits"
                                    id="mw.productsModal.saveChanges"
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="Add Product"
                                    description="Button to submit new product"
                                    id="mw.productsModal.submitNewProduct"
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
                                description="Button to cancel product editing"
                                id="mw.productsModal.cancel"
                            />
                        </button>
                    </div>
                </form>
            );
        }

        return (
            <div className={styles.panel}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                        <FormattedMessage
                            defaultMessage="Product Catalog"
                            description="Section header for product catalog"
                            id="mw.productsModal.productCatalog"
                        />
                    </h3>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                        {this.isOnline() ? (
                            <button
                                className={styles.buttonSecondary}
                                type="button"
                                disabled={publishing}
                                onClick={this.handlePublishProducts}
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
                                defaultMessage="Add Product"
                                description="Button to open add product form"
                                id="mw.productsModal.addProductButton"
                            />
                        </button>
                    </div>
                </div>
                {publishState ? (
                    <p style={{margin: '0 0 0.5rem', fontSize: '0.85rem'}}>{publishState}</p>
                ) : null}

                {products.length === 0 ? (
                    <div className={styles.emptyState}>
                        <ShoppingBag size={36} />
                        <p style={{margin: 0, fontWeight: 600}}>
                            <FormattedMessage
                                defaultMessage="No products defined yet"
                                description="Empty state header for product catalog"
                                id="mw.productsModal.emptyTitle"
                            />
                        </p>
                        <p style={{margin: 0, fontSize: '0.85rem'}}>
                            <FormattedMessage
                                defaultMessage="Click Add Product to create items players can purchase."
                                description="Empty state description for product catalog"
                                id="mw.productsModal.emptyDescription"
                            />
                        </p>
                    </div>
                ) : (
                    <div className={styles.productGrid}>
                        {products.map(product => (
                            <div
                                key={product.id}
                                className={styles.productCard}
                            >
                                <div className={styles.productHeader}>
                                    {product.icon ? (
                                        <img
                                            alt={product.name}
                                            className={styles.productIcon}
                                            src={product.icon}
                                        />
                                    ) : (
                                        <div className={styles.productIcon}>
                                            <ShoppingBag
                                                color="#888"
                                                size={22}
                                            />
                                        </div>
                                    )}
                                    <div className={styles.productInfo}>
                                        <span className={styles.productName}>{product.name}</span>
                                        <span className={styles.productId}>
                                            {'#'}
                                            {product.id}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.productPriceBadge}>
                                    <Coins size={12} />
                                    {product.price}{' '}
                                    {product.price === 1 ? (
                                        <FormattedMessage
                                            defaultMessage="credit"
                                            description="Singular credit unit"
                                            id="mw.productsModal.credit"
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="credits"
                                            description="Plural credits unit"
                                            id="mw.productsModal.credits"
                                        />
                                    )}
                                </div>
                                <div className={styles.productActions}>
                                    <button
                                        className={styles.buttonSecondary}
                                        type="button"
                                        onClick={() => this.handleStartEdit(product)}
                                    >
                                        <Edit2 size={13} />
                                        <FormattedMessage
                                            defaultMessage="Edit"
                                            description="Button to edit a product"
                                            id="mw.productsModal.edit"
                                        />
                                    </button>
                                    <button
                                        className={styles.buttonDanger}
                                        type="button"
                                        onClick={() => this.handleDeleteProduct(product.id)}
                                    >
                                        <Trash2 size={13} />
                                        <FormattedMessage
                                            defaultMessage="Delete"
                                            description="Button to delete a product"
                                            id="mw.productsModal.delete"
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    renderEntitlementsTab () {
        const {products, entitlements, selectedProductForEntitlements, grantUsernameInput,
            onlineStatus} = this.state;
        const currentList = Array.isArray(entitlements[selectedProductForEntitlements]) ?
            entitlements[selectedProductForEntitlements] : [];

        if (products.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <ShoppingBag size={36} />
                    <p style={{margin: 0, fontWeight: 600}}>
                        <FormattedMessage
                            defaultMessage="No products available"
                            description="Empty entitlements header"
                            id="mw.productsModal.noProductsAvailable"
                        />
                    </p>
                    <p style={{margin: 0, fontSize: '0.85rem'}}>
                        <FormattedMessage
                            defaultMessage={
                                'Create at least one product in the Catalog tab before managing entitlements.'
                            }
                            description="Empty entitlements description"
                            id="mw.productsModal.noProductsHelp"
                        />
                    </p>
                </div>
            );
        }

        const selectedProduct = products.find(p => p.id === selectedProductForEntitlements) || products[0];
        const online = this.isOnline();

        if (online) {
            return (
                <div className={styles.panel}>
                    <p style={{margin: 0, fontSize: '0.85rem'}}>
                        <FormattedMessage
                            defaultMessage={
                                'Live entitlements for the published project. ' +
                                'Test purchases in the editor use local test ownership instead.'
                            }
                            description="Notice explaining live versus test entitlements"
                            id="mw.productsModal.liveEntitlementsNotice"
                        />
                    </p>
                    <div className={styles.entitlementControls}>
                        {this.renderProductSelector()}
                        <form
                            style={{display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flex: 1}}
                            onSubmit={this.handleGrantUserOnline}
                        >
                            <div
                                className={styles.formRow}
                                style={{flex: 1, minWidth: '160px'}}
                            >
                                <label className={styles.formLabel}>
                                    <FormattedMessage
                                        defaultMessage="Grant to Username"
                                        description="Label for username input to grant product"
                                        id="mw.productsModal.grantToUsername"
                                    />
                                </label>
                                <input
                                    className={styles.formInput}
                                    placeholder="Username to grant"
                                    type="text"
                                    value={grantUsernameInput}
                                    onChange={e => this.setState({grantUsernameInput: e.target.value})}
                                />
                            </div>
                            <button
                                className={styles.buttonPrimary}
                                style={{height: '38px'}}
                                type="submit"
                            >
                                <UserPlus size={15} />
                                <FormattedMessage
                                    defaultMessage="Grant"
                                    description="Button to grant product to user"
                                    id="mw.productsModal.grant"
                                />
                            </button>
                        </form>
                    </div>
                    {onlineStatus ? (
                        <p style={{margin: 0, fontSize: '0.85rem'}}>{onlineStatus}</p>
                    ) : null}
                    {this.renderOnlineRevoke(selectedProduct)}
                </div>
            );
        }

        return (
            <div className={styles.panel}>
                <div className={styles.entitlementControls}>
                    {this.renderProductSelector()}

                    <form
                        style={{display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flex: 1}}
                        onSubmit={this.handleGrantUser}
                    >
                        <div
                            className={styles.formRow}
                            style={{flex: 1, minWidth: '160px'}}
                        >
                            <label className={styles.formLabel}>
                                <FormattedMessage
                                    defaultMessage="Grant to Username"
                                    description="Label for username input to grant product"
                                    id="mw.productsModal.grantToUsername"
                                />
                            </label>
                            <input
                                className={styles.formInput}
                                placeholder="Username to grant"
                                type="text"
                                value={grantUsernameInput}
                                onChange={e => this.setState({grantUsernameInput: e.target.value})}
                            />
                        </div>
                        <button
                            className={styles.buttonPrimary}
                            style={{height: '38px'}}
                            type="submit"
                        >
                            <UserPlus size={15} />
                            <FormattedMessage
                                defaultMessage="Grant"
                                description="Button to grant product to user"
                                id="mw.productsModal.grant"
                            />
                        </button>
                    </form>
                </div>

                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                        <FormattedMessage
                            defaultMessage='Users who own "{productName}" ({count})'
                            description="Section header showing granted users"
                            id="mw.productsModal.grantedUsersCount"
                            values={{
                                productName: selectedProduct ? selectedProduct.name : '',
                                count: currentList.length
                            }}
                        />
                    </h3>
                </div>

                {currentList.length === 0 ? (
                    <div className={styles.emptyState}>
                        <UserCheck size={32} />
                        <p style={{margin: 0}}>
                            <FormattedMessage
                                defaultMessage="No users currently own this product."
                                description="Message when no users own this product"
                                id="mw.productsModal.noUsersOwned"
                            />
                        </p>
                        <small>
                            <FormattedMessage
                                defaultMessage="Enter a username above to grant ownership."
                                description="Help text for granting ownership"
                                id="mw.productsModal.enterUsernameToGrant"
                            />
                        </small>
                    </div>
                ) : (
                    <div className={styles.userList}>
                        {currentList.map(username => (
                            <div
                                key={username}
                                className={styles.userRow}
                            >
                                <span className={styles.username}>
                                    {'@'}
                                    {username}
                                </span>
                                <button
                                    className={styles.buttonDanger}
                                    type="button"
                                    onClick={() => this.handleRevokeUser(username)}
                                >
                                    <UserMinus size={13} />
                                    <FormattedMessage
                                        defaultMessage="Revoke"
                                        description="Button to revoke product from user"
                                        id="mw.productsModal.revoke"
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    renderAnalyticsTab () {
        const {projectData, products} = this.state;
        const {projectId} = this.props;
        const hasProject = Boolean(projectId && projectId !== '0' && projectId !== 0);

        if (!hasProject) {
            return (
                <div className={styles.emptyState}>
                    <BarChart3 size={36} />
                    <p style={{margin: 0, fontWeight: 600}}>
                        <FormattedMessage
                            defaultMessage="Project not saved to MistWarp yet"
                            description="Notice when project is unsaved"
                            id="mw.productsModal.unsavedNotice"
                        />
                    </p>
                    <p style={{margin: 0, fontSize: '0.85rem'}}>
                        <FormattedMessage
                            defaultMessage={
                                'Save or publish your project to track live views, ' +
                                'playtime, and monetization analytics.'
                            }
                            description="Help text for unsaved analytics"
                            id="mw.productsModal.unsavedHelp"
                        />
                    </p>
                </div>
            );
        }

        const views = (projectData && (projectData.views || 0)) || 0;
        const hearts = (projectData && (projectData.hearts || 0)) || 0;
        const saves = (projectData && projectData.analytics && (projectData.analytics.saves || 0)) || 0;
        const playtimeMs = (projectData && projectData.analytics &&
            (projectData.analytics.totalPlaytimeMs || 0)) || 0;
        const playtimeHours = (playtimeMs / (1000 * 60 * 60)).toFixed(1);
        const donations = (projectData && projectData.donations && (projectData.donations.total || 0)) || 0;
        const title = (projectData && projectData.title) || 'Current Project';

        return (
            <div className={styles.panel}>
                <div className={styles.analyticsHeader}>
                    <div>
                        <h3 className={styles.sectionTitle}>{title}</h3>
                        <span style={{fontSize: '0.8rem', color: 'var(--text-dim, #888)'}}>
                            {'ID: '}
                            {projectId}
                        </span>
                    </div>
                    <a
                        className={styles.buttonSecondary}
                        href={`/mystuff/project/${projectId}`}
                        rel="noreferrer"
                        target="_blank"
                    >
                        <ExternalLink size={14} />
                        <FormattedMessage
                            defaultMessage="Full Management Page"
                            description="Link to full project management page"
                            id="mw.productsModal.fullManagementLink"
                        />
                    </a>
                </div>

                <div className={styles.statGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <Eye size={18} />
                            <span className={styles.statLabel}>{'Views'}</span>
                        </div>
                        <span className={styles.statNumber}>{views.toLocaleString()}</span>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <Heart size={18} />
                            <span className={styles.statLabel}>{'Hearts'}</span>
                        </div>
                        <span className={styles.statNumber}>{hearts.toLocaleString()}</span>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <Bookmark size={18} />
                            <span className={styles.statLabel}>{'Saves'}</span>
                        </div>
                        <span className={styles.statNumber}>{saves.toLocaleString()}</span>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <Clock3 size={18} />
                            <span className={styles.statLabel}>{'Playtime'}</span>
                        </div>
                        <span className={styles.statNumber}>
                            {playtimeHours}
                            {'h'}
                        </span>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <Coins size={18} />
                            <span className={styles.statLabel}>{'Donations'}</span>
                        </div>
                        <span className={styles.statNumber}>{donations.toLocaleString()}</span>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <ShoppingBag size={18} />
                            <span className={styles.statLabel}>{'Products'}</span>
                        </div>
                        <span className={styles.statNumber}>{products.length}</span>
                    </div>
                </div>
            </div>
        );
    }

    render () {
        const {intl, onRequestClose} = this.props;
        const {tab} = this.state;

        return (
            <Modal
                className={styles.modalContent}
                contentLabel={intl.formatMessage(messages.title)}
                height={520}
                id="productsModal"
                width={720}
                onRequestClose={onRequestClose}
            >
                <Box className={styles.body}>
                    <div
                        className={styles.tabs}
                        role="tablist"
                    >
                        <button
                            aria-selected={tab === 'analytics'}
                            className={`${styles.tab} ${tab === 'analytics' ? styles.tabSelected : ''}`}
                            role="tab"
                            type="button"
                            onClick={() => this.setState({tab: 'analytics', showForm: false})}
                        >
                            <BarChart3 size={15} />
                            <FormattedMessage
                                defaultMessage="Analytics"
                                description="Analytics tab in project management modal"
                                id="mw.productsModal.analyticsTab"
                            />
                        </button>
                        <button
                            aria-selected={tab === 'catalog'}
                            className={`${styles.tab} ${tab === 'catalog' ? styles.tabSelected : ''}`}
                            role="tab"
                            type="button"
                            onClick={() => this.setState({tab: 'catalog', showForm: false})}
                        >
                            <ShoppingBag size={15} />
                            <FormattedMessage
                                defaultMessage="Catalog"
                                description="Catalog tab in products modal"
                                id="mw.productsModal.catalogTab"
                            />
                        </button>
                        <button
                            aria-selected={tab === 'entitlements'}
                            className={`${styles.tab} ${tab === 'entitlements' ? styles.tabSelected : ''}`}
                            role="tab"
                            type="button"
                            onClick={() => this.setState({tab: 'entitlements', showForm: false})}
                        >
                            <Users size={15} />
                            <FormattedMessage
                                defaultMessage="User Entitlements"
                                description="Entitlements tab in products modal"
                                id="mw.productsModal.entitlementsTab"
                            />
                        </button>
                    </div>

                    {tab === 'analytics' ? this.renderAnalyticsTab() :
                        (tab === 'catalog' ? this.renderCatalogTab() : this.renderEntitlementsTab())}
                </Box>
            </Modal>
        );
    }
}

ProductsModalComponent.propTypes = {
    intl: intlShape.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    vm: PropTypes.instanceOf(VM).isRequired
};

export default injectIntl(ProductsModalComponent);
