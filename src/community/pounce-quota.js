import {useEffect, useState} from 'react';
import rotur from './rotur.js';

const listeners = new Set();
let quota = null;
let owner = '';
let loading = null;

const emit = () => listeners.forEach(listener => listener(quota));

const setQuota = next => {
    quota = next && typeof next.left === 'number' ? {
        left: Math.max(0, Math.floor(next.left)),
        daily: typeof next.daily === 'number' ? next.daily : 3,
        resetsAt: Number(next.resets_at || next.resetsAt) || 0
    } : null;
    emit();
};

const expired = () => Boolean(quota && quota.resetsAt && Date.now() >= quota.resetsAt);

const loadPounceQuota = (username, {force = false} = {}) => {
    const key = String(username || '').toLowerCase();
    if (!key) {
        owner = '';
        setQuota(null);
        return Promise.resolve(null);
    }
    if (key !== owner) {
        owner = key;
        quota = null;
        loading = null;
    }
    if (loading && !force) return loading;
    if (quota && !force && !expired()) return Promise.resolve(quota);
    const request = rotur.pounceAllowance().then(data => {
        if (owner === key) setQuota(data);
        return quota;
    }, () => quota)
        .finally(() => {
            if (loading === request) loading = null;
        });
    loading = request;
    return request;
};

const setPouncesLeft = (left, resetsAt) => {
    if (typeof left !== 'number' || !Number.isFinite(left)) return;
    setQuota({left, daily: quota ? quota.daily : 3, resets_at: resetsAt || (quota && quota.resetsAt)});
};

const usePounceQuota = username => {
    const [value, setValue] = useState(quota);
    useEffect(() => {
        listeners.add(setValue);
        setValue(quota);
        if (username) loadPounceQuota(username);
        return () => {
            listeners.delete(setValue);
        };
    }, [username]);
    return username ? value : null;
};

const resetPounceQuota = () => {
    owner = '';
    quota = null;
    loading = null;
    emit();
};

export {loadPounceQuota, resetPounceQuota, setPouncesLeft, usePounceQuota};
