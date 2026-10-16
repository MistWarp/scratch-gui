const REGION_ATTRIBUTE = 'data-mw-region';
const ASSET_REGION = 'asset';

let region = null;
let installedOn = null;

const regionOf = target => {
    if (!target || typeof target.closest !== 'function') return null;
    const host = target.closest(`[${REGION_ATTRIBUTE}]`);
    return host ? host.getAttribute(REGION_ATTRIBUTE) : null;
};

const record = event => {
    region = regionOf(event.target);
};

const getKeyRegion = () => region;

const setKeyRegion = next => {
    region = next || null;
};

const isAssetEditorActive = () => region === ASSET_REGION;

const installKeyScope = doc => {
    const root = doc || (typeof document === 'undefined' ? null : document);
    if (!root || installedOn === root) return () => {};
    if (installedOn) installedOn.removeEventListener('pointerdown', record, true);
    if (installedOn) installedOn.removeEventListener('focusin', record, true);
    installedOn = root;
    root.addEventListener('pointerdown', record, true);
    root.addEventListener('focusin', record, true);
    return () => {
        root.removeEventListener('pointerdown', record, true);
        root.removeEventListener('focusin', record, true);
        if (installedOn === root) installedOn = null;
        region = null;
    };
};

export {
    ASSET_REGION,
    REGION_ATTRIBUTE,
    getKeyRegion,
    installKeyScope,
    isAssetEditorActive,
    regionOf,
    setKeyRegion
};
