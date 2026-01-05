import addonL10nEntries from '../../addons/generated/l10n-entries';
import addonMessagesEn from '../../addons/addons-l10n/en.json';

export const loadAddonMessagesForLocale = async locale => {
    if (!locale) return addonMessagesEn;
    const loader = addonL10nEntries[locale];
    if (!loader) return addonMessagesEn;
    try {
        const mod = await loader();
        return mod.default || mod;
    } catch (e) {
        return addonMessagesEn;
    }
};

export const formatAddonMessage = (messages, key, args) => {
    const raw = messages[key] || addonMessagesEn[key] || '';
    if (!args) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name) => {
        if (Object.prototype.hasOwnProperty.call(args, name)) {
            return String(args[name]);
        }
        return `{${name}}`;
    });
};
