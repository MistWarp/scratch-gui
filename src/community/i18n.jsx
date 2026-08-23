/* eslint-disable max-len */
import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {IntlProvider} from 'react-intl';

const LOCALE_KEY = 'mw:community-locale';
export const LOCALES = [
    {value: 'auto', label: 'Use browser language'},
    {value: 'en', label: 'English'},
    {value: 'es', label: 'Español'}
];

const messages = {
    en: {
        'a11y.skip': 'Skip to content',
        'nav.main': 'Main navigation',
        'nav.create': 'Create',
        'nav.explore': 'Explore',
        'nav.spaces': 'Spaces',
        'nav.search': 'Search projects, people, and spaces',
        'home.title': 'Make a project. Let someone improve it.',
        'home.lead': 'MistWarp brings branches, project history, and contributions to visual coding without making you learn Git first.',
        'home.start': 'Start creating',
        'home.explore': 'Explore projects',
        'home.signin': 'Sign in with Rotur',
        'home.github': 'Follow on GitHub',
        'status.title': 'Service status',
        'status.lead': 'Checks run outside the main MistWarp deployment every five minutes.',
        'status.retry': 'Check again',
        'status.loading': 'Loading independent status data…',
        'status.failed': 'Independent status data is unavailable.',
        'status.operational': 'Operational',
        'status.degraded': 'Degraded',
        'status.unavailable': 'Unavailable',
        'status.unknown': 'No data',
        'status.incidents': 'Incident history',
        'status.noIncidents': 'No incidents have been reported.',
        'status.history': 'Seven-day uptime',
        'settings.language': 'Language',
        'settings.languageHelp': 'Changes the language used by the MistWarp community site. More pages will move into this translation system as their copy changes.',
        'settings.analytics': 'Anonymous product analytics',
        'settings.analyticsHelp': 'Records six creation milestones for 31 days. MistWarp does not send usernames, project IDs, page URLs, IP addresses, or browser details.'
    },
    es: {
        'a11y.skip': 'Saltar al contenido',
        'nav.main': 'Navegación principal',
        'nav.create': 'Crear',
        'nav.explore': 'Explorar',
        'nav.spaces': 'Espacios',
        'nav.search': 'Buscar proyectos, personas y espacios',
        'home.title': 'Crea un proyecto. Deja que alguien lo mejore.',
        'home.lead': 'MistWarp añade ramas, historial y contribuciones a la programación visual sin obligarte a aprender Git primero.',
        'home.start': 'Empezar a crear',
        'home.explore': 'Explorar proyectos',
        'home.signin': 'Iniciar sesión con Rotur',
        'home.github': 'Seguir en GitHub',
        'status.title': 'Estado del servicio',
        'status.lead': 'Las comprobaciones se ejecutan fuera del despliegue principal de MistWarp cada cinco minutos.',
        'status.retry': 'Comprobar de nuevo',
        'status.loading': 'Cargando datos de estado independientes…',
        'status.failed': 'Los datos de estado independientes no están disponibles.',
        'status.operational': 'Operativo',
        'status.degraded': 'Rendimiento reducido',
        'status.unavailable': 'No disponible',
        'status.unknown': 'Sin datos',
        'status.incidents': 'Historial de incidentes',
        'status.noIncidents': 'No se han comunicado incidentes.',
        'status.history': 'Disponibilidad de siete días',
        'settings.language': 'Idioma',
        'settings.languageHelp': 'Cambia el idioma del sitio de la comunidad de MistWarp. Más páginas usarán este sistema a medida que cambie su texto.',
        'settings.analytics': 'Análisis anónimo del producto',
        'settings.analyticsHelp': 'Registra seis hitos de creación durante 31 días. MistWarp no envía nombres de usuario, identificadores de proyecto, URLs, direcciones IP ni datos del navegador.'
    }
};

const getPreference = () => {
    try {
        return localStorage.getItem(LOCALE_KEY) || 'auto';
    } catch (e) {
        return 'auto';
    }
};

const resolveLocale = preference => {
    if (preference !== 'auto') return messages[preference] ? preference : 'en';
    const browserLocale = typeof navigator === 'undefined' ? 'en' : navigator.language.toLowerCase().split('-')[0];
    return messages[browserLocale] ? browserLocale : 'en';
};

const CommunityI18nContext = createContext({locale: 'en', preference: 'auto', setPreference: () => {}, t: key => messages.en[key] || key});

export const CommunityIntlProvider = ({children}) => {
    const [preference, setPreferenceState] = useState(getPreference);
    const locale = resolveLocale(preference);
    const setPreference = value => {
        const next = LOCALES.some(option => option.value === value) ? value : 'auto';
        try {
            localStorage.setItem(LOCALE_KEY, next);
        } catch (e) {
            // keep the in-memory setting when storage is unavailable
        }
        setPreferenceState(next);
    };
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);
    const value = useMemo(() => ({
        locale,
        preference,
        setPreference,
        t: key => messages[locale][key] || messages.en[key] || key
    }), [locale, preference]);
    return <CommunityI18nContext.Provider value={value}><IntlProvider locale={locale} messages={messages[locale]}>{children}</IntlProvider></CommunityI18nContext.Provider>;
};

export const useCommunityIntl = () => useContext(CommunityI18nContext);
