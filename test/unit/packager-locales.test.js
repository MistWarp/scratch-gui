let locales;

beforeEach(() => {
    jest.resetModules();
    locales = require('../../src/packager/locales');
});

test('the packager speaks English until a language has downloaded', async () => {
    const translate = locales.getTranslator('de');
    expect(translate('downloads.link')).toBe('Download {filename} ({size})');
    await locales.loadPackagerLocale('DE');
    expect(locales.getTranslator('de')('downloads.link')).toBe('{filename} herunterladen ({size})');
    expect(locales.getTranslator('fr')('downloads.link')).toBe('Download {filename} ({size})');
});

test('languages without packager translations need no download', async () => {
    await expect(locales.loadPackagerLocale('xx')).resolves.toBeUndefined();
    await expect(locales.loadPackagerLocale('en')).resolves.toBeUndefined();
    expect(locales.getTranslator('xx')('downloads.link')).toBe('Download {filename} ({size})');
    expect(locales.getTranslator('de')('missing.key')).toBe('missing.key');
});
