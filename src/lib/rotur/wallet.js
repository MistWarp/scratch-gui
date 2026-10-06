import {ensureScopes, getRotur} from './client.js';

const VIEW_SCOPE = 'credits:view';
const DAILY_SCOPE = 'credits:daily';
const DAY_MS = 24 * 60 * 60 * 1000;

const roundCredits = value => Math.round((Number(value) || 0) * 100) / 100;

const normalizeTransactions = transactions => {
    if (!Array.isArray(transactions)) return [];
    return transactions.reduce((list, transaction, index) => {
        if (!transaction || typeof transaction !== 'object') return list;
        const amount = roundCredits(transaction.amount);
        if (!amount) return list;
        const rawTime = Number(transaction.time || transaction.timestamp || 0);
        const time = rawTime > 0 && rawTime < 10000000000 ? rawTime * 1000 : rawTime;
        const incoming = transaction.type === 'in';
        list.push({
            id: `${transaction.type}-${rawTime}-${index}`,
            incoming,
            amount: Math.abs(amount),
            user: String(transaction.user || ''),
            note: String(transaction.note || ''),
            time: Number.isFinite(time) ? time : 0,
            total: Number.isFinite(Number(transaction.new_total)) ? roundCredits(transaction.new_total) : null
        });
        return list;
    }, []).sort((left, right) => right.time - left.time);
};

const getWallet = async () => {
    const rotur = getRotur();
    if (!rotur.loggedIn || !(await ensureScopes([VIEW_SCOPE]))) {
        return {allowed: false, balance: null, transactions: []};
    }
    const me = await rotur.me.get();
    if (!me || typeof me['sys.currency'] !== 'number') {
        return {allowed: false, balance: null, transactions: []};
    }
    return {
        allowed: true,
        balance: roundCredits(me['sys.currency']),
        transactions: normalizeTransactions(me['sys.transactions'])
    };
};

const allowWallet = () => ensureScopes([VIEW_SCOPE], {prompt: true});

const getDailyWait = async () => {
    const rotur = getRotur();
    if (!rotur.loggedIn || !(await ensureScopes([DAILY_SCOPE]))) return null;
    try {
        const result = await rotur.me.claimTime();
        return Math.max(0, Number(result && result.wait_time) || 0) * 1000;
    } catch (error) {
        if (error && error.status === 400) return 0;
        throw error;
    }
};

const claimDailyCredits = async () => {
    if (!(await ensureScopes([DAILY_SCOPE], {prompt: true}))) {
        return {claimed: false, denied: true};
    }
    try {
        await getRotur().me.claimDaily();
        return {claimed: true};
    } catch (error) {
        if (error && error.status === 429) {
            const wait = Number(error.data && error.data.wait_time);
            return {claimed: false, waitMs: Number.isFinite(wait) && wait > 0 ? wait * 1000 : DAY_MS};
        }
        throw error;
    }
};

export {
    normalizeTransactions,
    getWallet,
    allowWallet,
    getDailyWait,
    claimDailyCredits
};
