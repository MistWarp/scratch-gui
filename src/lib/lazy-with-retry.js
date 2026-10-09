import React, {lazy} from 'react';
import {BUILD_ID} from './build-version';

export const isChunkLoadError = error => Boolean(error && (
    error.name === 'ChunkLoadError' ||
    /Loading (?:CSS )?chunk [\w-]+ failed/i.test(error.message || '') ||
    /Failed to fetch dynamically imported module/i.test(error.message || '') ||
    /error loading dynamically imported module/i.test(error.message || '') ||
    /Importing a module script failed|Unable to preload CSS/i.test(error.message || '') ||
    /Cross-origin script load denied/i.test(error.message || '')
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
const RELOAD_COOLDOWN = 60 * 1000;

export const reloadStalePage = (error, browser = window) => {
    if (!isChunkLoadError(error)) return false;
    try {
        const key = `mw:chunk-reload:${BUILD_ID}`;
        const now = Date.now();
        const last = Number(browser.sessionStorage.getItem(key));
        if (last && now - last < RELOAD_COOLDOWN) return false;
        browser.sessionStorage.setItem(key, String(now));
        browser.location.reload();
        return true;
    } catch (e) {
        // Storage can be blocked in embedded pages. Keep the manual reload UI.
        return false;
    }
};

// React.lazy remembers a failed import forever, so an error boundary's "Try again" would rethrow it.
// This variant starts a fresh import the next time it renders after a failure. It only reloads the
// page when reloadStale is set.
export const retryableLazy = (load, {reloadStale = false} = {}) => {
    let Lazy = null;
    const createLazy = () => lazy(() => importWithRetry(load).catch(error => {
        if (reloadStale && reloadStalePage(error)) return new Promise(() => {});
        Lazy = createLazy();
        throw error;
    }));
    Lazy = createLazy();
    const RetryableLazy = props => React.createElement(Lazy, props);
    RetryableLazy.preload = () => importWithRetry(load).catch(() => {
        // Rendering retries the import and reports the error.
    });
    return RetryableLazy;
};

export const lazyWithReload = load => retryableLazy(load, {reloadStale: true});
