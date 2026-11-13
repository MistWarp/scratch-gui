import addonL10nEntries from '../../addons/generated/l10n-entries';
import addonMessagesEn from '../../addons/addons-l10n/en.json';
import loadAddonTranslations from '../../addons/translations';

export const loadAddonMessagesForLocale = async locale => ({
    ...addonMessagesEn,
    ...await loadAddonTranslations(addonL10nEntries, locale)
});

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
