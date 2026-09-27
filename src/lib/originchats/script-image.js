import {captureBlockSvg, renderBlockSvg} from '../backpack/block-to-image.js';

const SCRIPT_MIME = 'application/x-mistwarp-script';
const METADATA_ID = 'mistwarp-script';
const FORMAT = 'mistwarp-script';
const VERSION = 1;
const MAX_SVG_BYTES = 8 * 1024 * 1024;

const readAsDataUrl = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
});

const XLINK = 'http://www.w3.org/1999/xlink';

const inlineImages = async svg => {
    const cache = new Map();
    const images = Array.from(svg.querySelectorAll('image'));
    for (const image of images) {
        const href = image.getAttribute('href') || image.getAttributeNS(XLINK, 'href') || '';
        if (!href || href.startsWith('data:')) continue;
        if (!cache.has(href)) {
            cache.set(href, fetch(new URL(href, document.baseURI).href)
                .then(response => (response.ok ? response.blob() : null))
                .then(blob => (blob ? readAsDataUrl(blob) : null))
                .catch(() => null));
        }
        const data = await cache.get(href);
        if (data) {
            image.setAttributeNS(XLINK, 'xlink:href', data);
            image.removeAttribute('href');
        }
    }
};

const captureScript = topBlockId => {
    try {
        return captureBlockSvg(topBlockId);
    } catch (e) {
        return null;
    }
};

const renderScriptSvg = async (captured, payload) => {
    const svg = renderBlockSvg(captured);
    await inlineImages(svg);
    const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
    metadata.setAttribute('id', METADATA_ID);
    metadata.textContent = JSON.stringify({format: FORMAT, version: VERSION, blocks: payload});
    svg.insertBefore(metadata, svg.firstChild);
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
};

const validPayload = blocks => {
    const list = Array.isArray(blocks) ? blocks : blocks && blocks.blocks;
    return Array.isArray(list) && list.length > 0 && list.every(block => block && typeof block === 'object' &&
        typeof block.id === 'string' && typeof block.opcode === 'string');
};

const readScriptSvg = text => {
    if (typeof text !== 'string' || text.length > MAX_SVG_BYTES || !text.includes(METADATA_ID)) return null;
    try {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const metadata = doc.getElementById(METADATA_ID) ||
            Array.from(doc.getElementsByTagName('metadata')).find(node => node.getAttribute('id') === METADATA_ID);
        if (!metadata) return null;
        const data = JSON.parse(metadata.textContent);
        if (!data || data.format !== FORMAT || !validPayload(data.blocks)) return null;
        return data.blocks;
    } catch (e) {
        return null;
    }
};

const isSvgFile = file => Boolean(file) && (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || ''));

const readScriptFile = async file => {
    if (!isSvgFile(file) || file.size > MAX_SVG_BYTES) return null;
    return readScriptSvg(await file.text());
};

const acceptsScriptDrop = dataTransfer => {
    if (!dataTransfer) return false;
    const types = Array.from(dataTransfer.types || []);
    if (types.includes(SCRIPT_MIME)) return true;
    if (!types.includes('Files')) return false;
    return Array.from(dataTransfer.items || []).some(item => item.kind === 'file' && item.type === 'image/svg+xml');
};

const readScriptDrop = async dataTransfer => {
    const inline = dataTransfer.getData(SCRIPT_MIME);
    if (inline) {
        try {
            const blocks = JSON.parse(inline);
            return validPayload(blocks) ? blocks : null;
        } catch (e) {
            return null;
        }
    }
    for (const file of Array.from(dataTransfer.files || [])) {
        const blocks = await readScriptFile(file);
        if (blocks) return blocks;
    }
    return null;
};

const scriptCache = new Map();

const fetchScriptSvg = url => {
    if (!scriptCache.has(url)) {
        scriptCache.set(url, fetch(url)
            .then(response => {
                if (!response.ok) return null;
                const length = Number(response.headers.get('content-length'));
                if (length && length > MAX_SVG_BYTES) return null;
                return response.text();
            })
            .then(text => {
                const blocks = readScriptSvg(text);
                if (!blocks) return null;
                const image = URL.createObjectURL(new Blob([text], {type: 'image/svg+xml'}));
                return {blocks, image};
            })
            .catch(() => null));
    }
    return scriptCache.get(url);
};

const scriptBlockCount = payload => {
    const list = Array.isArray(payload) ? payload : (payload && payload.blocks) || [];
    return list.filter(block => block && !block.shadow).length;
};

export {
    SCRIPT_MIME,
    acceptsScriptDrop,
    captureScript,
    fetchScriptSvg,
    isSvgFile,
    readScriptDrop,
    readScriptFile,
    readScriptSvg,
    renderScriptSvg,
    scriptBlockCount
};
