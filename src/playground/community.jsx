import './import-first';

import React from 'react';
import {BrowserRouter} from 'react-router-dom';

import App from '../community/App.jsx';
import {CommunityIntlProvider} from '../community/i18n.jsx';
import {applyThemeVisuals, detectTheme, onSystemPreferenceChange} from '../lib/themes/themePersistance.js';
import {CustomTheme} from '../lib/themes/custom-themes.js';
import render from './app-target.js';
import '!!style-loader!css-loader!../community/styles/tokens.css';

// The dev server rewrites /<id>/embed to the embed player, but in production
// that path falls through to this community bundle. Bounce it to the embed
// player's hash form, which works everywhere. Numeric ids are Scratch projects;
// everything else (e.g. p1784...) is a MistWarp community project.
const embedMatch = typeof location !== 'undefined' &&
    location.pathname.match(/^\/(\d+|p[A-Za-z0-9]+)\/embed\/?$/);
const themePreview = typeof location !== 'undefined' &&
    new URLSearchParams(location.search).get('mw_theme_preview') === '1';

if (themePreview && window.parent !== window) {
    window.addEventListener('message', event => {
        if (event.source !== window.parent || !event.data || event.data.type !== 'mw:apply-theme') return;
        try {
            const stored = JSON.parse(event.data.theme || '{}');
            if (stored.inlineCustomTheme) applyThemeVisuals(CustomTheme.import(stored.inlineCustomTheme));
        } catch (e) {
            // Ignore malformed preview payloads.
        }
    });
}
if (embedMatch) {
    const id = embedMatch[1];
    location.replace(`/embed${location.search}#${/^\d+$/.test(id) ? id : `mw-${id}`}`);
} else {
    applyThemeVisuals(detectTheme());
    onSystemPreferenceChange(() => applyThemeVisuals(detectTheme()));

    render(
        <CommunityIntlProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </CommunityIntlProvider>
    );
}
