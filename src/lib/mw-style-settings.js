import turbowarpCss from '!css-loader!./mw-styles/turbowarp-tabs.css';
import scratchboxCss from '!css-loader!./mw-styles/scratchbox-tabs.css';
import iconOnlyCss from '!css-loader!./mw-styles/icon-only-tabs.css';
import textOnlyCss from '!css-loader!./mw-styles/text-only-tabs.css';
import macosCss from '!css-loader!./mw-styles/macos-windows.css';
import windows10Css from '!css-loader!./mw-styles/windows10-windows.css';

const STYLE_GROUPS = [
    {
        id: 'tab-style',
        defaultValue: 'mistwarp',
        options: [
            {value: 'mistwarp', css: null},
            {value: 'turbowarp', css: String(turbowarpCss)},
            {value: 'scratchbox', css: String(scratchboxCss)}
        ]
    },
    {
        id: 'tab-looks',
        defaultValue: 'default',
        options: [
            {value: 'default', css: null},
            {value: 'icon-only', css: String(iconOnlyCss)},
            {value: 'text-only', css: String(textOnlyCss)}
        ]
    },
    {
        id: 'window-style',
        defaultValue: 'mistwarp',
        options: [
            {value: 'mistwarp', css: null},
            {value: 'macos', css: String(macosCss)},
            {value: 'windows10', css: String(windows10Css)}
        ]
    }
];

const findGroup = id => STYLE_GROUPS.find(g => g.id === id);

const storageKey = id => `mw:style-${id}`;

const isValidValue = (group, value) => group.options.some(option => option.value === value);

const getStyleSetting = id => {
    const group = findGroup(id);
    if (!group) return null;
    try {
        const stored = localStorage.getItem(storageKey(id));
        if (stored && isValidValue(group, stored)) {
            return stored;
        }
    } catch (err) {
        // ignore
    }
    return group.defaultValue;
};

const elementId = id => `mw-style-${id}`;

const applyStyleSetting = (id, value) => {
    const group = findGroup(id);
    if (!group) return;
    const existing = document.getElementById(elementId(id));
    if (existing) existing.remove();
    const option = group.options.find(o => o.value === value);
    if (option && option.css) {
        const style = document.createElement('style');
        style.id = elementId(id);
        style.textContent = option.css;
        document.body.appendChild(style);
    }
};

const setStyleSetting = (id, value) => {
    const group = findGroup(id);
    if (!group || !isValidValue(group, value)) return;
    try {
        localStorage.setItem(storageKey(id), value);
    } catch (err) {
        // ignore
    }
    applyStyleSetting(id, value);
};

const getStyleSettings = () => Object.fromEntries(
    STYLE_GROUPS.map(group => [group.id, getStyleSetting(group.id)])
);

const getStoredStyleSettings = () => {
    try {
        if (!STYLE_GROUPS.some(group => localStorage.getItem(storageKey(group.id)) !== null)) return null;
    } catch (err) {
        return null;
    }
    return getStyleSettings();
};

const applyStyleSettings = settings => {
    for (const group of STYLE_GROUPS) {
        const value = settings && isValidValue(group, settings[group.id]) ?
            settings[group.id] : group.defaultValue;
        try {
            if (settings) localStorage.setItem(storageKey(group.id), value);
            else localStorage.removeItem(storageKey(group.id));
        } catch (err) {
            // ignore
        }
        applyStyleSetting(group.id, value);
    }
};

const initStyleSettings = () => {
    for (const group of STYLE_GROUPS) {
        applyStyleSetting(group.id, getStyleSetting(group.id));
    }
};

export {
    STYLE_GROUPS,
    getStyleSetting,
    getStyleSettings,
    getStoredStyleSettings,
    setStyleSetting,
    applyStyleSetting,
    applyStyleSettings,
    initStyleSettings
};
