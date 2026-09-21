import {classifyRequest, projectFromURL, publicIdentity, SANDBOX} from '../../../src/lib/editor-sandbox/protocol';

describe('editor account boundary', () => {
    test('scopes authenticated project operations to the host-selected project', () => {
        expect(classifyRequest('/projects/123/upload', 'POST', '123')).toBe('save');
        expect(classifyRequest('/projects/456/upload', 'POST', '123')).toBeNull();
        expect(classifyRequest('/projects/123/editor', 'GET', '123')).toBe('project-read');
        expect(classifyRequest('/projects/456/editor', 'GET', '123')).toBeNull();
        expect(classifyRequest('/projects/123/publish', 'POST', '123')).toBe('publish');
        expect(classifyRequest('/projects/123/publish', 'GET', '123')).toBeNull();
    });
    test.each(['/auth', '/logout', '/me/export', '/me/data', '/admin', '//evil.test',
        '/projects/123/../456/upload', '/projects/123/%2e%2e/456/upload',
        '/projects/123%2fupload', 'https://evil.test/projects/123/upload'])('denies %s', path => {
        expect(classifyRequest(path, 'POST', '123')).toBeNull();
    });
    test('does not turn a missing current project into account-wide access', () => {
        expect(classifyRequest('/projects/123', 'GET', null)).toBeNull();
        expect(classifyRequest('/projects', 'POST', null)).toBe('create');
    });
    test('identity crosses the boundary without tokens or private profile fields', () => {
        expect(publicIdentity({status: 'ready', token: 'secret', user: {
            id: '12', username: 'person', avatarUrl: 'avatar', email: 'private', token: 'secret'
        }})).toEqual({status: 'ready', user: {id: '12', username: 'person', avatarUrl: 'avatar'}});
    });
    test('chooses the project from the outer URL and rejects path injection', () => {
        expect(projectFromURL('https://mistwarp.org/editor#mw-123')).toBe('123');
        expect(projectFromURL('https://mistwarp.org/editor?platform_project=abc')).toBe('abc');
        expect(projectFromURL('https://mistwarp.org/editor?platform_project=../private')).toBeNull();
    });
    test('does not permit same-origin access, popups or top navigation', () => {
        expect(SANDBOX).not.toMatch(/allow-same-origin|allow-popups|allow-top-navigation/);
    });
});
