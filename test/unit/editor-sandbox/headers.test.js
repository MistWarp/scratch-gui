/** @jest-environment node */
import {onRequest} from '../../../functions/_middleware';

test.each(['/editor-runtime', '/editor-runtime.html', '/editor-runtime/'])(
    '%s enforces an opaque sandbox on direct visits without changing the response body', async path => {
        const response = await onRequest({
            request: new Request(`https://mistwarp.org${path}`),
            next: async () => new Response('<!doctype html><p>runtime</p>', {headers: {'Content-Type': 'text/html'}})
        });
        expect(response.headers.get('Content-Security-Policy')).toContain('sandbox allow-scripts');
        expect(response.headers.get('Content-Security-Policy')).not.toContain('allow-same-origin');
        expect(await response.text()).toBe('<!doctype html><p>runtime</p>');
    }
);

test.each(['/editor', '/editor.html', '/editor/', '/123/editor'])(
    '%s cannot be framed by another site', async path => {
        const response = await onRequest({
            request: new Request(`https://mistwarp.org${path}`),
            next: async () => new Response('<!doctype html><p>host</p>', {headers: {'Content-Type': 'text/html'}})
        });
        expect(response.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self'");
        expect(await response.text()).toBe('<!doctype html><p>host</p>');
    }
);

test('the runtime keeps its sandbox rather than the host policy', async () => {
    const response = await onRequest({
        request: new Request('https://mistwarp.org/editor-runtime'),
        next: async () => new Response('', {headers: {'Content-Type': 'text/html'}})
    });
    expect(response.headers.get('Content-Security-Policy')).not.toContain('frame-ancestors');
});

test('public runtime assets allow loading from the opaque editor origin', async () => {
    const response = await onRequest({
        request: new Request('https://mistwarp.org/assets/editor.js'),
        next: async () => new Response('export default 1', {headers: {'Content-Type': 'text/javascript'}})
    });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await response.text()).toBe('export default 1');
});

test('missing assets still return 404 instead of the HTML fallback', async () => {
    const response = await onRequest({
        request: new Request('https://mistwarp.org/assets/missing.js'),
        next: async () => new Response('<html>fallback</html>', {headers: {'Content-Type': 'text/html'}})
    });
    expect(response.status).toBe(404);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
});
