import {cancelCommerceBounty, listCommerceBounties} from '../../src/community/credits.js';

jest.mock('../../src/lib/rotur/client.js', () => ({
    ensureScopes: jest.fn(() => Promise.resolve(true)),
    getAccessToken: jest.fn(() => Promise.resolve('rotur-session'))
}));

const respond = (status, body) => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body)
    }));
};

describe('community billing requests', () => {
    test('shows a friendly message instead of the status code', async () => {
        respond(503, null);
        const error = await listCommerceBounties().catch(caught => caught);
        expect(error.message).toBe('MistWarp is having trouble right now. Try again in a moment.');
        expect(error.message).not.toContain('503');
    });

    test('keeps a readable server explanation', async () => {
        respond(400, {error: 'That bounty has already been paid out.'});
        await expect(cancelCommerceBounty('b1')).rejects.toThrow('That bounty has already been paid out.');
    });

    test('still asks for sign-in again when the server rejects the token', async () => {
        respond(401, {error: 'Unauthorized'});
        const error = await cancelCommerceBounty('b1').catch(caught => caught);
        expect(error.needsReauth).toBe(true);
        expect(error.message).toBe('Sign in to continue');
    });
});
