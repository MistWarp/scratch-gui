// Shaping for the development feed: MistWarp's own open and recently merged
// pull requests, and the link between one of them and a roadmap entry.

// Ordered so a reader sees what is still moving before what has landed.
const PULL_GROUPS = [
    {key: 'review', label: 'In review', states: ['open', 'draft']},
    {key: 'merged', label: 'Recently merged', states: ['merged']}
];

const PULL_STATE_LABELS = {
    open: 'Open',
    draft: 'Draft',
    merged: 'Merged',
    closed: 'Closed',
    unknown: 'Linked'
};

const pullTimestamp = value => {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
};

// A merged entry is interesting for when it landed; an open one for when it
// last moved.
const pullSortTime = pull => pullTimestamp(pull.mergedAt) || pullTimestamp(pull.updatedAt);

const pullState = pull => (
    Object.prototype.hasOwnProperty.call(PULL_STATE_LABELS, pull && pull.state) ? pull.state : 'unknown'
);

const groupPulls = pulls => PULL_GROUPS.map(group => ({
    ...group,
    pulls: (pulls || [])
        .filter(pull => group.states.includes(pullState(pull)))
        .sort((a, b) => pullSortTime(b) - pullSortTime(a))
}));

const pullRepos = pulls => [...new Set((pulls || []).map(pull => pull.repo).filter(Boolean))].sort();

const filterPulls = (pulls, {repo = '', query = ''} = {}) => {
    const normalizedQuery = query.trim().toLowerCase();
    return (pulls || []).filter(pull => {
        if (repo && pull.repo !== repo) return false;
        if (!normalizedQuery) return true;
        return `${pull.title} ${pull.repo} ${pull.author} #${pull.number}`.toLowerCase().includes(normalizedQuery);
    });
};

// Every roadmap entry already carries its resolved pull requests, so the
// reverse lookup for the Changes tab is built from the entries themselves.
// That covers links an admin attached as well as ones a pull request declared.
const roadmapIndexForPulls = ideas => {
    const index = new Map();
    (ideas || []).forEach(idea => {
        (idea.pullRequests || []).forEach(pull => {
            if (pull && pull.id && !index.has(pull.id)) index.set(pull.id, idea);
        });
    });
    return index;
};

// What a reader wants from an entry at a glance: is anything being built, and
// has any of it landed?
const roadmapProgress = idea => {
    const pulls = (idea && idea.pullRequests) || [];
    const merged = pulls.filter(pull => pullState(pull) === 'merged').length;
    const open = pulls.filter(pull => ['open', 'draft'].includes(pullState(pull))).length;
    return {total: pulls.length, merged, open};
};

const pullLinkValue = pull => `${pull.repo}#${pull.number}`;

export {
    PULL_GROUPS,
    PULL_STATE_LABELS,
    filterPulls,
    groupPulls,
    pullLinkValue,
    pullRepos,
    pullSortTime,
    pullState,
    pullTimestamp,
    roadmapIndexForPulls,
    roadmapProgress
};
