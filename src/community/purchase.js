import api from './api';
import {payUser} from '../lib/rotur/client.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Buy a paywalled project: open a purchase intent, transfer the price to the
// MistWarp account tagged with the returned one-time key, then confirm so the
// backend verifies the transfer, pays the creator and unlocks access. Returns
// the fresh project object. Throws with needsReauth set when the current token
// cannot transfer credits.
const buyProject = async id => {
    const intent = await api.purchaseIntent(id);
    if (intent.already) {
        return intent.project;
    }
    await payUser(intent.payTo, intent.amount, intent.key);
    let lastError = null;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const result = await api.purchaseConfirm(id, intent.key);
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

export {buyProject};
