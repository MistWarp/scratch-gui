/**
 * Lightweight OriginFS client for Rotur cloud files.
 * Paths: /application data/mistwarp@mistium/...
 * Stored under: origin/(c) users/{username}/...
 */

const ENTRY_SIZE = 14;
const IDX = {
    TYPE: 0,
    NAME: 1,
    LOCATION: 2,
    DATA: 3,
    CREATED: 8,
    EDITED: 9,
    SIZE: 11,
    UUID: 13
};

const parsePathComponents = path => {
    const lastSlash = path.lastIndexOf('/');
    const dir = lastSlash >= 0 ? path.substring(0, lastSlash) : '';
    const file = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
    const lastDot = file.lastIndexOf('.');
    const ext = lastDot >= 0 ? file.substring(lastDot) : '';
    const name = lastDot >= 0 ? file.substring(0, lastDot) : file;
    return {dir, name, ext};
};

class OriginFS {
    constructor (http) {
        this.http = http;
        this.username = '';
        this.index = {};
        this.entries = {};
        this.dirty = [];
        this.indexLoaded = false;
        this.inflightIndex = null;
        this._uuidCounter = 0;
    }

    cleanPath (p) {
        p = String(p).toLowerCase();
        p = p.replace(/^origin\/\(c\) users\//, '');
        const parts = p.split('/');
        p = parts.length >= 2 ? parts.slice(1).join('/') : '';
        return (`/${p}`).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    }

    formatPath (dir) {
        const basePath = `origin/(c) users/${this.username}/`;
        const formatted = String(dir).replace(/^\//, '').replace(/\/$/, '');
        return (basePath + formatted).replace(/\/$/, '');
    }

    buildEntry ({type, name, location, data, created, edited, size, uuid}) {
        const entry = new Array(ENTRY_SIZE);
        entry[IDX.TYPE] = type;
        entry[IDX.NAME] = name;
        entry[IDX.LOCATION] = location;
        entry[IDX.DATA] = data;
        entry[IDX.CREATED] = created;
        entry[IDX.EDITED] = edited;
        entry[IDX.SIZE] = size;
        entry[IDX.UUID] = uuid;
        return entry;
    }

    async generateUUID () {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID().replace(/-/g, '');
        }
        const data =
            Math.random().toString(36).slice(2) +
            (this._uuidCounter++).toString(36) +
            Date.now().toString() +
            this.username;
        if (crypto.subtle) {
            const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(data));
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
                .substring(0, 32);
        }
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash) + data.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16).padStart(32, '0');
    }

    async request (method, path, body = null) {
        if (method === 'GET') {
            return this.http.get(path, {}, true);
        }
        if (method === 'POST') {
            return this.http.post(path, body, true);
        }
        throw new Error(`Unsupported FS method: ${method}`);
    }

    async loadIndex () {
        if (this.indexLoaded) return;
        if (this.inflightIndex) return this.inflightIndex;
        this.inflightIndex = this.performLoadIndex();
        try {
            await this.inflightIndex;
            this.indexLoaded = true;
        } finally {
            this.inflightIndex = null;
        }
    }

    async performLoadIndex () {
        const raw = await this.request('GET', '/files/path-index');
        this.username = raw.username || '';
        this.index = {};
        for (const [key, value] of Object.entries(raw.index || {})) {
            if (typeof value === 'string') {
                this.index[this.cleanPath(key)] = value;
            }
        }
    }

    async ensureEntryLoaded (uuid) {
        if (this.entries[uuid]) return;
        this.entries[uuid] = await this.request(
            'GET',
            `/files/by-uuid?uuid=${encodeURIComponent(uuid)}`
        );
    }

    async readFileContent (path) {
        await this.loadIndex();
        const uuid = this.index[path.toLowerCase()];
        if (!uuid) {
            throw new Error('not found');
        }
        await this.ensureEntryLoaded(uuid);
        const data = this.entries[uuid][IDX.DATA];
        if (typeof data !== 'string') {
            throw new Error('invalid data type');
        }
        return data;
    }

    async createFolders (dir) {
        dir = dir.replace(/\/$/, '');
        if (!dir || dir === '/') return;

        const parts = dir.split('/').filter(Boolean);
        for (let i = 1; i <= parts.length; i++) {
            const subPath = `/${parts.slice(0, i).join('/')}`.toLowerCase();
            if (this.index[subPath]) continue;

            const now = Date.now();
            const uuid = await this.generateUUID();
            const entry = this.buildEntry({
                type: '.folder',
                name: parts[i - 1],
                location: this.formatPath(parts.slice(0, i - 1).join('/')),
                data: [],
                created: now,
                edited: now,
                size: 0,
                uuid
            });
            this.entries[uuid] = entry;
            this.index[subPath] = uuid;
            this.dirty.push({command: 'UUIDa', uuid, dta: entry});
        }
    }

    async createFile (path, data) {
        path = path.toLowerCase();
        await this.loadIndex();
        const now = Date.now();
        const {dir, name, ext} = parsePathComponents(path);
        await this.createFolders(dir);
        const uuid = await this.generateUUID();
        const entry = this.buildEntry({
            type: ext,
            name,
            location: this.formatPath(dir),
            data,
            created: now,
            edited: now,
            size: data.length,
            uuid
        });
        this.entries[uuid] = entry;
        this.index[path] = uuid;
        this.dirty.push({command: 'UUIDa', uuid, dta: entry});
    }

    async writeFile (path, data) {
        await this.loadIndex();
        const key = path.toLowerCase();
        const uuid = this.index[key];
        if (!uuid) {
            return this.createFile(path, data);
        }
        const now = Date.now();
        await this.ensureEntryLoaded(uuid);
        const entry = this.entries[uuid];
        entry[IDX.DATA] = data;
        entry[IDX.EDITED] = now;
        entry[IDX.SIZE] = data.length;
        this.entries[uuid] = entry;
        this.dirty.push({command: 'UUIDr', uuid, dta: data, idx: IDX.DATA + 1});
        this.dirty.push({command: 'UUIDr', uuid, dta: now, idx: IDX.EDITED + 1});
        this.dirty.push({command: 'UUIDr', uuid, dta: data.length, idx: IDX.SIZE + 1});
    }

    async commit () {
        if (this.dirty.length === 0) return;
        const updates = this.dirty;
        this.dirty = [];
        try {
            await this.request('POST', '/files', {updates});
        } catch (err) {
            this.dirty = [...updates, ...this.dirty];
            throw err;
        }
    }
}

export {OriginFS};
