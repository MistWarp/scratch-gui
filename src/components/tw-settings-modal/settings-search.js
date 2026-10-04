// Lowercase and drop accents so "theme", "Thème" and "THEME" all match each other.
const normalizeSearchText = text => String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase();

const getSearchTerms = query => normalizeSearchText(query)
    .split(/\s+/)
    .filter(Boolean);

/**
 * Find the settings pages that match a search query.
 * Every word of the query must appear in the page's label, keywords or setting text.
 * Pages whose label matches come first, otherwise the sidebar order is kept.
 * @param {Array<{id: string, label: string, keywords: (string|undefined)}>} pages Pages in sidebar order.
 * @param {string} query What the user typed.
 * @param {object} [pageText] Extra searchable text for each page id, such as setting labels.
 * @returns {Array<object>} The matching pages.
 */
const searchSettingsPages = (pages, query, pageText = {}) => {
    const terms = getSearchTerms(query);
    if (terms.length === 0) return [];
    const labelMatches = [];
    const otherMatches = [];
    for (const page of pages) {
        const label = normalizeSearchText(page.label);
        const haystack = normalizeSearchText([
            page.label,
            page.keywords,
            ...(pageText[page.id] || [])
        ].join(' '));
        if (!terms.every(term => haystack.includes(term))) continue;
        if (terms.every(term => label.includes(term))) {
            labelMatches.push(page);
        } else {
            otherMatches.push(page);
        }
    }
    return labelMatches.concat(otherMatches);
};

export {
    normalizeSearchText,
    searchSettingsPages
};
