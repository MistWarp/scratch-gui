/**
 * Resource hints and loading optimizations
 */

class ResourceOptimizer {
    constructor() {
        this.preloadedResources = new Set();
        this.criticalAssets = [
            'static/blocks-media/default/arrow.svg',
            'static/blocks-media/default/repeat.svg'
        ];
    }

    /**
     * Add resource hints to the document head
     */
    addResourceHints() {
        // Preconnect to known domains
        this.addPreconnect('https://cdn.assets.scratch.mit.edu');
        this.addPreconnect('https://uploads.scratch.mit.edu');
        
        // DNS prefetch for optional resources
        this.addDNSPrefetch('https://extensions.turbowarp.org');
        this.addDNSPrefetch('https://api.github.com');
        
        // Preload critical fonts
        this.preloadFont('/static/fonts/HelveticaNeue-Regular.woff2');
    }

    addPreconnect(href) {
        if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
        
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }

    addDNSPrefetch(href) {
        if (document.querySelector(`link[rel="dns-prefetch"][href="${href}"]`)) return;
        
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = href;
        document.head.appendChild(link);
    }

    preloadFont(href) {
        if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return;
        
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }

    /**
     * Preload critical assets based on route
     */
    preloadCriticalAssets(route = 'editor') {
        const assetsByRoute = {
            editor: [
                'static/blocks-media/default/arrow.svg',
                'static/blocks-media/default/repeat.svg',
                'static/blocks-media/default/turn-left.svg',
                'static/blocks-media/default/turn-right.svg'
            ],
            player: [
                'static/blocks-media/default/green-flag.svg',
                'static/blocks-media/default/stop.svg'
            ]
        };

        const assets = assetsByRoute[route] || assetsByRoute.editor;
        
        assets.forEach(asset => {
            if (!this.preloadedResources.has(asset)) {
                this.preloadAsset(asset, 'image');
                this.preloadedResources.add(asset);
            }
        });
    }

    preloadAsset(href, as = 'fetch') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        document.head.appendChild(link);
    }

    /**
     * Optimize image loading with intersection observer
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            // Observe all images with data-src
            setTimeout(() => {
                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            }, 100);
        }
    }

    /**
     * Setup service worker for caching
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    /**
     * Initialize all optimizations
     */
    init() {
        // Add resource hints immediately
        this.addResourceHints();
        
        // Preload critical assets when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.preloadCriticalAssets();
                this.setupLazyLoading();
            });
        } else {
            this.preloadCriticalAssets();
            this.setupLazyLoading();
        }

        // Setup service worker
        this.setupServiceWorker();
    }
}

// Auto-initialize
const resourceOptimizer = new ResourceOptimizer();
resourceOptimizer.init();

export default resourceOptimizer;
