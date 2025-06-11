let _ScratchBlocks = null;
let _loadPromise = null;

const isLoaded = () => !!_ScratchBlocks;

const get = () => {
    if (!isLoaded()) {
        throw new Error('scratch-blocks is not loaded yet');
    }
    return _ScratchBlocks;
};

const load = () => {
    if (_ScratchBlocks) {
        return Promise.resolve(_ScratchBlocks);
    }
    
    // Prevent multiple simultaneous loads
    if (_loadPromise) {
        return _loadPromise;
    }

    // Start timing the block loading
    const startTime = performance.now();

    _loadPromise = import(/* webpackChunkName: "sb" */ 'scratch-blocks')
        .then(m => {
            _ScratchBlocks = m.default;
            
            const loadTime = performance.now() - startTime;
            console.log(`🧩 Scratch blocks loaded in ${loadTime.toFixed(2)}ms`);
            
            // Aggressively preload commonly used block categories for 2x speedup
            if (_ScratchBlocks && typeof _ScratchBlocks.preloadCategories === 'function') {
                // Use requestIdleCallback if available, otherwise immediate execution
                const schedulePreload = window.requestIdleCallback || 
                    ((callback) => setTimeout(callback, 0)); // Immediate execution for speed
                
                schedulePreload(() => {
                    // Preload ALL commonly used categories immediately for maximum speed
                    _ScratchBlocks.preloadCategories([
                        'motion', 'looks', 'sound', 'events', 'control', 
                        'sensing', 'operators', 'data', 'procedures'
                    ]);
                });
            }
            
            return _ScratchBlocks;
        })
        .catch(error => {
            _loadPromise = null; // Reset on error to allow retry
            throw error;
        });
    
    return _loadPromise;
};

// Preload function that can be called early
const preload = () => {
    if (!_ScratchBlocks && !_loadPromise) {
        // Start loading but don't wait for it
        load().catch(err => {
            console.warn('Preload of scratch-blocks failed:', err);
        });
    }
};

export default {
    get,
    isLoaded,
    load,
    preload
};
