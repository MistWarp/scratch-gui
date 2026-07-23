import './import-first';

import React from 'react';
import {IntlProvider} from 'react-intl';
import {BrowserRouter} from 'react-router-dom';

import App from '../community/App.jsx';
import {applyThemeVisuals, detectTheme, onSystemPreferenceChange} from '../lib/themes/themePersistance.js';
import render from './app-target.js';
import '!!style-loader!css-loader!../community/styles/tokens.css';

// The dev server rewrites /<id>/embed to the embed player, but in production
// that path falls through to this community bundle. Bounce it to the embed
// player's hash form, which works everywhere. Numeric ids are Scratch projects;
// everything else (e.g. p1784...) is a MistWarp community project.
const embedMatch = typeof location !== 'undefined' &&
    location.pathname.match(/^\/(\d+|p[A-Za-z0-9]+)\/embed\/?$/);
if (embedMatch) {
    const id = embedMatch[1];
    location.replace(`/embed${location.search}#${/^\d+$/.test(id) ? id : `mw-${id}`}`);
} else {
    applyThemeVisuals(detectTheme());
    onSystemPreferenceChange(() => applyThemeVisuals(detectTheme()));

    render(
        <IntlProvider locale="en">
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </IntlProvider>
    );
}
