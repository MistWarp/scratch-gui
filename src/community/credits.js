import {ensureScopes, getAccessToken} from '../lib/rotur/client.js';

const ROTUR_API = 'https://api.rotur.dev/v2';

const isPermissionError = message => {
    const text = String(message || '').toLowerCase();
    return text.includes('permission') ||
        text.includes('scope') ||
        text.includes('not allowed') ||
        text.includes('unauthorized') ||
        text.includes('token');
};

const billingRequest = async (path, init = {}) => {
    const token = await getAccessToken();
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

const commerceRequest = async (path, init = {}) => {
    // Every call says which permission it needs. Anything more than viewing
    // is asked for from the person's click.
    const {scope} = init;
    await ensureScopes(scope, {prompt: scope.some(name => !name.endsWith(':view'))});
    const next = {...init};
    delete next.scope;
    return billingRequest(`/commerce${path}`, next);
};

const listCommerceBounties = async (filters = {}) => {
    const query = new URLSearchParams(filters);
    const path = `/bounties?${query.toString()}`;
    // Anyone can list bounties, so no token or credits permission is needed.
    const response = await fetch(`${ROTUR_API}/commerce${path}`);
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error((data && data.error) || `Billing request failed (${response.status})`);
    return data;
};

const cancelCommerceBounty = id => commerceRequest(`/bounties/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    scope: ['credits:manage'],
    body: '{}'
});

export {
    listCommerceBounties,
    cancelCommerceBounty
};
