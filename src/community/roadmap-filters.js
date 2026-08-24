const HIDDEN_ROADMAP_STATUSES = new Set(['shipped', 'declined']);

export const roadmapStatusMatches = (status, statusFilter) => (
    statusFilter ? status === statusFilter : !HIDDEN_ROADMAP_STATUSES.has(status)
);
