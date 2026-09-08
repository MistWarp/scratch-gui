import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {addLocaleData, IntlProvider} from 'react-intl';
import {localeData} from '@turbowarp/scratch-l10n';
import IntlMessageFormat from 'intl-messageformat';
import english from '../generated/community-locales/fallbacks.json';
import {loaders} from '../generated/community-locales';
import {
    LANGUAGE_KEY, LEGACY_LANGUAGE_KEY, locales, matchLocale, readPreference, resolveLocale,
    setCommunityLocale, setCommunityFormatter
} from './locale';

addLocaleData(localeData);
export const LOCALES = [
    {value: 'auto', label: 'Use browser language'},
    ...Object.entries(locales).map(([value, info]) => ({value, label: info.name}))
];

const loaded = new Map([['en', english]]);
const pending = new Map();
export const loadCommunityLocale = locale => {
    if (loaded.has(locale)) return Promise.resolve(loaded.get(locale));
    if (!loaders[locale]) return Promise.resolve(english);
    if (!pending.has(locale)) {
        pending.set(locale, loaders[locale]().then(module => {
            loaded.set(locale, module.default);
            pending.delete(locale);
            return module.default;
        }).catch(error => {
            pending.delete(locale);
            throw error;
        }));
    }
    return pending.get(locale);
};

export const createTranslator = (locale, messages) => {
    const formats = new Map();
    return (key, values) => {
        const fallback = Object.prototype.hasOwnProperty.call(english, key) ? english[key] : key;
        const message = (Object.prototype.hasOwnProperty.call(messages, key) && messages[key]) || fallback;
        if (!values) return message;
        try {
            if (!formats.has(key)) formats.set(key, new IntlMessageFormat(message, locale));
            return formats.get(key).format(values);
        } catch (e) {
            try {
                return new IntlMessageFormat(fallback, 'en').format(values);
            } catch (ignored) {
                return fallback;
            }
        }
    };
};
const defaultTranslate = createTranslator('en', english);
const CommunityI18nContext = createContext({
    locale: 'en', preference: 'auto', setPreference: () => {}, t: defaultTranslate, text: defaultTranslate
});

export const CommunityIntlProvider = ({children}) => {
    const [preference, setPreferenceState] = useState(readPreference);
    const [search, setSearch] = useState(() => window.location.search);
    const query = new URLSearchParams(search);
    const urlPreference = matchLocale(query.get('locale') || query.get('lang'));
    const requested = resolveLocale(preference, search, navigator.languages || [navigator.language]);
    const [active, setActive] = useState(() => ({locale: 'en', messages: english}));
    const [loadError, setLoadError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let current = true;
        setLoadError(false);
        loadCommunityLocale(requested).then(messages => {
            if (!current) return;
            setCommunityLocale(requested);
            setCommunityFormatter(createTranslator(requested, messages));
            setActive({locale: requested, messages});
        }).catch(() => {
            if (current) setLoadError(true);
        });
        return () => {
            current = false;
        };
    }, [requested, attempt]);
    const setPreference = useCallback(value => {
        const next = value === 'auto' ? 'auto' : matchLocale(value) || 'auto';
        try {
            localStorage.setItem(LANGUAGE_KEY, next);
            localStorage.removeItem(LEGACY_LANGUAGE_KEY);
        } catch (e) { /* Keep the in-memory choice when storage is unavailable. */ }
        // An explicit choice replaces an earlier link's language override.
        const url = new URL(window.location.href);
        url.searchParams.delete('locale');
        url.searchParams.delete('lang');
        window.history.replaceState(window.history.state, '', url.href);
        setSearch(url.search);
        setPreferenceState(next);
    }, []);
    useEffect(() => {
        const sync = event => {
            if (!event || event.key === LANGUAGE_KEY || event.key === null) setPreferenceState(readPreference());
        };
        const onNavigate = () => setSearch(window.location.search);
        window.addEventListener('storage', sync);
        window.addEventListener('popstate', onNavigate);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener('popstate', onNavigate);
        };
    }, []);
    useEffect(() => {
        document.documentElement.lang = active.locale;
        document.documentElement.dir = locales[active.locale]?.rtl ? 'rtl' : 'ltr';
    }, [active.locale]);
    const value = useMemo(() => {
        const translate = createTranslator(active.locale, active.messages);
        return {
            locale: active.locale,
            preference: urlPreference || preference,
            setPreference,
            t: translate,
            text: translate,
            loading: requested !== active.locale && !loadError,
            loadError,
            retry: () => setAttempt(n => n + 1)
        };
    }, [active, preference, urlPreference, setPreference, requested, loadError]);
    return (
        <CommunityI18nContext.Provider value={value}>
            <IntlProvider locale={active.locale} messages={{...english, ...active.messages}}>
                {children}
            </IntlProvider>
        </CommunityI18nContext.Provider>
    );
};

export const useCommunityIntl = () => useContext(CommunityI18nContext);
