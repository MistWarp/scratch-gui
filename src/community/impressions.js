import {useEffect} from 'react';
import rotur from './rotur.js';

const FLUSH_DELAY = 3000;
const SEEN_MS = 1000;
const BATCH = 100;

const queue = [];
const sent = new Set();
let timer = null;
let disabled = false;

const flush = (keepalive = false) => {
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    if (disabled || !queue.length) return;
    const batch = queue.splice(0, BATCH);
    Promise.resolve(rotur.reportImpressions(batch, {keepalive})).catch(error => {
        if (error && (error.status === 403 || error.status === 404 || error.code === 'not_available')) {
            disabled = true;
            queue.length = 0;
        }
    });
    if (queue.length) flush(keepalive);
};

const queueImpression = (token, visibleMs) => {
    if (disabled || !token || sent.has(token)) return;
    sent.add(token);
    queue.push({token, visible_ms: Math.max(SEEN_MS, Math.round(visibleMs))});
    if (!timer) timer = setTimeout(() => flush(), FLUSH_DELAY);
};

if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => flush(true));
}

const mostlyVisible = entry => {
    if (!entry.isIntersecting) return false;
    if (entry.intersectionRatio >= 0.5) return true;
    const viewport = entry.rootBounds ? entry.rootBounds.height : window.innerHeight;
    return viewport > 0 && entry.intersectionRect.height >= viewport * 0.5;
};

const useImpression = (ref, token) => {
    useEffect(() => {
        const node = ref.current;
        if (!token || typeof token !== 'string' || disabled || sent.has(token) || !node ||
            typeof IntersectionObserver !== 'function') {
            return;
        }
        let since = 0;
        let wait = null;
        const observer = new IntersectionObserver(([entry]) => {
            if (mostlyVisible(entry)) {
                if (since) return;
                since = Date.now();
                wait = setTimeout(() => {
                    queueImpression(token, Date.now() - since);
                    observer.disconnect();
                }, SEEN_MS);
            } else {
                since = 0;
                clearTimeout(wait);
            }
        }, {threshold: [0, 0.25, 0.5, 0.75, 1]});
        observer.observe(node);
        return () => {
            clearTimeout(wait);
            observer.disconnect();
        };
    }, [ref, token]);
};

export {flush as flushImpressions, queueImpression, useImpression};
