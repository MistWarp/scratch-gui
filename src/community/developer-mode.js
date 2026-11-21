import {useEffect, useState} from 'react';
import {local} from '../modules/storage';

export const DEVELOPER_MODE_KEY = 'mw:developer-view';
const CHANGE_EVENT = 'mw:developer-view-change';

export const isDeveloperMode = () => local.readString(DEVELOPER_MODE_KEY) === '1';

export const setDeveloperMode = on => {
    local.writeString(DEVELOPER_MODE_KEY, on ? '1' : '0');
    try {
        window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch (e) {
        return;
    }
};

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
