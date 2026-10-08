import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRichTranslator, createTranslator} from '../../src/community/i18n.jsx';
import {timeAgoText} from '../../src/community/format.js';

describe('community rich text', () => {
    test('puts elements inside a translated sentence', () => {
        const rich = createRichTranslator(createTranslator('en', {}));
        const markup = renderToStaticMarkup(
            <p>{rich('by {user}', {user: <a href="/users/sam">{'sam'}</a>})}</p>
        );
        expect(markup).toBe('<p>by <a href="/users/sam">sam</a></p>');
    });

    test('follows the word order of the translation', () => {
        const rich = createRichTranslator(createTranslator('fr', {'by {user}': '{user} l’a créé'}));
        const markup = renderToStaticMarkup(<p>{rich('by {user}', {user: <b>{'sam'}</b>})}</p>);
        expect(markup).toBe('<p><b>sam</b> l’a créé</p>');
    });

    test('says "just now" without adding "ago"', () => {
        expect(timeAgoText(Date.now())).toBe('just now');
        expect(timeAgoText(Date.now() - (5 * 60 * 1000))).toBe('5m ago');
        expect(timeAgoText(0)).toBe('');
    });
});
