const STORAGE_KEY = 'mw:security-warnings';

const DEFAULTS = {
    disabled: false,
    loadExtension: true,
    fetch: true,
    openWindow: true,
    redirect: true,
    recordAudio: true,
    recordVideo: true,
    readClipboard: true,
    notify: true,
    geolocate: true,
    embed: true,
    download: true
};

const getSecurityWarningSettings = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return stored && typeof stored === 'object' ? {...DEFAULTS, ...stored} : {...DEFAULTS};
    } catch (e) {
        return {...DEFAULTS};
    }
};

const setSecurityWarningSetting = (key, value) => {
    const settings = {...getSecurityWarningSettings(), [key]: value};
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        // Keep working for this page even when storage is unavailable.
    }
    return settings;
};

const shouldWarn = key => getSecurityWarningSettings()[key] !== false;
const isSecurityManagerDisabled = () =>
    (typeof window !== 'undefined' && window.__mwAllowAllSecurity === true) ||
    getSecurityWarningSettings().disabled === true;

export {
    DEFAULTS,
    getSecurityWarningSettings,
    setSecurityWarningSetting,
    shouldWarn,
    isSecurityManagerDisabled
};
