const OURS_RE = /^<{7}(?: (.*))?$/;
const BASE_RE = /^\|{7}/;
const SEPARATOR_RE = /^={7}$/;
const THEIRS_RE = /^>{7}(?: (.*))?$/;

/**
 * Find every conflict region in a text with git conflict markers.
 * Line numbers are 1-based to line up with Monaco.
 * @param {string} text file contents
 * @returns {Array<object>} regions with marker line numbers and both sides' text
 */
const parseConflicts = text => {
    const lines = String(text).split('\n');
    const regions = [];
    let current = null;
    let section = null;

    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        if (OURS_RE.test(line)) {
            current = {
                base: [],
                baseLine: 0,
                endLine: 0,
                ours: [],
                oursLabel: (line.match(OURS_RE)[1] || 'current').trim(),
                separatorLine: 0,
                startLine: lineNumber,
                theirs: [],
                theirsLabel: 'incoming'
            };
            section = 'ours';
            return;
        }
        if (!current) return;
        if (BASE_RE.test(line)) {
            current.baseLine = lineNumber;
            section = 'base';
            return;
        }
        if (SEPARATOR_RE.test(line)) {
            current.separatorLine = lineNumber;
            section = 'theirs';
            return;
        }
        if (THEIRS_RE.test(line)) {
            current.endLine = lineNumber;
            current.theirsLabel = (line.match(THEIRS_RE)[1] || 'incoming').trim();
            regions.push(current);
            current = null;
            section = null;
            return;
        }
        if (section) current[section].push(line);
    });

    return regions.filter(region => region.endLine > region.startLine);
};

/**
 * @param {object} region a region from parseConflicts
 * @param {string} choice one of ours, theirs, both
 * @returns {string} the text the whole region should be replaced with
 */
const resolutionText = (region, choice) => {
    if (choice === 'ours') return region.ours.join('\n');
    if (choice === 'theirs') return region.theirs.join('\n');
    return [...region.ours, ...region.theirs].join('\n');
};

export {
    parseConflicts,
    resolutionText
};
