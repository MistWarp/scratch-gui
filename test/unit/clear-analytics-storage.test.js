import clearAnalyticsStorage from '../../src/lib/clear-analytics-storage.js';

describe('clearing the old analytics storage', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    test('removes the analytics ID, preference and markers', () => {
        localStorage.setItem('mw:analytics-session', 'abc');
        localStorage.setItem('mw:anonymous-analytics', 'off');
        localStorage.setItem('mw:signup-tracked:maya', '1');
        sessionStorage.setItem('mw:analytics-once:editor_open', '1');
        sessionStorage.setItem('mw:analytics-day:project_run', '2026-10-16');
        expect(clearAnalyticsStorage()).toBe(true);
        expect(localStorage.length).toBe(0);
        expect(sessionStorage.length).toBe(0);
    });

    test('keeps everything else', () => {
        localStorage.setItem('tw:theme', '{}');
        localStorage.setItem('mw:rotur-token', 'x');
        sessionStorage.setItem('mw:other', '1');
        clearAnalyticsStorage();
        expect(localStorage.getItem('tw:theme')).toBe('{}');
        expect(localStorage.getItem('mw:rotur-token')).toBe('x');
        expect(sessionStorage.getItem('mw:other')).toBe('1');
    });
});
