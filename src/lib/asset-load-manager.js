/**
 * Enhanced asset loader with progressive loading and caching strategies
 */

class AssetLoadManager {
    constructor() {
        this.cache = new Map();
        this.loadQueue = [];
        this.loading = new Set();
        this.maxConcurrent = 6; // Optimal for most browsers
        this.activeDomainConnections = new Map();
    }

    /**
     * Preconnect to asset domains for faster loading
     */
    preconnectDomains() {
        const domains = [
            'https://cdn.assets.scratch.mit.edu',
            'https://uploads.scratch.mit.edu',
            'https://assets.scratch.mit.edu'
        ];

        domains.forEach(domain => {
            if (!this.activeDomainConnections.has(domain)) {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                document.head.appendChild(link);
                this.activeDomainConnections.set(domain, true);
            }
        });
    }

    /**
     * Load assets with priority and concurrent control
     */
    async loadAsset(url, options = {}) {
        const { priority = 'normal', cache = true } = options;
        
        // Check cache first
        if (cache && this.cache.has(url)) {
            return this.cache.get(url);
        }

        // If already loading, return existing promise
        if (this.loading.has(url)) {
            return this.loading.get(url);
        }

        const loadPromise = this._loadAssetInternal(url, options);
        this.loading.set(url, loadPromise);

        try {
            const result = await loadPromise;
            if (cache) {
                this.cache.set(url, result);
            }
            return result;
        } finally {
            this.loading.delete(url);
        }
    }

    async _loadAssetInternal(url, options) {
        // Wait for slot if we're at max concurrent requests
        await this._waitForSlot();

        try {
            const response = await fetch(url, {
                ...options,
                // Use browser cache effectively
                cache: 'default'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load asset: ${response.status}`);
            }

            return response;
        } catch (error) {
            console.warn(`Asset load failed for ${url}:`, error);
            throw error;
        }
    }

    async _waitForSlot() {
        while (this.loading.size >= this.maxConcurrent) {
            await Promise.race([...this.loading.values()]);
        }
    }

    /**
     * Preload critical assets
     */
    preloadCriticalAssets(urls) {
        const preloadPromises = urls.slice(0, 3).map(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            link.as = this._getAssetType(url);
            document.head.appendChild(link);
            
            return this.loadAsset(url, { priority: 'high' });
        });

        return Promise.allSettled(preloadPromises);
    }

    _getAssetType(url) {
        if (url.includes('.svg')) return 'image';
        if (url.includes('.png') || url.includes('.jpg')) return 'image';
        if (url.includes('.wav') || url.includes('.mp3')) return 'audio';
        if (url.includes('.js')) return 'script';
        if (url.includes('.css')) return 'style';
        return 'fetch';
    }

    /**
     * Clear cache to free memory
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            loading: this.loading.size
        };
    }
}

// Global instance
const assetLoadManager = new AssetLoadManager();

// Initialize preconnections
assetLoadManager.preconnectDomains();

export default assetLoadManager;
