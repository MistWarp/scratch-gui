import {addLocaleData} from 'react-intl';
import english from '@turbowarp/scratch-l10n/src/locale-data/en.js';
import {customLocales} from '@turbowarp/scratch-l10n/src/supported-locales.js';

const loaders = {
    af: () => import('@turbowarp/scratch-l10n/src/locale-data/af.js'),
    am: () => import('@turbowarp/scratch-l10n/src/locale-data/am.js'),
    ar: () => import('@turbowarp/scratch-l10n/src/locale-data/ar.js'),
    ast: () => import('@turbowarp/scratch-l10n/src/locale-data/ast.js'),
    az: () => import('@turbowarp/scratch-l10n/src/locale-data/az.js'),
    be: () => import('@turbowarp/scratch-l10n/src/locale-data/be.js'),
    bg: () => import('@turbowarp/scratch-l10n/src/locale-data/bg.js'),
    bn: () => import('@turbowarp/scratch-l10n/src/locale-data/bn.js'),
    ca: () => import('@turbowarp/scratch-l10n/src/locale-data/ca.js'),
    ckb: () => import('@turbowarp/scratch-l10n/src/locale-data/ckb.js'),
    cs: () => import('@turbowarp/scratch-l10n/src/locale-data/cs.js'),
    cy: () => import('@turbowarp/scratch-l10n/src/locale-data/cy.js'),
    da: () => import('@turbowarp/scratch-l10n/src/locale-data/da.js'),
    de: () => import('@turbowarp/scratch-l10n/src/locale-data/de.js'),
    el: () => import('@turbowarp/scratch-l10n/src/locale-data/el.js'),
    eo: () => import('@turbowarp/scratch-l10n/src/locale-data/eo.js'),
    es: () => import('@turbowarp/scratch-l10n/src/locale-data/es.js'),
    et: () => import('@turbowarp/scratch-l10n/src/locale-data/et.js'),
    eu: () => import('@turbowarp/scratch-l10n/src/locale-data/eu.js'),
    fa: () => import('@turbowarp/scratch-l10n/src/locale-data/fa.js'),
    fi: () => import('@turbowarp/scratch-l10n/src/locale-data/fi.js'),
    fil: () => import('@turbowarp/scratch-l10n/src/locale-data/fil.js'),
    fr: () => import('@turbowarp/scratch-l10n/src/locale-data/fr.js'),
    fy: () => import('@turbowarp/scratch-l10n/src/locale-data/fy.js'),
    ga: () => import('@turbowarp/scratch-l10n/src/locale-data/ga.js'),
    gd: () => import('@turbowarp/scratch-l10n/src/locale-data/gd.js'),
    gl: () => import('@turbowarp/scratch-l10n/src/locale-data/gl.js'),
    ha: () => import('@turbowarp/scratch-l10n/src/locale-data/ha.js'),
    he: () => import('@turbowarp/scratch-l10n/src/locale-data/he.js'),
    hi: () => import('@turbowarp/scratch-l10n/src/locale-data/hi.js'),
    hr: () => import('@turbowarp/scratch-l10n/src/locale-data/hr.js'),
    hu: () => import('@turbowarp/scratch-l10n/src/locale-data/hu.js'),
    hy: () => import('@turbowarp/scratch-l10n/src/locale-data/hy.js'),
    id: () => import('@turbowarp/scratch-l10n/src/locale-data/id.js'),
    is: () => import('@turbowarp/scratch-l10n/src/locale-data/is.js'),
    it: () => import('@turbowarp/scratch-l10n/src/locale-data/it.js'),
    ja: () => import('@turbowarp/scratch-l10n/src/locale-data/ja.js'),
    ka: () => import('@turbowarp/scratch-l10n/src/locale-data/ka.js'),
    kk: () => import('@turbowarp/scratch-l10n/src/locale-data/kk.js'),
    km: () => import('@turbowarp/scratch-l10n/src/locale-data/km.js'),
    ko: () => import('@turbowarp/scratch-l10n/src/locale-data/ko.js'),
    ku: () => import('@turbowarp/scratch-l10n/src/locale-data/ku.js'),
    lt: () => import('@turbowarp/scratch-l10n/src/locale-data/lt.js'),
    lv: () => import('@turbowarp/scratch-l10n/src/locale-data/lv.js'),
    mi: () => import('@turbowarp/scratch-l10n/src/locale-data/mi.js'),
    mn: () => import('@turbowarp/scratch-l10n/src/locale-data/mn.js'),
    nb: () => import('@turbowarp/scratch-l10n/src/locale-data/nb.js'),
    nl: () => import('@turbowarp/scratch-l10n/src/locale-data/nl.js'),
    nn: () => import('@turbowarp/scratch-l10n/src/locale-data/nn.js'),
    nso: () => import('@turbowarp/scratch-l10n/src/locale-data/nso.js'),
    or: () => import('@turbowarp/scratch-l10n/src/locale-data/or.js'),
    pl: () => import('@turbowarp/scratch-l10n/src/locale-data/pl.js'),
    pt: () => import('@turbowarp/scratch-l10n/src/locale-data/pt.js'),
    qu: () => import('@turbowarp/scratch-l10n/src/locale-data/qu.js'),
    ro: () => import('@turbowarp/scratch-l10n/src/locale-data/ro.js'),
    ru: () => import('@turbowarp/scratch-l10n/src/locale-data/ru.js'),
    sk: () => import('@turbowarp/scratch-l10n/src/locale-data/sk.js'),
    sl: () => import('@turbowarp/scratch-l10n/src/locale-data/sl.js'),
    sr: () => import('@turbowarp/scratch-l10n/src/locale-data/sr.js'),
    sv: () => import('@turbowarp/scratch-l10n/src/locale-data/sv.js'),
    sw: () => import('@turbowarp/scratch-l10n/src/locale-data/sw.js'),
    th: () => import('@turbowarp/scratch-l10n/src/locale-data/th.js'),
    tn: () => import('@turbowarp/scratch-l10n/src/locale-data/tn.js'),
    tr: () => import('@turbowarp/scratch-l10n/src/locale-data/tr.js'),
    uk: () => import('@turbowarp/scratch-l10n/src/locale-data/uk.js'),
    uz: () => import('@turbowarp/scratch-l10n/src/locale-data/uz.js'),
    vi: () => import('@turbowarp/scratch-l10n/src/locale-data/vi.js'),
    xh: () => import('@turbowarp/scratch-l10n/src/locale-data/xh.js'),
    zh: () => import('@turbowarp/scratch-l10n/src/locale-data/zh.js'),
    zu: () => import('@turbowarp/scratch-l10n/src/locale-data/zu.js')
};

addLocaleData(english);
addLocaleData(Object.values(customLocales));

const requests = new Map();

const loadData = name => {
    if (!requests.has(name)) {
        const request = loaders[name]().then(module => addLocaleData(module.default));
        request.catch(() => requests.delete(name));
        requests.set(name, request);
    }
    return requests.get(name);
};

const dataNamesFor = locale => {
    const code = String(locale || '').toLowerCase();
    const parent = customLocales[code]?.parentLocale;
    const names = [code, parent].filter(Boolean).map(name => name.split('-')[0]);
    return [...new Set(names)].filter(name => Object.prototype.hasOwnProperty.call(loaders, name));
};

export const loadIntlLocaleData = locale => Promise.all(dataNamesFor(locale).map(loadData)).then(() => {});
