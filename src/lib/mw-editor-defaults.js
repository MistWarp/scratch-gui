const DISABLE_COMPILER_KEY = 'mw:disable-compiler';
const DISABLE_CLOUD_VARIABLES_KEY = 'mw:disable-cloud-variables';
const LEGACY_ADDON_SETTINGS_KEY = 'tw:addons';

const LEGACY_ADDON_IDS = {
    [DISABLE_COMPILER_KEY]: 'tw-disable-compiler',
    [DISABLE_CLOUD_VARIABLES_KEY]: 'tw-disable-cloud-variables'
};

const readLegacyAddonEnabled = addonId => {
    try {
        const raw = localStorage.getItem(LEGACY_ADDON_SETTINGS_KEY);
        if (!raw) {
            return false;
        }
        const parsed = JSON.parse(raw);
        const entry = parsed && parsed[addonId];
        return !!(entry && entry.enabled);
    } catch (err) {
        return false;
    }
};

const readSetting = key => {
    try {
        const stored = localStorage.getItem(key);
        if (stored !== null && typeof stored !== 'undefined') {
            return stored === 'true';
        }
        const legacy = readLegacyAddonEnabled(LEGACY_ADDON_IDS[key]);
        if (legacy) {
            localStorage.setItem(key, 'true');
        }
        return legacy;
    } catch (err) {
        return false;
    }
};

const writeSetting = (key, value) => {
    try {
        localStorage.setItem(key, value ? 'true' : 'false');
    } catch (err) {
        // ignore
    }
};

const getDisableCompiler = () => readSetting(DISABLE_COMPILER_KEY);
const setDisableCompiler = value => writeSetting(DISABLE_COMPILER_KEY, value);
const getDisableCloudVariables = () => readSetting(DISABLE_CLOUD_VARIABLES_KEY);
const setDisableCloudVariables = value => writeSetting(DISABLE_CLOUD_VARIABLES_KEY, value);

export {
    getDisableCompiler,
    setDisableCompiler,
    getDisableCloudVariables,
    setDisableCloudVariables
};
