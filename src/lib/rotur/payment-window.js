// Paying through Rotur payment requests:
// https://docs.rotur.dev/build-an-app/payments
//
// mistwarp-api asks Rotur for the payment and hands back Rotur's approve page.
// The person approves it there with their password, in a window this page
// opens. Rotur tells this page the outcome when it was given a way back to
// it; otherwise the window just closes. Either way mistwarp-api is then asked
// to confirm, and it checks with Rotur, so nothing here decides what was paid.

import {sleep} from '../utils/async.js';

const ROTUR_ORIGIN = 'https://rotur.dev';
const CONFIRM_TRIES = 5;
const CONFIRM_DELAY = 1500;

const paymentError = (message, fields) => Object.assign(new Error(message), fields);

// Called straight from the click, before anything is awaited, so browsers
// don't block the window.
const openPaymentWindow = () => {
    let popup = null;
    try {
        popup = window.open('', 'rotur-payment', 'popup,width=480,height=760');
    } catch (_) {
        popup = null;
    }
    if (!popup) {
        throw paymentError(
            'Your browser blocked Rotur\'s payment window. Allow pop-ups for MistWarp, then try again.',
            {popupBlocked: true}
        );
    }
    return popup;
};

// Resolves with Rotur's answer ('paid' or 'declined'), or 'closed' if the
// window closes without one.
const waitForDecision = (popup, requestId) => new Promise(resolve => {
    let poll = null;
    const onMessage = event => {
        const data = event.data;
        if (event.origin !== ROTUR_ORIGIN || !data || data.type !== 'rotur:payment' || data.id !== requestId) return;
        window.removeEventListener('message', onMessage);
        clearInterval(poll);
        resolve(String(data.status || ''));
    };
    window.addEventListener('message', onMessage);
    poll = setInterval(() => {
        if (!popup.closed) return;
        window.removeEventListener('message', onMessage);
        clearInterval(poll);
        resolve('closed');
    }, 400);
});

// Rotur only sends people back to MistWarp's own origins; mistwarp-api drops
// anything else.
const currentPage = () => {
    try {
        const url = new URL(window.location.href);
        url.hash = '';
        return url.href;
    } catch (_) {
        return '';
    }
};

const notPaid = () => paymentError('You didn\'t finish paying on Rotur.', {cancelled: true});

/**
 * Pays through a Rotur payment request.
 * @param {object} steps How to start and finish this payment.
 * @param {function(string): Promise<object>} steps.start Asks mistwarp-api for the
 *   intent, given the page to come back to: {key, requestId, approveUrl}, or
 *   {already: true} when nothing needs paying.
 * @param {function(object): Promise<object>} steps.confirm Asks mistwarp-api to
 *   finish; it answers 402 until Rotur says the request was paid.
 * @returns {Promise<{intent: object, result: (object|undefined)}>} The intent,
 *   and what confirm answered (nothing when there was nothing to pay).
 *   Throws an error with `cancelled` set if the person didn't pay.
 */
const payWithRotur = async ({start, confirm}) => {
    const popup = openPaymentWindow();
    let intent;
    try {
        intent = await start(currentPage());
    } catch (e) {
        popup.close();
        throw e;
    }
    if (!intent || intent.already || !intent.approveUrl) {
        popup.close();
        return {intent};
    }
    popup.location.href = intent.approveUrl;
    const status = await waitForDecision(popup, intent.requestId);
    if (status !== 'paid' && status !== 'closed') throw notPaid();
    // A closed window may still have paid, if Rotur couldn't tell this page.
    const tries = status === 'paid' ? CONFIRM_TRIES : 2;
    for (let attempt = 1; ; attempt++) {
        try {
            return {intent, result: await confirm(intent)};
        } catch (e) {
            if (e.status !== 402) throw e;
            if (attempt >= tries) throw status === 'paid' ? e : notPaid();
            await sleep(CONFIRM_DELAY);
        }
    }
};

const payLink = (username, {amount, note} = {}) => {
    const params = new URLSearchParams();
    if (amount) params.set('amount', String(amount));
    if (note) params.set('note', String(note).slice(0, 200));
    const query = params.toString();
    return `${ROTUR_ORIGIN}/pay/${encodeURIComponent(username)}${query ? `?${query}` : ''}`;
};

export {payLink, payWithRotur};
