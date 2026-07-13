import {getMenuBarLayout, applyMenuBarLayout} from '../mw-menu-bar-layout.js';
import {getStoredStyleSettings, applyStyleSettings} from '../mw-style-settings.js';

// New theme-aware visual settings only need one entry here.
const MODULES = [
    {id: 'menuBarLayout', read: getMenuBarLayout, apply: applyMenuBarLayout},
    {id: 'styles', read: getStoredStyleSettings, apply: applyStyleSettings}
];

const captureStoredAppearance = () => MODULES.reduce((appearance, module) => {
    const value = module.read();
    if (value !== null) appearance[module.id] = value;
    return appearance;
}, {});

const mergeStoredAppearance = appearance => ({
    ...captureStoredAppearance(),
    ...(appearance || {})
});

const applyAppearance = appearance => {
    for (const module of MODULES) module.apply((appearance || {})[module.id] || null);
};

export {
    captureStoredAppearance,
    mergeStoredAppearance,
    applyAppearance
};
