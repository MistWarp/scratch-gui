import {lazy} from 'react';

export const isChunkLoadError = error => Boolean(error && (
    error.name === 'ChunkLoadError' || /Loading (?:CSS )?chunk [\w-]+ failed/i.test(error.message || '')
));

// Webpack removes failed chunk requests from its cache, so another import retries
// the download. Only retry transport failures, never module execution errors.
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
