export const hasRemixDivergence = remixFrom => Boolean(
    remixFrom && typeof remixFrom.ahead === 'number' && typeof remixFrom.behind === 'number'
);

export const canShowForkStatus = (remixFrom, canSync = false, gitHead = '') => Boolean(
    hasRemixDivergence(remixFrom) ||
    (canSync && remixFrom && remixFrom.head && gitHead && remixFrom.head !== gitHead)
);

export const remixParentLabel = remixFrom => {
    if (!remixFrom) return '';
    const owner = String(remixFrom.owner || '').trim();
    const title = String(remixFrom.title || '').trim();
    if (owner && title) return `${owner} / ${title}`;
    return title || owner;
};

export const remixDivergenceSentence = (remixFrom, text) => {
    if (!remixFrom) return '';
    const parent = remixParentLabel(remixFrom);
    if (!hasRemixDivergence(remixFrom)) {
        return text('Remixed from {value1}.', {value1: parent});
    }
    const {ahead, behind} = remixFrom;
    if (ahead === 0 && behind === 0) {
        return text('This project is up to date with {value1}.', {value1: parent});
    }
    if (ahead > 0 && behind === 0) {
        return ahead === 1 ?
            text('This project is 1 commit ahead of {value1}.', {value1: parent}) :
            text('This project is {value1} commits ahead of {value2}.', {value1: ahead, value2: parent});
    }
    if (ahead === 0 && behind > 0) {
        return behind === 1 ?
            text('This project is 1 commit behind {value1}.', {value1: parent}) :
            text('This project is {value1} commits behind {value2}.', {value1: behind, value2: parent});
    }
    if (ahead === 1 && behind === 1) {
        return text('This project is 1 commit ahead and 1 commit behind {value1}.', {value1: parent});
    }
    if (ahead === 1) {
        return text('This project is 1 commit ahead and {value1} commits behind {value2}.', {
            value1: behind,
            value2: parent
        });
    }
    if (behind === 1) {
        return text('This project is {value1} commits ahead and 1 commit behind {value2}.', {
            value1: ahead,
            value2: parent
        });
    }
    return text('This project is {value1} commits ahead and {value2} commits behind {value3}.', {
        value1: ahead,
        value2: behind,
        value3: parent
    });
};

export const remixDivergenceCompact = (remixFrom, text) => {
    if (!hasRemixDivergence(remixFrom)) return '';
    const {ahead, behind} = remixFrom;
    if (ahead === 0 && behind === 0) return text('Up to date');
    if (ahead > 0 && behind === 0) {
        return ahead === 1 ? text('1 commit ahead') : text('{value1} commits ahead', {value1: ahead});
    }
    if (ahead === 0 && behind > 0) {
        return behind === 1 ? text('1 commit behind') : text('{value1} commits behind', {value1: behind});
    }
    return text('{value1} ahead, {value2} behind', {value1: ahead, value2: behind});
};
