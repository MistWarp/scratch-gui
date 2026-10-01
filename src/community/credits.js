import {ensureScopes} from '../lib/rotur/client.js';
import {ROTUR_TOKEN_KEY} from '../lib/rotur/token-key.js';

const ROTUR_API = 'https://api.rotur.dev/v2';

// Detect an "insufficient funds" failure from a Rotur transfer error.
const isInsufficientFunds = error => {
    const message = String((error && error.message) || error || '').toLowerCase();
    return message.includes('insufficient') || message.includes('not enough') || message.includes('balance');
};

const isPermissionError = message => {
    const text = String(message || '').toLowerCase();
    return text.includes('permission') ||
        text.includes('scope') ||
        text.includes('not allowed') ||
        text.includes('unauthorized') ||
        text.includes('token');
};

const getToken = () => {
    try {
        return localStorage.getItem(ROTUR_TOKEN_KEY);
    } catch (_) {
        return null;
    }
};

const billingRequest = async (path, init = {}) => {
    const token = getToken();
    if (!token) {
        const error = new Error('Log in to use credits');
        error.needsReauth = true;
        throw error;
    }
    const response = await fetch(`${ROTUR_API}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(init.body ? {'Content-Type': 'application/json'} : {}),
            ...init.headers
        }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const message = (data && data.error) || `Billing request failed (${response.status})`;
        const error = new Error(message);
        if (isPermissionError(message)) {
            error.needsReauth = true;
        }
        throw error;
    }
    return data;
};

const randomIdempotencyKey = prefix => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() :
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}:${id}`;
};

const commerceRequest = async (path, init = {}) => {
    await ensureScopes(init.scope || ['credits:view']);
    const next = {...init};
    delete next.scope;
    return billingRequest(`/commerce${path}`, next);
};

const sendCommercePayment = ({to, amount, source = 'mistwarp', kind, resourceType, resourceId, note, splits}) =>
    commerceRequest('/payments', {
        method: 'POST',
        scope: ['credits:transfer'],
        body: JSON.stringify({
            to,
            amount,
            source,
            kind,
            resource_type: resourceType,
            resource_id: resourceId,
            note,
            splits,
            idempotency_key: randomIdempotencyKey(`${source}:${kind}:${resourceId || 'general'}`)
        })
    });

const getCommerceEarnings = async () => {
    await ensureScopes(['credits:view']);
    return billingRequest('/me/earnings');
};

const listCommerceBounties = async (filters = {}) => {
    const query = new URLSearchParams(filters);
    const path = `/bounties?${query.toString()}`;
    if (getToken()) return commerceRequest(path);
    const response = await fetch(`${ROTUR_API}/commerce${path}`);
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error((data && data.error) || `Billing request failed (${response.status})`);
    return data;
};

const createCommerceBounty = bounty => commerceRequest('/bounties', {
    method: 'POST',
    scope: ['credits:transfer'],
    body: JSON.stringify({
        ...bounty,
        idempotency_key: bounty.idempotency_key || randomIdempotencyKey(
            `${bounty.source}:${bounty.resource_type}:${bounty.resource_id}`
        )
    })
});

const cancelCommerceBounty = id => commerceRequest(`/bounties/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    scope: ['credits:manage'],
    body: '{}'
});

export {
    isInsufficientFunds,
    randomIdempotencyKey,
    sendCommercePayment,
    getCommerceEarnings,
    listCommerceBounties,
    createCommerceBounty,
    cancelCommerceBounty
};
