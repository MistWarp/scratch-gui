import matchLocale from './match-locale';
import {local} from '../../modules/storage';

export const LANGUAGE_KEY = 'tw:language';

const detectLocale = supportedLocales => {
    const query = new URLSearchParams(location.search);
    for (const value of [...query.getAll('locale'), ...query.getAll('lang')]) {
        const match = matchLocale(value, supportedLocales);
        if (match) return match;
    }
    const storedMatch = matchLocale(local.readString(LANGUAGE_KEY), supportedLocales);
    if (storedMatch) return storedMatch;
    const browser = window.navigator;
    // navigator.language is the primary choice. The remaining preferences provide fallbacks.
    for (const language of [browser.userLanguage || browser.language, ...(browser.languages || [])]) {
        const match = matchLocale(language, supportedLocales);
        if (match) return match;
    }
    return 'en';
};

export {detectLocale};
