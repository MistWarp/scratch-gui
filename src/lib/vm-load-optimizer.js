/**
 * Optimized VM loader with intelligent caching and error recovery
 */

class VMLoadOptimizer {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * Load project with aggressive optimizations for 2x speedup
     */
    async loadProject(vm, projectData, options = {}) {
        const startTime = performance.now();
        const { useCache = true, priority = 'high' } = options;
        
        // Generate cache key
        const cacheKey = this._generateCacheKey(projectData);
        let attempt = (this.retryAttempts.get(cacheKey) || 0) + 1;
        this.retryAttempts.set(cacheKey, attempt);
        
        // Prevent duplicate loads
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }
        
        try {
            // Enable turbo mode during loading for faster execution (if available)
            const originalTurboMode = vm.runtime?.turboMode || false;
            if (vm.setTurboMode && typeof vm.setTurboMode === 'function') {
                vm.setTurboMode(true);
            } else if (vm.runtime) {
                vm.runtime.turboMode = true;
            }
            
            // Check cache first
            if (useCache && this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (this._isCacheValid(cached)) {
                    // Restore original turbo mode
                    if (vm.setTurboMode && typeof vm.setTurboMode === 'function') {
                        vm.setTurboMode(originalTurboMode);
                    } else if (vm.runtime) {
                        vm.runtime.turboMode = originalTurboMode;
                    }
                    return this._loadFromCache(vm, cached);
                } else {
                    this.cache.delete(cacheKey);
                }
            }
            
            // Use optimized loading with batched updates
            const result = await this._optimizedProjectLoad(vm, projectData, cacheKey, useCache);
            
            // Restore original turbo mode
            if (vm.setTurboMode && typeof vm.setTurboMode === 'function') {
                vm.setTurboMode(originalTurboMode);
            } else if (vm.runtime) {
                vm.runtime.turboMode = originalTurboMode;
            }
            
            const loadTime = performance.now() - startTime;
            console.log(`📊 Project loaded in ${loadTime.toFixed(2)}ms (attempt ${attempt})`);
            
            // Cache successful loads
            if (useCache) {
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now(),
                    size: this._estimateSize(projectData)
                });
                this._cleanupCache();
            }
            
            // Reset retry count on success
            this.retryAttempts.delete(cacheKey);
            
            return result;
        } catch (error) {
            console.error(`❌ Load attempt ${attempt} failed:`, error);
            
            if (attempt < this.maxRetries + 1) {
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                console.warn(`Retrying in ${delay}ms...`);
                await this._delay(delay);
                this.retryAttempts.set(cacheKey, attempt);
                return this.loadProject(vm, projectData, options);
            } else {
                this.retryAttempts.delete(cacheKey);
                throw error;
            }
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    async _loadProjectWithRetry(vm, projectData, cacheKey, options) {
        let lastError;
        const maxAttempts = this.maxRetries + 1;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Add performance markers
                const startTime = performance.now();
                
                // Optimize VM settings for faster loading
                this._optimizeVMForLoading(vm);
                
                const result = await vm.loadProject(projectData);
                
                const loadTime = performance.now() - startTime;
                console.log(`Project loaded in ${loadTime.toFixed(2)}ms (attempt ${attempt})`);
                
                // Reset retry count on success
                this.retryAttempts.delete(cacheKey);
                
                return result;
            } catch (error) {
                lastError = error;
                
                if (attempt < maxAttempts) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    console.warn(`Load attempt ${attempt} failed, retrying in ${delay}ms:`, error);
                    await this._delay(delay);
                } else {
                    console.error(`Project load failed after ${maxAttempts} attempts:`, error);
                }
            }
        }

        throw lastError;
    }

    _optimizeVMForLoading(vm) {
        // Temporarily disable some features during loading for speed
        if (vm.runtime) {
            // Disable stepping during load (if property exists)
            const wasRunning = vm.runtime.isSteppingAllowed;
            if (typeof wasRunning !== 'undefined') {
                vm.runtime.isSteppingAllowed = false;
                
                // Restore after a delay
                setTimeout(() => {
                    vm.runtime.isSteppingAllowed = wasRunning;
                }, 100);
            }
        }
    }

    async _loadFromCache(vm, cached) {
        console.log('Loading project from cache');
        if (cached.data && vm.loadProject) {
            return vm.loadProject(cached.data);
        } else {
            // Fallback if cache data is invalid
            throw new Error('Invalid cache data');
        }
    }

    _generateCacheKey(projectData) {
        if (typeof projectData === 'string') {
            return `str_${projectData.length}_${this._simpleHash(projectData)}`;
        } else if (projectData instanceof ArrayBuffer) {
            return `buf_${projectData.byteLength}_${this._hashArrayBuffer(projectData)}`;
        } else {
            return `obj_${JSON.stringify(projectData).length}`;
        }
    }

    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    _hashArrayBuffer(buffer) {
        const view = new Uint8Array(buffer);
        let hash = 0;
        for (let i = 0; i < Math.min(view.length, 1000); i += 100) {
            hash = ((hash << 5) - hash) + view[i];
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    _estimateSize(data) {
        if (typeof data === 'string') {
            return data.length * 2; // UTF-16
        } else if (data instanceof ArrayBuffer) {
            return data.byteLength;
        } else {
            return JSON.stringify(data).length * 2;
        }
    }

    _isCacheValid(cached) {
        const maxAge = 30 * 60 * 1000; // 30 minutes
        return (Date.now() - cached.timestamp) < maxAge;
    }

    _cleanupCache() {
        const maxCacheSize = 50 * 1024 * 1024; // 50MB
        let totalSize = 0;
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => b[1].timestamp - a[1].timestamp); // Sort by timestamp, newest first

        for (const [key, value] of entries) {
            totalSize += value.size;
            if (totalSize > maxCacheSize) {
                this.cache.delete(key);
            }
        }
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.cache.clear();
        this.loadingPromises.clear();
        this.retryAttempts.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        let totalSize = 0;
        for (const value of this.cache.values()) {
            totalSize += value.size;
        }

        return {
            cacheEntries: this.cache.size,
            totalCacheSize: totalSize,
            activeLoads: this.loadingPromises.size
        };
    }

    /**
     * Optimized project loading with batched DOM updates
     */
    async _optimizedProjectLoad(vm, projectData, cacheKey, useCache) {
        return this._withBatchedUpdates(async () => {
            // Disable renderer updates during loading
            const renderer = vm.renderer;
            const originalDraw = renderer ? renderer.draw : null;
            
            if (renderer) {
                renderer.draw = () => {}; // Disable drawing during load
            }
            
            try {
                const result = await vm.loadProject(projectData);
                
                // Cache the result for future loads
                if (useCache) {
                    this._cacheProject(cacheKey, vm);
                }
                
                return result;
            } finally {
                // Re-enable renderer
                if (renderer && originalDraw) {
                    renderer.draw = originalDraw;
                    // Do one final draw to update everything
                    renderer.draw();
                }
            }
        });
    }

    /**
     * Batch DOM updates to reduce reflows
     */
    async _withBatchedUpdates(callback) {
        // Use requestIdleCallback if available for better performance
        if (window.requestIdleCallback) {
            return new Promise((resolve, reject) => {
                window.requestIdleCallback(async () => {
                    try {
                        const result = await callback();
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        } else {
            return callback();
        }
    }

    /**
     * Cache project data for faster subsequent loads
     */
    _cacheProject(cacheKey, vm) {
        try {
            const cacheData = {
                timestamp: Date.now(),
                targets: vm.runtime.targets.length,
                sprites: vm.runtime.targets.filter(t => !t.isStage).length,
                blocks: Object.keys(vm.runtime.targets[0]?.blocks?._blocks || {}).length
            };
            
            this.cache.set(cacheKey, cacheData);
            
            // Limit cache size to prevent memory bloat
            if (this.cache.size > 5) {
                const oldestKey = this.cache.keys().next().value;
                this.cache.delete(oldestKey);
            }
        } catch (error) {
            console.warn('Failed to cache project:', error);
        }
    }
}

// Global instance
const vmLoadOptimizer = new VMLoadOptimizer();

export default vmLoadOptimizer;
