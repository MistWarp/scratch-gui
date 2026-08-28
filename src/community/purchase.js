import api from './api';
import {sendCommercePayment} from './credits';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Buy a paywalled project through Rotur's idempotent commerce API, then ask the
// MistWarp API to verify the payment and unlock the project.
const buyProject = async id => {
    const intent = await api.purchaseIntent(id);
    if (intent.already) {
        return intent.project;
    }
    const paid = await sendCommercePayment({
        amount: intent.amount,
        kind: 'project_sale',
        resourceType: 'project',
        resourceId: id,
        note: `MistWarp project: ${intent.title || id}`,
        splits: intent.splits
    });
    const paymentId = paid.payment.id;
    let lastError = null;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const result = await api.purchaseConfirm(id, intent.key, paymentId);
            return result.project;
        } catch (e) {
            if (e.status === 402 && e.data && e.data.pending) {
                lastError = e;
                await sleep(1500);
                continue;
            }
            throw e;
        }
    }
    throw lastError || new Error('Payment could not be confirmed');
};

const buyGameProduct = async (projectId, productId) => {
    const intent = await api.gameProductIntent(projectId, productId);
    if (intent.already) return intent.product;
    const paid = await sendCommercePayment({
        amount: intent.amount,
        kind: 'game_product',
        resourceType: 'game_product',
        resourceId: intent.resourceId,
        note: `MistWarp game item: ${intent.title || productId}`,
        splits: intent.splits
    });
    let lastError = null;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const result = await api.gameProductConfirm(projectId, productId, intent.key, paid.payment.id);
            return result.product;
        } catch (e) {
            if (e.status === 402 && e.data && e.data.pending) {
                lastError = e;
                await sleep(1500);
                continue;
            }
            throw e;
        }
    }
    throw lastError || new Error('Payment could not be confirmed');
};

export {buyProject, buyGameProduct};
