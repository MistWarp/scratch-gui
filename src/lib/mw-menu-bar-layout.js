const ZONES = [
    {
        id: 'left',
        items: [
            '__errors', 'file', 'edit', 'mode', 'tools', 'bookmarks', 'view',
            '__divider', 'project-title', '__view-counter', 'community', 'media-recorder', 'block-count',
            'share', 'remix', 'feedback'
        ],
        extras: []
    },
    {
        id: 'right',
        items: ['save-status', 'about', 'collab-presence', 'rotur-account'],
        extras: []
    }
];

const ALWAYS_SHOW = ['save-status', 'rotur-account', 'collab-presence', 'view'];

const ALL_ITEMS = ZONES.reduce((acc, zone) => acc.concat(zone.items, zone.extras), []);

// Bump when default zone membership/order changes so old custom orders reset
const ORDER_KEY = 'mw:menu-bar-order-v6';
const HIDDEN_KEY = 'mw:menu-bar-hidden';
const CHANGE_EVENT = 'mw-menu-bar-layout-changed';
const STYLE_ID = 'mw-menu-bar-layout';

const readJSON = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        // ignore
    }
    return fallback;
};

const getLegacyHidden = () => {
    try {
        const addons = JSON.parse(localStorage.getItem('tw:addons')) || {};
        const legacy = addons['tw-interface-customization'];
        return addons['tw-remove-feedback']?.enabled ||
            (legacy?.enabled && legacy.removeFeedback) ? ['feedback'] : [];
    } catch (_) {
        return [];
    }
};

const writeJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        // ignore
    }
    try {
        require('./rotur/cloud-sync.js').notifyLocalChange();
    } catch (_) {
        // cloud sync optional
    }
};

const normalizeLayout = layout => {
    if (!layout || typeof layout !== 'object') return null;
    const orders = {};
    for (const zone of ZONES) {
        const order = layout.orders && Array.isArray(layout.orders[zone.id]) ? layout.orders[zone.id] : [];
        orders[zone.id] = [...new Set(order.filter(id => zone.items.includes(id)))];
    }
    const hidden = Array.isArray(layout.hidden) ?
        [...new Set(layout.hidden.filter(id => ALL_ITEMS.includes(id) && !ALWAYS_SHOW.includes(id)))] : [];
    return {orders, hidden};
};

const getMenuBarLayout = () => {
    const orders = readJSON(ORDER_KEY, {});
    const hidden = readJSON(HIDDEN_KEY, getLegacyHidden());
    if (Object.keys(orders).length === 0 && hidden.length === 0) return null;
    return normalizeLayout({orders, hidden});
};

const zoneById = zoneId => ZONES.find(z => z.id === zoneId);

const hasStoredOrder = zoneId => {
    const stored = readJSON(ORDER_KEY, {})[zoneId];
    return Array.isArray(stored) && stored.length > 0;
};

const getStoredOrder = zoneId => {
    const zone = zoneById(zoneId);
    if (!zone) return [];
    const stored = (readJSON(ORDER_KEY, {})[zoneId] || []).filter(id => zone.items.includes(id));
    for (const id of zone.items) {
        if (!stored.includes(id)) stored.push(id);
    }
    return stored;
};

const getHidden = () => readJSON(HIDDEN_KEY, getLegacyHidden())
    .filter(id => ALL_ITEMS.includes(id) && !ALWAYS_SHOW.includes(id));

const isHidden = id => getHidden().includes(id);

const getPresentOrderedIds = () => {
    const hidden = new Set(getHidden());
    const ids = [];
    const seen = new Set();
    for (const el of document.querySelectorAll('[data-mw-item]')) {
        const id = el.getAttribute('data-mw-item');
        if (seen.has(id)) continue;
        if (hidden.has(id) || ALWAYS_SHOW.includes(id) || el.offsetWidth > 0 || el.offsetHeight > 0) {
            ids.push(id);
            seen.add(id);
        }
    }
    return ids;
};

const getZoneDisplayOrder = (zoneId, presentIds) => {
    const zone = zoneById(zoneId);
    if (!zone) return [];
    const present = presentIds.filter(id => zone.items.includes(id));
    if (!hasStoredOrder(zoneId)) return present;
    const stored = getStoredOrder(zoneId).filter(id => present.includes(id));
    for (const id of present) {
        if (!stored.includes(id)) stored.push(id);
    }
    return stored;
};

const getZoneExtras = (zoneId, presentIds) => {
    const zone = zoneById(zoneId);
    if (!zone) return [];
    return zone.extras.filter(id => presentIds.includes(id));
};

const applyLayout = () => {
    const parts = [];
    for (const zone of ZONES) {
        if (!hasStoredOrder(zone.id)) continue;
        const order = getStoredOrder(zone.id);
        for (let i = 0; i < order.length; i++) {
            parts.push(`[data-mw-item="${order[i]}"]{order:${i};}`);
        }
    }
    for (const id of getHidden()) {
        parts.push(`[data-mw-item="${id}"]{display:none !important;}`);
    }
    let style = document.getElementById(STYLE_ID);
    if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
        document.head.appendChild(style);
    }
    style.textContent = parts.join('');
};

const applyMenuBarLayout = layout => {
    const normalized = normalizeLayout(layout);
    try {
        if (normalized) {
            localStorage.setItem(ORDER_KEY, JSON.stringify(normalized.orders));
            localStorage.setItem(HIDDEN_KEY, JSON.stringify(normalized.hidden));
        } else {
            localStorage.removeItem(ORDER_KEY);
            localStorage.removeItem(HIDDEN_KEY);
        }
    } catch (err) {
        // ignore
    }
    applyLayout();
    window.dispatchEvent(new Event(CHANGE_EVENT));
};

const setZoneOrder = (zoneId, order) => {
    const all = readJSON(ORDER_KEY, {});
    all[zoneId] = order;
    writeJSON(ORDER_KEY, all);
    applyLayout();
    window.dispatchEvent(new Event(CHANGE_EVENT));
};

const setHidden = (id, hidden) => {
    const current = new Set(getHidden());
    if (hidden) {
        current.add(id);
    } else {
        current.delete(id);
    }
    writeJSON(HIDDEN_KEY, Array.from(current));
    applyLayout();
    window.dispatchEvent(new Event(CHANGE_EVENT));
};

const initMenuBarLayout = () => {
    applyLayout();
};

export {
    ZONES,
    ALL_ITEMS,
    ALWAYS_SHOW,
    CHANGE_EVENT,
    ORDER_KEY,
    HIDDEN_KEY,
    getStoredOrder,
    setZoneOrder,
    getZoneDisplayOrder,
    getZoneExtras,
    getHidden,
    isHidden,
    setHidden,
    getPresentOrderedIds,
    getMenuBarLayout,
    applyMenuBarLayout,
    applyLayout,
    initMenuBarLayout
};
