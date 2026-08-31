import {getRoturToken} from '../rotur/identity.js';

const SABLE_API = 'https://sable.rotur.dev/v1';

const request = async (path, options = {}) => {
    const token = getRoturToken();
    if (!token) throw new Error('Sign in with Rotur to use smart features.');
    const response = await fetch(`${SABLE_API}${path}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = body && body.error && body.error.message;
        throw new Error(message || `Sable request failed (${response.status}).`);
    }
    return body;
};

const getSmartFeaturesBalance = () => request('/balance');

const topUpSmartFeatures = () => request('/balance/topup', {
    method: 'POST',
    body: JSON.stringify({amount: 10})
});

const cleanCommitName = value => String(value || '')
    .trim()
    .split('\n')[0]
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/[.!]+$/, '')
    .slice(0, 72)
    .trim();

const generateCommitName = async diff => {
    if (!String(diff || '').trim()) throw new Error('There are no changes to name.');
    const prompt = `Git commit title, 8 words max. Plain text only.\n${diff}`;
    const body = await request('/completions', {
        method: 'POST',
        body: JSON.stringify({
            model: 'sable/spark',
            prompt,
            max_tokens: 18,
            temperature: 0.2,
            sable: {
                personality: 'none',
                remember: false,
                builtin_tools: false
            }
        })
    });
    const name = cleanCommitName(body.choices && body.choices[0] && body.choices[0].text);
    if (!name) throw new Error('Sable did not return a commit name.');
    return {
        name,
        charged: body.sable && body.sable.charged_sc,
        balance: body.sable && body.sable.balance_sc
    };
};

export {
    cleanCommitName,
    generateCommitName,
    getSmartFeaturesBalance,
    topUpSmartFeatures
};
