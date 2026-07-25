import {normalizeUser} from '../../src/community/UserContext.jsx';

test('only a boolean true grants admin UI access', () => {
    expect(normalizeUser({username: 'user', isAdmin: false}).isAdmin).toBe(false);
    expect(normalizeUser({username: 'user', isAdmin: 'false'}).isAdmin).toBe(false);
    expect(normalizeUser({username: 'admin', isAdmin: true}).isAdmin).toBe(true);
});
