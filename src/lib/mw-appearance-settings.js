const APPEARANCE_SETTINGS = [
    {
        id: 'square-stage-corners',
        css: '[class*="stage_stage"],[class*="stage_green-flag-overlay-wrapper"]{border-radius:0 !important;}'
    },
    {
        id: 'hide-delete-button',
        css: '[data-tabs] > :nth-child(3) div[class*="delete-button_delete-button_"],' +
            '[data-tabs] > :nth-child(4) div[class*="delete-button_delete-button_"],' +
            'div[class*="sprite-selector_sprite-wrapper_"] div[class*="delete-button_delete-button_"]{display:none;}'
    },
    {
        id: 'hide-extension-button',
        css: '[class*="extension-button-container"]{display:none !important;}'
    },
    {
        id: 'hide-backpack',
        css: '[class^="backpack_backpack-container"]{display:none;}'
    },
    {
        id: 'unclip-palette',
        default: true,
        css: '.injectionDiv:has(> .blocklyToolboxDiv:hover, > svg.blocklyFlyout:not(.sa-flyoutClose):hover)' +
            ' > svg.blocklyFlyout:not(.sa-flyoutClose){overflow:visible;}' +
            '.injectionDiv:has(> .blocklyToolboxDiv:hover, > svg.blocklyFlyout:not(.sa-flyoutClose):hover)' +
            ' #blocklyBlockMenuClipRect{width:100000px;}'
    }
];

const storageKey = id => `mw:${id}`;

const defaultValue = id => {
    const setting = APPEARANCE_SETTINGS.find(s => s.id === id);
    return !!(setting && setting.default);
};

const getAppearanceSetting = id => {
    try {
        const stored = localStorage.getItem(storageKey(id));
        return stored === null ? defaultValue(id) : stored === 'true';
    } catch (err) {
        return defaultValue(id);
    }
};

const elementId = id => `mw-appearance-${id}`;

const applyAppearanceSetting = (id, enabled) => {
    const setting = APPEARANCE_SETTINGS.find(s => s.id === id);
    if (!setting) return;
    const existing = document.getElementById(elementId(id));
    if (enabled) {
        if (existing) return;
        const style = document.createElement('style');
        style.id = elementId(id);
        style.textContent = setting.css;
        document.head.appendChild(style);
    } else if (existing) {
        existing.remove();
    }
};

const setAppearanceSetting = (id, enabled) => {
    try {
        localStorage.setItem(storageKey(id), enabled);
    } catch (err) {
        // ignore
    }
    applyAppearanceSetting(id, enabled);
};

const initAppearanceSettings = () => {
    for (const setting of APPEARANCE_SETTINGS) {
        applyAppearanceSetting(setting.id, getAppearanceSetting(setting.id));
    }
};

export {
    APPEARANCE_SETTINGS,
    getAppearanceSetting,
    setAppearanceSetting,
    applyAppearanceSetting,
    initAppearanceSettings
};
