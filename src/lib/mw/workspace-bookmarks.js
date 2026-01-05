export const WORKSPACE_BOOKMARKS_COMMENT_PREFIX = 'WORKSPACE_BOOKMARKS:';
export const WORKSPACE_BOOKMARKS_DEFAULT_CATEGORY = 'General';
export const WORKSPACE_BOOKMARKS_VERSION = '2.0';

export const getDefaultWorkspaceBookmarksPayload = () => ({
    bookmarks: [],
    categories: [WORKSPACE_BOOKMARKS_DEFAULT_CATEGORY],
    collapsedCategories: []
});

export const normalizeWorkspaceBookmarksPayload = payload => {
    const normalized = payload && typeof payload === 'object' ? payload : {};

    const bookmarks = Array.isArray(normalized.bookmarks) ? normalized.bookmarks : [];
    const categories = Array.isArray(normalized.categories) ?
        normalized.categories :
        [WORKSPACE_BOOKMARKS_DEFAULT_CATEGORY];
    const collapsedCategories = Array.isArray(normalized.collapsedCategories) ? normalized.collapsedCategories : [];

    return {
        bookmarks,
        categories: categories.length ? categories : [WORKSPACE_BOOKMARKS_DEFAULT_CATEGORY],
        collapsedCategories
    };
};

export const parseWorkspaceBookmarksCommentText = text => {
    if (!text || typeof text !== 'string') return null;
    if (!text.startsWith(WORKSPACE_BOOKMARKS_COMMENT_PREFIX)) return null;

    const raw = text.slice(WORKSPACE_BOOKMARKS_COMMENT_PREFIX.length);
    const data = JSON.parse(raw);
    return normalizeWorkspaceBookmarksPayload(data);
};

export const readWorkspaceBookmarksFromStage = stage => {
    if (!stage || !stage.comments) return null;

    for (const commentId in stage.comments) {
        const comment = stage.comments[commentId];
        if (!comment || !comment.text) continue;

        const parsed = parseWorkspaceBookmarksCommentText(comment.text);
        if (parsed) return parsed;
    }

    return null;
};

export const serializeWorkspaceBookmarksToCommentText = payload => {
    const normalized = normalizeWorkspaceBookmarksPayload(payload);
    const data = {
        bookmarks: normalized.bookmarks,
        categories: normalized.categories,
        collapsedCategories: normalized.collapsedCategories,
        version: WORKSPACE_BOOKMARKS_VERSION,
        timestamp: Date.now()
    };
    return `${WORKSPACE_BOOKMARKS_COMMENT_PREFIX}${JSON.stringify(data)}`;
};

export const writeWorkspaceBookmarksToStage = (stage, payload) => {
    if (!stage || !stage.comments) return false;

    let bookmarkCommentId = null;
    for (const commentId in stage.comments) {
        const comment = stage.comments[commentId];
        if (
            comment &&
            typeof comment.text === 'string' &&
            comment.text.startsWith(WORKSPACE_BOOKMARKS_COMMENT_PREFIX)
        ) {
            bookmarkCommentId = commentId;
            break;
        }
    }

    const text = serializeWorkspaceBookmarksToCommentText(payload);

    if (bookmarkCommentId) {
        stage.comments[bookmarkCommentId].text = text;
        return true;
    }

    if (typeof stage.createComment === 'function') {
        void stage.createComment(
            null,
            null,
            text,
            -1000,
            -1000,
            200,
            100,
            true
        );
        return true;
    }

    return false;
};

export const createWorkspaceBookmarksExportData = payload => {
    const normalized = normalizeWorkspaceBookmarksPayload(payload);
    return {
        bookmarks: normalized.bookmarks,
        categories: normalized.categories,
        collapsedCategories: normalized.collapsedCategories,
        version: WORKSPACE_BOOKMARKS_VERSION,
        exportDate: new Date().toISOString()
    };
};

export const mergeWorkspaceBookmarksPayload = (existingPayload, importedData) => {
    const existing = normalizeWorkspaceBookmarksPayload(existingPayload);
    const imported = normalizeWorkspaceBookmarksPayload(importedData);

    const nextBookmarks = [...existing.bookmarks];
    const categories = new Set(existing.categories);

    imported.bookmarks.forEach(b => {
        const exists = nextBookmarks.some(existingBookmark =>
            existingBookmark.name === b.name &&
            JSON.stringify(existingBookmark.state) === JSON.stringify(b.state)
        );
        if (!exists) {
            const category = (b.category || WORKSPACE_BOOKMARKS_DEFAULT_CATEGORY);
            nextBookmarks.push({...b, category});
            categories.add(category);
        }
    });

    if (Array.isArray(importedData?.categories)) {
        importedData.categories.forEach(c => categories.add(c));
    }

    return {
        bookmarks: nextBookmarks,
        categories: [...categories],
        collapsedCategories: existing.collapsedCategories
    };
};

export const downloadJsonObject = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
