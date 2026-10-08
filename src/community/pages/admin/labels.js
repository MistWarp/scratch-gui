const standingLabel = (level, communityText) => ({
    good: communityText('Good standing'),
    warning: communityText('Warning'),
    suspended: communityText('Suspended'),
    banned: communityText('Banned')
}[level] || level);

const reportTypeLabel = (type, communityText) => ({
    project: communityText('Project'),
    user: communityText('Profile'),
    comment: communityText('Comment'),
    bounty: communityText('Bounty')
}[type] || type);

export {standingLabel, reportTypeLabel};
