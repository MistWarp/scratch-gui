import {useEffect, useState} from 'react';
import {request} from '../lib/community/api.js';
import {useUser} from './UserContext.jsx';

const CACHE_TIME = 5 * 60 * 1000;

const results = new Map();

const askApi = async () => {
    try {
        const response = await request('/classroom/available', {raw: true, cache: false});
        if (!response || response.status !== 200) return false;
        const data = await response.json().catch(() => null);
        return Boolean(data && data.available === true);
    } catch (e) {
        return false;
    }
};

const cachedAvailability = key => {
    const entry = results.get(key);
    if (!entry || typeof entry.value !== 'boolean' || Date.now() - entry.at > CACHE_TIME) return null;
    return entry.value;
};

const probeClassroom = key => {
    const entry = results.get(key);
    if (entry && entry.pending) return entry.pending;
    const known = cachedAvailability(key);
    if (known !== null) return Promise.resolve(known);
    const pending = askApi().then(value => {
        results.set(key, {value, at: Date.now()});
        return value;
    });
    results.set(key, {pending});
    return pending;
};

const forgetClassroomAvailability = () => {
    results.clear();
};

const useClassroomAvailable = () => {
    const {user, loading} = useUser();
    const key = loading ? null : String((user && user.username) || '');
    const [state, setState] = useState(() => {
        const value = key === null ? null : cachedAvailability(key);
        return value === null ? null : {key, value};
    });
    useEffect(() => {
        if (key === null) return;
        let active = true;
        probeClassroom(key).then(value => {
            if (active) setState({key, value});
        });
        return () => {
            active = false;
        };
    }, [key]);
    const current = state && state.key === key ? state : null;
    return {checked: Boolean(current), available: Boolean(current && current.value)};
};

export {
    forgetClassroomAvailability,
    probeClassroom,
    useClassroomAvailable
};
