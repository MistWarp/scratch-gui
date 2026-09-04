import React, {useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {Coins, ShoppingBag} from 'lucide-react';

import api from '../api';
import {buyGameProduct} from '../purchase';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import scopeStyles from '../../lib/mw/community-scope.module.css';

const rowStyle = {
    borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
    padding: '14px 0',
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
};
const iconStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    objectFit: 'cover',
    flexShrink: 0,
    background: 'var(--bg-input, #2a2a2a)'
};
const iconFallbackStyle = {
    ...iconStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const ProductIcon = ({product}) => {
    if (product.icon) {
        return (
            <img
                alt=""
                src={product.icon}
                style={iconStyle}
            />
        );
    }
    return (
        <span style={iconFallbackStyle}>
            <ShoppingBag size={22} color="#888" />
        </span>
    );
};

ProductIcon.propTypes = {
    product: PropTypes.object.isRequired
};

const localProducts = vm => {
    try {
        return (vm && vm.getProducts ? vm.getProducts() : []) || [];
    } catch (e) {
        return [];
    }
};

const isOwned = (product, vm, username) => {
    if (product.owned) return true;
    try {
        return Boolean(vm && vm.ownsProduct && vm.ownsProduct(product.id, username || ''));
    } catch (e) {
        return false;
    }
};

const GameMarketplaceModal = ({projectId, productId, isDraft, vm, username, onBlockProject, onResult}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState('');
    const [error, setError] = useState('');
    const purchaseInFlight = useRef(false);
    const mounted = useRef(true);
    const currentProjectId = useRef(projectId);
    currentProjectId.current = projectId;
    const releasePurchase = () => {
        purchaseInFlight.current = false;
    };

    useEffect(() => {
        let cancelled = false;
        setProducts([]);
        setLoading(true);
        setError('');
        if (isDraft) {
            const local = localProducts(vm)
                .filter(product => !productId || product.id === productId)
                .map(product => ({...product, owned: isOwned(product, vm, username)}));
            setProducts(local);
            setLoading(false);
            return () => {
                cancelled = true;
            };
        }
        api.gameProducts(projectId)
            .then(result => {
                if (cancelled) return;
                const remote = (result.products || [])
                    .filter(product => !productId || product.id === productId);
                const seen = new Set(remote.map(product => product.id));
                const missingLocal = localProducts(vm)
                    .filter(product => !seen.has(product.id) && (!productId || product.id === productId));
                setProducts([
                    ...remote.map(product => ({...product, owned: isOwned(product, vm, username)})),
                    ...missingLocal.map(product => ({...product, owned: isOwned(product, vm, username)}))
                ]);
            })
            .catch(e => {
                if (!cancelled) setError(e.message || 'Could not load this game shop.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [projectId, productId, isDraft]);

    useEffect(() => () => {
        mounted.current = false;
    }, []);

    const purchase = async product => {
        if (isOwned(product, vm, username)) {
            onResult({status: 'owned', product});
            return;
        }
        if (purchaseInFlight.current) return;
        const actionProjectId = projectId;
        purchaseInFlight.current = true;
        setBuying(product.id);
        setError('');
        try {
            let purchased;
            if (isDraft) {
                if (vm && vm.grantProduct) vm.grantProduct(product.id, username || '');
                purchased = {...product, owned: true};
            } else {
                purchased = await buyGameProduct(projectId, product.id);
            }
            if (mounted.current && currentProjectId.current === actionProjectId) {
                onResult({status: 'purchased', product: purchased});
            }
        } catch (e) {
            if (mounted.current && currentProjectId.current === actionProjectId) {
                setError(e.message || 'Could not complete the purchase.');
            }
        } finally {
            releasePurchase();
            if (mounted.current) setBuying('');
        }
    };

    const close = () => onResult({status: 'cancelled'});
    const focused = productId ? products.find(product => product.id === productId) : null;
    const list = productId ? (focused ? [focused] : []) : products;

    return (
        <div className={scopeStyles.scope}>
            <Modal
                icon={ShoppingBag}
                title={productId ? 'Purchase game content' : 'Game shop'}
                onClose={close}
                dismissDisabled={Boolean(buying)}
                actions={onBlockProject ? (
                    <Button
                        variant="danger"
                        disabled={Boolean(buying)}
                        onClick={onBlockProject}
                    >
                        Block this project
                    </Button>
                ) : null}
            >
                {loading ? <p>Loading shop…</p> : null}
                {!loading && !list.length ? <p>This project does not have any matching products.</p> : null}
                {!loading && productId && focused ? (
                    <p>
                        {`Would you like to buy ${focused.name} for ${focused.price} credits?`}
                        {isDraft ? ' (Test purchase — no credits charged.)' : null}
                    </p>
                ) : null}
                {list.map(product => {
                    const owned = isOwned(product, vm, username);
                    return (
                        <div
                            key={product.id}
                            style={rowStyle}
                        >
                            <ProductIcon product={product} />
                            <div style={{flex: 1, minWidth: 0}}>
                                <strong>{product.name}</strong>
                                {product.description ? <p style={{margin: '4px 0 0'}}>{product.description}</p> : null}
                                <div style={{display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap'}}>
                                    <Button
                                        variant="primary"
                                        busy={buying === product.id}
                                        busyLabel="Processing…"
                                        disabled={Boolean(buying) || owned}
                                        onClick={() => purchase(product)}
                                    >
                                        <Coins size={15} />
                                        {owned ? 'Already owned' : `Buy (${product.price} credits)`}
                                    </Button>
                                    {productId ? (
                                        <Button
                                            disabled={Boolean(buying)}
                                            onClick={close}
                                        >
                                            Cancel
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {error ? <p aria-live="polite">{error}</p> : null}
            </Modal>
        </div>
    );
};

GameMarketplaceModal.propTypes = {
    isDraft: PropTypes.bool,
    onBlockProject: PropTypes.func,
    onResult: PropTypes.func.isRequired,
    productId: PropTypes.string,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    username: PropTypes.string,
    vm: PropTypes.object
};

export default GameMarketplaceModal;
