import React, {useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {Coins, ShoppingBag} from 'lucide-react';

import api from '../api';
import {buyGameProduct} from '../purchase';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';

const GameMarketplaceModal = ({projectId, productId, onResult}) => {
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
        api.gameProducts(projectId)
            .then(result => {
                if (!cancelled) {
                    setProducts((result.products || []).filter(product => !productId || product.id === productId));
                }
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
    }, [projectId, productId]);

    useEffect(() => () => {
        mounted.current = false;
    }, []);

    const purchase = async product => {
        if (product.owned) {
            onResult({status: 'owned', product});
            return;
        }
        if (purchaseInFlight.current) return;
        const actionProjectId = projectId;
        purchaseInFlight.current = true;
        setBuying(product.id);
        setError('');
        try {
            const purchased = await buyGameProduct(projectId, product.id);
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

    return (
        <Modal
            icon={ShoppingBag}
            title={productId ? 'Purchase game content' : 'Game shop'}
            onClose={() => onResult({status: 'closed'})}
            dismissDisabled={Boolean(buying)}
        >
            {loading ? <p>Loading shop…</p> : null}
            {!loading && !products.length ? <p>This project does not have any matching products.</p> : null}
            {products.map(product => (
                <div key={product.id} style={{borderTop: '1px solid var(--border)', padding: '14px 0'}}>
                    <strong>{product.name}</strong>
                    {product.description ? <p>{product.description}</p> : null}
                    <Button
                        variant="primary"
                        busy={buying === product.id}
                        busyLabel="Processing…"
                        disabled={Boolean(buying)}
                        onClick={() => purchase(product)}
                    >
                        <Coins size={15} />
                        {product.owned ? 'Owned' : `Pay ${product.price} credits`}
                    </Button>
                </div>
            ))}
            {error ? <p aria-live="polite">{error}</p> : null}
        </Modal>
    );
};

GameMarketplaceModal.propTypes = {
    onResult: PropTypes.func.isRequired,
    productId: PropTypes.string,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default GameMarketplaceModal;
