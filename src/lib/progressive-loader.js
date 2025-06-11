/**
 * Progressive loader that prioritizes essential components and defers non-critical ones
 */

const LoadPriority = {
    CRITICAL: 0,    // Must load immediately (core VM, basic blocks)
    HIGH: 1,        // Should load soon (essential UI components)
    MEDIUM: 2,      // Can be deferred (some extensions)
    LOW: 3          // Load on demand (advanced features, some addons)
};

class ProgressiveLoader {
    constructor() {
        this.loadQueue = new Map();
        this.loaded = new Set();
        this.loading = new Set();
        this.isIdle = false;
        this.loadStats = new Map();
        
        // Use requestIdleCallback for better performance, with proper fallback
        this.scheduleCallback = window.requestIdleCallback ? 
            window.requestIdleCallback.bind(window) : 
            (callback) => setTimeout(() => callback({ timeRemaining: () => 16 }), 0);
    }

    /**
     * Register a module for progressive loading
     * @param {string} name Module name
     * @param {Function} loader Function that returns a Promise
     * @param {number} priority LoadPriority level
     */
    register(name, loader, priority = LoadPriority.MEDIUM) {
        if (!this.loadQueue.has(priority)) {
            this.loadQueue.set(priority, []);
        }
        this.loadQueue.get(priority).push({ name, loader });
    }

    /**
     * Start progressive loading process
     */
    async startLoading() {
        // Load critical components first
        await this.loadPriority(LoadPriority.CRITICAL);
        
        // Load high priority components
        await this.loadPriority(LoadPriority.HIGH);
        
        // Schedule medium and low priority loads during idle time
        this.scheduleIdleLoading();
    }

    /**
     * Load all modules of a specific priority
     */
    async loadPriority(priority) {
        const modules = this.loadQueue.get(priority) || [];
        const promises = modules.map(({ name, loader }) => this.loadModule(name, loader));
        await Promise.all(promises);
    }

    /**
     * Load a specific module with timing
     */
    async loadModule(name, loader) {
        if (this.loaded.has(name) || this.loading.has(name)) {
            return;
        }

        this.loading.add(name);
        const startTime = performance.now();
        
        try {
            await loader();
            this.loaded.add(name);
            
            const loadTime = performance.now() - startTime;
            this.loadStats.set(name, loadTime);
            console.log(`📦 Loaded module "${name}" in ${loadTime.toFixed(2)}ms`);
        } catch (error) {
            console.warn(`❌ Failed to load module ${name}:`, error);
        } finally {
            this.loading.delete(name);
        }
    }

    /**
     * Schedule loading during browser idle time
     */
    scheduleIdleLoading() {
        const loadNext = () => {
            if (!this.isIdle) return;

            // Load medium priority items first
            const mediumPriority = this.loadQueue.get(LoadPriority.MEDIUM) || [];
            const lowPriority = this.loadQueue.get(LoadPriority.LOW) || [];
            
            const nextModule = mediumPriority.find(m => !this.loaded.has(m.name)) ||
                              lowPriority.find(m => !this.loaded.has(m.name));

            if (nextModule) {
                this.loadModule(nextModule.name, nextModule.loader)
                    .then(() => {
                        this.scheduleCallback(loadNext);
                    });
            }
        };

        this.scheduleCallback(() => {
            this.isIdle = true;
            loadNext();
        });
    }

    /**
     * Force load a module immediately (for on-demand loading)
     */
    async forceLoad(name) {
        // Find the module in any priority queue
        for (const [priority, modules] of this.loadQueue) {
            const module = modules.find(m => m.name === name);
            if (module) {
                return this.loadModule(module.name, module.loader);
            }
        }
        throw new Error(`Module ${name} not found`);
    }
}

export default ProgressiveLoader;
export { LoadPriority };
