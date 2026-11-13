import loadAddonTranslations from '../../../src/addons/translations';

let warn;

beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    warn.mockRestore();
});

test('downloads the translations of a language that has them', async () => {
    const entries = {de: jest.fn(() => Promise.resolve({default: {'addon/name': 'Name auf Deutsch'}}))};
    await expect(loadAddonTranslations(entries, 'de')).resolves.toEqual({'addon/name': 'Name auf Deutsch'});
    expect(entries.de).toHaveBeenCalledTimes(1);
});

test('English and languages without addon translations need no download', async () => {
    const entries = {de: jest.fn()};
    await expect(loadAddonTranslations(entries, 'en')).resolves.toEqual({});
    await expect(loadAddonTranslations(entries, 'toString')).resolves.toEqual({});
    expect(entries.de).not.toHaveBeenCalled();
});

test('a failed download leaves addons in English instead of stopping them', async () => {
    const entries = {de: () => Promise.reject(new Error('offline'))};
    await expect(loadAddonTranslations(entries, 'de')).resolves.toEqual({});
    expect(warn).toHaveBeenCalledWith('Could not download add-on translations', expect.any(Error));
});
