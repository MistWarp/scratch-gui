import api from './api';
import {payWithRotur} from '../lib/rotur/payment-window.js';

const buyGameProduct = async (projectId, productId) => {
    const {intent, result} = await payWithRotur({
        start: returnUrl => api.gameProductIntent(projectId, productId, returnUrl),
        confirm: ({key}) => api.gameProductConfirm(projectId, productId, key)
    });
    return (result || intent).product;
};

export {buyGameProduct};
