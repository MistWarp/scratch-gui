import {messages, blockMessages, loaders} from '../generated/editor-locales/index.js';
import {detectLocale} from './utils/detect-locale';

const loaded = new Set(['en']);
const pending = new Map();

const isLocaleLoaded = locale => loaded.has(locale) || !loaders[locale];
const loadLocale = locale => {
    if (isLocaleLoaded(locale)) return Promise.resolve();
    if (!pending.has(locale)) {
        const request = loaders[locale]().then(module => {
            // Keep untranslated MistWarp strings available without duplicating
            // the English catalog in every language chunk.
            messages[locale] = {...messages.en, ...module.default.messages};
            Object.assign(blockMessages[locale], module.default.blocks);
            loaded.add(locale);
            pending.delete(locale);
        })
            .catch(error => {
                pending.delete(locale);
                throw error;
            });
        pending.set(locale, request);
    }
    return pending.get(locale);
};

const prepareLocale = () => {
    const locale = detectLocale(Object.keys(messages));
    return loadLocale(locale).catch(error => {
        // A failed translation download must not prevent opening a project.
        messages[locale] = messages.en;
        console.warn('Could not load editor translations', error);
    });
};

export {messages, loadLocale, isLocaleLoaded, prepareLocale};
