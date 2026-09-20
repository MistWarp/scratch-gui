import {isIsolatedEditor, isEditorDestination} from './protocol.js';
import {callEditorHost} from './client.js';

export const navigateFromEditor = path => {
    if (isIsolatedEditor()) return callEditorHost('navigate', {path});
    window.location.href = path;
    return Promise.resolve();
};

export const installEditorNavigation = () => {
    document.addEventListener('click', event => {
        const anchor = event.target.closest?.('a[href]');
        if (!anchor || anchor.hasAttribute('download') || event.defaultPrevented) return;
        const url = new URL(anchor.href, location.href);
        if (url.origin !== location.origin || !isEditorDestination(url.pathname)) return;
        event.preventDefault();
        navigateFromEditor(`${url.pathname}${url.search}${url.hash}`).catch(() => {});
    }, true);
};
