import React from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';

import MWFontsWindow from '../../components/mw-fonts-window/mw-fonts-window.jsx';
import WindowManager from '../../addons/window-system/window-manager';

let mwFontsWindow = null;
let mwFontsContainer = null;

const openMWFontsWindow = ({store, locale, messages}) => {
    const wm = WindowManager;
    if (!wm || typeof wm.createWindow !== 'function') {
        throw new Error('Window manager not available on vm.wm');
    }

    if (mwFontsWindow) {
        mwFontsWindow.show().bringToFront();
        return;
    }

    mwFontsContainer = document.createElement('div');
    mwFontsContainer.style.cssText = 'height: 100%; display: flex; flex-direction: column; min-height: 0;';

    mwFontsWindow = wm.createWindow({
        id: 'mw-fonts-window',
        title: 'Fonts',
        width: 520,
        height: 650,
        minWidth: 420,
        minHeight: 360,
        className: 'mw-fonts-window',
        onClose: () => {
            try {
                if (!mwFontsContainer) return;
                ReactDOM.unmountComponentAtNode(mwFontsContainer);
            } catch (e) {
                // ignore
            }
            mwFontsWindow = null;
            mwFontsContainer = null;
        }
    });

    mwFontsWindow.setContent(mwFontsContainer);

    try {
        const contentEl = mwFontsWindow.getContentElement ?
            mwFontsWindow.getContentElement() :
            mwFontsWindow.contentElement;
        if (contentEl) contentEl.style.pointerEvents = 'auto';
    } catch (e) {
        // ignore
    }

    ReactDOM.render(
        React.createElement(Provider, {store},
            React.createElement(IntlProvider, {locale: locale || 'en', messages: messages || {}},
                React.createElement(MWFontsWindow, null)
            )
        ),
        mwFontsContainer
    );

    mwFontsWindow.center();
    mwFontsWindow.show();
};

export default openMWFontsWindow;
