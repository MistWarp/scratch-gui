import {lazy} from 'react';

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
