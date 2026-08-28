import {ensureScopes} from '../lib/rotur/client.js';

const ROTUR_API = 'https://api.rotur.dev/v2';
const TOKEN_KEY = 'mw:rotur-token';

// Stripe credit top-up tiers (shared with the Rotur wallet). Buying opens a
// Stripe checkout session; the credits are credited to the account once the
// payment is confirmed.
const CREDIT_PACKS = [
    {credits: 50, price: 1.99, lookupKey: 'rotur_credits_50'},
    {credits: 250, price: 8.99, lookupKey: 'rotur_credits_250'},
    {credits: 500, price: 15.99, lookupKey: 'rotur_credits_500'}
];

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
        return localStorage.getItem(TOKEN_KEY);
    } catch (_) {
        return null;
    }
};

const billingRequest = async (path, init = {}) => {
    const token = getToken();
    if (!token) {
        const error = new Error('Log in to buy credits');
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

const getBillingStatus = () => billingRequest('/me/billing');

const openCreditCheckout = async pack => {
    await ensureScopes(['credits:manage']);
    const data = await billingRequest('/me/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({lookup_key: pack.lookupKey})
    });
    if (!data || !data.url) {
        throw new Error('Stripe did not return a checkout link.');
    }
    window.location.assign(data.url);
};

const openBillingPortal = async () => {
    const data = await billingRequest('/me/billing/portal', {method: 'POST'});
    if (!data || !data.url) {
        throw new Error('Rotur did not return a billing link.');
    }
    window.location.assign(data.url);
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

const listCommerceBounties = (filters = {}) => {
    const query = new URLSearchParams(filters);
    return commerceRequest(`/bounties?${query.toString()}`);
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

// Consume a ?billing=success|cancelled query param left by the Stripe checkout
// redirect, returning the result. No param means no billing result.
const consumeBillingResult = () => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get('billing');
    if (result !== 'success' && result !== 'cancelled') {
        return null;
    }
    url.searchParams.delete('billing');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    return result;
};

export {
    CREDIT_PACKS,
    isInsufficientFunds,
    getBillingStatus,
    openCreditCheckout,
    openBillingPortal,
    consumeBillingResult,
    randomIdempotencyKey,
    sendCommercePayment,
    getCommerceEarnings,
    listCommerceBounties,
    createCommerceBounty,
    cancelCommerceBounty
};
