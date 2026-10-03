import api from './api';
import {payWithRotur} from '../lib/rotur/payment-window.js';

// Buy a paywalled project: Rotur takes the payment, mistwarp-api unlocks it.
const buyProject = async id => {
    const {intent, result} = await payWithRotur({
        start: returnUrl => api.purchaseIntent(id, returnUrl),
        confirm: ({key}) => api.purchaseConfirm(id, key)
    });
    return (result || intent).project;
};

const buyGameProduct = async (projectId, productId) => {
    const {intent, result} = await payWithRotur({
        start: returnUrl => api.gameProductIntent(projectId, productId, returnUrl),
        confirm: ({key}) => api.gameProductConfirm(projectId, productId, key)
    });
    return (result || intent).product;
};

export {buyProject, buyGameProduct};
