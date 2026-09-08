import React, {useState} from 'react';
import {mount} from 'enzyme';
import {act} from 'react-dom/test-utils';
import {CommunityIntlProvider, createTranslator, loadCommunityLocale, useCommunityIntl} from '../../src/community/i18n.jsx';
import {loaders} from '../../src/generated/community-locales';
import {matchLocale, readPreference, resolveLocale, setCommunityLocale} from '../../src/community/locale';
import {formatDate, timeAgo} from '../../src/community/format';

jest.mock('../../src/generated/community-locales', () => ({
    loaders: {fr: jest.fn(), de: jest.fn(), es: jest.fn(), ar: jest.fn()}
}));
const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return {promise, resolve, reject};
};
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

const Probe = () => {
    const {text, locale, setPreference, loadError, retry} = useCommunityIntl();
    const [draft, setDraft] = useState('');
    return <div>
        <span className="locale">{locale}</span><span className="translation">{text('Save')}</span>
        <input value={draft} onChange={event => setDraft(event.target.value)} />
        <button className="de" onClick={() => setPreference('de')}>de</button>
        <button className="es" onClick={() => setPreference('es')}>es</button>
        <button className="ar" onClick={() => setPreference('ar')}>ar</button>
        <button className="retry" onClick={retry}>retry</button>
        {loadError ? <p role="alert">failed</p> : null}
    </div>;
};

beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    setCommunityLocale('en');
});

test('matches every editor language, regional aliases, and URL overrides', () => {
    const editorLocales = require('@turbowarp/scratch-l10n').default;
    Object.keys(editorLocales).forEach(locale => expect(matchLocale(locale.toUpperCase())).toBe(locale));
    expect(matchLocale('zh-Hant')).toBe('zh-tw');
    expect(matchLocale('pt_BR')).toBe('pt-br');
    expect(resolveLocale('de', '?lang=ja-hira', ['es'])).toBe('ja-Hira');
    expect(resolveLocale('auto', '', ['xx', 'fr-CA'])).toBe('fr');
    localStorage.setItem('mw:community-locale', 'es');
    expect(readPreference()).toBe('es');
    localStorage.setItem('tw:language', 'de');
    expect(readPreference()).toBe('de');
});

test('formats plural forms and placeholders with safe English fallback', () => {
    const source = '{count, plural, one {# project} other {# projects}}';
    const text = createTranslator('fr', {
        [source]: '{count, plural, one {# projet} other {# projets}}',
        'Hello {name}': 'Bonjour {name}',
        'Save': ''
    });
    expect(text(source, {count: 2})).toBe('2 projets');
    expect(text('Hello {name}', {name: '<b>Ada</b>'})).toBe('Bonjour <b>Ada</b>');
    expect(text('Save')).toBe('Save');
    expect(text('constructor')).toBe('constructor');
    expect(createTranslator('fr', {'Hello {name}': '{invalid'} )('Hello {name}', {name: 'Ada'})).toBe('Hello Ada');
});

test('deduplicates translation downloads', async () => {
    const request = deferred();
    loaders.fr.mockReturnValue(request.promise);
    const a = loadCommunityLocale('fr');
    const b = loadCommunityLocale('fr');
    expect(a).toBe(b);
    request.resolve({default: {Save: 'Enregistrer'}});
    await a;
    await loadCommunityLocale('fr');
    expect(loaders.fr).toHaveBeenCalledTimes(1);
});

test('ignores stale downloads and keeps drafts when switching languages', async () => {
    const de = deferred();
    const es = deferred();
    loaders.de.mockReturnValue(de.promise);
    loaders.es.mockReturnValue(es.promise);
    const wrapper = mount(<CommunityIntlProvider><Probe /></CommunityIntlProvider>);
    await act(flush);
    wrapper.find('input').simulate('change', {target: {value: 'unsaved text'}});
    wrapper.find('.de').simulate('click');
    wrapper.find('.es').simulate('click');
    await act(async () => { es.resolve({default: {Save: 'Guardar'}}); await flush(); });
    wrapper.update();
    expect(wrapper.find('.translation').text()).toBe('Guardar');
    await act(async () => { de.resolve({default: {Save: 'Speichern'}}); await flush(); });
    wrapper.update();
    expect(wrapper.find('.locale').text()).toBe('es');
    expect(wrapper.find('input').prop('value')).toBe('unsaved text');
    expect(localStorage.getItem('tw:language')).toBe('es');
    wrapper.unmount();
});

test('allows retry after a failed download and sets right-to-left direction', async () => {
    loaders.ar.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({default: {Save: 'حفظ'}});
    const wrapper = mount(<CommunityIntlProvider><Probe /></CommunityIntlProvider>);
    await act(flush);
    wrapper.find('.ar').simulate('click');
    await act(flush);
    wrapper.update();
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.find('.locale').text()).toBe('en');
    wrapper.find('.retry').simulate('click');
    await act(flush);
    wrapper.update();
    expect(wrapper.find('.translation').text()).toBe('حفظ');
    expect(document.documentElement.dir).toBe('rtl');
    wrapper.unmount();
});

test('dates and relative times follow the site choice instead of the browser locale', () => {
    setCommunityLocale('fr');
    const date = new Date(2026, 6, 12);
    expect(formatDate(date)).toBe(date.toLocaleDateString('fr', {year: 'numeric', month: 'short', day: 'numeric'}));
    expect(timeAgo(Date.now() - 120000)).toMatch(/2/);
    expect(timeAgo(Date.now() - 120000)).not.toBe('2m');
});
