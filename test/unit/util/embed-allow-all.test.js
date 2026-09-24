const loadShim = ({search, referrer, framed}) => {
    jest.resetModules();
    delete window.__mwAllowAllSecurity;
    window.history.replaceState({}, '', `/embed.html${search}`);
    Object.defineProperty(document, 'referrer', {configurable: true, value: referrer});
    Object.defineProperty(window, 'parent', {configurable: true, value: framed ? {} : window});
    require('../../../src/playground/embed-storage-shim.js');
    return window.__mwAllowAllSecurity === true;
};

afterEach(() => {
    Object.defineProperty(window, 'parent', {configurable: true, value: window});
    Object.defineProperty(document, 'referrer', {configurable: true, value: ''});
    delete window.__mwAllowAllSecurity;
});

test('allow_all is honoured when MistWarp frames its own embed', () => {
    expect(loadShim({
        search: '?allow_all=1',
        referrer: `${window.location.origin}/project/abc`,
        framed: true
    })).toBe(true);
});

test('allow_all is ignored when another site frames the embed', () => {
    expect(loadShim({
        search: '?allow_all=1',
        referrer: 'https://evil.example/page',
        framed: true
    })).toBe(false);
});

test('allow_all is ignored when the embed is opened as the top page', () => {
    expect(loadShim({
        search: '?allow_all=1',
        referrer: `${window.location.origin}/project/abc`,
        framed: false
    })).toBe(false);
});

test('allow_all is ignored when the framing page hides its referrer', () => {
    expect(loadShim({
        search: '?allow_all=1',
        referrer: '',
        framed: true
    })).toBe(false);
});

test('nothing is enabled without the flag', () => {
    expect(loadShim({
        search: '',
        referrer: `${window.location.origin}/project/abc`,
        framed: true
    })).toBe(false);
});
