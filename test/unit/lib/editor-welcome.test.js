import {
    STORAGE_KEY,
    dismissEditorWelcome,
    hasNoOwnProjects,
    isEditorWelcomeDismissed,
    shouldShowEditorWelcome
} from '../../../src/lib/editor-welcome.js';
import {request} from '../../../src/lib/community/api.js';

jest.mock('../../../src/lib/community/api.js', () => ({request: jest.fn()}));

const base = {
    dismissed: false,
    hasNoProjects: true,
    hash: '',
    isEmbedded: false,
    isPlayerOnly: false,
    isShowingDefaultProject: true,
    projectChanged: false,
    search: ''
};

beforeEach(() => {
    localStorage.clear();
});

test('shows for the untouched default project in the editor', () => {
    expect(shouldShowEditorWelcome(base)).toBe(true);
    expect(shouldShowEditorWelcome({...base, hash: '#0'})).toBe(true);
    expect(shouldShowEditorWelcome({...base, search: '?locale=en'})).toBe(true);
});

test('hides once dismissed or after the project is edited', () => {
    expect(shouldShowEditorWelcome({...base, dismissed: true})).toBe(false);
    expect(shouldShowEditorWelcome({...base, projectChanged: true})).toBe(false);
});

test('hides in the player, in embeds, and while another project is loading', () => {
    expect(shouldShowEditorWelcome({...base, isPlayerOnly: true})).toBe(false);
    expect(shouldShowEditorWelcome({...base, isEmbedded: true})).toBe(false);
    expect(shouldShowEditorWelcome({...base, isShowingDefaultProject: false})).toBe(false);
});

test('hides when the URL loads a project or a starter', () => {
    for (const search of [
        '?starter=clicker',
        '?project_url=https://example.com/a.sb3',
        '?clone=https://example.com/repo',
        '?platform_project=abc',
        '?restore=4'
    ]) {
        expect(shouldShowEditorWelcome({...base, search})).toBe(false);
    }
    expect(shouldShowEditorWelcome({...base, hash: '#123'})).toBe(false);
    expect(shouldShowEditorWelcome({...base, hash: '#mw-abc'})).toBe(false);
});

test('remembers a dismissal in localStorage', () => {
    expect(isEditorWelcomeDismissed()).toBe(false);
    dismissEditorWelcome();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dismissed');
    expect(isEditorWelcomeDismissed()).toBe(true);
});

test('only shows for someone signed in with no projects', () => {
    expect(shouldShowEditorWelcome({...base, hasNoProjects: false})).toBe(false);
    expect(shouldShowEditorWelcome({...base, hasNoProjects: undefined})).toBe(false);
});

test('counts every project the signed in user owns, including unshared ones', async () => {
    request.mockImplementation(path => Promise.resolve(path === '/me' ?
        {username: 'new user'} :
        {total: 0}));
    await expect(hasNoOwnProjects()).resolves.toBe(true);
    expect(request).toHaveBeenLastCalledWith('/users/new%20user/projects?all=true&limit=1', {cache: false});

    request.mockImplementation(path => Promise.resolve(path === '/me' ? {username: 'maker'} : {total: 3}));
    await expect(hasNoOwnProjects()).resolves.toBe(false);
});

test('treats a signed out visitor as not eligible', async () => {
    request.mockImplementation(() => Promise.reject(new Error('not authenticated')));
    await expect(hasNoOwnProjects()).rejects.toThrow();
});
