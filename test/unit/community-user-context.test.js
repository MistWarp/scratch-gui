import {normalizeUser, signInErrorMessage} from '../../src/community/UserContext.jsx';

test('only a boolean true grants admin UI access', () => {
    expect(normalizeUser({username: 'user', isAdmin: false}).isAdmin).toBe(false);
    expect(normalizeUser({username: 'user', isAdmin: 'false'}).isAdmin).toBe(false);
    expect(normalizeUser({username: 'admin', isAdmin: true}).isAdmin).toBe(true);
});

test('turns popup failures into useful sign-in feedback', () => {
    expect(signInErrorMessage(new Error('Popup window blocked'))).toContain('Allow popups');
    expect(signInErrorMessage(new Error('Rotur unavailable'))).toBe('Rotur unavailable');
});
