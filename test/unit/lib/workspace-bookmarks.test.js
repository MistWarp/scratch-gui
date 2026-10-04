import {
    getWorkspaceBookmarkShortcut,
    loadWorkspaceBookmarksPayload,
    WORKSPACE_BOOKMARKS_COMMENT_PREFIX
} from '../../../src/lib/mw/workspace-bookmarks.js';

const keyEvent = (key, extra = {}) => ({
    altKey: true,
    ctrlKey: true,
    key,
    getModifierState: () => false,
    ...extra
});

describe('workspace bookmark shortcuts', () => {
    test('maps Ctrl+Alt+1..9 and 0 to bookmarks 1-10', () => {
        expect(getWorkspaceBookmarkShortcut(keyEvent('1'))).toEqual({type: 'switch', index: 0});
        expect(getWorkspaceBookmarkShortcut(keyEvent('9'))).toEqual({type: 'switch', index: 8});
        expect(getWorkspaceBookmarkShortcut(keyEvent('0'))).toEqual({type: 'switch', index: 9});
    });

    test('maps Ctrl+Alt+T to adding a bookmark', () => {
        expect(getWorkspaceBookmarkShortcut(keyEvent('T'))).toEqual({type: 'add'});
    });

    test('needs both Ctrl and Alt', () => {
        expect(getWorkspaceBookmarkShortcut(keyEvent('1', {altKey: false}))).toBeNull();
        expect(getWorkspaceBookmarkShortcut(keyEvent('t', {ctrlKey: false}))).toBeNull();
    });

    test('ignores characters typed with AltGr', () => {
        const altGr = keyEvent('t', {getModifierState: modifier => modifier === 'AltGraph'});
        expect(getWorkspaceBookmarkShortcut(altGr)).toBeNull();
        expect(getWorkspaceBookmarkShortcut(keyEvent('{', {code: 'Digit7'}))).toBeNull();
    });

    test('uses physical keys only when asked, for macOS Option characters', () => {
        const optionT = keyEvent('†', {code: 'KeyT'});
        expect(getWorkspaceBookmarkShortcut(optionT)).toBeNull();
        expect(getWorkspaceBookmarkShortcut(optionT, true)).toEqual({type: 'add'});
        expect(getWorkspaceBookmarkShortcut(keyEvent('¡', {code: 'Digit1'}), true))
            .toEqual({type: 'switch', index: 0});
    });
});

describe('loading workspace bookmarks', () => {
    const stageWith = text => ({comments: {a: {text}}});

    test('reads stored bookmarks', () => {
        const stored = {bookmarks: [{name: 'Loop', category: 'General'}], categories: ['General']};
        const {payload, readable} = loadWorkspaceBookmarksPayload(
            stageWith(`${WORKSPACE_BOOKMARKS_COMMENT_PREFIX}${JSON.stringify(stored)}`)
        );
        expect(readable).toBe(true);
        expect(payload.bookmarks).toEqual(stored.bookmarks);
    });

    test('treats a project without bookmarks as an empty, writable list', () => {
        const {payload, readable} = loadWorkspaceBookmarksPayload({comments: {}});
        expect(readable).toBe(true);
        expect(payload.bookmarks).toEqual([]);
    });

    test('marks damaged bookmarks as unreadable so they are not overwritten', () => {
        const {payload, readable} = loadWorkspaceBookmarksPayload(
            stageWith(`${WORKSPACE_BOOKMARKS_COMMENT_PREFIX}{not json`)
        );
        expect(readable).toBe(false);
        expect(payload.bookmarks).toEqual([]);
    });
});
