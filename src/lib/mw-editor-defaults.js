import {isLegacyAddonEnabled, local} from '../modules/storage';

const DISABLE_COMPILER_KEY = 'mw:disable-compiler';
const DISABLE_CLOUD_VARIABLES_KEY = 'mw:disable-cloud-variables';

const LEGACY_ADDON_IDS = {
    [DISABLE_COMPILER_KEY]: 'tw-disable-compiler',
    [DISABLE_CLOUD_VARIABLES_KEY]: 'tw-disable-cloud-variables'
};

const readSetting = key => {
    const stored = local.readString(key);
    if (stored !== null) {
        return stored === 'true';
    }
    const legacy = isLegacyAddonEnabled(LEGACY_ADDON_IDS[key]);
    if (legacy) {
        local.writeBoolean(key, true);
    }
    return legacy;
};

const writeSetting = (key, value) => {
    local.writeBoolean(key, Boolean(value));
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
