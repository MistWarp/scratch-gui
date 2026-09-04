const IMAGE_EXTENSIONS = new Set(['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov']);
const AUDIO_EXTENSIONS = new Set(['wav', 'mp3', 'ogg', 'm4a', 'flac']);

const MEDIA_TYPES = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime'
};

export const extensionOfPath = path => {
    const base = String(path || '').split('/').pop();
    const dot = base.lastIndexOf('.');
    return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
};

export const mediaTypeForAssetPath = path => MEDIA_TYPES[extensionOfPath(path)] || '';

export const classifyAssetFile = path => {
    const extension = extensionOfPath(path);
    if (AUDIO_EXTENSIONS.has(extension)) return 'sounds';
    if (IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension)) return 'costumes';
    return 'code';
};

export const base64ToBytes = value => {
    const binary = atob(value || '');
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
};

export const inlineDataToBytes = value => {
    if (value === null || typeof value === 'undefined') return null;
    if (typeof value === 'string') return base64ToBytes(value);
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (Array.isArray(value)) return Uint8Array.from(value);
    return null;
};

export const formatAssetSize = value => {
    if (typeof value !== 'number' || !isFinite(value) || value < 0) return '';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};
