// isOwner historically includes maintainers. Prefer the server's source permission.
export const canViewProjectSource = project => {
    if (!project) return false;
    if (typeof project.canViewSource === 'boolean') return project.canViewSource;
    if (typeof project.canSeeInside === 'boolean') return project.canSeeInside;
    const owner = project.myRole ? project.myRole === 'owner' : project.isOwner === true;
    return owner || project.seeInside !== false;
};
