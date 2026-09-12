import {lazy} from 'react';
import {BUILD_ID} from './build-version';

export const isChunkLoadError = error => Boolean(error && (
    error.name === 'ChunkLoadError' ||
    /Loading (?:CSS )?chunk [\w-]+ failed/i.test(error.message || '') ||
    /Failed to fetch dynamically imported module/i.test(error.message || '') ||
    /error loading dynamically imported module/i.test(error.message || '') ||
    /Importing a module script failed|Unable to preload CSS/i.test(error.message || '')
));

// Retry transport failures once. Execution errors must reach the error boundary.
// A browser-cached failure or an asset removed by deployment can still need a reload.
export const importWithRetry = async load => {
    try {
        return await load();
    } catch (error) {
        if (!isChunkLoadError(error)) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
        return load();
    }
};

export default load => lazy(() => importWithRetry(load));

// Community page navigation can recover from assets removed by a deployment.
// Do not use this for editor imports, where a reload could discard project edits.
export const reloadStalePage = (error, browser = window) => {
    if (!isChunkLoadError(error)) return false;
    try {
        const key = `mw:chunk-reload:${BUILD_ID}`;
        if (browser.sessionStorage.getItem(key)) return false;
        browser.sessionStorage.setItem(key, '1');
        browser.location.reload();
        return true;
    } catch (e) {
        // Storage can be blocked in embedded pages. Keep the manual reload UI.
        return false;
    }
};

export const lazyWithReload = load => lazy(() => importWithRetry(load).catch(error => {
    reloadStalePage(error);
    throw error;
}));
