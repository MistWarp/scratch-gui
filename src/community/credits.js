// Ko-fi credit top-up tiers (shared with the Rotur wallet). Buying sends the
// credits to the account instantly once the Ko-fi order is processed.
const PURCHASE_TIERS = [
    {credits: 50, price: 1.99, link: 'https://ko-fi.com/s/eebeb7269f'},
    {credits: 250, price: 4.99, link: 'https://ko-fi.com/s/0638cbfd65'},
    {credits: 500, price: 6.99, link: 'https://ko-fi.com/s/e0ce188c8f'}
];

// Detect an "insufficient funds" failure from a Rotur transfer error.
const isInsufficientFunds = error => {
    const message = String((error && error.message) || error || '').toLowerCase();
    return message.includes('insufficient') || message.includes('not enough') || message.includes('balance');
};

export {PURCHASE_TIERS, isInsufficientFunds};
