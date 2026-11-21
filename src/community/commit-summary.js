const DEFAULT_MESSAGES = new Set(['', 'initial version', 'updated project', 'save project', 'untitled commit']);

export const SUMMARY_BATCH = 50;
export const SUMMARY_LIMIT = 100;

export const commitSubject = message => String(message || '').split('\n')[0].trim();

export const isDefaultCommitMessage = message => DEFAULT_MESSAGES.has(commitSubject(message).toLowerCase());

const formatList = (names, locale) => {
    try {
        return new Intl.ListFormat(locale ? [locale] : [], {style: 'long', type: 'conjunction'}).format(names);
    } catch {
        return names.join(', ');
    }
};

export const summaryPlace = (summary, text, locale) => {
    const names = Array.isArray(summary?.sprites) ? summary.sprites.filter(Boolean) : [];
    const count = Math.max(Number(summary?.spriteCount) || 0, names.length);
    if (!count) return '';
    if (count <= 3 && names.length === count) return formatList(names, locale);
    return text('{value1} sprites', {value1: count});
};

const sum = values => values.reduce((total, value) => total + (Number(value) || 0), 0);

export const commitSummarySentence = (summary, text, locale) => {
    if (!summary || summary.ok === false || summary.legacy) return '';
    const totals = summary.totals || {};
    const scripts = totals.scripts || {};
    const assets = totals.assets || {};
    const scriptCount = sum([scripts.added, scripts.removed, scripts.changed, scripts.moved]);
    const assetCount = sum([assets.added, assets.removed, assets.modified]);
    const files = Number(summary.authoredFiles) || 0;
    const place = summaryPlace(summary, text, locale);
    if (scriptCount && place) {
        if (scriptCount === Number(scripts.added)) {
            return scriptCount === 1 ?
                text('Added 1 script in {value1}', {value1: place}) :
                text('Added {value1} scripts in {value2}', {value1: scriptCount, value2: place});
        }
        if (scriptCount === Number(scripts.removed)) {
            return scriptCount === 1 ?
                text('Removed 1 script in {value1}', {value1: place}) :
                text('Removed {value1} scripts in {value2}', {value1: scriptCount, value2: place});
        }
        return scriptCount === 1 ?
            text('Changed 1 script in {value1}', {value1: place}) :
            text('Changed {value1} scripts in {value2}', {value1: scriptCount, value2: place});
    }
    if (assetCount && place) {
        return assetCount === 1 ?
            text('Changed 1 costume or sound in {value1}', {value1: place}) :
            text('Changed {value1} costumes and sounds in {value2}', {value1: assetCount, value2: place});
    }
    if (assetCount) {
        return assetCount === 1 ?
            text('Changed 1 asset file') :
            text('Changed {value1} asset files', {value1: assetCount});
    }
    if (Number(totals.items) && place) {
        return text('Changed variables, lists or settings in {value1}', {value1: place});
    }
    if (summary.tooLarge && place) {
        return text('Changed {value1}, too large to summarize', {value1: place});
    }
    if (files) {
        return files === 1 ?
            text('Changed 1 project file') :
            text('Changed {value1} project files', {value1: files});
    }
    if (totals.stateOnly || Number(totals.state)) return text('Only saved state changed');
    return text('No changes to how the project runs');
};

export const commitHeadline = (message, summary, text, locale) => {
    const subject = commitSubject(message);
    const sentence = commitSummarySentence(summary, text, locale);
    if (isDefaultCommitMessage(subject) && sentence) return {title: sentence, detail: ''};
    return {title: subject || text('Untitled commit'), detail: sentence};
};

export const pendingSummaryShas = (shas, known, limit = SUMMARY_LIMIT) => {
    const seen = new Set();
    const pending = [];
    for (const sha of shas.slice(0, limit)) {
        if (!/^[a-f0-9]{40}$/.test(String(sha)) || seen.has(sha) || known.has(sha)) continue;
        seen.add(sha);
        pending.push(sha);
    }
    return pending;
};

export const chunk = (values, size = SUMMARY_BATCH) => {
    const chunks = [];
    for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
    return chunks;
};
