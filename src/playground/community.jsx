import './import-first';

import React from 'react';
import {IntlProvider} from 'react-intl';
import {BrowserRouter} from 'react-router-dom';

import App from '../community/App.jsx';
import {applyThemeVisuals, detectTheme, onSystemPreferenceChange} from '../lib/themes/themePersistance.js';
import render from './app-target.js';
import '!!style-loader!css-loader!../community/styles/tokens.css';

applyThemeVisuals(detectTheme());
onSystemPreferenceChange(() => applyThemeVisuals(detectTheme()));

render(
    <IntlProvider locale="en">
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </IntlProvider>
);
