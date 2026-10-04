import {parseHttpUrl, safeUrl} from '../../../src/lib/utils/safe-url';

describe('safeUrl', () => {
    test('keeps absolute http and https links', () => {
        expect(safeUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
        expect(safeUrl('HTTP://Example.com')).toBe('http://example.com/');
    });

    test('rejects other schemes, relative links and malformed values', () => {
        expect(safeUrl(['javascript', 'alert(1)'].join(':'))).toBeNull();
        expect(safeUrl('data:image/png;base64,AAAA')).toBeNull();
        expect(safeUrl('/relative/path')).toBeNull();
        expect(safeUrl('http://')).toBeNull();
        expect(safeUrl('')).toBeNull();
        expect(safeUrl(null)).toBeNull();
        expect(safeUrl(void 0)).toBeNull();
    });

    test('parseHttpUrl returns a URL object', () => {
        expect(parseHttpUrl('https://example.com/x').pathname).toBe('/x');
        expect(parseHttpUrl('ftp://example.com')).toBeNull();
    });
});
