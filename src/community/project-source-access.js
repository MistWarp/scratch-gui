// isOwner historically includes maintainers. Prefer the server's source permission.
export const canViewProjectSource = project => {
    if (!project) return false;
    if (typeof project.canViewSource === 'boolean') return project.canViewSource;
    if (project.canSeeInside === false) return false;
    const owner = project.myRole ? project.myRole === 'owner' : project.isOwner === true;
    return owner || (Number(project.price || 0) <= 0 && project.seeInside !== false && !project.locked);
};
