const matchScore = (text, query) => {
    const value = String(text || '').toLowerCase().trim();
    const needle = String(query || '').toLowerCase().trim();
    if (!value || !needle) return 0;
    if (value === needle) return 4;
    if (value.startsWith(needle)) return 3;
    if ([' ', '-', '_'].some(separator => value.includes(separator + needle))) return 2;
    if (value.includes(needle)) return 1;
    return 0;
};

const bestMatchScore = (values, query) => values.reduce(
    (best, value) => Math.max(best, matchScore(value, query)),
    0
);

const rankSections = (sections, query) => sections
    .map((section, index) => ({section, index, score: bestMatchScore(section.match || [], query)}))
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map(entry => entry.section);

export {bestMatchScore, rankSections};
export default matchScore;
