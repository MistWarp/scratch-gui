import fs from 'fs';
import path from 'path';
import React from 'react';
import {mount} from 'enzyme';

const dataPath = name => `@turbowarp/scratch-l10n/src/locale-data/${name}.js`;

const scratchL10nLanguages = () => {
    const source = fs.readFileSync(path.join(
        path.dirname(require.resolve('@turbowarp/scratch-l10n/package.json')), 'src/locale-data.js'
    ), 'utf8');
    return [...source.matchAll(/^import \w+ from '\.\/locale-data\/([\w-]+)';$/gm)].map(match => match[1]);
};

let registered;
let downloads;
let watched;
let loadIntlLocaleData;

const watchDownloads = (name, {failFirst = false} = {}) => {
    const actual = jest.requireActual(dataPath(name));
    watched.push(name);
    jest.doMock(dataPath(name), () => {
        downloads.push(name);
        if (failFirst && downloads.filter(item => item === name).length === 1) throw new Error('offline');
        return actual;
    });
};

beforeEach(() => {
    jest.resetModules();
    registered = [];
    downloads = [];
    watched = [];
    jest.doMock('react-intl', () => {
        const actual = jest.requireActual('react-intl');
        return {
            ...actual,
            addLocaleData: data => {
                registered.push(...data.map(entry => entry.locale));
                actual.addLocaleData(data);
            }
        };
    });
    ({loadIntlLocaleData} = require('../../src/lib/intl-locale-data'));
});

afterEach(() => {
    jest.dontMock('react-intl');
    for (const name of watched) jest.dontMock(dataPath(name));
});

test('English and custom locales are registered at once and other languages when loaded', async () => {
    expect(registered).toEqual(expect.arrayContaining(['en', 'en-GB', 'ab', 'zh-cn', 'zh-tw']));
    expect(registered).not.toContain('de');
    await loadIntlLocaleData('de');
    expect(registered).toEqual(expect.arrayContaining(['de', 'de-AT']));
    expect(registered).not.toContain('fr');
});

test('a loaded language formats plurals with its own rules', async () => {
    await loadIntlLocaleData('de');
    const {FormattedMessage, IntlProvider} = require('react-intl');
    const render = count => mount(
        <IntlProvider
            locale="de"
            messages={{files: '{count, plural, one {# Datei} other {# Dateien}}'}}
        >
            <FormattedMessage
                defaultMessage="{count} files"
                id="files"
                values={{count}}
            />
        </IntlProvider>
    ).text();
    expect(render(1)).toBe('1 Datei');
    expect(render(2)).toBe('2 Dateien');
});

test('English and regional variants of a loaded language need no further download', async () => {
    watchDownloads('pt');
    await loadIntlLocaleData('en');
    await loadIntlLocaleData('pt');
    await loadIntlLocaleData('pt-br');
    expect(downloads).toEqual(['pt']);
});

test('a custom locale downloads the data of the language it is based on', async () => {
    watchDownloads('ru');
    watchDownloads('zh');
    await loadIntlLocaleData('ab');
    await loadIntlLocaleData('zh-cn');
    await loadIntlLocaleData('zh-tw');
    expect(downloads).toEqual(['ru', 'zh']);
});

test('concurrent requests share one download and a failed download can be retried', async () => {
    watchDownloads('fr', {failFirst: true});
    await expect(loadIntlLocaleData('fr')).rejects.toThrow('offline');
    await Promise.all([loadIntlLocaleData('fr'), loadIntlLocaleData('fr')]);
    await loadIntlLocaleData('fr');
    expect(downloads).toEqual(['fr', 'fr']);
    expect(registered).toContain('fr');
});

test('every language scratch-l10n registers can still be downloaded', async () => {
    const languages = scratchL10nLanguages();
    expect(languages.length).toBeGreaterThan(60);
    await Promise.all(languages.map(language => loadIntlLocaleData(language)));
    expect(registered).toEqual(expect.arrayContaining(languages));
});
