import english from './en.json';

const loaders = {
    ca: () => import('./ca.json'),
    cs: () => import('./cs.json'),
    de: () => import('./de.json'),
    es: () => import('./es.json'),
    fi: () => import('./fi.json'),
    fr: () => import('./fr.json'),
    hu: () => import('./hu.json'),
    it: () => import('./it.json'),
    ja: () => import('./ja.json'),
    ko: () => import('./ko.json'),
    lt: () => import('./lt.json'),
    nb: () => import('./nb.json'),
    nl: () => import('./nl.json'),
    pl: () => import('./pl.json'),
    'pt-br': () => import('./pt-br.json'),
    pt: () => import('./pt.json'),
    ru: () => import('./ru.json'),
    sl: () => import('./sl.json'),
    sv: () => import('./sv.json'),
    tr: () => import('./tr.json'),
    uk: () => import('./uk.json'),
    'zh-cn': () => import('./zh-cn.json'),
    'zh-tw': () => import('./zh-tw.json')
};
const messages = {en: english};
const lookup = (dictionary, id) => id.split('.').reduce((value, key) => value && value[key], dictionary);

export const loadPackagerLocale = locale => {
    const key = String(locale || '').toLowerCase();
    if (messages[key] || !Object.prototype.hasOwnProperty.call(loaders, key)) return Promise.resolve();
    return loaders[key]().then(module => {
        messages[key] = module.default;
    });
};
export const getTranslator = locale => id => lookup(messages[locale.toLowerCase()], id) || lookup(messages.en, id) || id;
