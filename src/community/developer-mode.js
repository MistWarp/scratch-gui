import {useEffect, useState} from 'react';
import {local} from '../modules/storage';

export const DEVELOPER_MODE_KEY = 'mw:developer-view';
const CHANGE_EVENT = 'mw:developer-view-change';
const DEVELOPER_TABS = {
    '': '',
    '#files': '',
    '#history': '/commits',
    '#branches': '/branches',
    '#pull-requests': '/pulls',
    '#releases': '/releases'
};

let fallback = null;

export const isDeveloperMode = () => {
    const stored = local.readString(DEVELOPER_MODE_KEY);
    if (stored === '1' || stored === '0') return stored === '1';
    return fallback === true;
};

export const setDeveloperMode = on => {
    fallback = Boolean(on);
    if (!local.writeString(DEVELOPER_MODE_KEY, on ? '1' : '0')) local.remove(DEVELOPER_MODE_KEY);
    try {
        window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch (e) {
        return;
    }
};

export const developerViewPath = hash => {
    const key = hash || '';
    if (/^#comment-id-./.test(key)) return '/comments';
    return Object.prototype.hasOwnProperty.call(DEVELOPER_TABS, key) ? DEVELOPER_TABS[key] : null;
};

export const plainClick = event => !event || (
    (event.button === 0 || typeof event.button === 'undefined') &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.defaultPrevented
);

export const useDeveloperMode = () => {
    const [on, setOn] = useState(isDeveloperMode);
    useEffect(() => {
        const sync = () => setOn(isDeveloperMode());
        const onStorage = event => {
            if (!event.key || event.key === DEVELOPER_MODE_KEY) sync();
        };
        window.addEventListener(CHANGE_EVENT, sync);
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener(CHANGE_EVENT, sync);
            window.removeEventListener('storage', onStorage);
        };
    }, []);
    return [on, setDeveloperMode];
};
