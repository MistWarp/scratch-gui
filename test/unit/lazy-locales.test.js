let dictionaries;
let loaders;
let locales;

beforeEach(() => {
    jest.resetModules();
    dictionaries = {en: {hello: 'Hello', fallbackOnly: 'Fallback'}, fr: {}, de: {}};
    loaders = {
        fr: jest.fn(() => Promise.resolve({default: {messages: {hello: 'Bonjour'}, blocks: {CONTROL_FOREVER: 'répéter indéfiniment'}}})),
        de: jest.fn(() => Promise.resolve({default: {messages: {hello: 'Hallo'}, blocks: {}}}))
    };
    jest.doMock('../../src/generated/editor-locales/index.js', () => ({messages: dictionaries, loaders, blockMessages: {en: {}, fr: {}, de: {}}}));
    locales = require('../../src/lib/editor-locales');
});

test('English requires no download and other languages share one request', async () => {
    await locales.loadLocale('en');
    expect(loaders.fr).not.toHaveBeenCalled();
    const loading = locales.loadLocale('fr');
    expect(locales.loadLocale('fr')).toBe(loading);
    await loading;
    expect(dictionaries.fr.hello).toBe('Bonjour');
    expect(dictionaries.fr.fallbackOnly).toBe('Fallback');
    await locales.loadLocale('fr');
    expect(loaders.fr).toHaveBeenCalledTimes(1);
    expect(loaders.de).not.toHaveBeenCalled();
});

test('loaded languages inherit missing English messages without replacing translations', async () => {
    dictionaries.en.onlyEnglish = 'Fallback';
    await locales.loadLocale('fr');
    expect(dictionaries.fr).toEqual(expect.objectContaining({
        hello: 'Bonjour',
        onlyEnglish: 'Fallback'
    }));
});

test('a failed language download can be retried', async () => {
    loaders.fr.mockRejectedValueOnce(new Error('offline'));
    await expect(locales.loadLocale('fr')).rejects.toThrow('offline');
    await locales.loadLocale('fr');
    expect(dictionaries.fr.hello).toBe('Bonjour');
    expect(loaders.fr).toHaveBeenCalledTimes(2);
});

test('a slow selection does not overwrite a newer language choice', async () => {
    let complete;
    loaders.fr.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    const {localeMiddleware, selectLocale} = require('../../src/reducers/locales');
    const next = jest.fn();
    const dispatch = localeMiddleware()(next);
    const pending = dispatch(selectLocale('fr'));
    dispatch(selectLocale('en'));
    complete({default: {messages: {hello: 'Bonjour'}, blocks: {CONTROL_FOREVER: 'répéter indéfiniment'}}});
    await pending;
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].locale).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
});
