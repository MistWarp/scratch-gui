import matchLocale from './match-locale';

export const LANGUAGE_KEY = 'tw:language';

const detectLocale = supportedLocales => {
    const query = new URLSearchParams(location.search);
    for (const value of [...query.getAll('locale'), ...query.getAll('lang')]) {
        const match = matchLocale(value, supportedLocales);
        if (match) return match;
    }
    try {
        const match = matchLocale(localStorage.getItem(LANGUAGE_KEY), supportedLocales);
        if (match) return match;
    } catch (e) { /* Browser language still works when storage is unavailable. */ }
    const browser = window.navigator;
    // navigator.language is the primary choice. The remaining preferences provide fallbacks.
    for (const language of [browser.userLanguage || browser.language, ...(browser.languages || [])]) {
        const match = matchLocale(language, supportedLocales);
        if (match) return match;
    }
    return 'en';
};

export {detectLocale};
