const aliases = {'zh-hans': 'zh-cn', 'zh-hant': 'zh-tw', 'zh-hk': 'zh-tw', 'zh': 'zh-cn', 'pt-pt': 'pt'};

// Preserve canonical spellings such as ja-Hira while accepting browser/URL variants.
const matchLocale = (value, supported) => {
    if (typeof value !== 'string') return null;
    const code = value.replace(/_/g, '-').toLowerCase();
    const canonical = new Map(supported.map(locale => [locale.toLowerCase(), locale]));
    if (canonical.has(code)) return canonical.get(code);
    if (aliases[code] && canonical.has(aliases[code])) return canonical.get(aliases[code]);
    return canonical.get(code.split('-')[0]) || null;
};

export default matchLocale;
