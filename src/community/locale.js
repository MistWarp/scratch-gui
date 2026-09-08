import locales from '../generated/community-locales/locales.json';
import matchSupportedLocale from '../lib/utils/match-locale';

export const LANGUAGE_KEY = 'tw:language';
export const LEGACY_LANGUAGE_KEY = 'mw:community-locale';
export {locales};
export const matchLocale = value => matchSupportedLocale(value, Object.keys(locales));

export const readPreference = () => {
    try {
        const shared = localStorage.getItem(LANGUAGE_KEY);
        if (shared === 'auto') return 'auto';
        if (matchLocale(shared)) return matchLocale(shared);
        return matchLocale(localStorage.getItem(LEGACY_LANGUAGE_KEY)) || 'auto';
    } catch (e) {
        return 'auto';
    }
};

export const resolveLocale = (preference, search = '', browserLanguages = ['en']) => {
    const params = new URLSearchParams(search);
    for (const requested of [...params.getAll('locale'), ...params.getAll('lang')]) {
        const match = matchLocale(requested);
        if (match) return match;
    }
    if (preference !== 'auto' && matchLocale(preference)) return matchLocale(preference);
    for (const language of browserLanguages) {
        const match = matchLocale(language);
        if (match) return match;
    }
    return 'en';
};

let activeLocale = 'en';
export const getCommunityLocale = () => activeLocale;
export const setCommunityLocale = locale => {
    activeLocale = locale;
};

let activeFormatter = (source, values = {}) => source.replace(/\{(\w+)\}/g,
    (match, name) => (Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match));
export const setCommunityFormatter = formatter => {
    activeFormatter = formatter;
};
export const formatCommunityMessage = (source, values) => activeFormatter(source, values);
